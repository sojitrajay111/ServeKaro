import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChefHat, Clock, Printer, Check, UtensilsCrossed, ShoppingBag, Flame } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useOrders, TableOrder } from '@/contexts/OrdersContext';
import { useRestaurant } from '@/contexts/RestaurantContext';

const getElapsedLabel = (createdAt: string) => {
  const seconds = Math.floor((Date.now() - new Date(createdAt).getTime()) / 1000);
  if (seconds < 60) return `${seconds}s ago`;
  return `${Math.floor(seconds / 60)}m ago`;
};

const getElapsedMinutes = (createdAt: string) =>
  Math.floor((Date.now() - new Date(createdAt).getTime()) / 60000);

const printKOT = (order: TableOrder, restaurantName: string) => {
  const kotNumber = `KOT-${Date.now().toString().slice(-4)}`;

  const html = `<!DOCTYPE html>
<html>
<head>
  <title>KOT - Table ${order.tableNumber}</title>
  <style>
    body { font-family: 'Courier New', monospace; max-width: 280px; margin: 0 auto; padding: 12px; }
    h2 { text-align: center; margin: 0 0 4px; font-size: 22px; letter-spacing: 3px; }
    .center { text-align: center; }
    .row { display: flex; justify-content: space-between; margin: 4px 0; font-size: 13px; }
    .divider { border-top: 2px dashed #000; margin: 8px 0; }
    .item-line { display: flex; align-items: baseline; margin: 8px 0 2px; }
    .item-qty { font-size: 20px; font-weight: 900; min-width: 28px; }
    .item-name { font-weight: bold; font-size: 16px; }
    .note { font-size: 11px; color: #555; margin-left: 28px; font-style: italic; }
    .footer { text-align: center; font-size: 11px; margin-top: 8px; letter-spacing: 2px; }
    @media print { body { margin: 0; } }
  </style>
</head>
<body>
  <h2>KOT</h2>
  <p class="center" style="margin:0;font-size:11px">${restaurantName}</p>
  <div class="divider"></div>
  <div class="row">
    <span><b>Table: ${order.tableNumber}</b></span>
    <span>${kotNumber}</span>
  </div>
  <div class="row">
    <span>${new Date(order.createdAt).toLocaleTimeString()}</span>
    <span>${new Date(order.createdAt).toLocaleDateString()}</span>
  </div>
  <div class="divider"></div>
  ${order.items
    .map(
      (item) => `
    <div class="item-line">
      <span class="item-qty">${item.quantity}×</span>
      <span class="item-name">${item.foodName}</span>
    </div>
    ${item.notes ? `<div class="note">★ ${item.notes}</div>` : ''}
  `
    )
    .join('')}
  <div class="divider"></div>
  <p class="footer">** KITCHEN COPY **</p>
</body>
</html>`;

  const win = window.open('', '_blank', 'width=350,height=520');
  if (win) {
    win.document.write(html);
    win.document.close();
    win.print();
  }
};

interface OrderCardProps {
  order: TableOrder;
  onAction: () => void;
  actionLabel: string;
  stripColor: string;
  buttonClass: string;
  restaurantName: string;
}

