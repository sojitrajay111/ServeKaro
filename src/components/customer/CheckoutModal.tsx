import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, User, Check, ShoppingBag, ShieldCheck, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useCart } from '@/contexts/CartContext';
import { useOrders } from '@/contexts/OrdersContext';
import { useRestaurant } from '@/contexts/RestaurantContext';
import { useLocation, useNavigate } from 'react-router-dom';

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CheckoutModal = ({ isOpen, onClose }: CheckoutModalProps) => {
  const navigate = useNavigate();
  const timeoutRef = useRef<any>(null);
  const location = useLocation();
  // CartSidebar lives outside <Routes> so useParams() always returns {}.
  // Parse tableId directly from the current path: /menu/:restaurantId/:tableId
  const pathParts = location.pathname.split('/').filter(Boolean);
  const tableId = pathParts[0] === 'menu' && pathParts.length >= 3 ? pathParts[2] : undefined;
  const { cartItems, getTotalPrice, clearCart } = useCart();
  const { submitOrder } = useOrders();
  const { currentRestaurant } = useRestaurant();
  const taxRate = (currentRestaurant?.settings.taxRate ?? 8.5) / 100;
  const orderType = 'dine-in';
  const [isProcessing, setIsProcessing] = useState(false);
  const [orderComplete, setOrderComplete] = useState(false);
  
  const [customerInfo, setCustomerInfo] = useState(() => {
    try {
      const saved = localStorage.getItem('customerInfo');
      return saved ? JSON.parse(saved) : { name: '', email: '', phone: '' };
    } catch {
      return { name: '', email: '', phone: '' };
    }
  });

  // Persist customer info to localStorage whenever it changes
  useEffect(() => {
    if (customerInfo.name || customerInfo.phone) {
      localStorage.setItem('customerInfo', JSON.stringify(customerInfo));
    }
  }, [customerInfo]);

  const totalPrice = getTotalPrice() * (1 + taxRate);

  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);

    submitOrder({
      tableId: tableId || 'takeaway',
      tableNumber: tableId || 'TA',
      customerName: customerInfo.name,
      customerPhone: customerInfo.phone,
      items: cartItems.map(item => ({
        itemId: item.item.itemId,
        foodName: item.item.foodName,
        price: item.item.price,
        quantity: item.quantity,
        notes: item.specialInstructions,
      })),
      status: 'pending',
      createdAt: new Date().toISOString(),
      total: totalPrice,
    });

    setIsProcessing(false);
    setOrderComplete(true);

    // Auto-close after 5s so customer can see the tracker banner
    timeoutRef.current = setTimeout(() => {
      clearCart();
      onClose();
      setOrderComplete(false);
    }, 5000);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/80 backdrop-blur-md"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, y: 100, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 100, scale: 0.95 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="relative bg-white sm:rounded-3xl shadow-2xl w-full sm:max-w-2xl sm:max-h-[90vh] h-full sm:h-auto flex flex-col overflow-hidden"
          >
            {orderComplete ? (
              <div className="flex-1 flex flex-col items-center justify-center p-8 sm:p-12 text-center bg-gradient-to-b from-green-50/50 to-white">
                <motion.div
                  initial={{ scale: 0, rotate: -45 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: 'spring', damping: 12, stiffness: 200 }}
                  className="relative mb-8"
                >
                  <div className="absolute inset-0 bg-green-200 blur-2xl opacity-40 rounded-full animate-pulse" />
                  <div className="relative w-28 h-28 bg-green-500 rounded-[2.5rem] flex items-center justify-center shadow-2xl shadow-green-200 border-4 border-white">
                    <Check className="h-14 w-14 text-white" />
                  </div>
                  {/* Decorative Sparkles */}
                  <motion.div 
                    animate={{ scale: [1, 1.2, 1], rotate: [0, 90, 0] }}
                    transition={{ duration: 3, repeat: Infinity }}
                    className="absolute -top-4 -right-4"
                  >
                    <Sparkles className="w-8 h-8 text-orange-400" />
                  </motion.div>
                </motion.div>

                <div className="space-y-4 mb-10">
                  <h2 className="text-4xl font-black text-gray-900 uppercase tracking-tighter leading-none">
                    Order Placed!
                  </h2>
                  <p className="text-sm font-medium text-gray-500 max-w-[280px] mx-auto leading-relaxed">
                    Your delicious meal is now being prioritized by our kitchen team.
                  </p>
                </div>

                {/* Status Card */}
                <div className="w-full max-w-sm bg-white border border-gray-100 rounded-3xl p-6 shadow-xl shadow-gray-100/50 space-y-6 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-accent/5 rounded-full -translate-y-1/2 translate-x-1/2" />
                  
                  <div className="grid grid-cols-2 gap-4 relative">
                    <div className="text-left">
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Order Number</p>
                      <p className="text-lg font-black text-gray-900">#BV-{Date.now().toString().slice(-4)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Table</p>
                      <p className="text-lg font-black text-accent">{tableId || 'Takeaway'}</p>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-dashed border-gray-100 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 rounded-full bg-green-500 animate-ping" />
                      <span className="text-[10px] font-black text-gray-900 uppercase tracking-widest">Sent to Kitchen</span>
                    </div>
                    <span className="text-[10px] font-black text-accent uppercase tracking-widest">Priority: High</span>
                  </div>
                </div>

                <div className="mt-10 space-y-4 w-full max-w-xs">
                  <Button 
                    onClick={() => {
                      if (timeoutRef.current) clearTimeout(timeoutRef.current);
                      clearCart();
                      onClose();
                      setOrderComplete(false);
                      navigate('/my-orders');
                    }}
                    className="w-full h-14 rounded-2xl bg-[image:var(--gradient-accent)] text-primary-foreground font-black uppercase tracking-widest shadow-xl active:scale-95 transition-all"
                  >
                    View Order Status
                  </Button>
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] animate-pulse">
                    Redirecting in 5s...
                  </p>
                </div>
              </div>
            ) : (
              <>
                {/* Header */}
                <div className="flex items-center justify-between p-6 sm:p-8 border-b border-gray-100 bg-white sticky top-0 z-10">
                  <div>
                    <h2 className="text-2xl font-black text-gray-900 uppercase tracking-tight">Checkout</h2>
                    <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Finalize your order</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={onClose}
                    className="rounded-full h-12 w-12 p-0 hover:bg-gray-100"
                  >
                    <X className="h-6 w-6 text-gray-400" />
                  </Button>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto custom-scrollbar p-6 sm:p-8 space-y-10">
                  <form id="checkout-form" onSubmit={handleSubmitOrder} className="space-y-10">
                    
                    {/* Order Items Summary */}
                    <div className="bg-gray-50 rounded-2xl p-6 space-y-4">
                      <h4 className="text-[10px] font-black uppercase tracking-widest text-gray-400 border-b border-gray-200 pb-2">Order Items</h4>
                      <div className="space-y-3">
                        {cartItems.map(cartItem => (
                          <div key={cartItem.item.itemId} className="flex justify-between items-center text-sm">
                            <div className="flex items-center gap-3 min-w-0">
                              <span className="w-6 h-6 bg-accent/10 rounded text-[10px] font-black text-accent flex items-center justify-center flex-shrink-0">
                                {cartItem.quantity}
                              </span>
                              <span className="font-bold text-gray-900 truncate uppercase tracking-tight">{cartItem.item.foodName}</span>
                            </div>
                            <span className="font-black text-gray-900 ml-4">${(cartItem.item.price * cartItem.quantity).toFixed(2)}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Customer Info */}
                    <div className="space-y-4">
                      <div className="flex items-center gap-2">
                        <User className="w-5 h-5 text-accent" />
                        <h4 className="text-[10px] font-black uppercase tracking-widest text-gray-400">Your Details</h4>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <Label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Full Name</Label>
                          <Input
                            placeholder="John Doe"
                            className="h-12 rounded-xl border-gray-200 bg-gray-50/50 focus:bg-white transition-all font-bold placeholder:font-normal placeholder:text-gray-400"
                            value={customerInfo.name}
                            onChange={(e) => setCustomerInfo({...customerInfo, name: e.target.value})}
                            required
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Phone Number</Label>
                          <Input
                            type="tel"
                            placeholder="+1 234 567 890"
                            className="h-12 rounded-xl border-gray-200 bg-gray-50/50 focus:bg-white transition-all font-bold placeholder:font-normal placeholder:text-gray-400"
                            value={customerInfo.phone}
                            onChange={(e) => setCustomerInfo({...customerInfo, phone: e.target.value})}
                            required
                          />
                        </div>
                      </div>
                    </div>
                  </form>
                </div>

                {/* Footer */}
                <div className="p-8 border-t border-gray-100 bg-gray-50/50 space-y-6">
                  <div className="flex items-center justify-between text-xs font-bold text-gray-400 uppercase tracking-widest">
                    <div className="flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 text-green-500" />
                      <span>Secure Checkout</span>
                    </div>
                    <div className="flex flex-col items-end">
                      <span>Incl. Taxes</span>
                      <span className="text-gray-900">${(getTotalPrice() * taxRate).toFixed(2)}</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between gap-6">
                    <div className="space-y-1">
                      <p className="text-[10px] font-black text-accent uppercase tracking-[0.2em]">Total Amount</p>
                      <p className="text-3xl font-black text-gray-900 tracking-tighter">
                        ${totalPrice.toFixed(2)}
                      </p>
                    </div>
                    <Button
                      type="submit"
                      form="checkout-form"
                      disabled={isProcessing}
                      className="flex-1 h-16 rounded-2xl bg-accent hover:bg-accent/90 text-accent-foreground font-black uppercase tracking-[0.1em] shadow-xl shadow-accent/20 active:scale-95 transition-all disabled:opacity-70"
                    >
                      {isProcessing ? (
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 border-2 border-accent-foreground/30 border-t-accent-foreground rounded-full animate-spin" />
                          <span>Processing</span>
                        </div>
                      ) : (
                        <>
                          <ShoppingBag className="h-5 w-5 mr-2" />
                          Confirm Order
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
