import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Input } from '@/components/ui/input';
import { Search, Menu as MenuIcon, X } from 'lucide-react';
import { useSearch } from '@/contexts/SearchContext';
import { useIsMobile } from '@/hooks/use-mobile';
import { Link } from 'react-router-dom';
import { MobileSidebar } from '@/components/MobileSidebar';
import { useRestaurant } from '@/contexts/RestaurantContext';
import { useCart } from '@/contexts/CartContext';

export const Header: React.FC = () => {
  const { searchQuery, setSearchQuery, setIsSearchActive } = useSearch();
  const { setIsCartOpen } = useCart();
  const isMobile = useIsMobile();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { currentRestaurant } = useRestaurant();
  const restaurantName = currentRestaurant?.name ?? '';
  const restaurantCuisine = currentRestaurant?.cuisine ? `Authentic ${currentRestaurant.cuisine} Cuisine` : 'Authentic Italian Cuisine';

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);
    setIsSearchActive(query.length > 0);
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  return (
    <>
    <motion.header 
      className="fixed top-0 left-0 right-0 z-50 bg-background/70 backdrop-blur-xl border-b border-accent/30"
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
    >
      <div className="container mx-auto px-3 sm:px-4 md:px-6 py-2 sm:py-3 lg:py-4">
        <div className="flex items-center justify-between gap-2 sm:gap-4">
          {/* Restaurant Name */}
          <motion.div 
            className="flex-1 min-w-0"
            initial={{ x: -50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            <h1 className="display-text text-lg sm:text-xl md:text-2xl lg:text-3xl xl:text-4xl text-foreground truncate">
              {restaurantName}
            </h1>
            <p className="body-text text-xs sm:text-sm text-muted-foreground hidden sm:block">
              {restaurantCuisine}
            </p>
          </motion.div>

          {/* Search Bar - Hidden on very small screens, shown on larger mobile */}
          <motion.div 
            className={`${isMobile ? 'hidden sm:flex' : 'flex'} flex-1 max-w-xs sm:max-w-md mx-1 sm:mx-2 lg:mx-4`}
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <div className="relative w-full">
              <Search className="absolute left-2 sm:left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-3 h-3 sm:w-4 sm:h-4" />
              <Input
                type="text"
                placeholder={isMobile ? "Search..." : "Search menu items..."}
                value={searchQuery}
                onChange={handleSearchChange}
                className="pl-7 sm:pl-8 lg:pl-10 bg-background/70 border-accent/30 focus:border-accent/50 text-xs sm:text-sm lg:text-base h-9 sm:h-10 lg:h-11 shadow-sm"
              />
            </div>
          </motion.div>

          {/* Mobile Menu Button */}
          {isMobile && (
            <motion.button
              onClick={() => {
                toggleMobileMenu();
                if (!isMobileMenuOpen) setIsCartOpen(false); // Close cart when opening menu
              }}
              className="p-2 sm:p-2.5 rounded-lg border border-accent/30 bg-background/70 hover:bg-accent/10 transition-colors relative z-50"
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.3 }}
            >
              {isMobileMenuOpen ? (
                <X className="w-5 h-5 sm:w-6 sm:h-6 text-foreground" />
              ) : (
                <MenuIcon className="w-5 h-5 sm:w-6 sm:h-6 text-foreground" />
              )}
            </motion.button>
          )}

          {/* Desktop Navigation & Logo */}
          <div className="flex items-center gap-2 sm:gap-4 flex-shrink-0">
            {/* Desktop Navigation */}
            {!isMobile && (
              <div className="flex items-center gap-2 sm:gap-4">
                <Link 
                  to="/about" 
                  className="text-xs sm:text-sm text-muted-foreground hover:text-accent transition-colors px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg hover:bg-accent/10"
                >
                  About
                </Link>
              </div>
            )}
            
            
            {/* <motion.div 
              className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 rounded-full bg-accent flex items-center justify-center animate-glow"
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.3 }}
            >
              <span className="display-text text-accent-foreground font-bold text-xs sm:text-sm md:text-lg">
                BV
              </span>
            </motion.div> */}
          </div>
        </div>

      </div>

    </motion.header>
    {/* Mobile Sidebar - Moved outside the header container to avoid inherited transparency */}
    <MobileSidebar isOpen={isMobile && isMobileMenuOpen} onClose={() => setIsMobileMenuOpen(false)} />
    </>
  );
};