import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Plus, Minus, ShoppingCart, Trash2, ShoppingBag, Info, Sparkles, Pencil, Check } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useCart } from '@/contexts/CartContext';
import { useRestaurant } from '@/contexts/RestaurantContext';
import { useMenu } from '@/contexts/MenuContext';
import { CheckoutModal } from './CheckoutModal';

export const CartSidebar: React.FC = () => {
  const {
    cartItems,
    removeFromCart,
    updateQuantity,
    updateSpecialInstructions,
    clearCart,
    getTotalItems,
    getTotalPrice,
    isCartOpen,
    setIsCartOpen,
    addToCart,
    showUpsell,
    setShowUpsell
  } = useCart();

  const { menuItems } = useMenu();

  const { currentRestaurant } = useRestaurant();
  const taxRate = (currentRestaurant?.settings.taxRate ?? 8.5) / 100;

  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  // Track which item's note input is open, and its draft value
  const [editingNoteId, setEditingNoteId] = useState<number | null>(null);
  const [noteDraft, setNoteDraft] = useState('');

  const handleCheckout = () => {
    if (cartItems.length === 0) {
      toast.error('Your cart is empty!');
      return;
    }
    setIsCheckoutOpen(true);
  };

  return (
    <>
      <AnimatePresence>
        {isCartOpen && (
          <div className="fixed inset-0 z-[100] flex justify-end overflow-hidden">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsCartOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm"
            />

            {/* Sidebar */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="relative w-full max-w-full sm:max-w-md h-full bg-white shadow-2xl flex flex-col z-[110]"
            >
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-gray-100 bg-white sticky top-0 z-10">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-accent/10 rounded-xl flex items-center justify-center">
                    <ShoppingCart className="w-5 h-5 text-accent" />
                  </div>
                  <div>
                    <h2 className="text-base sm:text-xl font-black text-gray-900 uppercase tracking-tight">Your Order</h2>
                    <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">
                      {getTotalItems()} Items Selected
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsCartOpen(false)}
                  className="rounded-full h-10 w-10 p-0 hover:bg-gray-100"
                >
                  <X className="h-5 w-5 text-gray-400" />
                </Button>
              </div>

              {/* Cart Items */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar bg-gray-50/30">
                {cartItems.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center p-8">
                    <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-6">
                      <ShoppingBag className="h-10 w-10 text-gray-300" />
                    </div>
                    <h3 className="text-lg font-black text-gray-900 uppercase tracking-tight mb-2">Cart is empty</h3>
                    <p className="text-sm text-gray-500 max-w-[200px]">
                      Add some delicious items from our menu to start your order.
                    </p>
                  </div>
                ) : (
                  <AnimatePresence initial={false}>
                    {cartItems.map(cartItem => (
                      <motion.div
                        key={cartItem.item.itemId}
                        layout
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 group"
                      >
                        <div className="flex gap-4">
                          <div className="w-20 h-20 rounded-xl overflow-hidden flex-shrink-0 border border-gray-50">
                            <img
                              src={cartItem.item.images[0] || '/placeholder.svg'}
                              alt={cartItem.item.foodName}
                              className="w-full h-full object-cover transition-transform group-hover:scale-110"
                            />
                          </div>
                          
                          <div className="flex-1 min-w-0 flex flex-col justify-between">
                            <div>
                              <div className="flex items-start justify-between gap-2">
                                <h4 className="font-black text-gray-900 text-sm truncate uppercase tracking-tight">
                                  {cartItem.item.foodName}
                                </h4>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => removeFromCart(cartItem.item.itemId)}
                                  className="h-6 w-6 p-0 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-full"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                              </div>
                              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">
                                ${cartItem.item.price.toFixed(2)} / unit
                              </p>
                            </div>

                            <div className="flex items-center justify-between mt-3">
                              <div className="flex items-center bg-gray-50 rounded-lg p-1 border border-gray-100">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => updateQuantity(cartItem.item.itemId, cartItem.quantity - 1)}
                                  className="h-7 w-7 p-0 hover:bg-white hover:shadow-sm"
                                >
                                  <Minus className="h-3 w-3" />
                                </Button>
                                <span className="text-xs font-black w-8 text-center text-gray-900">
                                  {cartItem.quantity}
                                </span>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => updateQuantity(cartItem.item.itemId, cartItem.quantity + 1)}
                                  className="h-7 w-7 p-0 hover:bg-white hover:shadow-sm"
                                >
                                  <Plus className="h-3 w-3" />
                                </Button>
                              </div>
                              <span className="font-black text-sm text-accent">
                                ${(cartItem.item.price * cartItem.quantity).toFixed(2)}
                              </span>
                            </div>
                          </div>
                        </div>
                        {/* Notes section */}
                        <div className="mt-3 pt-3 border-t border-gray-50">
                          {editingNoteId === cartItem.item.itemId ? (
                            <div className="flex flex-col gap-2">
                              <textarea
                                autoFocus
                                rows={2}
                                value={noteDraft}
                                onChange={e => setNoteDraft(e.target.value)}
                                placeholder="e.g. Less spicy, no onion, extra cheese…"
                                className="w-full text-xs rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 resize-none focus:outline-none focus:border-accent font-medium text-gray-700 placeholder:text-gray-300"
                              />
                              <div className="flex gap-2">
                                <button
                                  onClick={() => {
                                    updateSpecialInstructions(cartItem.item.itemId, noteDraft.trim());
                                    setEditingNoteId(null);
                                  }}
                                  className="flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-white bg-accent px-3 py-1.5 rounded-lg"
                                >
                                  <Check className="w-3 h-3" /> Save
                                </button>
                                <button
                                  onClick={() => setEditingNoteId(null)}
                                  className="text-[10px] font-black uppercase tracking-widest text-gray-400 px-3 py-1.5 rounded-lg hover:bg-gray-100"
                                >
                                  Cancel
                                </button>
                              </div>
                            </div>
                          ) : cartItem.specialInstructions ? (
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex items-start gap-2 flex-1 min-w-0">
                                <Info className="w-3 h-3 text-blue-400 mt-0.5 flex-shrink-0" />
                                <p className="text-[10px] font-bold text-blue-500 uppercase tracking-wide truncate">
                                  {cartItem.specialInstructions}
                                </p>
                              </div>
                              <button
                                onClick={() => { setNoteDraft(cartItem.specialInstructions || ''); setEditingNoteId(cartItem.item.itemId); }}
                                className="text-gray-300 hover:text-accent flex-shrink-0"
                              >
                                <Pencil className="w-3 h-3" />
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => { setNoteDraft(''); setEditingNoteId(cartItem.item.itemId); }}
                              className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-gray-300 hover:text-accent transition-colors"
                            >
                              <Pencil className="w-3 h-3" /> Add note
                            </button>
                          )}
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                )}

                {/* ✅ Smart Pairing Upsell Section */}
                {showUpsell && cartItems.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 }}
                    className="mb-8"
                  >
                    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-accent/5 via-accent/10 to-transparent border border-accent/20 p-6 group">
                      <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/2 w-32 h-32 bg-accent/10 rounded-full blur-3xl group-hover:bg-accent/20 transition-all duration-500" />
                      
                      <div className="relative space-y-4">
                        <div className="flex items-center justify-between">
                          <Badge className="bg-accent text-accent-foreground border-none font-black text-[10px] uppercase tracking-widest px-3 py-1 shadow-lg shadow-accent/20">
                            <Sparkles className="w-3 h-3 mr-1" />
                            Chef Recommends
                          </Badge>
                          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Wine Pairing</p>
                        </div>

                        <div className="flex items-center gap-4">
                          <div className="w-16 h-16 rounded-2xl overflow-hidden shadow-lg border border-white/50 flex-shrink-0">
                            <img 
                              src="https://images.pexels.com/photos/1640776/pexels-photo-1640776.jpeg?auto=compress&cs=tinysrgb&w=800&h=600&fit=crop" 
                              alt="Italian Wine Selection"
                              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                            />
                          </div>
                          <div className="flex-1">
                            <h4 className="font-black text-gray-900 text-sm uppercase tracking-tight leading-tight">Italian Wine Selection</h4>
                            <p className="text-[10px] font-bold text-gray-500 mt-1 uppercase tracking-wide">Enhance your meal with our curated selection</p>
                            <p className="text-accent font-black text-sm mt-1">$12.99</p>
                          </div>
                        </div>

                        <Button 
                          onClick={() => {
                            // Find the wine item from menuItems if possible, otherwise use a placeholder
                            const wineItem = menuItems.find(i => i.foodName.toLowerCase().includes('wine')) || {
                              itemId: 17,
                              foodName: 'Italian Wine Selection',
                              price: 12.99,
                              images: ['https://images.pexels.com/photos/1640776/pexels-photo-1640776.jpeg?auto=compress&cs=tinysrgb&w=800&h=600&fit=crop'],
                              description: 'Curated selection of premium Italian wines'
                            } as any;
                            
                            addToCart(wineItem);
                            setShowUpsell(false);
                            toast.success('Excellent choice! Pairing added to order.');
                          }}
                          className="w-full h-11 rounded-2xl bg-white border border-accent/20 hover:bg-accent hover:text-accent-foreground text-accent font-black text-[11px] uppercase tracking-widest transition-all duration-300 shadow-sm"
                        >
                          <Plus className="w-3.5 h-3.5 mr-2" />
                          Add to Order
                        </Button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </div>

              {/* Footer */}
              {cartItems.length > 0 && (
                <div className="p-8 border-t border-gray-100 bg-white space-y-6">
                  <div className="space-y-3">
                    <div className="flex justify-between text-xs font-bold text-gray-400 uppercase tracking-widest">
                      <span>Subtotal</span>
                      <span className="text-gray-900">${getTotalPrice().toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-xs font-bold text-gray-400 uppercase tracking-widest">
                      <span>Estimated Tax</span>
                      <span className="text-gray-900">${(getTotalPrice() * taxRate).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between items-end pt-4 border-t border-gray-100">
                      <div className="space-y-1">
                        <p className="text-[10px] font-black text-accent uppercase tracking-[0.2em]">Total Amount</p>
                        <p className="text-3xl font-black text-gray-900 tracking-tighter">
                          ${(getTotalPrice() * (1 + taxRate)).toFixed(2)}
                        </p>
                      </div>
                      <Badge className="bg-accent/10 text-accent border-none font-black text-[10px] uppercase tracking-widest px-3 py-1 mb-1">
                        <Sparkles className="w-3 h-3 mr-1" />
                        Premium
                      </Badge>
                    </div>
                  </div>

                  <div className="flex flex-col gap-3">
                    <Button 
                      onClick={handleCheckout} 
                      className="h-14 rounded-2xl bg-accent hover:bg-accent/90 text-accent-foreground font-black uppercase tracking-[0.1em] shadow-xl shadow-accent/20 active:scale-95 transition-all"
                    >
                      <ShoppingBag className="h-4 w-4 mr-2" />
                      Place Your Order
                    </Button>
                    <Button 
                      variant="ghost" 
                      onClick={clearCart}
                      className="text-xs font-bold text-gray-400 hover:text-red-500 hover:bg-red-50 uppercase tracking-widest"
                    >
                      Clear All Items
                    </Button>
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <CheckoutModal
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
      />
    </>
  );
};
