import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useRestaurant } from '@/contexts/RestaurantContext';
import { Header } from '@/components/Header';
import { MenuCard } from '@/components/MenuCard';
import { OrderTracker } from '@/components/customer/OrderTracker';
import { Button } from '@/components/ui/button';
import { useOrders } from '@/contexts/OrdersContext';
import { useCart } from '@/contexts/CartContext';
import {
  useGetCategoriesQuery,
  useGetMenuItemsQuery,
  useSearchMenuItemsQuery
} from '@/store/menuApi';
import {
  ChefHat,
  ArrowLeft,
  Search,
  Utensils,
  Leaf,
  Star,
  Flame,
} from 'lucide-react';

type DietFilter = 'all' | 'veg' | 'nonveg';

// Helper to transform API MenuItem to Context MenuItem
const transformMenuItem = (item: any) => ({
  ...item,
  popular: item.isPopular,
  new: item.isNewItem,
  chefRecommended: item.isChefsChoice,
  portionSize: item.weight,
  preparationTime: item.approxTime,
  dietaryInfo: {
    vegetarian: item.isVeg || false,
    vegan: false,
    glutenFree: false,
    dairyFree: false,
    spicy: false
  },
  images: item.images?.map((img: any) => typeof img === 'string' ? img : img.imageUrl) || ['/placeholder.svg']
});

const EmptyMenuState = ({ message = "No items found in this section." }: { message?: string }) => (
  <motion.div
    initial={{ opacity: 0, y: 15 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.6 }}
    className="flex flex-col items-center justify-center py-20 px-6 text-center max-w-md mx-auto"
  >
    <div className="w-20 h-20 bg-amber-50 rounded-full flex items-center justify-center mb-6 shadow-inner text-amber-600">
      <Utensils className="w-8 h-8 animate-pulse" />
    </div>
    <h3 className="text-xl font-bold text-gray-900 mb-2">No Delicacies Available</h3>
    <p className="text-sm text-gray-500 leading-relaxed">{message}</p>
  </motion.div>
);

