import React, { useEffect, useState } from 'react';
import { Banknote, CreditCard, Loader2, Printer, Smartphone, Wallet, Globe, BookUser, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useApproval } from '@/components/admin/ApprovalDialog';
import { useAddPaymentMutation, useBillQuery, useCreateBillMutation, useOpenShiftMutation } from '@/store/endpoints/billing';
import { useOrderQuery } from '@/store/endpoints/orders';
import { useOutletQuery } from '@/store/endpoints/admin';
import { useAppSelector } from '@/store/hooks';
import { useCan } from '@/hooks/useCan';
import { formatMoney, toPaise, toRupees } from '@/lib/money';
import { isApiError, toastError } from '@/lib/apiError';
import { printBill } from '@/lib/print';
import type { Amounts, Bill, Id, PaymentMode } from '@/types/api';

const MODES: { mode: PaymentMode; label: string; icon: typeof Banknote }[] = [
  { mode: 'cash', label: 'Cash', icon: Banknote },
  { mode: 'upi', label: 'UPI', icon: Smartphone },
  { mode: 'card', label: 'Card', icon: CreditCard },
  { mode: 'wallet', label: 'Wallet', icon: Wallet },
  { mode: 'online', label: 'Online', icon: Globe },
  { mode: 'due', label: 'Credit', icon: BookUser },
];

export function AmountsTable({ amounts, discountReason }: { amounts: Amounts; discountReason?: string }) {
  return (
    <dl className="text-sm space-y-1">
      <Row label="Subtotal" value={formatMoney(amounts.subtotal)} />
      {amounts.discount > 0 && <Row label={`Discount${discountReason ? ` (${discountReason})` : ''}`} value={`−${formatMoney(amounts.discount)}`} className="text-green-700" />}
      {amounts.serviceCharge > 0 && <Row label="Service charge" value={formatMoney(amounts.serviceCharge)} />}
      {amounts.taxes.map((t) => <Row key={`${t.name}${t.rate}`} label={`${t.name} @ ${t.rate}%`} value={formatMoney(t.amount)} />)}
      {amounts.roundOff !== 0 && <Row label="Round off" value={formatMoney(amounts.roundOff)} />}
      <Row label="Total" value={formatMoney(amounts.total)} className="text-base font-bold border-t pt-1" />
    </dl>
  );
}

const Row = ({ label, value, className = '' }: { label: string; value: string; className?: string }) => (
  <div className={`flex justify-between ${className}`}><dt>{label}</dt><dd className="tabular-nums">{value}</dd></div>
);

