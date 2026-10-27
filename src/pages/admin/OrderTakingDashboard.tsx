import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Ban, Check, ChefHat, Loader2, Minus, Plus, Receipt, Search, Send, Trash2, X } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { FoodTypeMark } from '@/components/FoodTypeMark';
import { ItemOptionsDialog, needsOptions, priceFor, simpleLine, type ChosenLine } from '@/components/ItemOptionsDialog';
import { BillDialog } from '@/components/admin/BillDialog';
import { useApproval } from '@/components/admin/ApprovalDialog';
import { useMenuQuery, useSetStockMutation } from '@/store/endpoints/menu';
import { useTablesQuery } from '@/store/endpoints/floor';
import {
  useAcceptOrderMutation, useAddItemsMutation, useCancelItemMutation, useCancelOrderMutation,
  useCreateOrderMutation, useOrderQuery, useRejectOrderMutation, useSendKotMutation,
} from '@/store/endpoints/orders';
import { useOutletQuery } from '@/store/endpoints/admin';
import { useAppSelector } from '@/store/hooks';
import { useCan } from '@/hooks/useCan';
import { formatMoney, unitWithAddons } from '@/lib/money';
import { toastError } from '@/lib/apiError';
import { lineKey } from '@/store/cart';
import type { MenuItem, OrderItem, OrderType } from '@/types/api';

type Draft = ChosenLine & { key: string };

const TYPE_LABEL: Record<OrderType, string> = { dine_in: 'Dine-in', takeaway: 'Takeaway', delivery: 'Delivery' };

const ItemStatus = ({ item }: { item: OrderItem }) => {
  if (item.status === 'cancelled') return <Badge variant="outline" className="text-red-600 border-red-200">Cancelled</Badge>;
  if (item.status === 'awaiting_acceptance') return <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100">QR · to accept</Badge>;
  if (!item.kotId) return <Badge variant="outline">Not sent</Badge>;
  return <Badge variant="secondary">KOT sent</Badge>;
};

