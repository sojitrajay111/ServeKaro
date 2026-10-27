import React from 'react';
import { Link } from 'react-router-dom';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { IndianRupee, Loader2, Receipt, ShoppingCart, Smartphone, Users, UtensilsCrossed } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useDashboardQuery } from '@/store/endpoints/reports';
import { useOrdersQuery } from '@/store/endpoints/orders';
import { useCurrentShiftQuery } from '@/store/endpoints/billing';
import { useAppSelector } from '@/store/hooks';
import { formatMoney, formatMoneyShort } from '@/lib/money';

const Stat = ({ icon: Icon, label, value, sub }: { icon: typeof Receipt; label: string; value: string; sub?: string }) => (
  <Card>
    <CardContent className="p-4 flex items-center gap-3">
      <div className="h-10 w-10 rounded-lg bg-accent/15 text-accent flex items-center justify-center flex-shrink-0"><Icon className="h-5 w-5" /></div>
      <div className="min-w-0">
        <p className="text-xs text-gray-500">{label}</p>
        <p className="text-xl font-bold tabular-nums truncate">{value}</p>
        {sub && <p className="text-xs text-gray-500">{sub}</p>}
      </div>
    </CardContent>
  </Card>
);

const hourLabel = (h: number) => `${h % 12 || 12}${h < 12 ? 'a' : 'p'}`;

export const AdminDashboard: React.FC = () => {
  const name = useAppSelector((s) => s.session.profile?.user.name.split(' ')[0]);
  const { data, isLoading } = useDashboardQuery(undefined, { pollingInterval: 120_000 });
  const { data: pending } = useOrdersQuery({ status: ['awaiting_acceptance'], limit: 50 });
  const { data: shift } = useCurrentShiftQuery();

  if (isLoading || !data) return <Loader2 className="h-8 w-8 animate-spin mx-auto mt-20 text-gray-400" />;

  const hours = Array.from({ length: 24 }, (_, h) => ({ hour: hourLabel(h), amount: (data.byHour.find((x) => x.hour === h)?.amount ?? 0) / 100 }))
    .filter((_, h) => h >= 7 || data.byHour.some((x) => x.hour === h));

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-gray-600">Hi {name}, here's today so far.</p>
        <div className="flex gap-2">
          {!shift && <Button asChild variant="outline" size="sm"><Link to="/admin/billing">Open shift</Link></Button>}
          <Button asChild size="sm"><Link to="/admin/orders">New order</Link></Button>
        </div>
      </div>

      {(pending?.meta.total ?? 0) > 0 && (
        <Card className="border-amber-300 bg-amber-50">
          <CardContent className="p-4 flex items-center justify-between">
            <span className="flex items-center gap-2 text-amber-900"><Smartphone className="h-4 w-4" /> {pending!.meta.total} QR order(s) waiting for acceptance</span>
            <Button asChild size="sm" variant="outline" className="bg-white"><Link to="/admin/live">Review</Link></Button>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Stat icon={IndianRupee} label="Sales today" value={formatMoneyShort(data.sales)} sub={`${data.bills} bills`} />
        <Stat icon={Receipt} label="Average bill" value={formatMoneyShort(data.avgBill)} />
        <Stat icon={ShoppingCart} label="Orders" value={String(data.orders)} sub={`${data.covers} guests`} />
        <Stat icon={UtensilsCrossed} label="Running tables" value={String(data.runningTables)} sub={formatMoneyShort(data.runningAmount)} />
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2"><CardTitle className="text-base">Sales by hour</CardTitle></CardHeader>
          <CardContent className="h-64">
            {data.byHour.length ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={hours}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="hour" tickLine={false} fontSize={12} />
                  <YAxis tickLine={false} fontSize={12} tickFormatter={(v) => `₹${v >= 1000 ? `${Math.round(v / 1000)}k` : v}`} width={48} />
                  <Tooltip formatter={(v: number) => formatMoney(v * 100)} />
                  <Bar dataKey="amount" fill="hsl(var(--accent))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : <p className="text-gray-500 text-sm text-center pt-20">No settled bills yet today</p>}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-base">Top items</CardTitle></CardHeader>
          <CardContent>
            {data.topItems.length ? (
              <ol className="space-y-2">
                {data.topItems.map((i, n) => (
                  <li key={`${i.id}${i.name}`} className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2 min-w-0"><span className="text-gray-400 w-4">{n + 1}</span><span className="truncate">{i.name}</span></span>
                    <span className="text-gray-600 tabular-nums">{i.qty} · {formatMoneyShort(i.amount)}</span>
                  </li>
                ))}
              </ol>
            ) : <p className="text-gray-500 text-sm">Nothing sold yet</p>}
            <Button asChild variant="link" className="px-0 mt-2"><Link to="/admin/analytics"><Users className="h-4 w-4 mr-1" /> Full reports</Link></Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