const OrderCard = ({
  order,
  onAction,
  actionLabel,
  stripColor,
  buttonClass,
  restaurantName,
}: OrderCardProps) => {
  const elapsed = getElapsedMinutes(order.createdAt);
  const isUrgent = elapsed >= 15;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.2 }}
    >
      <Card>
        <CardContent className="p-0">
          <div className="flex">
            {/* Colored left strip — rendered as a plain div so glass-card doesn't affect it */}
            <div className={`w-1 rounded-l-xl flex-shrink-0 ${stripColor}`} />

            <div className="flex-1 p-4 space-y-3">
              {/* Header row */}
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-gray-900">Table {order.tableNumber}</h3>
                <div className="flex items-center gap-2">
                  {isUrgent && (
                    <Badge className="bg-red-100 text-red-700 border border-red-200 text-xs gap-1">
                      <Flame className="w-3 h-3" /> Urgent
                    </Badge>
                  )}
                  <span className="flex items-center gap-1 text-xs text-gray-400">
                    <Clock className="w-3 h-3" />
                    {getElapsedLabel(order.createdAt)}
                  </span>
                </div>
              </div>

              {/* Items */}
              <div className="divide-y divide-gray-100">
                {order.items.map((item, i) => (
                  <div key={i} className="flex items-center justify-between py-2 first:pt-0 last:pb-0">
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-bold text-orange-600 w-6 text-center">
                        {item.quantity}×
                      </span>
                      <span className="text-sm font-medium text-gray-900">{item.foodName}</span>
                    </div>
                    {item.notes && (
                      <span className="text-xs text-orange-500 italic truncate max-w-[100px]">
                        {item.notes}
                      </span>
                    )}
                  </div>
                ))}
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-1 border-t border-gray-100">
                <Button
                  size="sm"
                  variant="outline"
                  className="flex-shrink-0"
                  onClick={() => printKOT(order, restaurantName)}
                  title="Print KOT"
                >
                  <Printer className="w-4 h-4" />
                </Button>
                <Button size="sm" className={`flex-1 ${buttonClass}`} onClick={onAction}>
                  <Check className="w-4 h-4 mr-1" />
                  {actionLabel}
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export const KitchenDisplay = () => {
  const { activeOrders, updateOrderStatus } = useOrders();
  const { currentRestaurant } = useRestaurant();
  const [, setTick] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => setTick((t) => t + 1), 30000);
    return () => clearInterval(interval);
  }, []);

  const restaurantName = currentRestaurant?.name || 'Restaurant';
  const pendingOrders = Array.from(activeOrders.values()).filter((o) => o.status === 'pending');
  const preparingOrders = Array.from(activeOrders.values()).filter((o) => o.status === 'preparing');
  const totalActive = pendingOrders.length + preparingOrders.length;

  const stats = [
    {
      title: 'New Orders',
      value: pendingOrders.length,
      icon: ShoppingBag,
      color: 'text-orange-600',
      bg: 'bg-orange-50',
    },
    {
      title: 'Preparing',
      value: preparingOrders.length,
      icon: ChefHat,
      color: 'text-blue-600',
      bg: 'bg-blue-50',
    },
    {
      title: 'Total Active',
      value: totalActive,
      icon: UtensilsCrossed,
      color: 'text-purple-600',
      bg: 'bg-purple-50',
    },
    {
      title: 'Urgent (>15m)',
      value: Array.from(activeOrders.values()).filter(
        (o) =>
          (o.status === 'pending' || o.status === 'preparing') &&
          getElapsedMinutes(o.createdAt) >= 15
      ).length,
      icon: Flame,
      color: 'text-red-600',
      bg: 'bg-red-50',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Kitchen Display</h1>
          <p className="text-sm text-gray-500">
            Live order queue for {restaurantName} — updates every 30s
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-3 flex-wrap">
            {[
              { label: 'New Order', dot: 'bg-orange-500' },
              { label: 'Preparing', dot: 'bg-blue-500' },
              { label: 'Urgent (>15m)', dot: 'bg-red-500' },
            ].map(({ label, dot }) => (
              <div
                key={label}
                className="flex items-center gap-2 px-3 py-1 bg-white border border-gray-200 rounded-md text-xs font-medium text-gray-600"
              >
                <div className={`w-2 h-2 rounded-full ${dot}`} />
                {label}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={stat.title}
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.4, delay: index * 0.08 }}
            >
              <Card>
                <CardContent className="p-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-500">{stat.title}</p>
                      <p className="text-2xl font-bold text-gray-900 mt-1">{stat.value}</p>
                    </div>
                    <div className={`p-3 rounded-lg ${stat.bg}`}>
                      <Icon className={`w-5 h-5 ${stat.color}`} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      <div className="h-px bg-gray-200" />

      {totalActive === 0 ? (
        <Card>
          <CardContent className="p-6 sm:p-10 lg:p-16 flex flex-col items-center text-center">
            <UtensilsCrossed className="w-14 h-14 text-gray-300 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900">Kitchen is clear</h3>
            <p className="text-sm text-gray-500 mt-1">No pending or in-progress orders</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
          {/* New Orders */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-orange-500" />
              <h2 className="text-sm font-bold text-gray-700 uppercase tracking-widest">
                New Orders ({pendingOrders.length})
              </h2>
            </div>
            <AnimatePresence>
              {pendingOrders.length === 0 ? (
                <p className="text-gray-400 text-sm text-center py-10">No new orders</p>
              ) : (
                pendingOrders.map((order) => (
                  <OrderCard
                    key={order.orderId ? order.orderId.toString() : `${order.tableId}-${order.createdAt}`}
                    order={order}
                    onAction={() => updateOrderStatus(order.orderId ? order.orderId.toString() : order.tableId, 'preparing')}
                    actionLabel="Start Preparing"
                    stripColor="bg-orange-500"
                    buttonClass="bg-orange-500 hover:bg-orange-600 text-white"
                    restaurantName={restaurantName}
                  />
                ))
              )}
            </AnimatePresence>
          </div>

          {/* Preparing */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-blue-500" />
              <h2 className="text-sm font-bold text-gray-700 uppercase tracking-widest">
                Preparing ({preparingOrders.length})
              </h2>
            </div>
            <AnimatePresence>
              {preparingOrders.length === 0 ? (
                <p className="text-gray-400 text-sm text-center py-10">Nothing in progress</p>
              ) : (
                preparingOrders.map((order) => (
                  <OrderCard
                    key={order.orderId ? order.orderId.toString() : `${order.tableId}-${order.createdAt}`}
                    order={order}
                    onAction={() => updateOrderStatus(order.orderId ? order.orderId.toString() : order.tableId, 'ready')}
                    actionLabel="Mark Ready"
                    stripColor="bg-blue-500"
                    buttonClass="bg-green-600 hover:bg-green-700 text-white"
                    restaurantName={restaurantName}
                  />
                ))
              )}
            </AnimatePresence>
          </div>
        </div>
      )}
    </div>
  );
};
