import React from 'react';
import { MenuItem } from '@/contexts/MenuContext';
import { motion } from 'framer-motion';
import { useCart } from '@/contexts/CartContext';
import { Plus, Minus } from 'lucide-react';

interface MenuCardProps {
  item: MenuItem;
  index?: number;
  onClick?: (item: MenuItem) => void;
}

export const MenuCard: React.FC<MenuCardProps> = ({ item, index = 0, onClick }) => {
  const { addToCart, cartItems, removeFromCart } = useCart();
  const cartItem = cartItems.find(i => i.item.itemId === item.itemId);
  const quantity = cartItem?.quantity || 0;
  
  return (
    <motion.div
      className={`relative flex flex-col bg-white/80 backdrop-blur-md rounded-3xl border border-black/5 p-3 sm:p-4 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-500 group ${item.soldOut ? 'opacity-50 grayscale pointer-events-none' : 'cursor-pointer'}`}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, delay: index * 0.05, ease: [0.19, 1, 0.22, 1] }}
      onClick={() => onClick?.(item)}
    >
      {/* Premium Image Section */}
      <div className="relative aspect-square overflow-hidden bg-gray-100 rounded-2xl shadow-inner">
        <img 
          src={item.images[0] || '/placeholder.svg'} 
          alt={item.foodName}
          className="w-full h-full object-cover transition-transform duration-[1.5s] ease-[cubic-bezier(0.19,1,0.22,1)] group-hover:scale-105"
        />
        
        {/* Status Indicators & Veg Badge */}
        <div className="absolute top-3 left-3 flex flex-col items-start gap-1.5 pointer-events-none z-10">
          {item.popular && (
            <span className="text-[9px] font-black tracking-wider bg-black text-white px-2.5 py-1 rounded-full uppercase shadow-md">BEST SELLER</span>
          )}
          {item.new && (
            <span className="text-[9px] font-black tracking-wider bg-amber-500 text-white px-2.5 py-1 rounded-full uppercase shadow-md">NEW</span>
          )}
          {item.dietaryInfo?.vegetarian && (
            <span className="text-[9px] font-black tracking-wider bg-green-500 text-white px-2.5 py-1 rounded-full uppercase shadow-md inline-flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-white" /> VEG
            </span>
          )}
        </div>

        {/* Quantity Overlay for added items */}
        {quantity > 0 && (
          <div className="absolute inset-0 bg-black/10 flex items-center justify-center backdrop-blur-[1px]">
            <div className="w-12 h-12 rounded-full bg-white shadow-2xl flex items-center justify-center font-bold text-lg border border-black/10 animate-scale-up">
              {quantity}
            </div>
          </div>
        )}
      </div>

      {/* Content Section */}
      <div className="pt-5 pb-2 flex-1 flex flex-col justify-between space-y-4">
        <div className="space-y-1.5 text-left px-1">
          <div className="flex justify-between items-start gap-2">
            <h3 className="font-bold text-gray-900 text-lg sm:text-xl line-clamp-1 group-hover:text-black transition-colors uppercase tracking-tight">
              {item.foodName}
            </h3>
            <span className="font-black text-lg text-gray-900 flex-shrink-0">
              ${typeof item.price === 'number' ? item.price.toFixed(2) : item.price}
            </span>
          </div>
          <p className="text-xs text-gray-400 font-medium tracking-wide">
            {item.portionSize || 'Signature Dish'}
          </p>
        </div>

        <div className="flex items-center justify-between gap-3 pt-2">
          {quantity > 0 ? (
            <div className="flex items-center justify-between bg-gray-100 rounded-full p-1 w-full border border-gray-200">
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  removeFromCart(item.itemId);
                }}
                className="p-2 text-gray-600 hover:text-black hover:bg-white rounded-full transition-all"
              >
                <Minus className="w-3.5 h-3.5" />
              </button>
              <span className="font-black text-sm text-gray-800 px-2">{quantity}</span>
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  if (!item.soldOut) addToCart(item);
                }}
                className="p-2 text-gray-600 hover:text-black hover:bg-white rounded-full transition-all"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <button 
              onClick={(e) => {
                e.stopPropagation();
                if (!item.soldOut) addToCart(item);
              }}
              className="w-full py-3 bg-[image:var(--gradient-accent)] text-primary-foreground rounded-full text-[10px] font-black tracking-wider uppercase transition-all duration-300 active:scale-95 shadow-md hover:shadow-lg"
            >
              Add to Order
            </button>
          )}
        </div>
      </div>
      
      {item.soldOut && (
        <div className="absolute inset-0 bg-white/80 rounded-3xl flex items-center justify-center z-20">
          <span className="font-black tracking-[0.2em] text-xs bg-red-500 text-white px-4 py-2 rounded-full shadow-md">OUT OF STOCK</span>
        </div>
      )}
    </motion.div>
  );
};