const RestaurantMenu = () => {
  const navigate = useNavigate();
  const { restaurantId, tableId } = useParams<{ restaurantId?: string; tableId?: string }>();
  const { currentRestaurant, loadRestaurantBySlug } = useRestaurant();

  const [selectedCategory, setSelectedCategory] = useState<{ categoryId: number; categoryName: string } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [dietFilter, setDietFilter] = useState<DietFilter>('all');
  const [showPopularOnly, setShowPopularOnly] = useState(false);
  const [showNewOnly, setShowNewOnly] = useState(false);
  const [showChefRecommended, setShowChefRecommended] = useState(false);
  const [isSearchSticky, setIsSearchSticky] = useState(false);
  const searchBarRef = useRef<HTMLDivElement>(null);

  const { data: apiCategories = [] } = useGetCategoriesQuery();
  const { data: searchResults = [] } = useSearchMenuItemsQuery(
    searchQuery,
    { skip: searchQuery.trim().length < 2 }
  );

  const { cartItems, getTotalPrice } = useCart();
  const { syncCartWithAdmin } = useOrders();

  // Sticky search bar: show fixed bar only after the inline search scrolls out of view
  useEffect(() => {
    const el = searchBarRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => setIsSearchSticky(!entry.isIntersecting),
      { threshold: 0, rootMargin: '-64px 0px 0px 0px' } // account for fixed header height
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (restaurantId) {
      setIsLoading(true);
      setError(null);
      const restaurant = loadRestaurantBySlug(restaurantId);
      if (!restaurant) setError('Restaurant not found');
      setIsLoading(false);
    }
  }, [restaurantId, loadRestaurantBySlug]);

  useEffect(() => {
    if (tableId && cartItems.length > 0) {
      const orderItems = cartItems.map(item => ({
        itemId: item.item.itemId,
        foodName: item.item.foodName,
        price: item.item.price,
        quantity: item.quantity,
        notes: item.specialInstructions
      }));
      syncCartWithAdmin(tableId, tableId, orderItems, getTotalPrice());
    }
  }, [tableId, cartItems, getTotalPrice, syncCartWithAdmin]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error || !currentRestaurant) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 text-center">
        <div>
          <ChefHat className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Restaurant Not Found</h2>
          <Button onClick={() => navigate('/')} variant="outline" className="mt-4">
            <ArrowLeft className="w-4 h-4 mr-2" /> Back to Home
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 bg-background">
      <Header />

      {/* Conditionally sticky search bar — appears below header once you scroll past the inline search */}
      {isSearchSticky && (
        <motion.div
          initial={{ y: -40, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -40, opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed top-16 left-0 right-0 z-30 bg-background/95 backdrop-blur-xl border-b border-border/50 px-3 sm:px-4 md:px-6 py-2.5 shadow-sm"
        >
          <div className="container mx-auto">
            <div className="relative max-w-md mx-auto group">
              <input
                className="w-full bg-background hover:bg-muted/40 focus:bg-background border border-border focus:border-accent px-5 py-2.5 rounded-2xl text-sm font-medium tracking-wide transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-accent/20 placeholder:text-muted-foreground shadow-sm"
                placeholder="Search dishes..."
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); setSelectedCategory(null); }}
                autoFocus={false}
              />
              <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground transition-colors group-focus-within:text-accent pointer-events-none" />
            </div>
          </div>
        </motion.div>
      )}

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
              {currentRestaurant.name}
            </h1>
            <p className="body-text text-base sm:text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto px-2">
              {currentRestaurant.description || 'Discover our carefully crafted dishes, each made with the finest ingredients.'}
            </p>
          </motion.div>

          {/* Filters Section */}
          <motion.div
            className="mb-8 sm:mb-12 space-y-4"
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            {/* Quick Filters */}
            <div className="flex flex-wrap justify-center gap-2 px-2">
              <Button
                onClick={() => setShowPopularOnly(!showPopularOnly)}
                variant={showPopularOnly ? 'default' : 'outline'}
                size="sm"
                className="text-xs min-h-[36px] sm:min-h-[40px] rounded-full"
              >
                <Star className="w-3 h-3 mr-1" />
                Popular
              </Button>
              <Button
                onClick={() => setShowNewOnly(!showNewOnly)}
                variant={showNewOnly ? 'default' : 'outline'}
                size="sm"
                className="text-xs rounded-full"
              >
                New Items
              </Button>
              <Button
                onClick={() => setShowChefRecommended(!showChefRecommended)}
                variant={showChefRecommended ? 'default' : 'outline'}
                size="sm"
                className="text-xs rounded-full"
              >
                <ChefHat className="w-3 h-3 mr-1" />
                Chef's Choice
              </Button>
            </div>

            {/* Dietary Filters */}
            <div className="flex flex-wrap justify-center gap-2">
              <Button
                onClick={() => setDietFilter(dietFilter === 'veg' ? 'all' : 'veg')}
                variant={dietFilter === 'veg' ? 'default' : 'outline'}
                size="sm"
                className="text-xs rounded-full"
              >
                <Leaf className="w-3 h-3 mr-1" />
                Vegetarian
              </Button>
              <Button
                onClick={() => setDietFilter(dietFilter === 'nonveg' ? 'all' : 'nonveg')}
                variant={dietFilter === 'nonveg' ? 'default' : 'outline'}
                size="sm"
                className="text-xs rounded-full"
              >
                <Flame className="w-3 h-3 mr-1" />
                Non-Veg
              </Button>
            </div>

            {/* Category Pills */}
            <div className="w-full overflow-x-auto no-scrollbar pb-2 -mx-3 sm:mx-0">
              <div className="flex flex-nowrap sm:flex-wrap justify-start sm:justify-center gap-2 sm:gap-3 px-3 sm:px-0 min-w-max sm:min-w-0">
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 0.4 }}
                >
                  <Button
                    onClick={() => setSelectedCategory(null)}
                    variant={!selectedCategory ? 'default' : 'outline'}
                    size="sm"
                    className={`transition-all duration-300 text-xs sm:text-sm px-4 sm:px-6 py-2 sm:py-5 rounded-full ${
                      !selectedCategory
                        ? 'bg-accent text-accent-foreground shadow-xl shadow-accent/20 border-accent/50'
                        : 'bg-background/40 backdrop-blur-md border-accent/10 hover:border-accent/40'
                    }`}
                  >
                    All Items
                  </Button>
                </motion.div>
                {apiCategories.map((category, index) => (
                  <motion.div
                    key={category.categoryId}
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.4, delay: 0.1 * (index + 1) }}
                  >
                    <Button
                      onClick={() => setSelectedCategory(category)}
                      variant={selectedCategory?.categoryId === category.categoryId ? 'default' : 'outline'}
                      size="sm"
                      className={`transition-all duration-300 text-xs sm:text-sm px-4 sm:px-6 py-2 sm:py-5 rounded-full ${
                        selectedCategory?.categoryId === category.categoryId
                          ? 'bg-accent text-accent-foreground shadow-xl shadow-accent/20 border-accent/50'
                          : 'bg-background/40 backdrop-blur-md border-accent/10 hover:border-accent/40'
                      }`}
                    >
                      {category.categoryName}
                    </Button>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Inline Search Bar (triggers sticky mode when scrolled past) */}
            <div ref={searchBarRef} className="flex justify-center px-2">
              <div className="relative w-full max-w-md group">
                <input
                  className="w-full bg-background/60 hover:bg-background focus:bg-background border border-border focus:border-accent px-6 py-3 rounded-2xl text-sm font-medium tracking-wide transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-accent/20 placeholder:text-muted-foreground shadow-sm"
                  placeholder="Search dishes..."
                  value={searchQuery}
                  onChange={(e) => { setSearchQuery(e.target.value); setSelectedCategory(null); }}
                />
                <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground transition-colors group-focus-within:text-accent pointer-events-none" />
              </div>
            </div>

          </motion.div>

          {/* Menu Items */}
          <AnimatePresence mode="wait">
            {searchQuery.trim().length >= 2 ? (
              <motion.div
                key="search"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                {(() => {
                  const filtered = searchResults.filter(item =>
                    dietFilter === 'all' ? true :
                    dietFilter === 'veg' ? item.isVeg : !item.isVeg
                  );
                  return filtered.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6 md:gap-8">
                      {filtered.map((item, index) => (
                        <MenuCard key={item.itemId} item={transformMenuItem(item)} index={index} />
                      ))}
                    </div>
                  ) : (
                    <EmptyMenuState message="No search results matched your query." />
                  );
                })()}
              </motion.div>
            ) : !selectedCategory ? (
              <motion.div key="all" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                {apiCategories.map((category) => (
                  <CategorySection
                    key={category.categoryId}
                    category={category}
                    dietFilter={dietFilter}
                    showPopularOnly={showPopularOnly}
                    showNewOnly={showNewOnly}
                    showChefRecommended={showChefRecommended}
                    hideIfEmpty
                  />
                ))}
              </motion.div>
            ) : (
              <motion.div key="category" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <CategorySection
                  category={selectedCategory}
                  dietFilter={dietFilter}
                  showPopularOnly={showPopularOnly}
                  showNewOnly={showNewOnly}
                  showChefRecommended={showChefRecommended}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>

      {/* Live order tracker — only shown when table has an active order */}
      {tableId && <OrderTracker tableId={tableId} />}
    </div>
  );
};

