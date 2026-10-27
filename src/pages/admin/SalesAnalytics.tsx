import React, { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import {
  DollarSign, ShoppingCart, TrendingUp, Users,
  Clock, Award, BarChart3, PieChart as PieIcon
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useOrders } from '@/contexts/OrdersContext';
import { useRestaurant } from '@/contexts/RestaurantContext';

const COLORS = ['#f97316', '#3b82f6', '#10b981', '#8b5cf6', '#f59e0b', '#ef4444'];

// ── Helpers ──────────────────────────────────────────────────────────────────
const fmt = (n: number) =>
  n >= 1000 ? `$${(n / 1000).toFixed(1)}k` : `$${n.toFixed(2)}`;

const hourLabel = (h: number) => {
  if (h === 0) return '12am';
  if (h < 12) return `${h}am`;
  if (h === 12) return '12pm';
  return `${h - 12}pm`;
};

// ── Custom Tooltip ────────────────────────────────────────────────────────────
const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-gray-100 rounded-xl shadow-lg px-3 py-2 text-xs">
      <p className="font-bold text-gray-700 mb-1">{label}</p>
      {payload.map((p: any, i: number) => (
        <p key={i} style={{ color: p.color }} className="font-semibold">
          {p.name}: {p.name.toLowerCase().includes('revenue') || p.name === 'Revenue' ? `$${Number(p.value).toFixed(2)}` : p.value}
        </p>
      ))}
    </div>
  );
};