export const OrderTakingDashboard: React.FC = () => {
  const [params, setParams] = useSearchParams();
  const navigate = useNavigate();
  const can = useCan();
  const withApproval = useApproval();
  const outletId = useAppSelector((s) => s.session.outletId);

  const orderId = params.get('order');
  const { data: outlet } = useOutletQuery(outletId!, { skip: !outletId });
  const { data: menu, isLoading: menuLoading } = useMenuQuery();
  const { data: tables = [] } = useTablesQuery();
  const { data: order, isFetching: orderLoading } = useOrderQuery(orderId!, { skip: !orderId });

  const [type, setType] = useState<OrderType>('dine_in');
  const [tableId, setTableId] = useState<string>(params.get('table') || '');
  const [covers, setCovers] = useState('');
  const [customer, setCustomer] = useState({ name: '', phone: '' });
  const [draft, setDraft] = useState<Draft[]>([]);
  const [category, setCategory] = useState<string>('all');
  const [q, setQ] = useState('');
  const [optionsFor, setOptionsFor] = useState<MenuItem | null>(null);
  const [billOpen, setBillOpen] = useState(false);
  const [cancelTarget, setCancelTarget] = useState<OrderItem | 'order' | 'reject' | null>(null);
  const [cancelQty, setCancelQty] = useState(1);
  const [cancelReason, setCancelReason] = useState('');

  const [createOrder, creating] = useCreateOrderMutation();
  const [addItems, adding] = useAddItemsMutation();
  const [sendKot] = useSendKotMutation();
  const [accept] = useAcceptOrderMutation();
  const [reject] = useRejectOrderMutation();
  const [cancelItem] = useCancelItemMutation();
  const [cancelOrder] = useCancelOrderMutation();
  const [setStock] = useSetStockMutation();

  // Opening another order or table resets the draft.
  useEffect(() => { setDraft([]); }, [orderId]);
  useEffect(() => { if (params.get('table')) { setTableId(params.get('table')!); setType('dine_in'); } }, [params]);
  useEffect(() => {
    if (outlet && !outlet.orderTypes.includes(type)) setType(outlet.orderTypes[0]);
  }, [outlet, type]);

  const orderType = order?.type ?? type;
  const isOpen = !order || ['open', 'awaiting_acceptance'].includes(order.status);

  const items = useMemo(() => {
    if (!menu) return [];
    const term = q.trim().toLowerCase();
    const activeCats = new Set(menu.categories.filter((c) => c.isActive).map((c) => c.id));
    return menu.items.filter((i) => i.isActive && activeCats.has(i.categoryId)
      && (category === 'all' || i.categoryId === category)
      && (!term || i.name.toLowerCase().includes(term) || i.shortCode?.toLowerCase() === term));
  }, [menu, category, q]);

  const freeTables = tables.filter((t) => t.isActive && t.status === 'free');
  const awaiting = order?.items.filter((i) => i.status === 'awaiting_acceptance') ?? [];
  const unsent = order?.items.filter((i) => i.status === 'active' && !i.kotId) ?? [];
  const draftTotal = draft.reduce((s, l) => s + unitWithAddons(l.unitPrice, l.addons) * l.qty, 0);

  const addLine = (line: ChosenLine) => {
    const key = lineKey(line);
    setDraft((d) => {
      const existing = d.find((x) => x.key === key);
      return existing ? d.map((x) => (x.key === key ? { ...x, qty: x.qty + line.qty } : x)) : [...d, { ...line, key }];
    });
  };

  const tapItem = (item: MenuItem) => {
    if (!item.inStock) return;
    if (!isOpen) return toast.error('This order is already billed');
    if (needsOptions(item, menu?.addonGroups ?? [])) setOptionsFor(item);
    else addLine(simpleLine(item, orderType));
  };

  const changeQty = (key: string, delta: number) =>
    setDraft((d) => d.flatMap((x) => (x.key !== key ? [x] : x.qty + delta <= 0 ? [] : [{ ...x, qty: x.qty + delta }])));

  const payload = draft.map(({ itemId, variantId, addonIds, qty, note }) => ({ itemId, variantId, addonIds, qty, note }));

  const save = async (sendKotNow: boolean) => {
    if (!draft.length) return;
    try {
      if (order) {
        await addItems({ id: order.id, items: payload, sendKot: sendKotNow }).unwrap();
      } else {
        if (orderType === 'dine_in' && !tableId) return toast.error('Pick a table');
        const created = await createOrder({
          type: orderType,
          ...(orderType === 'dine_in' && { tableId }),
          ...(covers && { covers: Number(covers) }),
          ...((customer.name || customer.phone) && {
            customer: { ...(customer.name && { name: customer.name }), ...(customer.phone && { phone: customer.phone }) },
          }),
          items: payload,
          sendKot: sendKotNow,
        }).unwrap();
        setParams({ order: created.id }, { replace: true });
      }
      setDraft([]);
      toast.success(sendKotNow ? 'Sent to kitchen' : 'Saved');
    } catch (e) { toastError(e); }
  };

  const confirmCancel = async () => {
    if (!order || !cancelTarget) return;
    if (cancelReason.trim().length < 3) return toast.error('Add a reason');
    const reason = cancelReason.trim();
    const done = cancelTarget === 'order'
      ? await withApproval((approval) => cancelOrder({ id: order.id, reason, approval }).unwrap())
      : cancelTarget === 'reject'
        ? await withApproval(() => reject({ id: order.id, reason }).unwrap())
        : await withApproval(() => cancelItem({ id: order.id, itemId: cancelTarget.id, qty: cancelQty, reason }).unwrap());
    if (done) {
      toast.success(cancelTarget === 'reject' ? 'Rejected' : 'Cancelled');
      setCancelTarget(null);
      if (cancelTarget === 'order' || (cancelTarget === 'reject' && done.status === 'cancelled')) navigate('/admin/live');
    }
  };

  const newOrder = () => { setParams({}); setDraft([]); setCustomer({ name: '', phone: '' }); setCovers(''); };

  if (menuLoading) return <Loader2 className="h-8 w-8 animate-spin mx-auto mt-20 text-gray-400" />;

  return (
    <div className="flex flex-col lg:flex-row gap-4 h-full">
      {/* Menu */}
      <div className="flex-1 min-w-0 flex flex-col gap-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input placeholder="Search item or short code" className="pl-10 bg-white" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
          <button onClick={() => setCategory('all')} className={`pill-button ${category === 'all' ? 'pill-button-active' : ''}`}>All</button>
          {menu?.categories.filter((c) => c.isActive).map((c) => (
            <button key={c.id} onClick={() => setCategory(c.id)} className={`pill-button whitespace-nowrap ${category === c.id ? 'pill-button-active' : ''}`}>{c.name}</button>
          ))}
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-2 overflow-y-auto pb-4">
          {items.map((item) => (
            <Card
              key={item.id}
              role="button"
              tabIndex={0}
              onClick={() => tapItem(item)}
              onKeyDown={(e) => e.key === 'Enter' && tapItem(item)}
              className={`p-3 select-none transition ${item.inStock ? 'cursor-pointer hover:shadow-md hover:border-accent' : 'opacity-50 cursor-not-allowed'}`}
            >
              <div className="flex items-start gap-2">
                <FoodTypeMark type={item.foodType} />
                <div className="min-w-0 flex-1">
                  <p className="font-medium leading-tight line-clamp-2">{item.name}</p>
                  <p className="text-sm text-gray-600 mt-1">
                    {item.variants.length ? `from ${formatMoney(Math.min(...item.variants.map((v) => v.price)))}` : formatMoney(priceFor(item, orderType))}
                  </p>
                </div>
              </div>
              <div className="flex items-center justify-between mt-2">
                {item.shortCode ? <span className="text-[10px] font-mono text-gray-400">{item.shortCode}</span> : <span />}
                <button
                  className={`text-[10px] font-semibold uppercase ${item.inStock ? 'text-gray-400 hover:text-red-600' : 'text-red-600'}`}
                  onClick={(e) => { e.stopPropagation(); setStock({ id: item.id, inStock: !item.inStock }); }}
                  title={item.inStock ? 'Mark sold out' : 'Back in stock'}
                >
                  {item.inStock ? 'Sold out?' : 'Sold out'}
                </button>
              </div>
            </Card>
          ))}
          {!items.length && <p className="col-span-full text-center text-gray-500 py-10">No items match.</p>}
        </div>
      </div>

      {/* Order panel */}
      <Card className="w-full lg:w-[400px] flex flex-col max-h-full">
        <div className="p-4 border-b space-y-3">
          {order ? (
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-lg font-bold">Order #{order.orderNo}</h3>
                <p className="text-sm text-gray-600">
                  {TYPE_LABEL[order.type]}{order.tableName && ` · ${order.tableName}`}{order.covers ? ` · ${order.covers} guests` : ''}
                  {order.source === 'qr' && ' · QR'}
                </p>
                {order.customer?.name && <p className="text-xs text-gray-500">{order.customer.name} {order.customer.phone}</p>}
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="capitalize">{order.status.replace('_', ' ')}</Badge>
                <Button size="sm" variant="ghost" onClick={newOrder} title="New order"><Plus className="h-4 w-4" /></Button>
              </div>
            </div>
          ) : (
            <>
              <div className="flex rounded-lg border overflow-hidden">
                {(outlet?.orderTypes ?? ['dine_in', 'takeaway']).map((t) => (
                  <button key={t} onClick={() => setType(t)} className={`flex-1 py-2 text-sm font-medium ${type === t ? 'bg-accent text-accent-foreground' : 'bg-white hover:bg-gray-50'}`}>
                    {TYPE_LABEL[t]}
                  </button>
                ))}
              </div>
              {type === 'dine_in' && (
                <div className="flex gap-2">
                  <Select value={tableId} onValueChange={setTableId}>
                    <SelectTrigger className="flex-1"><SelectValue placeholder="Table" /></SelectTrigger>
                    <SelectContent>
                      {freeTables.map((t) => <SelectItem key={t.id} value={t.id}>{t.name} ({t.capacity})</SelectItem>)}
                      {!freeTables.length && <div className="px-3 py-2 text-sm text-gray-500">No free tables</div>}
                    </SelectContent>
                  </Select>
                  <Input className="w-24" inputMode="numeric" placeholder="Guests" value={covers} onChange={(e) => setCovers(e.target.value.replace(/\D/g, '').slice(0, 2))} />
                </div>
              )}
              <div className="flex gap-2">
                <Input placeholder="Customer name" value={customer.name} onChange={(e) => setCustomer({ ...customer, name: e.target.value })} maxLength={80} />
                <Input placeholder="Phone" inputMode="tel" value={customer.phone} onChange={(e) => setCustomer({ ...customer, phone: e.target.value })} />
              </div>
            </>
          )}
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-2 min-h-[160px]">
          {orderLoading && !order && <Loader2 className="h-5 w-5 animate-spin mx-auto text-gray-400" />}

          {awaiting.length > 0 && can('orders.accept') && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 flex items-center justify-between gap-2">
              <span className="text-sm text-amber-900">{awaiting.length} item(s) ordered from the table QR</span>
              <div className="flex gap-1">
                <Button size="sm" variant="outline" title="Reject" onClick={() => { setCancelTarget('reject'); setCancelReason(''); }}><X className="h-4 w-4" /></Button>
                <Button size="sm" onClick={() => accept(order!.id).unwrap().then(() => toast.success('Accepted, KOT sent')).catch(toastError)}><Check className="h-4 w-4 mr-1" /> Accept</Button>
              </div>
            </div>
          )}

          {order?.items.map((i) => (
            <div key={i.id} className={`flex items-start justify-between gap-2 text-sm ${i.status === 'cancelled' ? 'opacity-50 line-through' : ''}`}>
              <div className="min-w-0">
                <p className="font-medium">{i.qty} × {i.name}{i.variantName && ` (${i.variantName})`}</p>
                {i.addons.length > 0 && <p className="text-xs text-gray-500">+ {i.addons.map((a) => a.name).join(', ')}</p>}
                {i.note && <p className="text-xs text-amber-700">» {i.note}</p>}
                <div className="mt-1"><ItemStatus item={i} /></div>
              </div>
              <div className="flex items-center gap-1">
                <span className="tabular-nums">{formatMoney(unitWithAddons(i.unitPrice, i.addons) * i.qty)}</span>
                {i.status === 'active' && isOpen && can('orders.cancelItem') && (
                  <Button size="icon" variant="ghost" className="h-7 w-7 text-gray-400 hover:text-red-600" title="Cancel item"
                    onClick={() => { setCancelTarget(i); setCancelQty(i.qty); setCancelReason(''); }}>
                    <Ban className="h-3.5 w-3.5" />
                  </Button>
                )}
              </div>
            </div>
          ))}

          {draft.length > 0 && (
            <div className="border-t pt-2 space-y-2">
              <p className="text-xs font-semibold uppercase text-gray-500">New items</p>
              {draft.map((l) => (
                <div key={l.key} className="flex items-center justify-between gap-2 text-sm">
                  <div className="min-w-0">
                    <p className="font-medium truncate">{l.name}{l.variantName && ` (${l.variantName})`}</p>
                    {l.addons.length > 0 && <p className="text-xs text-gray-500">+ {l.addons.map((a) => a.name).join(', ')}</p>}
                    {l.note && <p className="text-xs text-amber-700">» {l.note}</p>}
                  </div>
                  <div className="flex items-center gap-1">
                    <Button size="icon" variant="outline" className="h-7 w-7" onClick={() => changeQty(l.key, -1)}>{l.qty === 1 ? <Trash2 className="h-3 w-3" /> : <Minus className="h-3 w-3" />}</Button>
                    <span className="w-6 text-center">{l.qty}</span>
                    <Button size="icon" variant="outline" className="h-7 w-7" onClick={() => changeQty(l.key, 1)}><Plus className="h-3 w-3" /></Button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {!order && !draft.length && <p className="text-center text-gray-400 py-8 text-sm">Tap items to start an order</p>}
        </div>

        <div className="border-t p-4 space-y-2">
          <div className="flex justify-between text-sm"><span className="text-gray-600">Order total</span><span className="font-semibold tabular-nums">{formatMoney(order?.amounts.total ?? 0)}</span></div>
          {draft.length > 0 && <div className="flex justify-between text-sm"><span className="text-gray-600">New items (before tax)</span><span className="tabular-nums">{formatMoney(draftTotal)}</span></div>}

          {draft.length > 0 ? (
            <div className="grid grid-cols-3 gap-2">
              <Button variant="outline" onClick={() => save(false)} disabled={creating.isLoading || adding.isLoading}>Save</Button>
              <Button className="col-span-2" onClick={() => save(true)} disabled={creating.isLoading || adding.isLoading}>
                {(creating.isLoading || adding.isLoading) ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <ChefHat className="h-4 w-4 mr-2" />} Save & KOT
              </Button>
            </div>
          ) : order && (
            <div className="grid grid-cols-2 gap-2">
              {unsent.length > 0 ? (
                <Button variant="outline" onClick={() => sendKot(order.id).unwrap().then(() => toast.success('Sent to kitchen')).catch(toastError)}><Send className="h-4 w-4 mr-2" /> Send KOT</Button>
              ) : isOpen && can('orders.cancelItem') ? (
                <Button variant="outline" className="text-red-600" onClick={() => { setCancelTarget('order'); setCancelReason(''); }}>Cancel order</Button>
              ) : <span />}
              {can('bills.create') && ['open', 'billed'].includes(order.status) && (
                <Button onClick={() => setBillOpen(true)} disabled={awaiting.length > 0}>
                  <Receipt className="h-4 w-4 mr-2" /> {order.status === 'billed' ? 'Payment' : 'Bill'}
                </Button>
              )}
            </div>
          )}
        </div>
      </Card>

      <ItemOptionsDialog item={optionsFor} addonGroups={menu?.addonGroups ?? []} orderType={orderType} onClose={() => setOptionsFor(null)} onAdd={addLine} />

      {order && <BillDialog orderId={order.id} billId={order.billId} open={billOpen} onClose={() => setBillOpen(false)} />}

      <Dialog open={Boolean(cancelTarget)} onOpenChange={(o) => !o && setCancelTarget(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>
              {cancelTarget === 'order' ? `Cancel order #${order?.orderNo}`
                : cancelTarget === 'reject' ? 'Reject QR items'
                : `Cancel ${cancelTarget?.name ?? ''}`}
            </DialogTitle>
          </DialogHeader>
          {cancelTarget && typeof cancelTarget === 'object' && cancelTarget.qty > 1 && (
            <div className="flex items-center gap-2">
              <span className="text-sm">Quantity</span>
              <Input type="number" min={1} max={cancelTarget.qty} value={cancelQty} onChange={(e) => setCancelQty(Math.min(cancelTarget.qty, Math.max(1, Number(e.target.value))))} className="w-20" />
              <span className="text-sm text-gray-500">of {cancelTarget.qty}</span>
            </div>
          )}
          <Input autoFocus placeholder="Reason (e.g. customer changed mind)" value={cancelReason} onChange={(e) => setCancelReason(e.target.value)} maxLength={200} />
          <p className="text-xs text-gray-500">If the kitchen already has it, a cancel KOT is printed and the cancellation is logged.</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCancelTarget(null)}>Keep</Button>
            <Button variant="destructive" onClick={confirmCancel}>{cancelTarget === 'reject' ? 'Reject' : cancelTarget === 'order' ? 'Cancel order' : 'Cancel item'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
