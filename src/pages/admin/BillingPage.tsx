import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Banknote, Gift, Loader2, Lock, Minus, Plus, Printer, RotateCcw, Search, Undo2, XCircle } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AmountsTable, PaymentPanel } from '@/components/admin/BillDialog';
import { useApproval } from '@/components/admin/ApprovalDialog';
import {
  useBillQuery, useBillsQuery, useCashMovementMutation, useCloseShiftMutation, useComplimentaryMutation,
  useCurrentShiftQuery, useOpenShiftMutation, useRefundPaymentMutation, useReprintBillMutation, useVoidBillMutation,
} from '@/store/endpoints/billing';
import { useOutletQuery } from '@/store/endpoints/admin';
import { useAppSelector } from '@/store/hooks';
import { useCan } from '@/hooks/useCan';
import { formatMoney, toPaise } from '@/lib/money';
import { toastError } from '@/lib/apiError';
import { printBill } from '@/lib/print';
import type { Bill, BillStatus, Payment } from '@/types/api';

const NOTES = ['500', '200', '100', '50', '20', '10', '5', '2', '1'];
const today = () => new Date().toLocaleDateString('en-CA');

const STATUS_BADGE: Record<BillStatus, string> = {
  unpaid: 'bg-red-100 text-red-800',
  partly_paid: 'bg-amber-100 text-amber-800',
  paid: 'bg-green-100 text-green-800',
  void: 'bg-gray-200 text-gray-600',
};

