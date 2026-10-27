import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { X, Search, Settings, Home, Info, Menu as MenuIcon, Clock, ChefHat, Instagram, Facebook, Twitter, ShoppingBag } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useSearch } from '@/contexts/SearchContext';
import { useMenu } from '@/contexts/MenuContext';
import { useRestaurant } from '@/contexts/RestaurantContext';
import { useOrders } from '@/contexts/OrdersContext';


interface MobileSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export const MobileSidebar: React.FC<MobileSidebarProps> = ({ isOpen, onClose }) => {
  const { searchQuery, setSearchQuery, setIsSearchActive } = useSearch();
  const { categories, setSelectedCategory } = useMenu();
  const { customerOrders } = useOrders();
  const currentYear = new Date().getFullYear();
  const { currentRestaurant } = useRestaurant();
  const restaurantName = currentRestaurant?.name ?? '';
  const restaurantDescription = currentRestaurant?.description ?? 'Authentic Italian cuisine with modern culinary innovation.';

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);
    setIsSearchActive(query.length > 0);
  };

  const handleLinkClick = () => {
    onClose();
  };

  const handleCategoryClick = (category: any) => {
    setSelectedCategory(category);
    onClose();
  };

  // Check if restaurant is currently open (simple check)
  const isCurrentlyOpen = () => {
    const now = new Date();
    const hour = now.getHours();
    return hour >= 11 && hour < 23; // Open 11 AM - 11 PM
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2
      }
    }
  };

  const itemVariants = {
    hidden: { x: -20, opacity: 0 },
    visible: { x: 0, opacity: 1 }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60]"
            onClick={onClose}
          />

          {/* Sidebar */}
          <motion.div
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed top-0 left-0 h-full w-[320px] sm:w-[380px] max-w-[90vw] !bg-background/95 backdrop-blur-xl border-r border-accent/20 z-[70] shadow-2xl flex flex-col opacity-100"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-accent/20">
              <h2 className="display-text text-xl font-bold text-primary-foreground">
                Menu
              </h2>
              <button
                onClick={onClose}
                className="p-2 rounded-lg hover:bg-accent/10 transition-colors"
                aria-label="Close menu"
              >
                <X className="w-5 h-5 text-primary-foreground" />
              </button>
            </div>

            {/* Search */}
            <div className="p-4 border-b border-accent/20">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4 z-10 pointer-events-none" />
                <Input
                  type="text"
                  placeholder="Search menu items..."
                  value={searchQuery}
                  onChange={handleSearchChange}
                  className="pl-10 bg-background border-border focus:border-primary"
                />
              </div>
            </div>

            {/* Navigation Links */}
            <nav className="flex-1 overflow-y-auto p-4 custom-scrollbar">
              <motion.div 
                className="space-y-2"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
              >

                <motion.div variants={itemVariants}>
                  <Link
                    to="/about"
                    onClick={handleLinkClick}
                    className="flex items-center gap-3 p-3 rounded-xl text-muted-foreground hover:text-accent hover:bg-accent/10 transition-all duration-300 border border-transparent hover:border-accent/20 group"
                  >
                    <div className="w-10 h-10 rounded-lg bg-accent/5 flex items-center justify-center group-hover:bg-accent/20 transition-colors">
                      <Info className="w-5 h-5 text-accent" />
                    </div>
                    <span className="body-text font-bold text-lg">About Us</span>
                  </Link>
                </motion.div>

                <motion.div variants={itemVariants}>
                  <Link
                    to="/my-orders"
                    onClick={handleLinkClick}
                    className="flex items-center gap-3 p-3 rounded-xl text-muted-foreground hover:text-accent hover:bg-accent/10 transition-all duration-300 border border-transparent hover:border-accent/20 group"
                  >
                    <div className="w-10 h-10 rounded-lg bg-accent/5 flex items-center justify-center group-hover:bg-accent/20 transition-colors relative">
                      <ShoppingBag className="w-5 h-5 text-accent" />
                      <AnimatePresence>
                        {customerOrders.length > 0 && (
                          <motion.span
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            exit={{ scale: 0 }}
                            className="absolute -top-1 -right-1 w-4 h-4 bg-orange-600 text-white text-[8px] font-black flex items-center justify-center rounded-full shadow-lg border border-white"
                          >
                            {customerOrders.length}
                          </motion.span>
                        )}
                      </AnimatePresence>
                    </div>
                    <span className="body-text font-bold text-lg">My Orders</span>
                  </Link>
                </motion.div>

                {/* Categories Section */}
                <motion.div variants={itemVariants} className="pt-6 mt-4 border-t border-accent/10">
                  <h3 className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] mb-4 px-2">
                    Menu Categories
                  </h3>
                  
                  {categories.length > 0 ? (
                    <div className="grid grid-cols-2 gap-2">
                      {categories.map((category) => (
                        <button
                          key={category.categoryId}
                          onClick={() => handleCategoryClick(category)}
                          className="flex flex-col items-center justify-center p-3 rounded-xl bg-accent/5 hover:bg-accent/10 border border-accent/10 hover:border-accent/30 transition-all duration-300 group"
                        >
                          <span className="body-text text-xs font-bold text-muted-foreground group-hover:text-accent text-center">
                            {category.categoryName}
                          </span>
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="px-2 py-4 rounded-xl bg-accent/5 border border-dashed border-accent/20 text-center">
                      <p className="text-[10px] text-muted-foreground italic">
                        No categories found in database
                      </p>
                    </div>
                  )}
                </motion.div>
              </motion.div>
            </nav>

            {/* Important Details Section */}
            <div className="p-4 border-t border-accent/20 space-y-4 overflow-y-auto">
              {/* Restaurant Info */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <ChefHat className="w-4 h-4 text-accent" />
                  <h3 className="display-text text-sm font-bold text-primary-foreground">
                    {restaurantName}
                  </h3>
                </div>
                <p className="body-text text-xs text-muted-foreground leading-relaxed">
                  {restaurantDescription}
                </p>
              </div>

              {/* Opening Hours */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-accent flex-shrink-0" />
                    <h4 className="body-text text-xs font-semibold text-primary-foreground">
                      Opening Hours
                    </h4>
                  </div>
                  <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    isCurrentlyOpen() ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'
                  }`}>
                    <div className={`w-1.5 h-1.5 rounded-full ${isCurrentlyOpen() ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
                    {isCurrentlyOpen() ? 'OPEN NOW' : 'CLOSED'}
                  </div>
                </div>
                <div className="space-y-1 pl-6">
                  {[
                    { days: 'Monday - Thursday', hours: '11:00 AM - 10:00 PM' },
                    { days: 'Friday - Saturday', hours: '11:00 AM - 11:00 PM' },
                    { days: 'Sunday', hours: '12:00 PM - 9:00 PM' }
                  ].map((slot) => (
                    <p key={slot.days} className="body-text text-xs text-muted-foreground">
                      <span className="font-medium">{slot.days}:</span> {slot.hours}
                    </p>
                  ))}
                </div>
              </div>

              {/* Social Media */}
              <div className="space-y-2">
                <h4 className="body-text text-xs font-semibold text-primary-foreground">
                  Follow Us
                </h4>
                <div className="flex gap-2">
                  <a 
                    href="#" 
                    className="w-8 h-8 rounded-full border border-accent/30 hover:bg-accent hover:text-accent-foreground flex items-center justify-center transition-colors duration-200"
                    aria-label="Instagram"
                  >
                    <Instagram className="w-4 h-4" />
                  </a>
                  <a 
                    href="#" 
                    className="w-8 h-8 rounded-full border border-accent/30 hover:bg-accent hover:text-accent-foreground flex items-center justify-center transition-colors duration-200"
                    aria-label="Facebook"
                  >
                    <Facebook className="w-4 h-4" />
                  </a>
                  <a 
                    href="#" 
                    className="w-8 h-8 rounded-full border border-accent/30 hover:bg-accent hover:text-accent-foreground flex items-center justify-center transition-colors duration-200"
                    aria-label="Twitter"
                  >
                    <Twitter className="w-4 h-4" />
                  </a>
                </div>
              </div>

              {/* Copyright */}
              <div className="pt-2 border-t border-accent/20">
                <p className="body-text text-xs text-muted-foreground text-center">
                  © {currentYear} {restaurantName}
                </p>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

