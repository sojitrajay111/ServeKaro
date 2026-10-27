import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Gift, Clock, Star, Percent } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
export interface Promotion {
  id: string;
  type: string;
  title: string;
  description: string;
  code?: string;
  discount?: number;
  validUntil?: string;
  active: boolean;
  action?: {
    text: string;
    link: string;
  };
}

const PROMOTIONS: Promotion[] = [];

export const PromotionalBanner: React.FC = () => {
  const [currentPromoIndex, setCurrentPromoIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(true);
  const [dismissedPromos, setDismissedPromos] = useState<string[]>([]);

  const activePromotions = PROMOTIONS.filter(
    promo => promo.active && !dismissedPromos.includes(promo.id)
  );

  useEffect(() => {
    if (activePromotions.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentPromoIndex((prev) => (prev + 1) % activePromotions.length);
    }, 8000); // Change every 8 seconds

    return () => clearInterval(interval);
  }, [activePromotions.length]);

  const handleDismiss = () => {
    const currentPromo = activePromotions[currentPromoIndex];
    if (currentPromo) {
      setDismissedPromos(prev => [...prev, currentPromo.id]);
      
      // Move to next promotion or hide banner if no more promos
      if (activePromotions.length === 1) {
        setIsVisible(false);
      } else {
        setCurrentPromoIndex((prev) => prev % (activePromotions.length - 1));
      }
    }
  };

  const getPromoIcon = (type: Promotion['type']) => {
    switch (type) {
      case 'discount':
        return <Percent className="h-5 w-5" />;
      case 'special':
        return <Star className="h-5 w-5" />;
      case 'event':
        return <Clock className="h-5 w-5" />;
      default:
        return <Gift className="h-5 w-5" />;
    }
  };

  const getPromoColors = (type: Promotion['type']) => {
    switch (type) {
      case 'discount':
        return 'from-red-500 to-pink-500';
      case 'special':
        return 'from-yellow-500 to-orange-500';
      case 'event':
        return 'from-blue-500 to-purple-500';
      default:
        return 'from-green-500 to-teal-500';
    }
  };

  if (!isVisible || activePromotions.length === 0) return null;

  const currentPromo = activePromotions[currentPromoIndex];

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -50 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -50 }}
        className={`relative overflow-hidden bg-gradient-to-r ${getPromoColors(currentPromo.type)} text-white`}
      >
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,white_1px,transparent_0)] [background-size:20px_20px]"></div>
        </div>

        <div className="relative container mx-auto px-4 py-3">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              {/* Icon */}
              <motion.div
                animate={{ rotate: [0, 10, -10, 0] }}
                transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
                className="flex-shrink-0"
              >
                {getPromoIcon(currentPromo.type)}
              </motion.div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-semibold text-sm sm:text-base truncate">
                    {currentPromo.title}
                  </h3>
                  {currentPromo.discount && (
                    <Badge className="bg-white/20 text-white border-white/20 text-xs">
                      {currentPromo.discount}% OFF
                    </Badge>
                  )}
                </div>
                <p className="text-xs sm:text-sm opacity-90 line-clamp-1">
                  {currentPromo.description}
                </p>
                {currentPromo.validUntil && (
                  <p className="text-xs opacity-75 mt-1">
                    Valid until: {currentPromo.validUntil}
                  </p>
                )}
              </div>
            </div>

            {/* Action Button */}
            <div className="flex items-center gap-2 flex-shrink-0">
              {currentPromo.action && (
                <Button
                  variant="secondary"
                  size="sm"
                  className="bg-white/20 hover:bg-white/30 text-white border-white/20 text-xs sm:text-sm"
                >
                  {currentPromo.action.text}
                </Button>
              )}

              {/* Dismiss Button */}
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDismiss}
                className="h-8 w-8 p-0 text-white hover:bg-white/20"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Progress Indicator */}
          {activePromotions.length > 1 && (
            <div className="flex justify-center gap-1 mt-2">
              {activePromotions.map((_, index) => (
                <motion.div
                  key={index}
                  className={`h-1 rounded-full ${
                    index === currentPromoIndex ? 'bg-white w-6' : 'bg-white/40 w-2'
                  }`}
                  transition={{ duration: 0.3 }}
                />
              ))}
            </div>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

