import React from 'react';
import { motion } from 'framer-motion';
import { Flag, Leaf, Flame, Star, ChefHat } from 'lucide-react';

export const MenuLegend: React.FC = () => {
  const legendItems = [
    {
      icon: <Flag className="w-3 h-3 text-white" />,
      bgColor: 'bg-green-500',
      title: 'Vegetarian',
    },
    {
      icon: <Flag className="w-3 h-3 text-white" />,
      bgColor: 'bg-red-500',
      title: 'Non-Veg',
    },
    {
      icon: <Leaf className="w-3 h-3 text-white" />,
      bgColor: 'bg-green-600',
      title: 'Plant-Based',
    },
    {
      icon: <Flame className="w-3 h-3 text-white" />,
      bgColor: 'bg-red-600',
      title: 'Spicy',
    },
    {
      icon: <Star className="w-3 h-3 fill-current" />,
      bgColor: 'bg-orange-500',
      title: 'Popular',
    },
    {
      icon: <ChefHat className="w-3 h-3" />,
      bgColor: 'bg-yellow-500',
      title: "Chef's Choice",
    }
  ];

  return (
    <motion.div
      className="bg-background/80 backdrop-blur-sm border border-accent/20 rounded-2xl p-4 mb-8"
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <h3 className="text-sm font-semibold text-primary-foreground mb-3 text-center">Menu Icons Guide</h3>
      
      {/* Desktop Layout */}
      <div className="hidden sm:flex items-center justify-center gap-6 flex-wrap">
        {legendItems.map((item, index) => (
          <motion.div
            key={index}
            className="flex items-center gap-2"
            initial={{ x: -10, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
          >
            <div className={`w-6 h-6 rounded-full flex items-center justify-center ${item.bgColor}`}>
              {item.icon}
            </div>
            <span className="text-sm text-muted-foreground font-medium">{item.title}</span>
          </motion.div>
        ))}
      </div>

      {/* Mobile Layout */}
      <div className="sm:hidden grid grid-cols-2 gap-3">
        {legendItems.map((item, index) => (
          <motion.div
            key={index}
            className="flex items-center gap-2"
            initial={{ x: -10, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
          >
            <div className={`w-5 h-5 rounded-full flex items-center justify-center ${item.bgColor}`}>
              {React.cloneElement(item.icon, { className: 'w-2.5 h-2.5 text-white' })}
            </div>
            <span className="text-xs text-muted-foreground font-medium">{item.title}</span>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
};
