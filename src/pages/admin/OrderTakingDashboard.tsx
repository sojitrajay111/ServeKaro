import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus,
  Minus,
  Search,
  ShoppingCart,
  Trash2,
  CheckCircle2,
  Clock,
  Users,
  Table as TableIcon,
  UtensilsCrossed,
  AlertCircle,
  BookOpen,
  FileText,
  X
} from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { useMenu } from '@/contexts/MenuContext';
import { useOrders, TableOrder } from '@/contexts/OrdersContext';
import { useRestaurant } from '@/contexts/RestaurantContext';
import { toast } from 'sonner';
import { BillingModal } from '@/components/admin/BillingModal';

type ViewMode = 'tables' | 'menu' | 'orders';

export const OrderTakingDashboard: React.FC = () => {
  const { menuItems, categories } = useMenu();
  const { activeOrders, submitOrder, updateOrderStatus, completeOrder } = useOrders();
  
  const { currentRestaurant, getTablesByRestaurant } = useRestaurant();
  const restaurantTables = currentRestaurant ? getTablesByRestaurant(currentRestaurant.id) : [];
  
  const [viewMode, setViewMode] = useState<ViewMode>('tables');
  const [selectedCategory, setSelectedCategory] = useState<number | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTable, setSelectedTable] = useState<{id: string, number: string} | null>(null);
  const [cart, setCart] = useState<{itemId: number, foodName: string, price: number, quantity: number}[]>([]);
  const [billingOrder, setBillingOrder] = useState<TableOrder | null>(null);
  const [searchParams, setSearchParams] = useSearchParams();
  const tableParam = searchParams.get('tableId');

  // Filter menu items
  const filteredItems = useMemo(() => {
    return menuItems.filter(item => {
      const matchesCategory = selectedCategory === 'all' || item.categoryId === selectedCategory;
      const matchesSearch = item.foodName.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [menuItems, selectedCategory, searchQuery]);

  // Cart logic
  const addToCart = (item: any) => {
    setCart(prev => {
      const existing = prev.find(i => i.itemId === item.itemId);
      if (existing) {
        return prev.map(i => i.itemId === item.itemId ? { ...i, quantity: i.quantity + 1 } : i);
      }
      return [...prev, { itemId: item.itemId, foodName: item.foodName, price: item.price, quantity: 1 }];
    });
    toast.success(`Added ${item.foodName} to cart`);
  };

  const removeFromCart = (itemId: number) => {
    setCart(prev => prev.filter(i => i.itemId !== itemId));
  };

  const updateQuantity = (itemId: number, delta: number) => {
    setCart(prev => prev.map(i => {
      if (i.itemId === itemId) {
        const newQty = Math.max(0, i.quantity + delta);
        return { ...i, quantity: newQty };
      }
      return i;
    }).filter(i => i.quantity > 0));
  };

  const cartTotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  const clearCart = () => {
    setCart([]);
    toast.info('Cart cleared');
  };

  const handleTableSelect = (tableId: string, tableNumber: string) => {
    setSelectedTable({ id: tableId, number: tableNumber });
    // Check if table already has an active order
    const existingOrder = Array.from(activeOrders.values()).find(o => o.tableId === tableId);
    if (existingOrder) {
      setCart(existingOrder.items.map(i => ({ ...i })));
    } else {
      setCart([]);
    }
    setViewMode('menu');
  };

  // Auto-select table if passed via query parameter
  useEffect(() => {
    if (tableParam && restaurantTables.length > 0) {
      const matchedTable = restaurantTables.find(t => t.id === tableParam);
      if (matchedTable) {
        handleTableSelect(matchedTable.id, matchedTable.tableNumber);
        // Clear search parameters so it doesn't trigger again on subsequent view mode switches
        setSearchParams({}, { replace: true });
      }
    }
  }, [tableParam, restaurantTables]);

  const handleSubmitOrder = () => {
    if (!selectedTable || cart.length === 0) return;

    const order: TableOrder = {
      tableId: selectedTable.id,
      tableNumber: selectedTable.number,
      items: cart.map(i => ({ ...i })),
      status: 'pending',
      createdAt: new Date().toISOString(),
      total: cartTotal
    };

    submitOrder(order);
    toast.success(`Order submitted for Table ${selectedTable.number}`);
    setViewMode('tables');
    setSelectedTable(null);
    setCart([]);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] bg-gray-50/50 overflow-hidden relative">
      {/* 1. Sticky Static Header */}
      <div className="flex-none bg-white/80 backdrop-blur-md border-b border-gray-100 px-6 py-4 z-20">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="h-10 w-10 bg-accent rounded-xl flex items-center justify-center text-accent-foreground shadow-lg shadow-accent/10">
              <TableIcon className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-black text-gray-900 uppercase tracking-tight">Order Management</h1>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                {selectedTable ? `Serving Table ${selectedTable.number}` : 'Select a table to start'}
              </p>
            </div>
          </div>

          <div className="flex items-center bg-gray-100 p-1 rounded-xl">
            <button
              onClick={() => setViewMode('tables')}
              className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${
                viewMode === 'tables' ? 'bg-white text-accent shadow-sm' : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              Tables
            </button>
            <button
              onClick={() => setViewMode('orders')}
              className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${
                viewMode === 'orders' ? 'bg-white text-accent shadow-sm' : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              Active Orders
            </button>
          </div>
        </div>
      </div>

      {/* 2. Scrollable Content Area */}
      <div className="flex-1 overflow-y-auto custom-scrollbar pb-32">
        <div className="p-6">
          {viewMode === 'tables' && (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
              {restaurantTables.map((table, index) => {
                const order = Array.from(activeOrders.values()).find(o => o.tableId === table.id);
                const status = order?.status;

                const statusMeta = {
                  browsing:  { label: 'Browsing',    icon: BookOpen,        bg: 'bg-blue-500',   text: 'text-blue-600',   ring: 'border-blue-200',  cardBg: 'bg-blue-50/40'  },
                  pending:   { label: 'New Order',   icon: AlertCircle,     bg: 'bg-red-500',    text: 'text-red-600',    ring: 'border-red-300',   cardBg: 'bg-red-50/50'   },
                  preparing: { label: 'Preparing',   icon: UtensilsCrossed, bg: 'bg-orange-500', text: 'text-orange-600', ring: 'border-orange-200',cardBg: 'bg-orange-50/40'},
                  ready:     { label: 'Ready',       icon: CheckCircle2,    bg: 'bg-green-500',  text: 'text-green-600',  ring: 'border-green-200', cardBg: 'bg-green-50/40' },
                  completed: { label: 'Bill',        icon: FileText,        bg: 'bg-purple-500', text: 'text-purple-600', ring: 'border-purple-200',cardBg: 'bg-purple-50/40'},
                };

                const meta = status ? statusMeta[status as keyof typeof statusMeta] : null;
                const StatusIcon = meta?.icon;

                return (
                  <motion.button
                    key={table.id}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.03 }}
                    whileHover={{ y: -3, transition: { duration: 0.15 } }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => handleTableSelect(table.id, table.tableNumber)}
                    className={`relative text-left p-4 rounded-2xl border-2 transition-all shadow-sm hover:shadow-md ${
                      meta
                        ? `${meta.cardBg} ${meta.ring}`
                        : 'bg-white border-gray-100 hover:border-gray-200'
                    }`}
                  >
                    {/* Ping for pending */}
                    {status === 'pending' && (
                      <span className="absolute -top-1 -right-1 flex h-3 w-3">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                        <span className="relative inline-flex h-3 w-3 rounded-full bg-red-500" />
                      </span>
                    )}

                    {/* Top row: number + time */}
                    <div className="flex items-start justify-between mb-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-base font-black shadow-sm ${
                        meta ? `${meta.bg} text-white` : 'bg-gray-100 text-gray-600'
                      }`}>
                        {table.tableNumber}
                      </div>
                      {order && (
                        <div className="flex items-center gap-1 text-[10px] text-gray-400 font-medium mt-0.5">
                          <Clock className="w-2.5 h-2.5" />
                          {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      )}
                    </div>

                    {/* Table name + location */}
                    <div className="mb-2.5">
                      <p className="text-sm font-bold text-gray-900 leading-tight">
                        {table.tableName || `Table ${table.tableNumber}`}
                      </p>
                      <div className="flex items-center gap-1 mt-0.5">
                        <Users className="w-2.5 h-2.5 text-gray-300" />
                        <p className="text-[10px] text-gray-400">{table.location} · {table.capacity} seats</p>
                      </div>
                    </div>

                    {/* Status badge */}
                    <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide border ${
                      meta
                        ? `bg-white/70 ${meta.ring} ${meta.text}`
                        : 'bg-gray-50 text-gray-400 border-gray-200'
                    }`}>
                      {StatusIcon && <StatusIcon className="w-2.5 h-2.5" />}
                      {meta ? meta.label : 'Empty'}
                    </div>

                    {/* Order summary for non-browsing orders */}
                    {order && status !== 'browsing' && (
                      <div className="mt-3 pt-2.5 border-t border-black/5 space-y-1">
                        {order.items.slice(0, 2).map((item, i) => (
                          <div key={i} className="flex items-center gap-1 text-[10px] text-gray-600">
                            <span className="font-bold text-gray-800">{item.quantity}×</span>
                            <span className="truncate">{item.foodName}</span>
                          </div>
                        ))}
                        {order.items.length > 2 && (
                          <p className="text-[10px] text-gray-400">+{order.items.length - 2} more</p>
                        )}
                        <div className="flex justify-between items-center pt-1">
                          <span className="text-[10px] text-gray-400 uppercase font-semibold">Total</span>
                          <span className="text-sm font-black text-gray-900">${order.total.toFixed(2)}</span>
                        </div>
                      </div>
                    )}
                  </motion.button>
                );
              })}
            </div>
          )}

          {viewMode === 'menu' && (
            <div className="space-y-8">
              {/* Menu Controls */}
              <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
                <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0 scrollbar-hide max-w-full">
                  <Button
                    variant={selectedCategory === 'all' ? 'default' : 'outline'}
                    onClick={() => setSelectedCategory('all')}
                    className={`rounded-xl text-[10px] font-black uppercase tracking-widest h-10 px-6 ${
                      selectedCategory === 'all' 
                        ? 'bg-accent hover:bg-accent/90 text-accent-foreground border-transparent' 
                        : ''
                    }`}
                  >
                    All Items
                  </Button>
                  {categories.map(cat => {
                    const isSelected = selectedCategory === cat.categoryId;
                    return (
                      <Button
                        key={cat.categoryId}
                        variant={isSelected ? 'default' : 'outline'}
                        onClick={() => setSelectedCategory(cat.categoryId)}
                        className={`rounded-xl text-[10px] font-black uppercase tracking-widest h-10 px-6 ${
                          isSelected 
                            ? 'bg-accent hover:bg-accent/90 text-accent-foreground border-transparent' 
                            : ''
                        }`}
                      >
                        {cat.categoryName}
                      </Button>
                    );
                  })}
                </div>
                <div className="relative w-full sm:w-56 md:w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 z-10 pointer-events-none" />
                  <Input 
                    placeholder="Search menu..." 
                    className="pl-10 h-11 rounded-xl border-gray-100 bg-gray-50/50"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>

              {/* Menu Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
                {filteredItems.map(item => (
                  <Card key={item.itemId} className="group overflow-hidden border-gray-100 hover:border-orange-200 transition-all shadow-sm hover:shadow-xl hover:shadow-orange-100/50 rounded-2xl bg-white">
                    <CardContent className="p-0">
                      <div className="relative h-32 sm:h-40 overflow-hidden">
                        <img 
                          src={item.images[0]} 
                          alt={item.foodName}
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                        />
                        <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-md rounded-lg px-2 py-1 shadow-sm">
                          <span className="text-xs font-black text-gray-900">${item.price.toFixed(2)}</span>
                        </div>
                      </div>
                      <div className="p-4 space-y-3">
                        <div>
                          <h4 className="text-sm font-black text-gray-900 uppercase tracking-tight">{item.foodName}</h4>
                          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-0.5 line-clamp-1">{item.description}</p>
                        </div>
                        <Button 
                          onClick={() => addToCart(item)}
                          className="w-full bg-gray-900 hover:bg-black text-white h-10 rounded-xl text-[10px] font-black uppercase tracking-widest"
                        >
                          <Plus className="w-3 h-3 mr-2" />
                          Add to Order
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {viewMode === 'orders' && (() => {
            const visibleOrders = Array.from(activeOrders.values())
              .filter(o => o.status !== 'completed' && o.status !== 'browsing');

            if (visibleOrders.length === 0) {
              return (
                <div className="flex flex-col items-center justify-center py-24 text-center">
                  <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mb-4">
                    <CheckCircle2 className="w-8 h-8 text-gray-300" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-600 mb-1">No active orders</h3>
                  <p className="text-sm text-gray-400">Orders will appear here in real-time.</p>
                </div>
              );
            }

            const statusStyle: Record<string, { bar: string; badge: string; badgeText: string; label: string }> = {
              pending:   { bar: 'bg-red-500',    badge: 'bg-red-50 border-red-200',    badgeText: 'text-red-600',    label: 'New Order'  },
              preparing: { bar: 'bg-orange-500', badge: 'bg-orange-50 border-orange-200', badgeText: 'text-orange-600', label: 'Preparing'  },
              ready:     { bar: 'bg-green-500',  badge: 'bg-green-50 border-green-200',   badgeText: 'text-green-600',  label: 'Ready'      },
            };

            return (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                {visibleOrders.map(order => {
                  const key = order.orderId ? order.orderId.toString() : `${order.tableId}-${order.createdAt}`;
                  const s = statusStyle[order.status] ?? statusStyle.pending;
                  const orderId = order.orderId ? order.orderId.toString() : order.tableId;
                  const tableLabel = order.tableNumber && order.tableNumber !== 'TA'
                    ? `Table ${order.tableNumber}`
                    : 'Takeaway';
                  const elapsed = Math.floor((Date.now() - new Date(order.createdAt).getTime()) / 60000);

                  return (
                    <motion.div
                      key={key}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col"
                    >
                      {/* Coloured top bar */}
                      <div className={`h-1 w-full ${s.bar}`} />

                      {/* Header */}
                      <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-gray-50">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm text-white shadow-sm ${s.bar}`}>
                            {order.tableNumber && order.tableNumber !== 'TA' ? order.tableNumber : '🥡'}
                          </div>
                          <div>
                            <p className="text-sm font-bold text-gray-900">{tableLabel}</p>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <Clock className="w-3 h-3 text-gray-400" />
                              <span className="text-[11px] text-gray-400">
                                {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                {elapsed > 0 && <span className="ml-1 text-gray-300">· {elapsed}m ago</span>}
                              </span>
                            </div>
                          </div>
                        </div>
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold border ${s.badge} ${s.badgeText}`}>
                          {s.label}
                        </span>
                      </div>

                      {/* Customer info */}
                      {(order.customerName || order.customerPhone) && (
                        <div className="px-5 pt-3 flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center">
                            <Users className="w-3 h-3 text-gray-400" />
                          </div>
                          <span className="text-xs text-gray-500">
                            {order.customerName}{order.customerPhone ? ` · ${order.customerPhone}` : ''}
                          </span>
                        </div>
                      )}

                      {/* Items */}
                      <div className="flex-1 px-5 py-4 space-y-2">
                        {order.items.map((item, idx) => (
                          <div key={idx} className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2 min-w-0">
                              <span className={`shrink-0 w-5 h-5 rounded-md flex items-center justify-center text-[10px] font-black text-white ${s.bar}`}>
                                {item.quantity}
                              </span>
                              <span className="text-sm text-gray-700 truncate">{item.foodName}</span>
                            </div>
                            <span className="shrink-0 text-sm font-semibold text-gray-900">
                              ${(item.price * item.quantity).toFixed(2)}
                            </span>
                          </div>
                        ))}
                      </div>

                      {/* Total + Action */}
                      <div className="px-5 py-4 border-t border-gray-50 bg-gray-50/50 flex items-center justify-between gap-3">
                        <div>
                          <p className="text-[10px] text-gray-400 uppercase font-semibold tracking-wide">Total</p>
                          <p className="text-xl font-black text-gray-900">${order.total.toFixed(2)}</p>
                        </div>

                        <div className="flex gap-2">
                          {order.status === 'pending' && (
                            <Button
                              size="sm"
                              className="bg-orange-500 hover:bg-orange-600 text-white rounded-xl h-10 px-5 font-bold text-xs"
                              onClick={() => updateOrderStatus(orderId, 'preparing')}
                            >
                              <UtensilsCrossed className="w-3.5 h-3.5 mr-1.5" />
                              Accept
                            </Button>
                          )}
                          {order.status === 'preparing' && (
                            <Button
                              size="sm"
                              className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl h-10 px-5 font-bold text-xs"
                              onClick={() => updateOrderStatus(orderId, 'ready')}
                            >
                              <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" />
                              Mark Ready
                            </Button>
                          )}
                          {order.status === 'ready' && (
                            <Button
                              size="sm"
                              className="bg-green-600 hover:bg-green-700 text-white rounded-xl h-10 px-5 font-bold text-xs"
                              onClick={() => setBillingOrder(order)}
                            >
                              <FileText className="w-3.5 h-3.5 mr-1.5" />
                              Bill
                            </Button>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            );
          })()}
        </div>
      </div>

      {/* Billing Modal */}
      {billingOrder && (
        <BillingModal
          order={billingOrder}
          onClose={() => setBillingOrder(null)}
          onPaid={(tableId) => {
            completeOrder(tableId);
            setBillingOrder(null);
          }}
        />
      )}

      {/* 3. Executive Cart Summary (Luxury Floating Bar) */}
      <AnimatePresence>
        {viewMode === 'menu' && selectedTable && cart.length > 0 && (
          <motion.div 
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="absolute bottom-0 left-0 right-0 z-50 p-4"
          >
            <div className="max-w-5xl mx-auto">
              <div className="bg-white border border-gray-200 shadow-[0_20px_50px_rgba(0,0,0,0.15)] rounded-2xl overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-accent/5 to-transparent pointer-events-none" />
                
                <div className="relative px-6 py-4 flex items-center justify-between gap-6">
                  {/* Left: Total & Items */}
                  <div className="flex items-center gap-6">
                    <div className="h-12 w-12 bg-accent rounded-xl flex items-center justify-center text-accent-foreground shadow-lg shadow-accent/20">
                      <ShoppingCart className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-accent uppercase tracking-[0.2em] mb-0.5">Order Total</p>
                      <div className="flex items-baseline gap-1">
                        <span className="text-2xl font-black text-gray-900">${cartTotal.toFixed(2)}</span>
                        <span className="text-xs text-gray-400 font-medium">({cart.reduce((sum, item) => sum + item.quantity, 0)} items)</span>
                      </div>
                    </div>
                  </div>

                  {/* Middle: Horizontal Item List (Scrollable) */}
                  <div className="hidden md:flex flex-1 items-center gap-2 overflow-x-auto py-1 scrollbar-hide border-x px-4 border-gray-100">
                    {cart.map((item) => (
                      <motion.div
                        key={item.itemId}
                        layout
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5 flex items-center gap-2 whitespace-nowrap group"
                      >
                        <span className="text-xs font-bold text-accent">{item.quantity}x</span>
                        <span className="text-xs font-medium text-gray-700">{item.foodName}</span>
                        <button 
                          onClick={() => removeFromCart(item.itemId)}
                          className="text-gray-300 hover:text-red-500 transition-colors"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </motion.div>
                    ))}
                  </div>

                  {/* Right: Actions */}
                  <div className="flex items-center gap-3">
                    <Button 
                      variant="ghost" 
                      onClick={clearCart}
                      className="text-gray-400 hover:text-red-500 hover:bg-red-50"
                    >
                      <Trash2 className="w-5 h-5" />
                    </Button>
                    <Button 
                      onClick={handleSubmitOrder}
                      size="lg"
                      className="bg-accent hover:bg-accent/90 text-accent-foreground px-8 h-14 rounded-xl shadow-xl shadow-accent/20 font-bold group"
                    >
                      Process Order
                      <CheckCircle2 className="ml-2 w-5 h-5 group-hover:scale-110 transition-transform" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