/** Payment panel for an existing bill. Used inside BillDialog and on the Bills screen. */
export function PaymentPanel({ bill, onPaid }: { bill: Bill; onPaid?: () => void }) {
  const outletId = useAppSelector((s) => s.session.outletId);
  const { data: outlet } = useOutletQuery(outletId!, { skip: !outletId });
  const can = useCan();
  const [mode, setMode] = useState<PaymentMode>('cash');
  const [amount, setAmount] = useState(toRupees(bill.due));
  const [reference, setReference] = useState('');
  const [tendered, setTendered] = useState('');
  const [needShift, setNeedShift] = useState(false);
  const [openingCash, setOpeningCash] = useState('');
  const [pay, paying] = useAddPaymentMutation();
  const [openShift, opening] = useOpenShiftMutation();

  useEffect(() => { setAmount(toRupees(bill.due)); }, [bill.due]);

  const paise = toPaise(amount);
  const change = mode === 'cash' && tendered ? toPaise(tendered) - paise : 0;

  const submit = async () => {
    try {
      const updated = await pay({ id: bill.id, mode, amount: paise, reference: reference.trim() || undefined }).unwrap();
      setReference('');
      setTendered('');
      if (updated.status === 'paid') {
        toast.success(`${updated.billNo} settled`);
        onPaid?.();
      } else {
        toast.success(`${formatMoney(paise)} received · ${formatMoney(updated.due)} left`);
      }
    } catch (e) {
      if (isApiError(e) && e.code === 'NO_OPEN_SHIFT') setNeedShift(true);
      else toastError(e);
    }
  };

  const startShift = async () => {
    try {
      await openShift({ openingCash: toPaise(openingCash || '0') }).unwrap();
      setNeedShift(false);
      toast.success('Shift opened');
    } catch (e) { toastError(e); }
  };

  if (bill.status === 'paid' || bill.status === 'void') {
    return (
      <div className="text-center py-4 space-y-3">
        <CheckCircle2 className={`h-10 w-10 mx-auto ${bill.status === 'void' ? 'text-gray-400' : 'text-green-600'}`} />
        <p className="font-medium">{bill.status === 'void' ? 'This bill is void' : bill.isComplimentary ? 'Complimentary (NC)' : 'Paid in full'}</p>
        <Button variant="outline" onClick={() => printBill(bill, outlet)}><Printer className="h-4 w-4 mr-2" /> Print</Button>
      </div>
    );
  }

  if (needShift) {
    return (
      <div className="space-y-3 rounded-lg border border-amber-200 bg-amber-50 p-4">
        <p className="text-sm text-amber-900">No shift is open. Count the cash in the drawer and open a shift to take payments.</p>
        {can('shift.manage') ? (
          <div className="flex gap-2">
            <Input inputMode="decimal" placeholder="Opening cash ₹" value={openingCash} onChange={(e) => setOpeningCash(e.target.value)} />
            <Button onClick={startShift} disabled={opening.isLoading}>Open shift</Button>
          </div>
        ) : <p className="text-sm text-amber-900">Ask a cashier or manager to open one.</p>}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2">
        <span className="text-sm text-gray-600">Due</span>
        <span className="text-xl font-bold tabular-nums">{formatMoney(bill.due)}</span>
      </div>
      {bill.payments.length > 0 && (
        <ul className="text-sm space-y-1">
          {bill.payments.map((p) => (
            <li key={p.id} className="flex justify-between text-gray-600">
              <span className="capitalize">{p.mode === 'due' ? 'Credit' : p.mode}{p.reference ? ` · ${p.reference}` : ''}</span>
              <span className="tabular-nums">{formatMoney(p.amount)}</span>
            </li>
          ))}
        </ul>
      )}
      <div className="grid grid-cols-3 gap-2">
        {MODES.filter((m) => m.mode !== 'due' || bill.customer?.phone).map(({ mode: m, label, icon: Icon }) => (
          <button
            key={m}
            type="button"
            onClick={() => setMode(m)}
            className={`flex flex-col items-center gap-1 rounded-lg border py-2 text-sm transition ${mode === m ? 'border-accent bg-accent/10 ring-1 ring-accent font-semibold' : 'hover:bg-gray-50'}`}
          >
            <Icon className="h-4 w-4" /> {label}
          </button>
        ))}
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <Label className="text-xs">Amount ₹</Label>
          <Input inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} />
        </div>
        {mode === 'cash' ? (
          <div>
            <Label className="text-xs">Cash given ₹</Label>
            <Input inputMode="decimal" value={tendered} onChange={(e) => setTendered(e.target.value)} placeholder="optional" />
          </div>
        ) : mode !== 'due' ? (
          <div>
            <Label className="text-xs">Reference</Label>
            <Input value={reference} onChange={(e) => setReference(e.target.value)} placeholder="UTR / last 4" maxLength={60} />
          </div>
        ) : null}
      </div>
      {change > 0 && <p className="text-sm font-semibold text-green-700">Return change: {formatMoney(change)}</p>}
      <div className="flex gap-2">
        <Button variant="outline" onClick={() => printBill(bill, outlet)} title="Print bill"><Printer className="h-4 w-4" /></Button>
        <Button className="flex-1" onClick={submit} disabled={paying.isLoading || !(paise > 0) || paise > bill.due}>
          {paying.isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
          {paise < bill.due ? `Take ${formatMoney(paise)} (split)` : `Settle ${formatMoney(paise)}`}
        </Button>
      </div>
    </div>
  );
}

/**
 * Step 1 (orderId, no bill yet): discount + customer, then generate the bill.
 * Step 2: collect payment(s).
 */
export function BillDialog({ orderId, billId, open, onClose }: { orderId?: Id; billId?: Id | null; open: boolean; onClose: () => void }) {
  const can = useCan();
  const withApproval = useApproval();
  const outletId = useAppSelector((s) => s.session.outletId);
  const role = useAppSelector((s) => s.session.profile?.role);
  const { data: outlet } = useOutletQuery(outletId!, { skip: !outletId });
  const { data: order }= useOrderQuery(orderId!, { skip: !orderId || !open });
  const [createdId, setCreatedId] = useState<Id | null>(null);
  const activeBillId = billId || createdId || order?.billId || null;
  const { data: bill } = useBillQuery(activeBillId!, { skip: !activeBillId || !open });
  const [createBill, creating] = useCreateBillMutation();

  const [kind, setKind] = useState<'percent' | 'flat'>('percent');
  const [value, setValue] = useState('');
  const [reason, setReason] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [gstin, setGstin] = useState('');

  useEffect(() => {
    if (!open) {
      setCreatedId(null);
      setValue('');
      setReason('');
    }
  }, [open]);
  useEffect(() => {
    setName(order?.customer?.name || '');
    setPhone(order?.customer?.phone || '');
  }, [order?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const discountValue = kind === 'percent' ? Number(value) : toPaise(value);
  const hasDiscount = value !== '' && discountValue > 0;

  const generate = async () => {
    if (hasDiscount && reason.trim().length < 2) return toast.error('Add a reason for the discount');
    const created = await withApproval((approval) => createBill({
      orderId: orderId!,
      ...(hasDiscount && { discount: { kind, value: discountValue, reason: reason.trim() } }),
      customer: {
        ...(name.trim() && { name: name.trim() }),
        ...(phone.trim() && { phone: phone.trim() }),
        ...(gstin.trim() && { gstin: gstin.trim().toUpperCase() }),
      },
      approval,
    }).unwrap());
    if (created) {
      setCreatedId(created.id);
      printBill(created, outlet);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md max-h-[92vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {bill ? <>Bill {bill.billNo} <Badge variant="secondary" className="capitalize">{bill.status.replace('_', ' ')}</Badge></> : `Bill order #${order?.orderNo ?? ''}`}
          </DialogTitle>
          <DialogDescription>{bill?.tableName || order?.tableName || (order && order.type.replace('_', ' '))}</DialogDescription>
        </DialogHeader>

        {bill ? (
          <>
            <AmountsTable amounts={bill.amounts} discountReason={bill.discounts[0]?.reason} />
            <PaymentPanel bill={bill} onPaid={onClose} />
          </>
        ) : order ? (
          <div className="space-y-4">
            <AmountsTable amounts={order.amounts} />
            {can('bills.discount') && (
              <section className="space-y-2">
                <Label>Discount</Label>
                <div className="flex gap-2">
                  <div className="flex rounded-md border overflow-hidden">
                    {(['percent', 'flat'] as const).map((k) => (
                      <button key={k} type="button" onClick={() => setKind(k)} className={`px-3 text-sm ${kind === k ? 'bg-accent text-accent-foreground' : 'bg-white'}`}>{k === 'percent' ? '%' : '₹'}</button>
                    ))}
                  </div>
                  <Input inputMode="decimal" placeholder={kind === 'percent' ? '10' : '50'} value={value} onChange={(e) => setValue(e.target.value)} className="w-24" />
                  <Input placeholder="Reason" value={reason} onChange={(e) => setReason(e.target.value)} maxLength={100} />
                </div>
                {role && !role.isOwner && (
                  <p className="text-xs text-gray-500">You can give up to {role.maxDiscountPercent}%. More needs a manager PIN.</p>
                )}
              </section>
            )}
            <section className="grid grid-cols-2 gap-2">
              <div><Label className="text-xs">Customer name</Label><Input value={name} onChange={(e) => setName(e.target.value)} maxLength={80} /></div>
              <div><Label className="text-xs">Phone</Label><Input value={phone} onChange={(e) => setPhone(e.target.value)} inputMode="tel" /></div>
              <div className="col-span-2"><Label className="text-xs">Customer GSTIN (B2B invoice)</Label><Input value={gstin} onChange={(e) => setGstin(e.target.value)} maxLength={15} placeholder="optional" /></div>
            </section>
            <Button className="w-full" onClick={generate} disabled={creating.isLoading}>
              {creating.isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />} Generate bill & print
            </Button>
          </div>
        ) : (
          <Loader2 className="h-6 w-6 animate-spin mx-auto my-8 text-gray-400" />
        )}
      </DialogContent>
    </Dialog>
  );
}
