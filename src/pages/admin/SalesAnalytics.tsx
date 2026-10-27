import React, { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Download, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  downloadCsv, useAuditLogsQuery, useCategoriesReportQuery, useDayEndQuery, useItemsReportQuery,
  usePaymentsReportQuery, useSalesReportQuery, useTaxReportQuery, type Range,
} from '@/store/endpoints/reports';
import { useAppSelector } from '@/store/hooks';
import { formatMoney } from '@/lib/money';
import { toastError } from '@/lib/apiError';

const iso = (d: Date) => d.toLocaleDateString('en-CA');
const daysAgo = (n: number) => { const d = new Date(); d.setDate(d.getDate() - n); return iso(d); };
const PRESETS: { label: string; range: () => Range }[] = [
  { label: 'Today', range: () => ({ from: iso(new Date()), to: iso(new Date()) }) },
  { label: 'Yesterday', range: () => ({ from: daysAgo(1), to: daysAgo(1) }) },
  { label: '7 days', range: () => ({ from: daysAgo(6), to: iso(new Date()) }) },
  { label: '30 days', range: () => ({ from: daysAgo(29), to: iso(new Date()) }) },
  { label: 'This month', range: () => { const d = new Date(); return { from: iso(new Date(d.getFullYear(), d.getMonth(), 1)), to: iso(d) }; } },
];

const Money = ({ v, className = '' }: { v: number; className?: string }) => <span className={`tabular-nums ${className}`}>{formatMoney(v)}</span>;

function DataTable<T>({ rows, cols, empty = 'No data for these dates' }: {
  rows: T[] | undefined; cols: { head: string; cell: (r: T) => React.ReactNode; right?: boolean }[]; empty?: string;
}) {
  if (!rows) return <Loader2 className="h-6 w-6 animate-spin mx-auto my-8 text-gray-400" />;
  if (!rows.length) return <p className="text-center text-gray-500 py-8">{empty}</p>;
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="bg-gray-50 text-gray-600"><tr>{cols.map((c) => <th key={c.head} className={`p-3 ${c.right ? 'text-right' : 'text-left'}`}>{c.head}</th>)}</tr></thead>
        <tbody>{rows.map((r, i) => <tr key={i} className="border-t">{cols.map((c) => <td key={c.head} className={`p-3 ${c.right ? 'text-right' : ''}`}>{c.cell(r)}</td>)}</tr>)}</tbody>
      </table>
    </div>
  );
}

function DayEnd({ date }: { date: string }) {
  const { data } = useDayEndQuery(date);
  if (!data) return <Loader2 className="h-6 w-6 animate-spin mx-auto my-8 text-gray-400" />;
  const s = data.sales;
  return (
    <div className="grid md:grid-cols-2 gap-4">
      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-base">Sales · {data.date}</CardTitle></CardHeader>
        <CardContent className="text-sm space-y-1">
          {[['Bills', String(s.bills)], ['Gross', formatMoney(s.gross)], ['Discount', `−${formatMoney(s.discount)}`], ['Service charge', formatMoney(s.serviceCharge)],
            ['Tax', formatMoney(s.tax)], ['Round off', formatMoney(s.roundOff)], ['Net sales', formatMoney(s.net)]].map(([k, v]) => (
            <div key={k} className={`flex justify-between ${k === 'Net sales' ? 'font-bold border-t pt-1' : ''}`}><span>{k}</span><span className="tabular-nums">{v}</span></div>
          ))}
          <div className="flex justify-between text-gray-600 pt-2"><span>Void bills</span><span>{data.void.count} · {formatMoney(data.void.amount)}</span></div>
          <div className="flex justify-between text-gray-600"><span>Complimentary</span><span>{data.complimentary.count} · {formatMoney(data.complimentary.amount)}</span></div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-base">Payments</CardTitle></CardHeader>
        <CardContent className="text-sm space-y-1">
          {data.payments.map((p) => <div key={p.mode} className="flex justify-between capitalize"><span>{p.mode === 'due' ? 'Credit' : p.mode} ({p.count})</span><Money v={p.net} /></div>)}
          {!data.payments.length && <p className="text-gray-500">No payments</p>}
          <h4 className="font-semibold pt-3">GST</h4>
          {data.taxes.map((t) => <div key={`${t.name}${t.rate}`} className="flex justify-between"><span>{t.name} @ {t.rate}% on {formatMoney(t.taxable)}</span><Money v={t.amount} /></div>)}
        </CardContent>
      </Card>
      <Card className="md:col-span-2">
        <CardHeader className="pb-2"><CardTitle className="text-base">Shifts</CardTitle></CardHeader>
        <CardContent className="p-0">
          <DataTable rows={data.shifts} empty="No shifts" cols={[
            { head: 'Opened', cell: (r) => new Date(r.openedAt).toLocaleTimeString('en-IN', { timeStyle: 'short' }) },
            { head: 'Closed', cell: (r) => (r.closedAt ? new Date(r.closedAt).toLocaleTimeString('en-IN', { timeStyle: 'short' }) : 'Open') },
            { head: 'Expected', right: true, cell: (r) => (r.expectedCash != null ? <Money v={r.expectedCash} /> : '—') },
            { head: 'Counted', right: true, cell: (r) => (r.countedCash != null ? <Money v={r.countedCash} /> : '—') },
            { head: 'Difference', right: true, cell: (r) => (r.difference != null ? <Money v={r.difference} className={r.difference ? 'text-red-600 font-semibold' : ''} /> : '—') },
          ]} />
        </CardContent>
      </Card>
    </div>
  );
}

