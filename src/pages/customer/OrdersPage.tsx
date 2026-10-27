import React from 'react';
import { Link, useParams } from 'react-router-dom';
import { CheckCircle2, ChefHat, Clock, Loader2, Receipt, UtensilsCrossed, XCircle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useTrackOrderQuery } from '@/store/endpoints/public';
import { useOrderTracking } from '@/hooks/useRealtime';
import { useAppSelector } from '@/store/hooks';
import { formatMoney } from '@/lib/money';
import type { KotStatus, TrackedOrder } from '@/types/api';

const STEPS: { key: string; label: string; icon: typeof Clock }[] = [
  { key: 'placed', label: 'Placed', icon: Clock },
  { key: 'confirmed', label: 'Confirmed', icon: CheckCircle2 },
  { key: 'cooking', label: 'Cooking', icon: ChefHat },
  { key: 'served', label: 'Served', icon: UtensilsCrossed },
];

// One step for the whole order, from the slowest item still in the kitchen.
function stepOf(o: TrackedOrder) {
  if (o.status === 'awaiting_acceptance') return 0;
  const kitchen = o.items.filter((i) => i.status === 'active').map((i) => i.kitchenStatus);
  if (!kitchen.length) return 1;
  const order: (KotStatus | null)[] = [null, 'pending', 'preparing', 'ready', 'served'];
  const slowest = kitchen.reduce((min, s) => (order.indexOf(s) < order.indexOf(min) ? s : min), 'served' as KotStatus | null);
  if (slowest === 'served' || slowest === 'ready') return 3;
  if (slowest === 'preparing') return 2;
  return 1;
}

const ITEM_LABEL: Record<string, string> = {
  awaiting_acceptance: 'Waiting', pending: 'Sent to kitchen', preparing: 'Cooking', ready: 'Ready', served: 'Served', cancelled: 'Cancelled',
};

// /order/:trackingToken: live status for the customer.
export function TrackOrderPage() {
  const { trackingToken = '' } = useParams();
  const { data: o, isLoading, isError } = useTrackOrderQuery(trackingToken);
  useOrderTracking(trackingToken);

  if (isLoading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>;
  if (isError || !o) return <div className="min-h-screen flex items-center justify-center p-6 text-center text-muted-foreground">Order not found.</div>;

  const step = stepOf(o);
  const cancelled = o.status === 'cancelled';

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-lg mx-auto p-4 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Order #{o.orderNo}</h1>
            <p className="text-sm text-muted-foreground">{o.tableName && `Table ${o.tableName} · `}{new Date(o.createdAt).toLocaleTimeString('en-IN', { timeStyle: 'short' })}</p>
          </div>
          <Button asChild variant="outline" size="sm"><Link to="/my-orders">All orders</Link></Button>
        </div>

        {cancelled ? (
          <Card className="border-red-200 bg-red-50"><CardContent className="p-4 flex items-center gap-2 text-red-700"><XCircle className="h-5 w-5" /> This order was cancelled. Please ask the staff.</CardContent></Card>
        ) : (
          <Card>
            <CardContent className="p-4">
              <div className="flex justify-between">
                {STEPS.map((s, i) => (
                  <div key={s.key} className="flex flex-col items-center flex-1">
                    <div className={`h-10 w-10 rounded-full flex items-center justify-center ${i <= step ? 'bg-accent text-accent-foreground' : 'bg-muted text-muted-foreground'} ${i === step ? 'ring-4 ring-accent/20' : ''}`}>
                      <s.icon className="h-5 w-5" />
                    </div>
                    <span className={`text-xs mt-1 ${i <= step ? 'font-semibold' : 'text-muted-foreground'}`}>{s.label}</span>
                  </div>
                ))}
              </div>
              {step === 0 && <p className="text-sm text-center text-muted-foreground mt-3">Waiting for the staff to confirm…</p>}
            </CardContent>
          </Card>
        )}

        <Card>
          <CardContent className="p-0 divide-y">
            {o.items.map((i, n) => (
              <div key={n} className={`flex items-center justify-between p-3 ${i.status === 'cancelled' ? 'opacity-50 line-through' : ''}`}>
                <div>
                  <p className="font-medium">{i.qty} × {i.name}{i.variantName && ` (${i.variantName})`}</p>
                  {i.addons.length > 0 && <p className="text-xs text-muted-foreground">+ {i.addons.join(', ')}</p>}
                </div>
                <Badge variant="secondary">{ITEM_LABEL[i.status === 'active' ? i.kitchenStatus ?? 'pending' : i.status]}</Badge>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 space-y-1 text-sm">
            <div className="flex justify-between"><span>Items</span><span>{formatMoney(o.amounts.subtotal)}</span></div>
            {o.amounts.taxes.map((t) => <div key={`${t.name}${t.rate}`} className="flex justify-between text-muted-foreground"><span>{t.name} {t.rate}%</span><span>{formatMoney(t.amount)}</span></div>)}
            <div className="flex justify-between font-bold text-base border-t pt-1"><span>Total</span><span>{formatMoney(o.bill?.total ?? o.amounts.total)}</span></div>
            {o.bill && (
              <div className="flex items-center justify-between pt-2">
                <span className="flex items-center gap-1"><Receipt className="h-4 w-4" /> Bill {o.bill.billNo}</span>
                <Badge className={o.bill.status === 'paid' ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'}>
                  {o.bill.status === 'paid' ? 'Paid' : `${formatMoney(o.bill.due)} due`}
                </Badge>
              </div>
            )}
          </CardContent>
        </Card>
        <p className="text-xs text-center text-muted-foreground">This page updates by itself.</p>
      </div>
    </div>
  );
}

// /my-orders: orders placed from this phone.
export const OrdersPage: React.FC = () => {
  const placed = useAppSelector((s) => s.cart.placed);
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-lg mx-auto p-4 space-y-3">
        <h1 className="text-2xl font-bold">My orders</h1>
        {placed.map((p) => (
          <Link key={p.trackingToken} to={`/order/${p.trackingToken}`}>
            <Card className="hover:shadow-md transition mb-2">
              <CardContent className="p-4 flex justify-between items-center">
                <div>
                  <p className="font-semibold">Order #{p.orderNo}</p>
                  <p className="text-sm text-muted-foreground">{p.tableName && `Table ${p.tableName} · `}{new Date(p.at).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}</p>
                </div>
                <span className="text-accent text-sm font-medium">Track →</span>
              </CardContent>
            </Card>
          </Link>
        ))}
        {!placed.length && <p className="text-muted-foreground text-center py-16">No orders from this phone yet. Scan the QR on your table to order.</p>}
      </div>
    </div>
  );
};
