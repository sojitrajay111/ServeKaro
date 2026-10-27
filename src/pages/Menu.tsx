import React, { useState, useMemo } from 'react';
import { Header } from '@/components/Header.tsx';
import { MenuCard } from '@/components/MenuCard';
import { ItemDetailsModal } from '@/components/customer/ItemDetailsModal';
import { MenuCardSkeleton } from '@/components/SkeletonLoaders';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useMenu, MenuItem, Category } from '@/contexts/MenuContext';
import { useSearch } from '@/contexts/SearchContext';
import { motion } from 'framer-motion';
import { Filter, Star, Leaf, Clock, ChefHat } from 'lucide-react';

const Menu: React.FC = () => {
  const { 
    categories, 
    getItemsByCategory, 
    searchItems 
  } = useMenu();
  const { searchQuery, isSearchActive, setSearchQuery, setIsSearchActive } = useSearch();
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  // Enhanced filtering options
  const [dietaryFilters, setDietaryFilters] = useState({
    vegetarian: false,
    vegan: false,
    glutenFree: false,
    spicy: false
  });
  const [showPopularOnly, setShowPopularOnly] = useState(false);
  const [showNewOnly, setShowNewOnly] = useState(false);
  const [showChefRecommended, setShowChefRecommended] = useState(false);

  // Enhanced filtering with Peter Pane-inspired options
  const filteredItems = useMemo(() => {
    setIsLoading(true);
    
    let items;
    
    // Base filtering by category/search
    if (isSearchActive && searchQuery) {
      items = searchItems(searchQuery);
    } else if (selectedCategory) {
      items = getItemsByCategory(selectedCategory.categoryId);
    } else {
      items = searchItems('');
    }
    
    // Apply dietary filters
    if (dietaryFilters.vegetarian) {
      items = items.filter(item => item.dietaryInfo?.vegetarian);
    }
    if (dietaryFilters.vegan) {
      items = items.filter(item => item.dietaryInfo?.vegan);
    }
    if (dietaryFilters.glutenFree) {
      items = items.filter(item => item.dietaryInfo?.glutenFree);
    }
    if (dietaryFilters.spicy) {
      items = items.filter(item => item.dietaryInfo?.spicy);
    }
    
    // Apply special filters
    if (showPopularOnly) {
      items = items.filter(item => item.popular);
    }
    if (showNewOnly) {
      items = items.filter(item => item.new);
    }
    if (showChefRecommended) {
      items = items.filter(item => item.chefRecommended);
    }
    
    // Simulate loading delay for better UX
    setTimeout(() => setIsLoading(false), 300);
    return items;
  }, [
    selectedCategory, 
    searchQuery, 
    isSearchActive, 
    dietaryFilters, 
    showPopularOnly, 
    showNewOnly, 
    showChefRecommended,
    searchItems, 
    getItemsByCategory
  ]);

  const handleOpenDetails = (item: MenuItem) => {
    setSelectedItem(item);
  };

  const handleCategoryClick = (category: Category) => {
    if (selectedCategory?.categoryId === category.categoryId) {
      setSelectedCategory(null);
    } else {
      setSelectedCategory(category);
    }
  };

  return (
    <div className="flex-1 bg-background">
      <Header />
      
      <main className="pt-20 sm:pt-24 pb-8 sm:pb-12">
        <div className="container mx-auto px-3 sm:px-4 md:px-6">
          {/* Page Header */}
          <motion.div 
            className="text-center mb-8 sm:mb-12"
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.6 }}
          >
            <h1 className="display-text text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-primary-foreground mb-3 sm:mb-4">
              Our Menu
            </h1>
            <p className="body-text text-base sm:text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto px-2">
              Discover our carefully crafted dishes, each made with the finest ingredients 
              and traditional Italian techniques.
            </p>
          </motion.div>

          {/* Enhanced Filters Section */}
          <motion.div 
            className="mb-8 sm:mb-12 space-y-6"
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            {/* Quick Filters */}
            <div className="flex flex-wrap justify-center gap-2 mb-4 px-2">
              <Button
                onClick={() => setShowPopularOnly(!showPopularOnly)}
                variant={showPopularOnly ? "default" : "outline"}
                size="sm"
                className="text-xs min-h-[36px] sm:min-h-[40px]"
              >
                <Star className="w-3 h-3 mr-1" />
                Popular
              </Button>
              <Button
                onClick={() => setShowNewOnly(!showNewOnly)}
                variant={showNewOnly ? "default" : "outline"}
                size="sm"
                className="text-xs"
              >
                New Items
              </Button>
              <Button
                onClick={() => setShowChefRecommended(!showChefRecommended)}
                variant={showChefRecommended ? "default" : "outline"}
                size="sm"
                className="text-xs"
              >
                <ChefHat className="w-3 h-3 mr-1" />
                Chef's Choice
              </Button>
            </div>

            {/* Dietary Filters */}
            <div className="flex flex-wrap justify-center gap-2 mb-4">
              <Button
                onClick={() => setDietaryFilters(prev => ({ ...prev, vegetarian: !prev.vegetarian }))}
                variant={dietaryFilters.vegetarian ? "default" : "outline"}
                size="sm"
                className="text-xs"
              >
                <Leaf className="w-3 h-3 mr-1" />
                Vegetarian
              </Button>
              <Button
                onClick={() => setDietaryFilters(prev => ({ ...prev, vegan: !prev.vegan }))}
                variant={dietaryFilters.vegan ? "default" : "outline"}
                size="sm"
                className="text-xs"
              >
                <Leaf className="w-3 h-3 mr-1" />
                Vegan
              </Button>
              <Button
                onClick={() => setDietaryFilters(prev => ({ ...prev, glutenFree: !prev.glutenFree }))}
                variant={dietaryFilters.glutenFree ? "default" : "outline"}
                size="sm"
                className="text-xs"
              >
                Gluten-Free
              </Button>
              <Button
                onClick={() => setDietaryFilters(prev => ({ ...prev, spicy: !prev.spicy }))}
                variant={dietaryFilters.spicy ? "default" : "outline"}
                size="sm"
                className="text-xs"
              >
                🌶️ Spicy
              </Button>
            </div>
              {/* Main Categories - Horizontal Scroll on Mobile */}
              <div className="w-full overflow-x-auto no-scrollbar pb-2 mb-4 sm:mb-8 -mx-3 sm:mx-0">
                <div className="flex flex-nowrap sm:flex-wrap justify-start sm:justify-center gap-2 sm:gap-3 px-3 sm:px-0 min-w-max sm:min-w-0">
                  {categories.map((category, index) => (
                    <motion.div
                      key={category.categoryId}
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ duration: 0.4, delay: 0.1 * index }}
                    >
                      <Button
                        onClick={() => handleCategoryClick(category)}
                        variant={selectedCategory?.categoryId === category.categoryId ? "default" : "outline"}
                        size="sm"
                        className={`
                          transition-all duration-300 text-xs sm:text-sm px-4 sm:px-6 py-2 sm:py-5 rounded-full
                          ${selectedCategory?.categoryId === category.categoryId 
                            ? 'bg-accent text-accent-foreground shadow-xl shadow-accent/20 animate-glow border-accent/50' 
                            : 'bg-background/40 backdrop-blur-md border-accent/10 hover:border-accent/40'
                          }
                        `}
                      >
                        {category.categoryName}
                      </Button>
                    </motion.div>
                  ))}
                </div>
              </div>

            </motion.div>


          {/* Menu Items Grid */}
          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6 md:gap-8">
              {[...Array(8)].map((_, i) => (
                <MenuCardSkeleton key={i} />
              ))}
            </div>
          ) : (
            <motion.div 
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6 md:gap-8"
              layout
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
            >
              {filteredItems.map((item, index) => (
                <MenuCard
                  key={item.itemId}
                  item={item}
                  onClick={handleOpenDetails}
                  index={index}
                />
              ))}
            </motion.div>
          )}

          {/* No Results */}
          {filteredItems.length === 0 && (
            <motion.div 
              className="text-center py-16"
              initial={{ y: 30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.6 }}
            >
              <h3 className="display-text text-2xl font-semibold text-primary-foreground mb-4">
                No items found
              </h3>
              <p className="body-text text-muted-foreground mb-6">
                Try adjusting your search or browse our categories above.
              </p>
              <Button
                onClick={() => {
                  setSelectedCategory(null);
                  setSearchQuery('');
                  setIsSearchActive(false);
                }}
                variant="outline"
                className="glass-card"
              >
                View All Items
              </Button>
            </motion.div>
          )}
        </div>
      </main>

      {/* Item Details Modal */}
      <ItemDetailsModal
        isOpen={!!selectedItem}
        onClose={() => setSelectedItem(null)}
        item={selectedItem}
      />
    </div>
  );
};

export default Menu;