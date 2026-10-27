import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronLeft,
  ShoppingBag,
  Clock,
  CheckCircle2,
  UtensilsCrossed,
  Utensils,
  Receipt,
  AlertCircle,
  XCircle,
  Sparkles
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useOrders, TableOrder } from '@/contexts/OrdersContext';
import { useRestaurant } from '@/contexts/RestaurantContext';

// ── Status config ───────────────────────────────────────────────────────────
const STATUS = {
  pending: {
    label: 'Order Received',
    icon: AlertCircle,
    bar: 'bg-amber-400',
    dot: 'bg-amber-400',
    pill: 'bg-amber-50 text-amber-600 border-amber-200',
    pulse: true,
  },
  preparing: {
    label: 'In the Kitchen',
    icon: UtensilsCrossed,
    bar: 'bg-blue-500',
    dot: 'bg-blue-500',
    pill: 'bg-blue-50 text-blue-600 border-blue-200',
    pulse: true,
  },
  ready: {
    label: 'Ready to Serve',
    icon: CheckCircle2,
    bar: 'bg-emerald-500',
    dot: 'bg-emerald-500',
    pill: 'bg-emerald-50 text-emerald-600 border-emerald-200',
    pulse: false,
  },
  completed: {
    label: 'Completed',
    icon: CheckCircle2,
    bar: 'bg-slate-200',
    dot: 'bg-slate-300',
    pill: 'bg-slate-50 text-slate-400 border-slate-200',
    pulse: false,
  },
  cancelled: {
    label: 'Cancelled',
    icon: XCircle,
    bar: 'bg-rose-400',
    dot: 'bg-rose-400',
    pill: 'bg-rose-50 text-rose-500 border-rose-200',
    pulse: false,
  },
  browsing: {
    label: 'Browsing',
    icon: ShoppingBag,
    bar: 'bg-slate-200',
    dot: 'bg-slate-300',
    pill: 'bg-slate-50 text-slate-400 border-slate-200',
    pulse: false,
  },
};

// ── Progress Steps ──────────────────────────────────────────────────────────
const STEPS = ['pending', 'preparing', 'ready', 'completed'] as const;
const STEP_LABELS = ['Received', 'Kitchen', 'Ready', 'Done'];

const stepIndex = (status: string) =>
  STEPS.indexOf(status as (typeof STEPS)[number]);

