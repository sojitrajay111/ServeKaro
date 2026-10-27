import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '@/components/Header.tsx';
import { MenuCard } from '@/components/MenuCard';
import { ItemDetailsModal } from '@/components/customer/ItemDetailsModal';
import { TrendingSection } from '@/components/customer/TrendingSection';
import { RestaurantReviewSection } from '@/components/customer/RestaurantReviewSection';
import { Button } from '@/components/ui/button';
import { useMenu, MenuItem, Category, SubCategory } from '@/contexts/MenuContext';
import { useRestaurant } from '@/contexts/RestaurantContext';
import { motion } from 'framer-motion';
import { ChefHat, ChevronLeft, ChevronRight, ArrowLeft, Utensils, Pizza, Fish, Beef, Coffee, IceCream, Wine, Salad, Soup, Cookie, Cake, Apple, Carrot, Milk, Beer } from 'lucide-react';
import heroImage from '@/assets/hero-pasta.jpg';

// Hero content data
const heroContent = [
  {
    id: 1,
    image: 'https://images.unsplash.com/photo-1551218808-94e220e084d2?w=1920&h=1080&fit=crop&crop=center',
    title: 'Bella Vista',
    subtitle: 'Authentic Italian Cuisine',
    description: 'Experience the artistry of traditional Italian cooking with modern culinary innovation. Each dish tells a story of passion, tradition, and exceptional ingredients.',
    icon: '🍝'
  },
  {
    id: 2,
    image: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=1920&h=1080&fit=crop&crop=center',
    title: 'Fresh Ingredients',
    subtitle: 'Farm to Table Excellence',
    description: 'We source the finest ingredients from local farms and Italian suppliers to bring you the most authentic flavors and freshest produce.',
    icon: '🥬'
  },
  {
    id: 3,
    image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=1920&h=1080&fit=crop&crop=center',
    title: 'Culinary Mastery',
    subtitle: 'Chef-Crafted Perfection',
    description: 'Our master chefs bring decades of experience and passion to every dish, creating unforgettable dining experiences that celebrate Italian heritage.',
    icon: '👨‍🍳'
  },
  {
    id: 4,
    image: 'https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=1920&h=1080&fit=crop&crop=center',
    title: 'Elegant Dining',
    subtitle: 'Sophisticated Atmosphere',
    description: 'Step into our beautifully designed restaurant where every detail is crafted to enhance your dining experience and create lasting memories.',
    icon: '✨'
  }
];