const CategorySection = ({
  category,
  dietFilter = 'all',
  showPopularOnly = false,
  showNewOnly = false,
  showChefRecommended = false,
  hideIfEmpty = false,
}: {
  category: { categoryId: number; categoryName: string };
  dietFilter?: DietFilter;
  showPopularOnly?: boolean;
  showNewOnly?: boolean;
  showChefRecommended?: boolean;
  hideIfEmpty?: boolean;
}) => {
  const { data: menuItems = [], isLoading } = useGetMenuItemsQuery({
    categoryId: category.categoryId,
  });

  const filtered = menuItems.filter(item => {
    if (dietFilter === 'veg' && !item.isVeg) return false;
    if (dietFilter === 'nonveg' && item.isVeg) return false;
    if (showPopularOnly && !item.isPopular) return false;
    if (showNewOnly && !item.isNewItem) return false;
    if (showChefRecommended && !item.isChefsChoice) return false;
    return true;
  });

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (filtered.length === 0) {
    if (hideIfEmpty) return null;
    return <EmptyMenuState message={`We couldn't find any items under "${category.categoryName}" matching your preferences.`} />;
  }

  return (
    <section className="mb-12 sm:mb-16">
      <motion.div
        className="flex items-baseline gap-6 mb-6 sm:mb-8"
        initial={{ y: 30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-primary-foreground">
          {category.categoryName}
        </h2>
        <span className="text-muted-foreground text-xs font-medium uppercase tracking-widest">
          {filtered.length} Items
        </span>
        <div className="h-px flex-1 bg-border/60" />
      </motion.div>

      <motion.div
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6 md:gap-8"
        layout
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        {filtered.map((item, index) => (
          <MenuCard key={item.itemId} item={transformMenuItem(item)} index={index} />
        ))}
      </motion.div>
    </section>
  );
};

export default RestaurantMenu;
