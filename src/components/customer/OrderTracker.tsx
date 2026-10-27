import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChefHat, Clock, CheckCircle2, Utensils, PartyPopper } from 'lucide-react';
import { useOrders, TableOrder } from '@/contexts/OrdersContext';

interface OrderTrackerProps {
  tableId: string;
}

const STEPS: { status: TableOrder['status']; label: string; icon: React.FC<any> }[] = [
  { status: 'pending',   label: 'Order Placed',  icon: Clock },
  { status: 'preparing', label: 'Preparing',      icon: ChefHat },
  { status: 'ready',     label: 'Ready to Serve', icon: Utensils },
  { status: 'completed', label: 'Served',         icon: PartyPopper },
];

const stepIndex = (status: TableOrder['status']) =>
  STEPS.findIndex(s => s.status === status);

export const OrderTracker: React.FC<OrderTrackerProps> = ({ tableId }) => {
  const { activeOrders } = useOrders();
  const [visible, setVisible] = useState(false);

  const order = Array.from(activeOrders.values())
    .filter(o => o.tableId === tableId && o.status !== 'completed' && o.status !== 'cancelled')
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];

  // Show tracker once an order exists for this table; hide after completed
  useEffect(() => {
    if (order && order.status !== 'browsing') {
      setVisible(true);
    }
  }, [order]);

  if (!order || order.status === 'browsing' || order.status === 'cancelled') return null;

  const currentStep = stepIndex(order.status);

  const statusColor =
    order.status === 'pending'   ? 'bg-orange-500' :
    order.status === 'preparing' ? 'bg-blue-500'   :
    order.status === 'ready'     ? 'bg-green-500'  :
    'bg-gray-500';

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: 'spring', damping: 22, stiffness: 180 }}
          className="fixed bottom-0 left-0 right-0 z-50 px-4 pb-4 pt-0 pointer-events-none"
        >
          <div className="max-w-lg mx-auto pointer-events-auto">
            <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden">
              {/* Header strip */}
              <div className={`${statusColor} px-4 py-2 flex items-center justify-between`}>
                <span className="text-white text-[10px] font-black uppercase tracking-widest">
                  Table {order.tableNumber} — Live Order Status
                </span>
                <span className="text-white/80 text-[10px] font-bold">
                  {order.items.length} item{order.items.length !== 1 ? 's' : ''} · ${order.total.toFixed(2)}
                </span>
              </div>

              {/* Steps */}
              <div className="px-4 py-3">
                <div className="flex items-center justify-between">
                  {STEPS.map((step, i) => {
                    const Icon = step.icon;
                    const done = i <= currentStep;
                    const active = i === currentStep;
                    return (
                      <React.Fragment key={step.status}>
                        <div className="flex flex-col items-center gap-1 flex-shrink-0">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-500 ${
                            active ? `${statusColor} shadow-lg` :
                            done   ? 'bg-gray-200' :
                            'bg-gray-100'
                          }`}>
                            <Icon className={`w-4 h-4 ${active ? 'text-white' : done ? 'text-gray-500' : 'text-gray-300'}`} />
                          </div>
                          <span className={`text-[9px] font-black uppercase tracking-wider text-center leading-tight max-w-[56px] ${
                            active ? 'text-gray-900' : done ? 'text-gray-400' : 'text-gray-300'
                          }`}>
                            {step.label}
                          </span>
                        </div>
                        {i < STEPS.length - 1 && (
                          <div className={`flex-1 h-0.5 mx-1 rounded transition-all duration-700 ${
                            i < currentStep ? statusColor.replace('bg-', 'bg-') : 'bg-gray-100'
                          }`} />
                        )}
                      </React.Fragment>
                    );
                  })}
                </div>

                {order.status === 'ready' && (
                  <motion.p
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center text-xs font-bold text-green-600 mt-2 animate-pulse"
                  >
                    Your order is ready — our staff is on the way!
                  </motion.p>
                )}
                {order.status === 'preparing' && (
                  <p className="text-center text-[10px] text-gray-400 mt-2">
                    Our chefs are working on your order
                  </p>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