// Function to get appropriate icon for subcategory
const getSubCategoryIcon = (subCategoryName: string) => {
  const name = subCategoryName.toLowerCase();
  
  // Specific exact matches first
  if (name === 'gnocchi') return Utensils;
  if (name === 'risotto') return Soup;
  if (name === 'baked pasta') return Pizza;
  if (name === 'fresh pasta') return Pizza;
  if (name === 'cold starters') return Salad;
  if (name === 'hot appetizers') return Soup;
  if (name === 'sharing platters') return Utensils;
  if (name === 'soup & bread') return Soup;
  if (name === 'beef burgers') return Beef;
  if (name === 'chicken burgers') return Utensils;
  if (name === 'vegan burgers') return Carrot;
  if (name === 'gourmet sandwiches') return Utensils;
  if (name === 'steaks & grills') return Beef;
  if (name === 'seafood specials') return Fish;
  if (name === 'vegetarian mains') return Carrot;
  if (name === 'warm salads') return Salad;
  if (name === 'power bowls') return Salad;
  if (name === 'fries & chips') return Apple;
  if (name === 'vegetables') return Carrot;
  if (name === 'sauces & dips') return Utensils;
  if (name === 'classic desserts') return Cake;
  if (name === 'ice cream & sorbet') return IceCream;
  if (name === 'cakes & pastries') return Cake;
  if (name === 'seasonal specials') return Cookie;
  if (name === 'hot drinks') return Coffee;
  if (name === 'cold drinks') return Apple;
  if (name === 'wine & beer') return Wine;
  if (name === 'cocktails') return Beer;
  if (name === 'kids menu') return Cookie;
  if (name === 'breakfast classics') return Coffee;
  if (name === 'pancakes & waffles') return Coffee;
  if (name === 'brunch specials') return Coffee;
  
  // General keyword matches (less specific)
  if (name.includes('cold') || name.includes('fresh')) return Salad;
  if (name.includes('hot') && name.includes('appetizer')) return Soup;
  if (name.includes('sharing') || name.includes('platter')) return Utensils;
  if (name.includes('soup') || name.includes('bread')) return Soup;
  if (name.includes('beef') || name.includes('burger')) return Beef;
  if (name.includes('chicken') || name.includes('poultry')) return Utensils;
  if (name.includes('vegan') || name.includes('plant')) return Carrot;
  if (name.includes('sandwich') || name.includes('gourmet')) return Utensils;
  if (name.includes('steak') || name.includes('grill')) return Beef;
  if (name.includes('seafood') || name.includes('fish')) return Fish;
  if (name.includes('vegetarian') || name.includes('veggie')) return Carrot;
  if (name.includes('pasta')) return Pizza;
  if (name.includes('baked')) return Pizza;
  if (name.includes('warm') || name.includes('power')) return Salad;
  if (name.includes('poke') || name.includes('bowl')) return Salad;
  if (name.includes('fries') || name.includes('chips')) return Apple;
  if (name.includes('vegetable')) return Carrot;
  if (name.includes('sauce') || name.includes('dip')) return Utensils;
  if (name.includes('classic') || name.includes('dessert')) return Cake;
  if (name.includes('ice cream') || name.includes('sorbet')) return IceCream;
  if (name.includes('cake') || name.includes('pastry')) return Cake;
  if (name.includes('seasonal') || name.includes('special')) return Cookie;
  if (name.includes('hot') && name.includes('drink')) return Coffee;
  if (name.includes('cold') && name.includes('juice')) return Apple;
  if (name.includes('wine') || name.includes('beer')) return Wine;
  if (name.includes('cocktail') || name.includes('alcohol')) return Beer;
  if (name.includes('mini') || name.includes('kids')) return Cookie;
  if (name.includes('breakfast') || name.includes('pancake')) return Coffee;
  if (name.includes('waffle') || name.includes('healthy')) return Apple;
  if (name.includes('brunch')) return Coffee;
  
  return ChefHat; // Default icon
};