// ── Main Component ────────────────────────────────────────────────────────────
export const SalesAnalytics: React.FC = () => {
  const { activeOrders, customerOrders } = useOrders();
  const { currentRestaurant, getTablesByRestaurant } = useRestaurant();

  const allOrders = useMemo(() => {
    const live = Array.from(activeOrders.values());
    const history = customerOrders.filter(
      o => !live.some(l => l.orderId === o.orderId && o.orderId != null)
    );
    return [...live, ...history];
  }, [activeOrders, customerOrders]);

  // ── KPIs ──────────────────────────────────────────────────────────────────
  const totalRevenue = allOrders
    .filter(o => o.status !== 'cancelled')
    .reduce((s, o) => s + o.total, 0);

  const totalOrders = allOrders.filter(o => o.status !== 'cancelled' && o.status !== 'browsing').length;
  const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
  const tables = currentRestaurant ? getTablesByRestaurant(currentRestaurant.id) : [];
  const occupiedTables = new Set(Array.from(activeOrders.values()).map(o => o.tableId)).size;

  const kpis = [
    { label: 'Total Revenue', value: fmt(totalRevenue), icon: DollarSign, color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-100' },
    { label: 'Total Orders', value: totalOrders, icon: ShoppingCart, color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-100' },
    { label: 'Avg Order Value', value: fmt(avgOrderValue), icon: TrendingUp, color: 'text-violet-600', bg: 'bg-violet-50', border: 'border-violet-100' },
    { label: 'Occupied Tables', value: `${occupiedTables} / ${tables.length}`, icon: Users, color: 'text-orange-600', bg: 'bg-orange-50', border: 'border-orange-100' },
  ];

  // ── Revenue by hour ───────────────────────────────────────────────────────
  const revenueByHour = useMemo(() => {
    const map = new Map<number, { revenue: number; orders: number }>();
    for (let h = 0; h < 24; h++) map.set(h, { revenue: 0, orders: 0 });
    allOrders.filter(o => o.status !== 'cancelled' && o.status !== 'browsing').forEach(o => {
      const h = new Date(o.createdAt).getHours();
      const slot = map.get(h)!;
      slot.revenue += o.total;
      slot.orders += 1;
    });
    return Array.from(map.entries())
      .map(([h, v]) => ({ hour: hourLabel(h), ...v, Revenue: +v.revenue.toFixed(2), Orders: v.orders }))
      .filter((_, i) => i >= 6 && i <= 23); // 6am–11pm
  }, [allOrders]);

  // ── Top items ─────────────────────────────────────────────────────────────
  const topItems = useMemo(() => {
    const map = new Map<string, { qty: number; revenue: number }>();
    allOrders.filter(o => o.status !== 'cancelled').forEach(o => {
      o.items.forEach(item => {
        const e = map.get(item.foodName) ?? { qty: 0, revenue: 0 };
        e.qty += item.quantity;
        e.revenue += item.price * item.quantity;
        map.set(item.foodName, e);
      });
    });
    return Array.from(map.entries())
      .map(([name, v]) => ({ name, qty: v.qty, Revenue: +v.revenue.toFixed(2) }))
      .sort((a, b) => b.Revenue - a.Revenue)
      .slice(0, 7);
  }, [allOrders]);

  // ── Status breakdown (pie) ────────────────────────────────────────────────
  const statusBreakdown = useMemo(() => {
    const map: Record<string, number> = {};
    allOrders.filter(o => o.status !== 'browsing').forEach(o => {
      map[o.status] = (map[o.status] ?? 0) + 1;
    });
    return Object.entries(map).map(([name, value]) => ({ name, value }));
  }, [allOrders]);

  // ── Order volume by status ────────────────────────────────────────────────
  const pendingCount = allOrders.filter(o => o.status === 'pending').length;
  const preparingCount = allOrders.filter(o => o.status === 'preparing').length;
  const readyCount = allOrders.filter(o => o.status === 'ready').length;
  const completedCount = allOrders.filter(o => o.status === 'completed').length;

  const isEmpty = totalOrders === 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <BarChart3 className="w-6 h-6 text-accent" />
          Sales Analytics
        </h1>
        <p className="text-sm text-gray-500 mt-0.5">
          {currentRestaurant?.name} · Live session data
        </p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((k, i) => {
          const Icon = k.icon;
          return (
            <motion.div
              key={k.label}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.07 }}
              className={`bg-white rounded-2xl border ${k.border} p-4 shadow-sm`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">{k.label}</p>
                  <p className={`text-2xl font-bold mt-1 ${k.color}`}>{k.value}</p>
                </div>
                <div className={`${k.bg} ${k.border} border rounded-xl p-2.5`}>
                  <Icon className={`w-5 h-5 ${k.color}`} />
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {isEmpty ? (
        /* ── Empty State ── */
        <div className="flex flex-col items-center justify-center py-24 text-center bg-white rounded-2xl border border-gray-100">
          <div className="w-16 h-16 rounded-2xl bg-gray-50 flex items-center justify-center mb-4">
            <BarChart3 className="w-8 h-8 text-gray-300" />
          </div>
          <h3 className="text-lg font-semibold text-gray-600 mb-1">No order data yet</h3>
          <p className="text-sm text-gray-400 max-w-xs">
            Analytics will populate automatically as orders come in during your session.
          </p>
        </div>
      ) : (
        <>
          {/* Revenue over time */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
            <Card className="xl:col-span-2 rounded-2xl border-gray-100 shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-bold text-gray-700 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-accent" />
                  Revenue by Hour
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={220}>
                  <AreaChart data={revenueByHour} margin={{ top: 4, right: 8, left: -8, bottom: 0 }}>
                    <defs>
                      <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#f97316" stopOpacity={0.18} />
                        <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="hour" tick={{ fontSize: 10, fill: '#94a3b8' }} />
                    <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} />
                    <Tooltip content={<CustomTooltip />} />
                    <Area
                      type="monotone"
                      dataKey="Revenue"
                      stroke="#f97316"
                      strokeWidth={2}
                      fill="url(#revGrad)"
                      dot={false}
                      activeDot={{ r: 4, fill: '#f97316' }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Status Pie */}
            <Card className="rounded-2xl border-gray-100 shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-bold text-gray-700 flex items-center gap-2">
                  <PieIcon className="w-4 h-4 text-accent" />
                  Order Status
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={160}>
                  <PieChart>
                    <Pie
                      data={statusBreakdown}
                      cx="50%"
                      cy="50%"
                      innerRadius={45}
                      outerRadius={70}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {statusBreakdown.map((_, i) => (
                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="grid grid-cols-2 gap-1.5 mt-2">
                  {statusBreakdown.map((s, i) => (
                    <div key={s.name} className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                      <span className="text-[11px] text-gray-500 capitalize">{s.name} ({s.value})</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Top Items */}
          <Card className="rounded-2xl border-gray-100 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-bold text-gray-700 flex items-center gap-2">
                <Award className="w-4 h-4 text-accent" />
                Top Items by Revenue
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={topItems} layout="vertical" margin={{ top: 0, right: 12, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 10, fill: '#94a3b8' }} />
                  <YAxis
                    type="category"
                    dataKey="name"
                    width={90}
                    tick={{ fontSize: 10, fill: '#64748b' }}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="Revenue" fill="#f97316" radius={[0, 6, 6, 0]} maxBarSize={18}>
                    {topItems.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Order pipeline summary */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: 'Pending', count: pendingCount, color: 'bg-amber-500' },
              { label: 'Preparing', count: preparingCount, color: 'bg-blue-500' },
              { label: 'Ready', count: readyCount, color: 'bg-emerald-500' },
              { label: 'Completed', count: completedCount, color: 'bg-slate-400' },
            ].map(s => (
              <div key={s.label} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex items-center gap-3">
                <div className={`w-2.5 h-10 rounded-full ${s.color}`} />
                <div>
                  <p className="text-xs text-gray-400 font-medium">{s.label}</p>
                  <p className="text-2xl font-black text-gray-900">{s.count}</p>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};