function ShiftCard() {
  const can = useCan();
  const { data: shift, isLoading } = useCurrentShiftQuery();
  const [open, opening] = useOpenShiftMutation();
  const [move] = useCashMovementMutation();
  const [close, closing] = useCloseShiftMutation();
  const [openingCash, setOpeningCash] = useState('');
  const [movement, setMovement] = useState<{ kind: 'in' | 'out'; amount: string; reason: string } | null>(null);
  const [closingOpen, setClosingOpen] = useState(false);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [coins, setCoins] = useState('');

  const counted = NOTES.reduce((s, n) => s + Number(n) * 100 * (counts[n] || 0), 0) + (toPaise(coins || '0') || 0);

  if (isLoading) return <Card className="p-6"><Loader2 className="h-5 w-5 animate-spin text-gray-400" /></Card>;

  if (!shift) {
    return (
      <Card>
        <CardHeader><CardTitle className="text-base flex items-center gap-2"><Lock className="h-4 w-4" /> No shift open</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          <p className="text-sm text-gray-600">Count the cash in the drawer to start taking payments.</p>
          {can('shift.manage') && (
            <div className="flex gap-2">
              <Input inputMode="decimal" placeholder="Opening cash ₹" value={openingCash} onChange={(e) => setOpeningCash(e.target.value)} />
              <Button disabled={opening.isLoading} onClick={() => open({ openingCash: toPaise(openingCash || '0') }).unwrap().then(() => toast.success('Shift opened')).catch(toastError)}>Open shift</Button>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  const cash = shift.cash!;
  const submitClose = async () => {
    try {
      const closed = await close({ countedCash: counted, denominations: Object.fromEntries(Object.entries(counts).filter(([, v]) => v > 0)) }).unwrap();
      const diff = closed.difference ?? 0;
      toast[diff === 0 ? 'success' : 'warning'](diff === 0 ? 'Shift closed. Cash matches.' : `Shift closed. ${diff > 0 ? 'Extra' : 'Short'} ${formatMoney(Math.abs(diff))}`);
      setClosingOpen(false);
      setCounts({});
    } catch (e) { toastError(e); }
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center justify-between">
          <span className="flex items-center gap-2"><Banknote className="h-4 w-4 text-green-600" /> Shift open since {new Date(shift.openedAt).toLocaleTimeString('en-IN', { timeStyle: 'short' })}</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <dl className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
          <div><dt className="text-gray-500">Opening</dt><dd className="font-semibold">{formatMoney(cash.openingCash)}</dd></div>
          <div><dt className="text-gray-500">Cash sales</dt><dd className="font-semibold">{formatMoney(cash.cashSales)}</dd></div>
          <div><dt className="text-gray-500">Cash in/out</dt><dd className="font-semibold">{formatMoney(cash.cashMovements)}</dd></div>
          <div><dt className="text-gray-500">Should be in drawer</dt><dd className="font-bold text-lg">{formatMoney(cash.expected)}</dd></div>
        </dl>
        {can('shift.manage') && (
          <div className="flex flex-wrap gap-2">
            <Button size="sm" variant="outline" onClick={() => setMovement({ kind: 'in', amount: '', reason: '' })}><Plus className="h-4 w-4 mr-1" /> Cash in</Button>
            <Button size="sm" variant="outline" onClick={() => setMovement({ kind: 'out', amount: '', reason: '' })}><Minus className="h-4 w-4 mr-1" /> Cash out</Button>
            <Button size="sm" variant="secondary" onClick={() => setClosingOpen(true)}>Close shift</Button>
          </div>
        )}
      </CardContent>

      <Dialog open={Boolean(movement)} onOpenChange={(o) => !o && setMovement(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>{movement?.kind === 'in' ? 'Cash in' : 'Cash out (petty cash)'}</DialogTitle></DialogHeader>
          {movement && (
            <div className="space-y-2">
              <Input autoFocus inputMode="decimal" placeholder="Amount ₹" value={movement.amount} onChange={(e) => setMovement({ ...movement, amount: e.target.value })} />
              <Input placeholder="Reason (e.g. milk, change from bank)" value={movement.reason} onChange={(e) => setMovement({ ...movement, reason: e.target.value })} maxLength={100} />
            </div>
          )}
          <DialogFooter>
            <Button onClick={() => movement && move({ kind: movement.kind, amount: toPaise(movement.amount), reason: movement.reason.trim() })
              .unwrap().then(() => { setMovement(null); toast.success('Recorded'); }).catch(toastError)}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={closingOpen} onOpenChange={setClosingOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Close shift</DialogTitle>
            <DialogDescription>Count the drawer. Expected: {formatMoney(cash.expected)}</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-3 gap-2">
            {NOTES.map((n) => (
              <div key={n}>
                <Label className="text-xs">₹{n} ×</Label>
                <Input inputMode="numeric" value={counts[n] || ''} onChange={(e) => setCounts({ ...counts, [n]: Number(e.target.value.replace(/\D/g, '')) })} />
              </div>
            ))}
            <div className="col-span-3"><Label className="text-xs">Coins / other ₹</Label><Input inputMode="decimal" value={coins} onChange={(e) => setCoins(e.target.value)} /></div>
          </div>
          <div className="flex justify-between text-sm font-semibold">
            <span>Counted {formatMoney(counted)}</span>
            <span className={counted === cash.expected ? 'text-green-700' : 'text-red-600'}>
              {counted === cash.expected ? 'Matches' : `${counted > cash.expected ? '+' : '−'}${formatMoney(Math.abs(counted - cash.expected))}`}
            </span>
          </div>
          <DialogFooter><Button onClick={submitClose} disabled={closing.isLoading}>Close shift</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

function BillDetail({ id, onClose }: { id: string; onClose: () => void }) {
  const can = useCan();
  const withApproval = useApproval();
  const outletId = useAppSelector((s) => s.session.outletId);
  const { data: outlet } = useOutletQuery(outletId!, { skip: !outletId });
  const { data: bill } = useBillQuery(id);
  const [reprint] = useReprintBillMutation();
  const [refund] = useRefundPaymentMutation();
  const [voidBill] = useVoidBillMutation();
  const [nc] = useComplimentaryMutation();
  const [action, setAction] = useState<{ kind: 'refund'; payment: Payment } | { kind: 'void' | 'nc' } | null>(null);
  const [reason, setReason] = useState('');
  const [reopen, setReopen] = useState(false);

  if (!bill) return null;

  const run = async () => {
    if (!action || reason.trim().length < 3) return toast.error('Add a reason');
    const r = reason.trim();
    let done: Bill | undefined;
    if (action.kind === 'refund') {
      done = await withApproval(() => refund({ id: bill.id, paymentId: action.payment.id, amount: action.payment.amount - action.payment.refunded, reason: r }).unwrap());
    } else if (action.kind === 'void') {
      done = await withApproval((approval) => voidBill({ id: bill.id, reason: r, approval, reopenOrder: reopen }).unwrap());
    } else {
      done = await withApproval((approval) => nc({ id: bill.id, reason: r, approval }).unwrap());
    }
    if (done) {
      toast.success('Done');
      setAction(null);
      setReason('');
    }
  };

  const netPaid = bill.payments.reduce((s, p) => s + p.amount - p.refunded, 0);

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md max-h-[92vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">{bill.billNo} <Badge className={`${STATUS_BADGE[bill.status]} capitalize`}>{bill.isComplimentary ? 'NC' : bill.status.replace('_', ' ')}</Badge></DialogTitle>
          <DialogDescription>
            Order #{bill.orderNo}{bill.tableName && ` · ${bill.tableName}`} · {new Date(bill.createdAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
          </DialogDescription>
        </DialogHeader>

        <ul className="text-sm space-y-1 border-b pb-2">
          {bill.lines.map((l, i) => (
            <li key={i} className="flex justify-between"><span>{l.qty} × {l.name}</span><span className="tabular-nums">{formatMoney(l.amount)}</span></li>
          ))}
        </ul>
        <AmountsTable amounts={bill.amounts} discountReason={bill.discounts[0]?.reason} />

        {bill.status !== 'paid' && bill.status !== 'void' ? <PaymentPanel bill={bill} /> : (
          bill.payments.length > 0 && (
            <ul className="text-sm space-y-1">
              {bill.payments.map((p) => (
                <li key={p.id} className="flex items-center justify-between">
                  <span className="capitalize">{p.mode}{p.reference && ` · ${p.reference}`}{p.refunded > 0 && <span className="text-red-600"> (refunded {formatMoney(p.refunded)})</span>}</span>
                  <span className="flex items-center gap-2">
                    {formatMoney(p.amount)}
                    {can('payments.refund') && p.refunded < p.amount && bill.status !== 'void' && (
                      <Button size="icon" variant="ghost" className="h-7 w-7" title="Refund" onClick={() => setAction({ kind: 'refund', payment: p })}><Undo2 className="h-3.5 w-3.5" /></Button>
                    )}
                  </span>
                </li>
              ))}
            </ul>
          )
        )}

        {bill.voidReason && <p className="text-sm text-gray-600">Reason: {bill.voidReason}</p>}

        <div className="flex flex-wrap gap-2 pt-2 border-t">
          {can('bills.reprint') && (
            <Button size="sm" variant="outline" onClick={() => reprint(bill.id).unwrap().then((b) => printBill(b, outlet, { duplicate: true })).catch(toastError)}>
              <Printer className="h-4 w-4 mr-1" /> Reprint
            </Button>
          )}
          {bill.status === 'unpaid' && (
            <Button size="sm" variant="outline" onClick={() => setAction({ kind: 'nc' })}><Gift className="h-4 w-4 mr-1" /> Complimentary</Button>
          )}
          {bill.status !== 'void' && (
            <Button size="sm" variant="outline" className="text-red-600" disabled={netPaid > 0} title={netPaid > 0 ? 'Refund payments first' : undefined} onClick={() => setAction({ kind: 'void' })}>
              <XCircle className="h-4 w-4 mr-1" /> Void
            </Button>
          )}
        </div>
        {bill.status !== 'void' && netPaid > 0 && can('bills.void') && <p className="text-xs text-gray-500">To void a paid bill, refund its payments first.</p>}

        {action && (
          <div className="rounded-lg border p-3 space-y-2 bg-gray-50">
            <p className="text-sm font-semibold">
              {action.kind === 'refund' ? `Refund ${formatMoney(action.payment.amount - action.payment.refunded)} (${action.payment.mode})`
                : action.kind === 'void' ? 'Void this bill (the number is kept)' : 'Make this bill complimentary'}
            </p>
            <Input autoFocus placeholder="Reason" value={reason} onChange={(e) => setReason(e.target.value)} maxLength={200} />
            {action.kind === 'void' && (
              <label className="flex items-center gap-2 text-sm"><Switch checked={reopen} onCheckedChange={setReopen} /> Reopen the order to bill again</label>
            )}
            <div className="flex gap-2 justify-end">
              <Button size="sm" variant="ghost" onClick={() => setAction(null)}>Back</Button>
              <Button size="sm" variant="destructive" onClick={run}>Confirm</Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

export const BillingPage: React.FC = () => {
  const can = useCan();
  const [date, setDate] = useState(today());
  const [status, setStatus] = useState<BillStatus | 'all'>('all');
  const [q, setQ] = useState('');
  const [openId, setOpenId] = useState<string | null>(null);
  const { data, isFetching } = useBillsQuery(
    { from: date, to: date, limit: 200, ...(status !== 'all' && { status }), ...(q.trim() && { q: q.trim() }) },
    { skip: !can('reports.view') },
  );
  const bills = useMemo(() => data?.data ?? [], [data]);
  const totals = useMemo(() => ({
    paid: bills.filter((b) => b.status === 'paid' && !b.isComplimentary).reduce((s, b) => s + b.amounts.total, 0),
    due: bills.filter((b) => b.status === 'unpaid' || b.status === 'partly_paid').reduce((s, b) => s + b.due, 0),
  }), [bills]);

  return (
    <div className="space-y-4">
      <ShiftCard />

      {can('reports.view') ? (
        <Card>
          <CardHeader className="pb-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <CardTitle className="text-base">Bills</CardTitle>
              <div className="flex flex-wrap gap-2">
                <Input type="date" value={date} max={today()} onChange={(e) => setDate(e.target.value)} className="w-40" />
                <Select value={status} onValueChange={(v) => setStatus(v as BillStatus | 'all')}>
                  <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="unpaid">Unpaid</SelectItem>
                    <SelectItem value="partly_paid">Part paid</SelectItem>
                    <SelectItem value="paid">Paid</SelectItem>
                    <SelectItem value="void">Void</SelectItem>
                  </SelectContent>
                </Select>
                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input placeholder="Bill no." className="pl-8 w-32" value={q} onChange={(e) => setQ(e.target.value)} />
                </div>
                <Button variant="outline" size="icon" asChild title="Day end report"><Link to={`/admin/analytics?tab=dayend&date=${date}`}><RotateCcw className="h-4 w-4" /></Link></Button>
              </div>
            </div>
            <p className="text-sm text-gray-600">Collected {formatMoney(totals.paid)} · Pending {formatMoney(totals.due)}</p>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-gray-600">
                  <tr><th className="text-left p-3">Bill</th><th className="text-left p-3">Table / type</th><th className="text-right p-3">Total</th><th className="text-right p-3">Due</th><th className="p-3">Status</th></tr>
                </thead>
                <tbody>
                  {bills.map((b) => (
                    <tr key={b.id} className="border-t hover:bg-gray-50 cursor-pointer" onClick={() => setOpenId(b.id)}>
                      <td className="p-3 font-medium">{b.billNo}<div className="text-xs text-gray-500">{new Date(b.createdAt).toLocaleTimeString('en-IN', { timeStyle: 'short' })}</div></td>
                      <td className="p-3">{b.tableName || b.orderType.replace('_', ' ')}</td>
                      <td className="p-3 text-right tabular-nums">{formatMoney(b.amounts.total)}</td>
                      <td className="p-3 text-right tabular-nums">{b.due ? formatMoney(b.due) : '—'}</td>
                      <td className="p-3 text-center"><Badge className={`${STATUS_BADGE[b.status]} capitalize`}>{b.isComplimentary ? 'NC' : b.status.replace('_', ' ')}</Badge></td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {!bills.length && <p className="text-center text-gray-500 py-8">{isFetching ? 'Loading…' : 'No bills for this day'}</p>}
            </div>
          </CardContent>
        </Card>
      ) : (
        <p className="text-sm text-gray-500">Open a table from the Tables screen to take payment.</p>
      )}

      {openId && <BillDetail id={openId} onClose={() => setOpenId(null)} />}
    </div>
  );
};
