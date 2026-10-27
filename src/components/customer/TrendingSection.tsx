import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, Star, Clock, ChefHat, Flame, Eye, Users, ThumbsUp, Award, Sparkles } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useMenu } from '@/contexts/MenuContext';

export const TrendingSection: React.FC = () => {
  const { menuItems } = useMenu();
  const [activeTab, setActiveTab] = useState<'trending' | 'popular' | 'new' | 'chef'>('trending');
  
  // Get trending items (popular + new items)
  const trendingItems = menuItems
    .filter(item => !item.soldOut && (item.popular || item.new || item.chefRecommended))
    .slice(0, 8);

  const popularItems = menuItems
    .filter(item => !item.soldOut && item.popular)
    .slice(0, 6);

  const newItems = menuItems
    .filter(item => !item.soldOut && item.new)
    .slice(0, 6);

  const chefRecommended = menuItems
    .filter(item => !item.soldOut && item.chefRecommended)
    .slice(0, 6);

  

  const EnhancedTrendingCard = ({ item, index, type }: { item: any; index: number; type: 'trending' | 'popular' | 'new' | 'chef' }) => (
    <motion.div
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      className="bg-gradient-to-br from-white to-gray-50 rounded-lg sm:rounded-xl p-3 sm:p-4 shadow-sm border border-accent/10 hover:shadow-lg hover:border-accent/30 transition-all duration-300 group"
    >
      <div className="flex items-start gap-2 sm:gap-3 md:gap-4">
        <div className="relative w-12 h-12 sm:w-16 sm:h-16 bg-gray-200 rounded-lg sm:rounded-xl overflow-hidden flex-shrink-0">
          <img
            src={(item.images[0] as any)?.imageUrl ?? item.images[0] ?? '/placeholder.svg'}
            alt={item.foodName}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
          />
          {/* Trending indicator */}
          <div className="absolute -top-1 -right-1 w-6 h-6 bg-gradient-to-r from-orange-400 to-red-400 rounded-full flex items-center justify-center">
            <Sparkles className="w-3 h-3 text-white" />
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between mb-2">
            <h4 className="font-semibold text-sm sm:text-base text-primary-foreground group-hover:text-accent transition-colors truncate">{item.foodName}</h4>
            <div className="text-right">
              <span className="text-base sm:text-lg font-bold text-accent">${item.price.toFixed(2)}</span>
              {item.originalPrice && (
                <span className="text-xs text-gray-500 line-through ml-1">${item.originalPrice.toFixed(2)}</span>
              )}
            </div>
          </div>
          <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{item.description}</p>
          
          {/* Enhanced badges and stats */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 flex-wrap">
              {type === 'trending' && (
                <Badge className="bg-gradient-to-r from-orange-500 to-red-500 text-white text-xs">
                  <TrendingUp className="w-3 h-3 mr-1" />
                  Trending
                </Badge>
              )}
              {type === 'popular' && (
                <Badge className="bg-gradient-to-r from-red-500 to-pink-500 text-white text-xs">
                  <Flame className="w-3 h-3 mr-1" />
                  Popular
                </Badge>
              )}
              {type === 'new' && (
                <Badge className="bg-gradient-to-r from-purple-500 to-blue-500 text-white text-xs">
                  <Sparkles className="w-3 h-3 mr-1" />
                  New
                </Badge>
              )}
              {type === 'chef' && (
                <Badge className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white text-xs">
                  <ChefHat className="w-3 h-3 mr-1" />
                  Chef's Pick
                </Badge>
              )}
            </div>
            
            {/* Quick stats */}
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              {item.preparationTime && (
                <span className="flex items-center">
                  <Clock className="w-3 h-3 mr-1" />
                  {item.preparationTime}
                </span>
              )}
              <span className="flex items-center">
                <Eye className="w-3 h-3 mr-1" />
                {Math.floor(Math.random() * 100) + 20}
              </span>
              <span className="flex items-center">
                <ThumbsUp className="w-3 h-3 mr-1" />
                {Math.floor(Math.random() * 50) + 10}
              </span>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );

  const getCurrentItems = () => {
    switch (activeTab) {
      case 'trending': return trendingItems;
      case 'popular': return popularItems;
      case 'new': return newItems;
      case 'chef': return chefRecommended;
      default: return trendingItems;
    }
  };

  return (
    <div className="space-y-8">

      {/* Interactive Tab Navigation */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.2 }}
      >
        <Card className="bg-gradient-to-r from-background to-accent/5">
          <CardHeader className="pb-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <CardTitle className="text-2xl font-bold text-primary-foreground mb-2">
                  What's Hot Right Now 🔥
                </CardTitle>
                <p className="text-muted-foreground">
                  Real-time favorites from our community of food lovers
                </p>
              </div>
              
              {/* Tab Navigation */}
              <div className="flex gap-2 bg-background/50 p-1 rounded-lg backdrop-blur-sm">
                {[
                  { key: 'trending', label: 'Trending', icon: TrendingUp },
                  { key: 'popular', label: 'Popular', icon: Flame },
                  { key: 'new', label: 'New', icon: Sparkles },
                  { key: 'chef', label: "Chef's", icon: ChefHat }
                ].map((tab) => (
                  <Button
                    key={tab.key}
                    variant={activeTab === tab.key ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setActiveTab(tab.key as any)}
                    className={`flex items-center gap-2 transition-all duration-300 ${
                      activeTab === tab.key 
                        ? activeTab === 'trending' ? 'bg-orange-500 hover:bg-orange-600 text-white shadow-lg border-transparent'
                          : activeTab === 'popular' ? 'bg-red-500 hover:bg-red-600 text-white shadow-lg border-transparent'
                          : activeTab === 'new' ? 'bg-purple-500 hover:bg-purple-600 text-white shadow-lg border-transparent'
                          : 'bg-yellow-500 hover:bg-yellow-600 text-white shadow-lg border-transparent'
                        : 'hover:bg-accent/10'
                    }`}
                  >
                    <tab.icon className="w-4 h-4" />
                    <span className="hidden sm:inline">{tab.label}</span>
                  </Button>
                ))}
              </div>
            </div>
          </CardHeader>
          
          <CardContent>
            {/* Active Tab Content */}
            <motion.div 
              key={activeTab}
              initial={{ x: 20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ duration: 0.4 }}
              className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4"
            >
              {getCurrentItems().map((item, index) => (
                <EnhancedTrendingCard 
                  key={`${activeTab}-${item.itemId}`} 
                  item={item} 
                  index={index} 
                  type={activeTab} 
                />
              ))}
            </motion.div>
            
            {getCurrentItems().length === 0 && (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Star className="w-8 h-8 text-gray-400" />
                </div>
                <p className="text-gray-500">No items available in this category yet.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Enhanced Today's Special */}
      <motion.div
        initial={{ y: 30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.4 }}
        className="relative overflow-hidden"
      >
        <Card className="bg-gradient-to-r from-amber-50 via-orange-50 to-red-50 border-2 border-amber-200">
          <CardContent className="p-8">
            <div className="text-center space-y-4">
              {/* Animated sparkles */}
              <div className="relative inline-block">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                  className="absolute -top-2 -left-2"
                >
                  <Sparkles className="h-6 w-6 text-amber-400" />
                </motion.div>
                <motion.div
                  animate={{ rotate: -360 }}
                  transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                  className="absolute -top-2 -right-2"
                >
                  <Sparkles className="h-6 w-6 text-orange-400" />
                </motion.div>
                <h3 className="text-2xl sm:text-3xl font-bold text-amber-800 px-8">
                  ✨ Today's Special ✨
                </h3>
              </div>
              
              <p className="text-xl sm:text-2xl font-semibold text-orange-700">
                Pan-Seared Halibut with Lemon Herb Butter
              </p>
              <p className="text-gray-700 max-w-2xl mx-auto">
                Fresh Atlantic halibut with seasonal vegetables and our signature herb butter sauce. 
                A masterpiece that combines ocean freshness with garden-to-table perfection.
              </p>
              
              <div className="flex flex-wrap items-center justify-center gap-4">
                <Badge className="bg-green-500 text-white px-4 py-2 text-sm">
                  🕒 Limited Time Only
                </Badge>
                <div className="text-3xl font-bold text-orange-700">
                  $28.00
                  <span className="text-lg text-gray-500 line-through ml-2">$35.00</span>
                </div>
                <Badge className="bg-red-500 text-white px-4 py-2 text-sm">
                  👨‍🍳 Chef's Special
                </Badge>
              </div>

              <Button 
                size="lg"
                className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white px-8 py-3 rounded-full shadow-lg hover:shadow-xl transition-all duration-300"
              >
                Order Now - Save $7!
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};
