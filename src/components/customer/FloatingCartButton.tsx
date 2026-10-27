import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingCart, ShoppingBag } from 'lucide-react';
import { useCart } from '@/contexts/CartContext';
import { useLocation } from 'react-router-dom';

export const FloatingCartButton: React.FC = () => {
  const { getTotalItems, getTotalPrice, setIsCartOpen } = useCart();
  const location = useLocation();
  
  const totalItems = getTotalItems();
  const totalPrice = getTotalPrice();
  
  // Don't show on admin pages or if cart is empty
  const isAdminPage = location.pathname.startsWith('/admin');
  const shouldShow = totalItems > 0 && !isAdminPage;

  return (
    <AnimatePresence>
      {shouldShow && (
        <motion.div
          initial={{ x: '100%', opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: '100%', opacity: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-[50]"
        >
          <button
            onClick={() => setIsCartOpen(true)}
            className="group relative flex items-center gap-2 sm:gap-3 bg-accent hover:bg-accent/90 text-accent-foreground px-4 py-3 sm:px-6 sm:py-4 rounded-2xl shadow-2xl shadow-accent/30 border border-white/20 backdrop-blur-xl transition-all active:scale-95"
          >
            {/* Icon and Badge */}
            <div className="relative">
              <ShoppingBag className="w-6 h-6 transition-transform group-hover:scale-110" />
              <span className="absolute -top-3 -right-3 bg-primary text-primary-foreground text-[10px] font-black w-6 h-6 rounded-full flex items-center justify-center shadow-lg border-2 border-accent group-hover:animate-pulse">
                {totalItems}
              </span>
            </div>

            {/* Label and Price */}
            <div className="flex flex-col items-start leading-none">
              <span className="text-[10px] font-black uppercase tracking-[0.2em] opacity-80">View Order</span>
              <span className="text-lg font-black tracking-tight">${totalPrice.toFixed(2)}</span>
            </div>

            {/* Sparkle effect on hover */}
            <motion.div 
              className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl pointer-events-none"
              whileHover={{ scale: 1.02 }}
            />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
