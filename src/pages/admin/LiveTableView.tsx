import React from 'react';
import { motion } from 'framer-motion';
import {
  Users,
  Clock,
  CheckCircle2,
  UtensilsCrossed,
  BookOpen,
  AlertCircle,
  TrendingUp,
  DollarSign,
  ShoppingCart,
  Wifi,
  ChevronRight
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { useRestaurant } from '@/contexts/RestaurantContext';
import { useOrders } from '@/contexts/OrdersContext';

const STATUS_CONFIG = {
  empty: {
    label: 'Empty',
    dot: 'bg-gray-300',
    card: 'bg-white border-gray-100',
    badge: 'bg-gray-50 text-gray-400 border-gray-200',
    circle: 'bg-gray-100 text-gray-500',
    icon: Users,
  },
  browsing: {
    label: 'Browsing',
    dot: 'bg-blue-400',
    card: 'bg-blue-50/60 border-blue-200',
    badge: 'bg-blue-100 text-blue-700 border-blue-200',
    circle: 'bg-blue-500 text-white',
    icon: BookOpen,
  },
  pending: {
    label: 'New Order',
    dot: 'bg-red-500 animate-ping',
    card: 'bg-red-50 border-red-300 shadow-red-100',
    badge: 'bg-red-500 text-white border-red-500',
    circle: 'bg-red-500 text-white',
    icon: AlertCircle,
  },
  preparing: {
    label: 'Preparing',
    dot: 'bg-orange-400',
    card: 'bg-orange-50/60 border-orange-200',
    badge: 'bg-orange-100 text-orange-700 border-orange-200',
    circle: 'bg-orange-500 text-white',
    icon: UtensilsCrossed,
  },
  ready: {
    label: 'Ready to Serve',
    dot: 'bg-green-500',
    card: 'bg-green-50/60 border-green-200',
    badge: 'bg-green-100 text-green-700 border-green-200',
    circle: 'bg-green-500 text-white',
    icon: CheckCircle2,
  },
  completed: {
    label: 'Bill Requested',
    dot: 'bg-purple-400',
    card: 'bg-purple-50/60 border-purple-200',
    badge: 'bg-purple-100 text-purple-700 border-purple-200',
    circle: 'bg-purple-500 text-white',
    icon: AlertCircle,
  },
};

export const LiveTableView: React.FC = () => {
  const navigate = useNavigate();
  const { currentRestaurant, getTablesByRestaurant } = useRestaurant();
  const { activeOrders } = useOrders();

  if (!currentRestaurant) return null;

  const restaurantTables = getTablesByRestaurant(currentRestaurant.id);
  const activeOrderList = Array.from(activeOrders.values());
  const totalRevenue = activeOrderList.reduce((sum, o) => sum + o.total, 0);
  const occupiedCount = activeOrderList.filter(o => o.status !== 'browsing').length;
  const occupancyRate = restaurantTables.length > 0
    ? Math.round((occupiedCount / restaurantTables.length) * 100)
    : 0;
  const pendingCount = activeOrderList.filter(o => o.status === 'pending').length;
  const readyCount = activeOrderList.filter(o => o.status === 'ready').length;

  const getStatusConfig = (tableId: string) => {
    const order = activeOrderList.find(o => o.tableId === tableId);
    if (!order) return { cfg: STATUS_CONFIG.empty, order: null };
    const key = order.status as keyof typeof STATUS_CONFIG;
    return { cfg: STATUS_CONFIG[key] ?? STATUS_CONFIG.empty, order };
  };

  const stats = [
    { label: 'Occupied', value: occupiedCount, sub: `of ${restaurantTables.length} tables`, icon: Users, accent: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-100' },
    { label: 'Occupancy', value: `${occupancyRate}%`, sub: 'capacity used', icon: TrendingUp, accent: 'text-violet-600', bg: 'bg-violet-50', border: 'border-violet-100' },
    { label: 'Pending', value: pendingCount, sub: `${readyCount} ready to serve`, icon: ShoppingCart, accent: 'text-orange-600', bg: 'bg-orange-50', border: 'border-orange-100' },
    { label: 'Live Revenue', value: `$${totalRevenue.toFixed(2)}`, sub: 'active tables', icon: DollarSign, accent: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-100' },
  ];

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            Live Table Monitor
            <span className="flex items-center gap-1 text-xs font-semibold text-emerald-600 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
              <Wifi className="w-3 h-3" />
              LIVE
            </span>
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">{currentRestaurant.name} · Real-time floor status</p>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap gap-2">
          {Object.entries(STATUS_CONFIG).map(([key, s]) => (
            <div key={key} className="flex items-center gap-1.5 px-2.5 py-1 bg-white border border-gray-100 rounded-lg text-xs font-medium text-gray-600 shadow-sm">
              <span className={`w-2 h-2 rounded-full ${s.dot.replace('animate-ping', '')}`} />
              {s.label}
            </div>
          ))}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s, i) => {
          const Icon = s.icon;
          return (
            <motion.div
              key={s.label}
              initial={{ y: 16, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: i * 0.08 }}
              className={`bg-white border ${s.border} rounded-2xl p-4 shadow-sm`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">{s.label}</p>
                  <p className={`text-2xl font-bold mt-1 ${s.accent}`}>{s.value}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{s.sub}</p>
                </div>
                <div className={`${s.bg} ${s.border} border rounded-xl p-2.5`}>
                  <Icon className={`w-5 h-5 ${s.accent}`} />
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Floor Plan Grid */}
      {restaurantTables.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mb-4">
            <Users className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-700 mb-1">No tables configured</h3>
          <p className="text-sm text-gray-400">Add tables from the QR Codes page to see them here.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
          {restaurantTables.map((table, index) => {
            const { cfg, order } = getStatusConfig(table.id);
            const Icon = cfg.icon;
            const isPending = order?.status === 'pending';

            return (
              <motion.div
                key={table.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.025 }}
                onClick={() => navigate(`/admin/orders?tableId=${table.id}`)}
                className={`relative group cursor-pointer rounded-2xl border-2 p-4 shadow-sm transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 ${cfg.card}`}
              >
                {/* Ping ring for pending orders */}
                {isPending && (
                  <span className="absolute -top-1 -right-1 flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500" />
                  </span>
                )}

                {/* Table number circle + time */}
                <div className="flex items-start justify-between mb-3">
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold shadow-sm ${cfg.circle}`}>
                    {table.tableNumber}
                  </div>
                  {order && (
                    <div className="flex items-center gap-1 text-[10px] text-gray-400 font-medium">
                      <Clock className="w-2.5 h-2.5" />
                      {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  )}
                </div>

                {/* Table name & location */}
                <div className="mb-2">
                  <p className="text-xs font-bold text-gray-800 leading-tight">
                    {table.tableName || `Table ${table.tableNumber}`}
                  </p>
                  <p className="text-[10px] text-gray-400 mt-0.5">{table.location}</p>
                </div>

                {/* Status badge */}
                <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[10px] font-bold uppercase tracking-wide ${cfg.badge}`}>
                  <Icon className="w-2.5 h-2.5" />
                  {cfg.label}
                </div>

                {/* Order summary */}
                {order && order.status !== 'browsing' && (
                  <div className="mt-3 pt-2.5 border-t border-black/5">
                    <div className="space-y-0.5 mb-2">
                      {order.items.slice(0, 2).map((item, i) => (
                        <div key={i} className="flex items-center gap-1 text-[10px] text-gray-600">
                          <span className="font-bold text-gray-800">{item.quantity}×</span>
                          <span className="truncate">{item.foodName}</span>
                        </div>
                      ))}
                      {order.items.length > 2 && (
                        <p className="text-[10px] text-gray-400 font-medium">+{order.items.length - 2} more</p>
                      )}
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-semibold text-gray-400 uppercase">Total</span>
                      <span className="text-sm font-bold text-gray-900">${order.total.toFixed(2)}</span>
                    </div>
                  </div>
                )}

                {/* Hover chevron */}
                <div className="absolute bottom-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                  <ChevronRight className="w-3.5 h-3.5 text-gray-400" />
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
};