const ProgressTracker = ({ status }: { status: TableOrder['status'] }) => {
  if (status === 'cancelled' || status === 'browsing') return null;
  const current = stepIndex(status);

  return (
    <div className="flex items-center gap-0 w-full">
      {STEPS.map((step, i) => {
        const done = i <= current;
        const active = i === current;
        return (
          <React.Fragment key={step}>
            <div className="flex flex-col items-center gap-1 relative">
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center transition-all duration-300 ${
                  done ? 'bg-accent shadow-sm' : 'bg-slate-100'
                }`}
              >
                {done ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                ) : (
                  <div className="w-1.5 h-1.5 rounded-full bg-slate-300" />
                )}
                {active && (
                  <span className="absolute inset-0 rounded-full bg-accent animate-ping opacity-30" />
                )}
              </div>
              <span className={`text-[9px] font-bold uppercase tracking-wide whitespace-nowrap ${
                done ? 'text-accent' : 'text-slate-300'
              }`}>
                {STEP_LABELS[i]}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div className={`flex-1 h-0.5 mb-4 transition-all duration-300 ${
                i < current ? 'bg-accent' : 'bg-slate-100'
              }`} />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
};

// ── Main Page ───────────────────────────────────────────────────────────────
export const OrdersPage: React.FC = () => {
  const navigate = useNavigate();
  const { customerOrders } = useOrders();
  const { currentRestaurant } = useRestaurant();

  const activeOrders = customerOrders.filter(
    o => o.status !== 'completed' && o.status !== 'cancelled' && o.status !== 'browsing'
  );
  const pastOrders = customerOrders.filter(
    o => o.status === 'completed' || o.status === 'cancelled'
  );
  const grandTotal = customerOrders
    .filter(o => o.status !== 'cancelled')
    .reduce((sum, o) => sum + o.total, 0);

  const OrderCard = ({ order, idx }: { order: TableOrder; idx: number }) => {
    const s = STATUS[order.status] ?? STATUS.completed;
    const Icon = s.icon;
    const tableLabel =
      order.tableNumber && order.tableNumber !== 'TA'
        ? `Table ${order.tableNumber}`
        : 'Takeaway';

    return (
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: idx * 0.08 }}
        className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden"
      >
        {/* Status bar */}
        <div className={`h-1 w-full ${s.bar}`} />

        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-slate-50">
          <div className="flex items-center gap-3">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${s.bar}`}>
              <Icon className="w-4 h-4 text-white" />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-900">{tableLabel}</p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <Clock className="w-3 h-3 text-slate-300" />
                <span className="text-[11px] text-slate-400">
                  {new Date(order.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                  {' · '}
                  {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </div>
          </div>
          <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold border ${s.pill}`}>
            {s.pulse && <span className={`w-1.5 h-1.5 rounded-full ${s.dot} animate-pulse`} />}
            {s.label}
          </span>
        </div>

        {/* Items */}
        <div className="px-5 py-4 space-y-2.5">
          {order.items.map((item, i) => (
            <div key={i} className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 min-w-0">
                <span className="shrink-0 w-5 h-5 rounded-md bg-slate-100 flex items-center justify-center text-[10px] font-black text-slate-500">
                  {item.quantity}
                </span>
                <span className="text-sm text-slate-700 truncate">{item.foodName}</span>
                {item.notes && (
                  <span className="text-[10px] text-slate-400 italic truncate">"{item.notes}"</span>
                )}
              </div>
              <span className="shrink-0 text-sm font-semibold text-slate-800">
                ${(item.price * item.quantity).toFixed(2)}
              </span>
            </div>
          ))}
        </div>

        {/* Progress tracker for active orders */}
        {order.status !== 'completed' && order.status !== 'cancelled' && (
          <div className="px-5 pb-4">
            <ProgressTracker status={order.status} />
          </div>
        )}

        {/* Total */}
        <div className="flex items-center justify-between px-5 py-3 bg-slate-50/70 border-t border-slate-50">
          <span className="text-xs text-slate-400 font-semibold uppercase tracking-wide">
            {order.items.reduce((s, i) => s + i.quantity, 0)} items
          </span>
          <span className="text-base font-black text-slate-900">${order.total.toFixed(2)}</span>
        </div>
      </motion.div>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-36">

      {/* Header */}
      <div className="bg-white sticky top-0 z-30 border-b border-slate-100 shadow-sm">
        <div className="max-w-xl mx-auto px-4 h-16 flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(-1)}
            className="rounded-xl h-9 w-9 p-0 hover:bg-slate-100"
          >
            <ChevronLeft className="w-5 h-5 text-slate-700" />
          </Button>
          <div className="text-center">
            <h1 className="text-sm font-bold text-slate-900">My Orders</h1>
            {currentRestaurant && (
              <p className="text-[11px] text-slate-400 mt-0.5">{currentRestaurant.name}</p>
            )}
          </div>
          <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center">
            <Receipt className="w-4 h-4 text-slate-400" />
          </div>
        </div>
      </div>

      <div className="max-w-xl mx-auto px-4 pt-5 space-y-6">

        {customerOrders.length === 0 ? (
          /* ── Empty State ── */
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center pt-28 text-center"
          >
            <div className="w-20 h-20 rounded-3xl bg-white border border-slate-100 shadow-sm flex items-center justify-center mb-5">
              <ShoppingBag className="w-9 h-9 text-slate-200" />
            </div>
            <h3 className="text-lg font-bold text-slate-800 mb-1">No orders yet</h3>
            <p className="text-sm text-slate-400 max-w-[220px] mb-8">
              Scan your table's QR code or browse the menu to place your first order.
            </p>
            <Button
              onClick={() => navigate(-1)}
              className="h-12 px-8 rounded-2xl bg-slate-900 text-white font-semibold text-sm hover:bg-slate-800 shadow-md"
            >
              <Utensils className="w-4 h-4 mr-2" />
              Browse Menu
            </Button>
          </motion.div>
        ) : (
          <AnimatePresence mode="popLayout">

            {/* ── Active Orders ── */}
            {activeOrders.length > 0 && (
              <section>
                <div className="flex items-center gap-2 mb-3">
                  <Sparkles className="w-3.5 h-3.5 text-accent" />
                  <h2 className="text-xs font-bold text-slate-500 uppercase tracking-widest">
                    Active · {activeOrders.length}
                  </h2>
                </div>
                <div className="space-y-3">
                  {activeOrders.map((order, idx) => (
                    <OrderCard key={order.createdAt} order={order} idx={idx} />
                  ))}
                </div>
              </section>
            )}

            {/* ── Past Orders ── */}
            {pastOrders.length > 0 && (
              <section>
                <div className="flex items-center gap-2 mb-3">
                  <Clock className="w-3.5 h-3.5 text-slate-300" />
                  <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                    History · {pastOrders.length}
                  </h2>
                </div>
                <div className="space-y-3 opacity-80">
                  {pastOrders.map((order, idx) => (
                    <OrderCard key={order.createdAt} order={order} idx={idx} />
                  ))}
                </div>
              </section>
            )}

          </AnimatePresence>
        )}
      </div>

      {/* ── Sticky Bottom Bar ── */}
      {customerOrders.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 z-50 px-4 pb-6 pt-2">
          <div className="max-w-xl mx-auto">
            <motion.div
              initial={{ y: 80, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className="bg-white/95 backdrop-blur-xl rounded-2xl border border-slate-100 shadow-xl shadow-slate-200/60 p-4 flex items-center justify-between gap-4"
            >
              <div className="pl-1">
                <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-widest">Total Spent</p>
                <p className="text-2xl font-black text-slate-900 leading-none mt-0.5">${grandTotal.toFixed(2)}</p>
              </div>
              <Button
                onClick={() => navigate(-1)}
                className="flex-1 h-12 rounded-xl bg-accent hover:bg-accent/90 text-accent-foreground font-bold text-sm shadow-md shadow-accent/20"
              >
                <Utensils className="w-4 h-4 mr-2" />
                Order More
              </Button>
            </motion.div>
          </div>
        </div>
      )}
    </div>
  );
};