const Index = () => {
  const navigate = useNavigate();
  const { categories, subCategories, getSubCategoriesByCategory, getItemsBySubCategory, getItemsByCategory } = useMenu();
  const { currentRestaurant } = useRestaurant();
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [scrollPosition, setScrollPosition] = useState(0);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const sliderRef = useRef<HTMLDivElement>(null);
  const autoScrollInterval = useRef<NodeJS.Timeout | null>(null);
  
  // Hero carousel state
  const [currentHeroSlide, setCurrentHeroSlide] = useState(0);
  const heroInterval = useRef<NodeJS.Timeout | null>(null);
  
  // Interactive menu states
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [selectedSubCategory, setSelectedSubCategory] = useState<SubCategory | null>(null);
  const [categorySubCategories, setCategorySubCategories] = useState<SubCategory[]>([]);
  const [subCategoryItems, setSubCategoryItems] = useState<MenuItem[]>([]);

  const handleOpenDetails = (item: MenuItem) => {
    setSelectedItem(item);
  };



  // Interactive menu handlers
  const handleCategorySelect = (category: Category) => {
    setSelectedCategory(category);
    setSelectedSubCategory(null);
    setSubCategoryItems([]);
    const subCats = getSubCategoriesByCategory(category.categoryId);
    setCategorySubCategories(subCats);
  };

  const handleSubCategorySelect = (subCategory: SubCategory) => {
    setSelectedSubCategory(subCategory);
    const items = getItemsBySubCategory(subCategory.subCategoryId);
    setSubCategoryItems(items);
  };

  const handleBackToCategories = () => {
    setSelectedCategory(null);
    setSelectedSubCategory(null);
    setCategorySubCategories([]);
    setSubCategoryItems([]);
  };

  const handleBackToSubCategories = () => {
    setSelectedSubCategory(null);
    setSubCategoryItems([]);
  };

  const scrollSlider = (direction: 'left' | 'right') => {
    const container = sliderRef.current;
    if (container) {
      const cardWidth = 384 + 32; // w-96 (384px) + gap-8 (32px)
      const maxSlides = Math.max(0, categories.length - 1);
      
      let newSlide = currentSlide;
      if (direction === 'left') {
        newSlide = Math.max(0, currentSlide - 1);
      } else {
        newSlide = Math.min(maxSlides, currentSlide + 1);
      }
      
      const newPosition = newSlide * cardWidth;
      
      container.scrollTo({
        left: newPosition,
        behavior: 'smooth'
      });
      
      setCurrentSlide(newSlide);
      setScrollPosition(newPosition);
    }
  };

  // Handle scroll events to update current slide indicator
  useEffect(() => {
    const container = sliderRef.current;
    if (!container) return;

    const handleScroll = () => {
      const cardWidth = 384 + 32; // w-96 + gap-8
      const scrollLeft = container.scrollLeft;
      const newSlide = Math.round(scrollLeft / cardWidth);
      setCurrentSlide(newSlide);
      setScrollPosition(scrollLeft);
    };

    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, [categories.length]);

  const startAutoScroll = () => {
    if (autoScrollInterval.current) {
      clearInterval(autoScrollInterval.current);
    }
    
    autoScrollInterval.current = setInterval(() => {
      if (!isHovered) {
        const container = sliderRef.current;
        if (container) {
          const maxScroll = container.scrollWidth - container.clientWidth;
          const scrollAmount = 320; // Width of one card + gap
          const currentScroll = container.scrollLeft;
          const newPosition = currentScroll + scrollAmount;
          
          if (newPosition >= maxScroll) {
            // Reset to beginning for infinite loop with smooth transition
            container.scrollTo({
              left: 0,
              behavior: 'smooth'
            });
          } else {
            container.scrollTo({
              left: newPosition,
              behavior: 'smooth'
            });
          }
        }
      }
    }, 4000); // Auto scroll every 4 seconds for smoother experience
  };

  const stopAutoScroll = () => {
    if (autoScrollInterval.current) {
      clearInterval(autoScrollInterval.current);
      autoScrollInterval.current = null;
    }
  };

  // Auto scroll effect - always running, pauses on hover
  useEffect(() => {
    startAutoScroll();
    return () => {
      stopAutoScroll();
    };
  }, [isHovered]);

  // Mobile detection
  useEffect(() => {
    const checkMobile = () => {
      const isMobileDevice = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || 
                             (navigator.maxTouchPoints && navigator.maxTouchPoints > 2);
      setIsMobile(isMobileDevice);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Default select Main Courses on mount and preload its subcategories
  useEffect(() => {
    const mainCourses = categories.find(c => c.categoryName === 'Main Courses');
    if (mainCourses) {
      setSelectedCategory(mainCourses);
      const subCats = getSubCategoriesByCategory(mainCourses.categoryId);
      setCategorySubCategories(subCats);
    }
  }, []);

  // Hero carousel auto-advance
  useEffect(() => {
    heroInterval.current = setInterval(() => {
      setCurrentHeroSlide((prev) => (prev + 1) % heroContent.length);
    }, 5000); // Change slide every 5 seconds

    return () => {
      if (heroInterval.current) {
        clearInterval(heroInterval.current);
      }
    };
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopAutoScroll();
      if (heroInterval.current) {
        clearInterval(heroInterval.current);
      }
    };
  }, []);

  return (
    <div className="flex-1 bg-background">
      <Header />
      
      {/* Dynamic Hero Section */}
      <motion.section 
        className="relative min-h-screen flex items-center justify-center overflow-hidden px-3 sm:px-4 py-16 sm:py-20"
        style={{ paddingTop: 'calc(6rem + 60px)' }} // Account for header + promotional banner
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1 }}
      >
        {/* Background Images Carousel */}
        <div className="absolute inset-0 z-0">
          {heroContent.map((slide, index) => (
            <motion.div
              key={slide.id}
              className="absolute inset-0"
              initial={{ opacity: 0 }}
              animate={{ 
                opacity: index === currentHeroSlide ? 1 : 0,
                scale: index === currentHeroSlide ? 1 : 1.1
              }}
              transition={{ duration: 1.5, ease: "easeInOut" }}
            >
              <img 
                src={slide.image}
                alt={slide.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-br from-dark/80 via-dark/60 to-dark/40" />
            </motion.div>
          ))}
        </div>

        {/* Hero Content */}
        <motion.div 
          className="relative z-10 text-center text-white px-2 sm:px-4 max-w-4xl mx-auto"
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.3 }}
        >
          <motion.div
            className="mb-4 sm:mb-6"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.5 }}
          >
            <motion.div
              key={currentHeroSlide}
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.5 }}
              className="text-4xl sm:text-6xl md:text-7xl mb-3 sm:mb-4 animate-float drop-shadow-lg"
            >
              {heroContent[currentHeroSlide].icon}
            </motion.div>
          </motion.div>
          
          <motion.h1 
            className="display-text text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold mb-3 sm:mb-4 md:mb-6 lg:mb-8 tracking-tight"
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.4, ease: "easeOut" }}
          >
            <motion.span 
              key={currentHeroSlide}
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.6 }}
              className="block text-white drop-shadow-2xl" 
              style={{ textShadow: '2px 2px 4px rgba(0,0,0,0.8), 0 0 8px rgba(0,0,0,0.6)' }}
            >
              {currentHeroSlide === 0 ? (currentRestaurant?.name || heroContent[0].title) : heroContent[currentHeroSlide].title}
            </motion.span>
          </motion.h1>
          
          <motion.p 
            className="body-text text-lg sm:text-xl md:text-2xl lg:text-3xl xl:text-4xl mb-3 sm:mb-4 md:mb-6 font-light tracking-wide"
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.6 }}
            style={{ color: '#F4E4BC', textShadow: '1px 1px 3px rgba(0,0,0,0.8), 0 0 6px rgba(0,0,0,0.6)' }}
          >
            <motion.span
              key={currentHeroSlide}
              initial={{ y: 30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.6 }}
            >
              {heroContent[currentHeroSlide].subtitle}
            </motion.span>
          </motion.p>
          
          <motion.p 
            className="body-text text-sm sm:text-base md:text-lg lg:text-xl xl:text-2xl mb-8 sm:mb-12 md:mb-16 max-w-3xl mx-auto leading-relaxed font-light px-2"
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.8 }}
            style={{ color: '#FFFFFF', textShadow: '1px 1px 2px rgba(0,0,0,0.9), 0 0 4px rgba(0,0,0,0.7)' }}
          >
            <motion.span
              key={currentHeroSlide}
              initial={{ y: 30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.6 }}
            >
              {heroContent[currentHeroSlide].description}
            </motion.span>
          </motion.p>
          
        </motion.div>


        {/* Floating Elements */}
        <motion.div 
          className="absolute top-1/4 left-10 w-20 h-20 bg-accent/20 rounded-full blur-xl animate-float"
          animate={{ 
            y: [-20, 20, -20],
            x: [-10, 10, -10]
          }}
          transition={{ 
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
        
        <motion.div 
          className="absolute bottom-1/4 right-10 w-32 h-32 bg-primary/20 rounded-full blur-xl"
          animate={{ 
            y: [20, -20, 20],
            x: [10, -10, 10]
          }}
          transition={{ 
            duration: 10,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 2
          }}
        />
      </motion.section>


      {/* Interactive Menu Section */}
      <motion.section 
        className="py-16 sm:py-20 md:py-24 px-3 sm:px-4 md:px-6 bg-gradient-to-br from-background via-background/95 to-accent/5"
        initial={{ y: 100, opacity: 0 }}
        whileInView={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8 }}
        viewport={{ once: true }}
      >
        <div className="container mx-auto">
          {/* Header with navigation */}
          <motion.div 
            className="text-center mb-12 sm:mb-16"
            initial={{ y: 50, opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            viewport={{ once: true }}
          >
            {/* Breadcrumb Navigation */}
            {(selectedCategory || selectedSubCategory) && (
              <div className="flex items-center justify-center gap-2 mb-6 text-sm text-muted-foreground">
                <button 
                  onClick={handleBackToCategories}
                  className="flex items-center gap-1 hover:text-accent transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" />
                  All Categories
                </button>
                {selectedCategory && (
                  <>
                    <span>/</span>
                    <span className={selectedSubCategory ? 'cursor-pointer hover:text-accent transition-colors' : 'text-accent'} 
                          onClick={selectedSubCategory ? handleBackToSubCategories : undefined}>
                      {selectedCategory.categoryName}
                    </span>
                  </>
                )}
                {selectedSubCategory && (
                  <>
                    <span>/</span>
                    <span className="text-accent">{selectedSubCategory.subCategoryName}</span>
                  </>
                )}
              </div>
            )}

            <h2 className="display-text text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-primary-foreground mb-4 sm:mb-6">
              {!selectedCategory ? 'Choose Your Food Category' : 
               !selectedSubCategory ? `${selectedCategory.categoryName} Categories` : 
               `${selectedSubCategory.subCategoryName} Menu`}
            </h2>
            
            {/* Dynamic Step Suggestion */}
            {!selectedCategory && (
              <motion.div 
                className="bg-gradient-to-r from-accent/10 to-orange-100/50 border border-accent/30 rounded-xl p-4 mb-6 max-w-2xl mx-auto"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                <div className="flex items-center justify-center gap-3">
                  <div className="flex items-center justify-center w-8 h-8 bg-accent text-white rounded-full font-bold text-sm">
                    1
                  </div>
                  <p className="text-accent font-semibold">
                    👇 Select a food category below to see subcategories
                  </p>
                </div>
              </motion.div>
            )}

            {selectedCategory && !selectedSubCategory && (
              <motion.div 
                className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-300 rounded-xl p-4 mb-6 max-w-2xl mx-auto"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                <div className="flex items-center justify-center gap-3">
                  <div className="flex items-center justify-center w-8 h-8 bg-blue-500 text-white rounded-full font-bold text-sm">
                    2
                  </div>
                  <p className="text-blue-600 font-semibold">
                    👇 Choose a subcategory from {selectedCategory.categoryName} below
                  </p>
                </div>
              </motion.div>
            )}

            {selectedSubCategory && (
              <motion.div 
                className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-300 rounded-xl p-4 mb-6 max-w-2xl mx-auto"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                <div className="flex items-center justify-center gap-3">
                  <div className="flex items-center justify-center w-8 h-8 bg-green-500 text-white rounded-full font-bold text-sm">
                    3
                  </div>
                  <p className="text-green-600 font-semibold">
                    🍽️ Browse and order from {selectedSubCategory.subCategoryName} menu items
                  </p>
                </div>
              </motion.div>
            )}
            
          </motion.div>

          {/* Enhanced Categories Slider */}
          <div className="relative mb-12 overflow-hidden">
            {/* Enhanced Navigation Arrows */}
            <button
              onClick={() => scrollSlider('left')}
              className="hidden md:flex absolute left-2 top-1/2 -translate-y-1/2 z-20 w-14 h-14 bg-gradient-to-r from-accent to-orange-500 hover:from-accent/90 hover:to-orange-400 text-white rounded-full items-center justify-center shadow-xl transition-all duration-300 hover:scale-110 hover:shadow-2xl backdrop-blur-sm"
            >
              <ChevronLeft className="w-7 h-7" />
            </button>
            
            <button
              onClick={() => scrollSlider('right')}
              className="hidden md:flex absolute right-2 top-1/2 -translate-y-1/2 z-20 w-14 h-14 bg-gradient-to-r from-accent to-orange-500 hover:from-accent/90 hover:to-orange-400 text-white rounded-full items-center justify-center shadow-xl transition-all duration-300 hover:scale-110 hover:shadow-2xl backdrop-blur-sm"
            >
              <ChevronRight className="w-7 h-7" />
            </button>

            {/* Enhanced Category Cards Container */}
            <div 
              ref={sliderRef}
              className="flex gap-6 sm:gap-8 overflow-x-auto overflow-y-hidden pb-6 px-6 sm:px-12 md:px-20 -mx-3 sm:-mx-4 md:-mx-6 scrollbar-hide slider-container" 
              style={{ 
                scrollbarWidth: 'none', 
                msOverflowStyle: 'none',
                scrollBehavior: 'smooth',
                overflowY: 'hidden'
              }}
              onMouseEnter={() => setIsHovered(true)}
              onMouseLeave={() => setIsHovered(false)}
            >
              {categories.map((category, index) => (
                <motion.div
                  key={category.categoryId}
                  className={`relative w-80 sm:w-96 h-72 sm:h-80 rounded-3xl overflow-hidden group cursor-pointer flex-shrink-0 min-w-80 sm:min-w-96 transition-all duration-500 ${
                    selectedCategory?.categoryId === category.categoryId 
                      ? 'border-4 border-accent ring-4 ring-accent/40 shadow-2xl shadow-accent/40 scale-105' 
                      : !selectedCategory ? 'border-2 border-white/20 hover:border-accent/60 hover:shadow-2xl hover:shadow-accent/20 hover:scale-102' : 'border-2 border-gray-300/30'
                  }`}
                  initial={{ y: 0, opacity: 1, scale: 1 }}
                  whileInView={{ y: 0, opacity: 1, scale: 1 }}
                  transition={{ duration: 0, delay: 0 }}
                  viewport={{ once: true }}
                  whileHover={{ 
                    y: 0,
                    transition: { duration: 0.3, ease: "easeOut" }
                  }}
                  onClick={() => handleCategorySelect(category)}
                >
                  {/* Enhanced Background with Gradient Overlay */}
                  <div className="absolute inset-0">
                    <img 
                      src="https://images.unsplash.com/photo-1551218808-94e220e084d2?w=500&h=400&fit=crop&crop=center"
                      alt={category.categoryName}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-115"
                    />
                    <div className="absolute inset-0 bg-gradient-to-br from-black/20 via-black/40 to-black/80" />
                    <div className={`absolute inset-0 bg-gradient-to-t transition-opacity duration-500 ${
                      selectedCategory?.categoryId === category.categoryId 
                        ? 'from-accent/40 via-accent/20 to-transparent opacity-100' 
                        : 'from-accent/20 via-accent/10 to-transparent opacity-0 group-hover:opacity-100'
                    }`} />
                  </div>
                  
                  {/* Enhanced Content Layout */}
                  <div className="absolute inset-0 flex flex-col justify-between p-6 sm:p-8">
                    {/* Top Section - Status and Icon */}
                    <div className="flex items-start justify-between">
                      {/* Selection Status Badge */}
                      {selectedCategory?.categoryId === category.categoryId ? (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="bg-accent text-white px-4 py-2 rounded-full font-bold text-sm shadow-lg"
                        >
                          ✓ SELECTED
                        </motion.div>
                      ) : (
                        <motion.div
                          className="bg-white/20 backdrop-blur-sm text-white px-4 py-2 rounded-full font-medium text-sm opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                          whileHover={{ scale: 1.05 }}
                        >
                          👆 CLICK TO SELECT
                        </motion.div>
                      )}
                      
                      {/* Enhanced Icon */}
                      <div className={`w-16 h-16 rounded-2xl flex items-center justify-center backdrop-blur-sm transition-all duration-300 ${
                        selectedCategory?.categoryId === category.categoryId 
                          ? 'bg-accent/90 text-white shadow-lg' 
                          : 'bg-white/20 text-white group-hover:bg-accent/80 group-hover:scale-110'
                      }`}>
                        <ChefHat className="w-8 h-8" />
                      </div>
                    </div>

                    {/* Bottom Section - Category Name and Description */}
                    <div className="transform translate-y-4 group-hover:translate-y-0 transition-transform duration-500">
                      <motion.h3 
                        className={`display-text text-2xl sm:text-3xl font-bold mb-3 transition-all duration-300 ${
                          selectedCategory?.categoryId === category.categoryId 
                            ? 'text-white drop-shadow-lg' 
                            : 'text-white group-hover:text-accent drop-shadow-lg'
                        }`}
                        whileHover={{ scale: 1.02 }}
                      >
                        {category.categoryName}
                      </motion.h3>
                      
                      <p className="body-text text-white/90 text-base font-medium opacity-0 group-hover:opacity-100 transition-all duration-500 delay-100">
                        Discover amazing dishes in this category
                      </p>
                      
                      {/* Decorative Elements */}
                      <div className="flex items-center gap-2 mt-4 opacity-0 group-hover:opacity-100 transition-all duration-500 delay-200">
                        <div className="w-12 h-1 bg-accent rounded-full" />
                        <div className="w-2 h-2 bg-accent rounded-full animate-pulse" />
                        <div className="w-2 h-2 bg-accent rounded-full animate-pulse delay-100" />
                        <div className="w-2 h-2 bg-accent rounded-full animate-pulse delay-200" />
                      </div>
                    </div>
                  </div>

                  {/* Enhanced Selection Indicator */}
                  {selectedCategory?.categoryId === category.categoryId && (
                    <>
                      <motion.div
                        className="absolute top-4 left-4 w-6 h-6 bg-accent rounded-full shadow-lg"
                        animate={{ scale: [1, 1.2, 1] }}
                        transition={{ duration: 2, repeat: Infinity }}
                      />
                      <motion.div
                        className="absolute -top-2 -right-2 w-8 h-8 border-4 border-accent rounded-full"
                        animate={{ rotate: 360 }}
                        transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                      />
                    </>
                  )}
                  
                  {/* Hover Glow Effect */}
                  <div className="absolute -inset-1 bg-gradient-to-r from-accent via-orange-500 to-accent rounded-3xl opacity-0 group-hover:opacity-20 transition-opacity duration-500 -z-10 blur-xl" />
                </motion.div>
              ))}
            </div>

          </div>

          {/* Subcategories Section - Shows when category is selected */}
          {selectedCategory && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="mb-12"
            >
              <div className="text-center mb-8">
                <h3 className="text-2xl sm:text-3xl font-bold text-primary-foreground mb-2">
                  {selectedCategory.categoryName} Subcategories
                </h3>
                <p className="text-muted-foreground">
                  Choose a subcategory to view specific dishes
                </p>
              </div>
              
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 sm:gap-6">
                {categorySubCategories.map((subCategory, index) => (
                  <motion.div
                    key={subCategory.subCategoryId}
                    className={`relative h-32 sm:h-36 rounded-lg overflow-hidden group cursor-pointer bg-gradient-to-br from-accent/10 to-primary/10 border transition-colors duration-300 ${
                      selectedSubCategory?.subCategoryId === subCategory.subCategoryId
                        ? 'border-accent/60 ring-2 ring-accent ring-opacity-40'
                        : 'border-accent/20 hover:border-accent/40'
                    }`}
                    initial={{ y: 30, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ duration: 0.4, delay: index * 0.1 }}
                    whileHover={{ 
                      scale: 1.02,
                      y: -4,
                      transition: { duration: 0.3 }
                    }}
                    onClick={() => handleSubCategorySelect(subCategory)}
                  >
                    <div className="absolute inset-0 flex flex-col justify-center items-center p-3 sm:p-4 text-center">
                      <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center mb-2 sm:mb-3 transition-colors duration-300 ${
                        selectedSubCategory?.subCategoryId === subCategory.subCategoryId
                          ? 'bg-accent/40'
                          : 'bg-accent/20 group-hover:bg-accent/30'
                      }`}>
                        {(() => {
                          const IconComponent = getSubCategoryIcon(subCategory.subCategoryName);
                          return <IconComponent className="w-5 h-5 sm:w-6 sm:h-6 text-accent" />;
                        })()}
                      </div>
                      <h3 className={`text-sm sm:text-base font-bold mb-1 transition-colors duration-300 ${
                        selectedSubCategory?.subCategoryId === subCategory.subCategoryId
                          ? 'text-accent'
                          : 'text-primary-foreground group-hover:text-accent'
                      }`}>
                        {subCategory.subCategoryName}
                      </h3>
                      <p className="text-xs text-muted-foreground group-hover:text-primary-foreground transition-colors duration-300">
                        {selectedSubCategory?.subCategoryId === subCategory.subCategoryId ? 'Selected' : 'View dishes'}
                      </p>
                    </div>

                    {/* Selected Indicator */}
                    {selectedSubCategory?.subCategoryId === subCategory.subCategoryId && (
                      <div className="absolute top-2 left-2 w-4 h-4 bg-accent rounded-full animate-pulse" />
                    )}
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Menu Items Section - Shows when subcategory is selected */}
          {selectedSubCategory && subCategoryItems.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="mb-12"
            >
              <div className="text-center mb-8">
                <h3 className="text-2xl sm:text-3xl font-bold text-primary-foreground mb-2">
                  {selectedSubCategory.subCategoryName} Items
                </h3>
                <p className="text-muted-foreground">
                  Explore our delicious dishes in this category
                </p>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 sm:gap-8">
                {subCategoryItems.map((item, index) => (
                  <MenuCard
                    key={item.itemId}
                    item={item}
                    onClick={handleOpenDetails}
                    index={index}
                  />
                ))}
              </div>
            </motion.div>
          )}

          {/* Default Items Section - When category selected but no subcategory, show all items in category */}
          {selectedCategory && !selectedSubCategory && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="mb-12"
            >
              <div className="text-center mb-8">
                <h3 className="text-2xl sm:text-3xl font-bold text-primary-foreground mb-2">
                  {selectedCategory.categoryName} Items
                </h3>
                <p className="text-muted-foreground">
                  Showing all dishes in {selectedCategory.categoryName}
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 sm:gap-8">
                {getItemsByCategory(selectedCategory.categoryId).map((item, index) => (
                  <MenuCard
                    key={item.itemId}
                    item={item}
                    onClick={handleOpenDetails}
                    index={index}
                  />
                ))}
              </div>
            </motion.div>
          )}

          {/* No items message */}
          {selectedSubCategory && subCategoryItems.length === 0 && (
            <div className="text-center py-12">
              <ChefHat className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-primary-foreground mb-2">No items available</h3>
              <p className="text-muted-foreground">This subcategory doesn't have any items yet.</p>
            </div>
          )}

        </div>
      </motion.section>


      {/* Customer Insights Section */}
      <motion.section 
        className="relative py-16 sm:py-20 lg:py-24"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
        viewport={{ once: true }}
      >
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <TrendingSection />
        </div>
      </motion.section>

      {/* Restaurant Reviews Section */}
      <RestaurantReviewSection />

      {/* Item Details Modal */}
      <ItemDetailsModal
        isOpen={!!selectedItem}
        onClose={() => setSelectedItem(null)}
        item={selectedItem}
      />

    </div>
  );
};

export default Index;