function AuditLog() {
  const [page, setPage] = useState(1);
  const { data } = useAuditLogsQuery({ page });
  return (
    <Card>
      <CardContent className="p-0">
        <DataTable rows={data?.data} empty="Nothing logged yet" cols={[
          { head: 'When', cell: (r) => new Date(r.createdAt).toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' }) },
          { head: 'Who', cell: (r) => r.userName ?? '—' },
          { head: 'What', cell: (r) => <span className="font-mono text-xs">{r.action}</span> },
          { head: 'Details', cell: (r) => <span className="text-xs text-gray-600 break-all">{Object.entries(r.details ?? {}).map(([k, v]) => `${k}: ${typeof v === 'object' ? JSON.stringify(v) : v}`).join(' · ')}{r.approvedBy && ' · manager approved'}</span> },
        ]} />
        {data && data.meta.total > data.meta.limit && (
          <div className="flex justify-between p-3 border-t">
            <Button size="sm" variant="outline" disabled={page === 1} onClick={() => setPage(page - 1)}>Newer</Button>
            <Button size="sm" variant="outline" disabled={page * data.meta.limit >= data.meta.total} onClick={() => setPage(page + 1)}>Older</Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export const SalesAnalytics: React.FC = () => {
  const [params, setParams] = useSearchParams();
  const { accessToken, outletId } = useAppSelector((s) => s.session);
  const [range, setRange] = useState<Range>(() => {
    const d = params.get('date');
    return d ? { from: d, to: d } : PRESETS[2].range();
  });
  const tab = params.get('tab') || 'sales';

  const sales = useSalesReportQuery(range);
  const items = useItemsReportQuery(range, { skip: tab !== 'items' });
  const categories = useCategoriesReportQuery(range, { skip: tab !== 'categories' });
  const payments = usePaymentsReportQuery(range, { skip: tab !== 'payments' });
  const tax = useTaxReportQuery(range, { skip: tab !== 'tax' });

  const totals = useMemo(() => (sales.data ?? []).reduce(
    (t, r) => ({ net: t.net + r.net, bills: t.bills + r.bills, tax: t.tax + r.tax, discount: t.discount + r.discount }),
    { net: 0, bills: 0, tax: 0, discount: 0 },
  ), [sales.data]);

  const exportCsv = (report: string) => downloadCsv(report, range, accessToken, outletId).catch(toastError);
  const csvButton = (report: string) => <Button size="sm" variant="outline" onClick={() => exportCsv(report)}><Download className="h-4 w-4 mr-1" /> CSV</Button>;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        {PRESETS.map((p) => (
          <Button key={p.label} size="sm" variant={JSON.stringify(p.range()) === JSON.stringify(range) ? 'default' : 'outline'} onClick={() => setRange(p.range())}>{p.label}</Button>
        ))}
        <Input type="date" className="w-40 bg-white" value={range.from} max={range.to} onChange={(e) => setRange({ ...range, from: e.target.value })} />
        <span className="text-gray-400">to</span>
        <Input type="date" className="w-40 bg-white" value={range.to} min={range.from} onChange={(e) => setRange({ ...range, to: e.target.value })} />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[['Net sales', formatMoney(totals.net)], ['Bills', String(totals.bills)], ['Avg bill', formatMoney(totals.bills ? Math.round(totals.net / totals.bills) : 0)], ['Discounts', formatMoney(totals.discount)]].map(([k, v]) => (
          <Card key={k}><CardContent className="p-4"><p className="text-xs text-gray-500">{k}</p><p className="text-xl font-bold tabular-nums">{v}</p></CardContent></Card>
        ))}
      </div>

      <Tabs value={tab} onValueChange={(t) => setParams({ tab: t })}>
        <TabsList className="flex-wrap h-auto">
          <TabsTrigger value="sales">Sales</TabsTrigger>
          <TabsTrigger value="items">Items</TabsTrigger>
          <TabsTrigger value="categories">Categories</TabsTrigger>
          <TabsTrigger value="payments">Payments</TabsTrigger>
          <TabsTrigger value="tax">GST</TabsTrigger>
          <TabsTrigger value="dayend">Day end</TabsTrigger>
          <TabsTrigger value="audit">Audit log</TabsTrigger>
        </TabsList>

        <TabsContent value="sales" className="space-y-4">
          <Card>
            <CardContent className="h-64 pt-4">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={(sales.data ?? []).map((r) => ({ day: r.key.slice(5), net: r.net / 100 }))}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="day" fontSize={12} tickLine={false} />
                  <YAxis fontSize={12} tickLine={false} width={50} tickFormatter={(v) => `₹${v >= 1000 ? `${Math.round(v / 1000)}k` : v}`} />
                  <Tooltip formatter={(v: number) => formatMoney(v * 100)} />
                  <Bar dataKey="net" fill="hsl(var(--accent))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2 flex-row items-center justify-between"><CardTitle className="text-base">By day</CardTitle>{csvButton('sales')}</CardHeader>
            <CardContent className="p-0">
              <DataTable rows={sales.data} cols={[
                { head: 'Date', cell: (r) => r.key },
                { head: 'Bills', right: true, cell: (r) => r.bills },
                { head: 'Gross', right: true, cell: (r) => <Money v={r.gross} /> },
                { head: 'Discount', right: true, cell: (r) => <Money v={r.discount} /> },
                { head: 'Tax', right: true, cell: (r) => <Money v={r.tax} /> },
                { head: 'Net', right: true, cell: (r) => <Money v={r.net} className="font-semibold" /> },
              ]} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="items">
          <Card>
            <CardHeader className="pb-2 flex-row items-center justify-between"><CardTitle className="text-base">Item sales</CardTitle>{csvButton('items')}</CardHeader>
            <CardContent className="p-0">
              <DataTable rows={items.data} cols={[
                { head: 'Item', cell: (r) => r.name },
                { head: 'Qty', right: true, cell: (r) => r.qty },
                { head: 'Amount', right: true, cell: (r) => <Money v={r.amount} /> },
              ]} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="categories">
          <Card>
            <CardHeader className="pb-2 flex-row items-center justify-between"><CardTitle className="text-base">Category sales</CardTitle>{csvButton('categories')}</CardHeader>
            <CardContent className="p-0">
              <DataTable rows={categories.data} cols={[
                { head: 'Category', cell: (r) => r.name ?? '—' },
                { head: 'Qty', right: true, cell: (r) => r.qty },
                { head: 'Amount', right: true, cell: (r) => <Money v={r.amount} /> },
              ]} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payments">
          <Card>
            <CardHeader className="pb-2 flex-row items-center justify-between"><CardTitle className="text-base">Payment modes</CardTitle>{csvButton('payments')}</CardHeader>
            <CardContent className="p-0">
              <DataTable rows={payments.data} cols={[
                { head: 'Mode', cell: (r) => <span className="capitalize">{r.mode === 'due' ? 'Credit' : r.mode}</span> },
                { head: 'Count', right: true, cell: (r) => r.count },
                { head: 'Received', right: true, cell: (r) => <Money v={r.amount} /> },
                { head: 'Refunded', right: true, cell: (r) => <Money v={r.refunded} /> },
                { head: 'Net', right: true, cell: (r) => <Money v={r.net} className="font-semibold" /> },
              ]} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tax" className="space-y-4">
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-base">GST by rate</CardTitle></CardHeader>
            <CardContent className="p-0">
              <DataTable rows={tax.data?.byRate} cols={[
                { head: 'Tax', cell: (r) => `${r.name} @ ${r.rate}%` },
                { head: 'Taxable value', right: true, cell: (r) => <Money v={r.taxable} /> },
                { head: 'Tax amount', right: true, cell: (r) => <Money v={r.amount} /> },
              ]} />
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-base">HSN summary (GSTR-1)</CardTitle></CardHeader>
            <CardContent className="p-0">
              <DataTable rows={tax.data?.byHsn} cols={[
                { head: 'HSN/SAC', cell: (r) => r.hsn || '—' },
                { head: 'GST rate', right: true, cell: (r) => `${r.rate}%` },
                { head: 'Qty', right: true, cell: (r) => r.qty },
                { head: 'Value', right: true, cell: (r) => <Money v={r.value} /> },
              ]} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="dayend"><DayEnd date={range.to} /></TabsContent>
        <TabsContent value="audit"><AuditLog /></TabsContent>
      </Tabs>
    </div>
  );
};
