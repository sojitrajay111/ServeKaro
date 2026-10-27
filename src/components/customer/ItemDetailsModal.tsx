import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Star, Clock, ChefHat, X, ArrowLeft, ArrowRight, ShoppingCart, Info, Leaf } from 'lucide-react';
import { MenuItem } from '@/contexts/MenuContext';
import { useCart } from '@/contexts/CartContext';

interface ItemDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: MenuItem | null;
}

export const ItemDetailsModal: React.FC<ItemDetailsModalProps> = ({ isOpen, onClose, item }) => {
  const { addToCart } = useCart();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  if (!item) return null;

  const nextImage = () => {
    if (item.images.length > 1) {
      setCurrentImageIndex((prev) => (prev + 1) % item.images.length);
    }
  };

  const prevImage = () => {
    if (item.images.length > 1) {
      setCurrentImageIndex((prev) => (prev - 1 + item.images.length) % item.images.length);
    }
  };

  const handleAddToCart = () => {
    addToCart(item);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-md"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, y: 100 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 100 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="relative bg-white sm:rounded-3xl shadow-2xl w-full sm:max-w-4xl sm:max-h-[85vh] h-full sm:h-auto flex flex-col sm:flex-row overflow-hidden"
          >
            {/* Image Section */}
            <div className="relative w-full sm:w-1/2 h-[40vh] sm:h-auto bg-gray-100 flex-shrink-0">
              <img
                src={item.images[currentImageIndex] || '/placeholder.svg'}
                alt={item.foodName}
                className="w-full h-full object-cover"
              />
              
              {/* Image Controls */}
              {item.images.length > 1 && (
                <div className="absolute inset-x-4 top-1/2 -translate-y-1/2 flex justify-between pointer-events-none">
                  <Button
                    onClick={(e) => { e.stopPropagation(); prevImage(); }}
                    variant="ghost"
                    size="sm"
                    className="rounded-full w-10 h-10 bg-white/20 hover:bg-white/40 text-white backdrop-blur-md pointer-events-auto"
                  >
                    <ArrowLeft className="w-5 h-5" />
                  </Button>
                  <Button
                    onClick={(e) => { e.stopPropagation(); nextImage(); }}
                    variant="ghost"
                    size="sm"
                    className="rounded-full w-10 h-10 bg-white/20 hover:bg-white/40 text-white backdrop-blur-md pointer-events-auto"
                  >
                    <ArrowRight className="w-5 h-5" />
                  </Button>
                </div>
              )}

              {/* Badges */}
              <div className="absolute top-6 left-6 flex flex-col gap-2">
                {item.popular && (
                  <Badge className="bg-accent text-accent-foreground border-none font-black text-[10px] uppercase tracking-widest px-3 py-1">
                    Popular
                  </Badge>
                )}
                {item.dietaryInfo?.vegetarian && (
                  <Badge className="bg-green-500 text-white border-none font-black text-[10px] uppercase tracking-widest px-3 py-1 flex items-center gap-1">
                    <Leaf className="w-3 h-3" />
                    Vegetarian
                  </Badge>
                )}
              </div>

              {/* Mobile Close Button */}
              <Button
                onClick={onClose}
                variant="ghost"
                size="sm"
                className="sm:hidden absolute top-6 right-6 rounded-full w-10 h-10 bg-black/20 text-white backdrop-blur-md"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>

            {/* Info Section */}
            <div className="flex-1 flex flex-col bg-white overflow-y-auto">
              {/* Desktop Close Button */}
              <div className="hidden sm:flex justify-end p-4">
                <Button variant="ghost" size="sm" onClick={onClose} className="rounded-full h-10 w-10 p-0 text-gray-400">
                  <X className="h-5 w-5" />
                </Button>
              </div>

              <div className="p-8 sm:pt-0 flex-1">
                <div className="space-y-6">
                  <div>
                    <h2 className="text-3xl font-black text-gray-900 mb-2 uppercase tracking-tight">
                      {item.foodName}
                    </h2>
                    <div className="flex items-center gap-4 text-sm text-gray-500 font-bold uppercase tracking-widest">
                      <span className="flex items-center gap-1 text-accent">
                        <Clock className="w-4 h-4" />
                        {item.preparationTime || '15-20 min'}
                      </span>
                      <span className="flex items-center gap-1">
                        <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                        4.8 (95)
                      </span>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-gray-400">Description</h4>
                    <p className="text-gray-600 leading-relaxed">
                      {item.description}
                    </p>
                  </div>

                  {item.ingredients && item.ingredients.length > 0 && (
                    <div className="space-y-3">
                      <h4 className="text-[10px] font-black uppercase tracking-widest text-gray-400">Ingredients</h4>
                      <div className="flex flex-wrap gap-2">
                        {item.ingredients.map((ing, idx) => (
                          <span key={idx} className="px-3 py-1 bg-gray-50 text-gray-600 rounded-lg text-xs font-bold border border-gray-100">
                            {ing}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-2xl border border-blue-100">
                    <Info className="w-5 h-5 text-blue-500 flex-shrink-0" />
                    <p className="text-xs font-bold text-blue-600 leading-tight uppercase tracking-wide">
                      Allergy info: Contains gluten, dairy, and eggs. Please inform us of any sensitivities.
                    </p>
                  </div>
                </div>
              </div>

              {/* Sticky Footer */}
              <div className="p-8 border-t border-gray-100 bg-gray-50/50 flex items-center justify-between gap-6">
                <div>
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Total Price</p>
                  <p className="text-3xl font-black text-gray-900">
                    ${typeof item.price === 'number' ? item.price.toFixed(2) : item.price}
                  </p>
                </div>
                <Button
                  onClick={handleAddToCart}
                  className="flex-1 h-14 rounded-2xl bg-accent hover:bg-accent/90 text-accent-foreground font-black uppercase tracking-widest shadow-xl shadow-accent/20 active:scale-95 transition-all"
                >
                  <ShoppingCart className="w-5 h-5 mr-2" />
                  Add to Order
                </Button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
