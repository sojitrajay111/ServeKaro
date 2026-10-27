import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { useRestaurant } from './RestaurantContext';

import { useGetCategoriesQuery, useGetMenuItemsQuery } from '@/store/menuApi';

export interface Category {
  categoryId: number;
  categoryName: string;
}

export interface SubCategory {
  subCategoryId: number;
  categoryId: number;
  subCategoryName: string;
}

export interface MenuItem {
  itemId: number;
  categoryId: number;
  foodName: string;
  description: string;
  detailedDescription?: string;
  ingredients?: string[];
  allergens?: string[];
  dietaryInfo?: {
    vegetarian: boolean;
    vegan: boolean;
    glutenFree: boolean;
    dairyFree: boolean;
    spicy: boolean;
  };
  nutritionalInfo?: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  };
  portionSize?: string;
  preparationTime?: string;
  price: number;
  originalPrice?: number; // For showing discounts
  createdAt: string;
  isDinner: boolean;
  soldOut: boolean;
  popular?: boolean;
  new?: boolean;
  chefRecommended?: boolean;
  images: string[];
  tags?: string[];
}

export interface MenuImage {
  imageId: number;
  itemId: number;
  imageUrl: string;
}

interface MenuContextType {
  menuItems: MenuItem[];
  categories: Category[];
  subCategories: SubCategory[];
  selectedCategory: Category | null;
  setSelectedCategory: (category: Category | null) => void;
  getFeaturedItems: () => MenuItem[];
  getItemsByCategory: (categoryId: number) => MenuItem[];
  getSubCategoriesByCategory: (categoryId: number) => SubCategory[];
  getItemsBySubCategory: (subCategoryId: number) => MenuItem[];
  searchItems: (query: string) => MenuItem[];
  getDinnerItems: () => MenuItem[];
  getLunchItems: () => MenuItem[];
  
  // ✅ NEW: Restaurant-specific functions
  getRestaurantMenuData: () => any;
  getRestaurantCategories: () => any[];
  getItemsByRestaurantCategory: (categoryId: string) => any[];
  
  // ✅ NEW: CRUD Functions
  addMenuItem: (item: Partial<MenuItem>) => void;
  updateMenuItem: (itemId: number, updates: Partial<MenuItem>) => void;
  deleteMenuItem: (itemId: number) => void;
  toggleItemVisibility: (itemId: number) => void;
  addCategory: (category: Partial<Category>) => void;
  isLoading: boolean;
}

const MenuContext = createContext<MenuContextType | undefined>(undefined);

export const useMenu = () => {
  const context = useContext(MenuContext);
  if (!context) {
    throw new Error('useMenu must be used within a MenuProvider');
  }
  return context;
};

export const MenuProvider = ({ children }: { children: ReactNode }) => {
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const { currentRestaurant } = useRestaurant();
  
  // ✅ NEW: State management for menu items - now restaurant-specific
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [currentMenuData, setCurrentMenuData] = useState<any>(null);
  const [currentCategories, setCurrentCategories] = useState<any[]>([]);
  const [currentFeaturedItems, setCurrentFeaturedItems] = useState<any[]>([]);
  
  // ✅ Use RTK Query to fetch categories
  const { data: apiCategoriesData = [] } = useGetCategoriesQuery();
  
  // ✅ NEW: Fetch all menu items from API
  const { data: apiMenuItemsData = [], isLoading: isLoadingApiItems } = useGetMenuItemsQuery({});

  // Update menu data when restaurant changes
  useEffect(() => {
    if (currentRestaurant) {
      // With mock data removed, we'll rely on the API.
      // Until API is fully integrated, we set empty arrays.
      setCurrentMenuData(null);
      setCurrentCategories([]);
      setCurrentFeaturedItems([]);
    }
  }, [currentRestaurant]);

  // ✅ NEW: Sync API items with local state
  useEffect(() => {
    // Only sync if API has finished loading
    if (!isLoadingApiItems) {
      if (apiMenuItemsData.length > 0) {
        const transformedItems: MenuItem[] = apiMenuItemsData.map(item => ({
          itemId: item.itemId,
          subCategoryId: item.subCategoryId || 1,
          categoryId: item.categoryId, // Ensure categoryId is preserved
          foodName: item.foodName,
          description: item.description,
          price: item.price,
          createdAt: item.createdAt,
          isDinner: item.isDinner,
          soldOut: item.soldOut,
          popular: item.isPopular,
          new: item.isNewItem,
          chefRecommended: item.isChefsChoice,
          images: item.images?.map((img: any) => typeof img === 'object' && img !== null ? img.imageUrl : img) || ['/placeholder.svg'],
          portionSize: item.weight,
          preparationTime: item.approxTime,
          dietaryInfo: {
            vegetarian: item.isVeg || false,
            vegan: false,
            glutenFree: false,
            dairyFree: false,
            spicy: false
          }
        }));
        setMenuItems(transformedItems);
        console.log('MenuContext: Synced real menu items from API');
      } else if (apiMenuItemsData.length === 0 && !isLoadingApiItems) {
        // Clear items if API is empty to reflect real database state
        setMenuItems([]);
        console.log('MenuContext: API returned empty menu items');
      }
    }
  }, [apiMenuItemsData, isLoadingApiItems]);

  // Log categories for debugging
  useEffect(() => {
    if (!isLoadingApiItems) {
      console.log('MenuContext: Categories loaded:', apiCategoriesData.length);
    }
  }, [apiCategoriesData, isLoadingApiItems]);

  // Map RTK Query categories to our Category format - handling potential naming differences from API
  const apiCategories: Category[] = apiCategoriesData.map((cat: any) => ({
    categoryId: cat.categoryId ?? cat.id ?? cat.Id,
    categoryName: cat.categoryName ?? cat.name ?? cat.Name,
  })).filter(cat => cat.categoryId != null && cat.categoryName); // Use != null to allow ID 0

  // Load menu items from localStorage on mount
  useEffect(() => {
    const savedItems = localStorage.getItem('menuItems');
    if (savedItems && !currentRestaurant) {
      try {
        const parsedItems = JSON.parse(savedItems);
        if (Array.isArray(parsedItems) && parsedItems.length > 0) {
          setMenuItems(parsedItems);
          console.log('MenuContext: Loaded menu items from localStorage');
        }
      } catch (error) {
        console.error('MenuContext: Error parsing saved menu items:', error);
      }
    }
  }, [currentRestaurant]);

  const getFeaturedItems = () => {
    if (currentFeaturedItems && currentFeaturedItems.length > 0) {
      return currentFeaturedItems;
    }
    return menuItems.filter(item => item.popular || item.chefRecommended);
  };

  const getRestaurantMenuData = () => {
    return currentMenuData;
  };

  const getRestaurantCategories = () => {
    return currentCategories;
  };

  const getItemsByRestaurantCategory = (categoryId: string) => {
    if (!currentMenuData) return [];
    return currentMenuData[categoryId] || [];
  };

  const getItemsByCategory = (categoryId: number) => {
    return menuItems.filter(item => item.categoryId === categoryId);
  };

  const searchItems = (query: string) => {
    if (!query) return menuItems;
    
    const lowerQuery = query.toLowerCase();
    return menuItems.filter(item => 
      item.foodName.toLowerCase().includes(lowerQuery) ||
      item.description.toLowerCase().includes(lowerQuery)
    );
  };

  const getDinnerItems = () => {
    return menuItems.filter(item => item.isDinner);
  };

  const getLunchItems = () => {
    return menuItems.filter(item => !item.isDinner);
  };

  // ✅ NEW: CRUD Functions Implementation
  const addMenuItem = (item: Partial<MenuItem>) => {
    const newItem: MenuItem = {
      itemId: Date.now(), // Generate unique ID
      categoryId: item.categoryId || 1,
      foodName: item.foodName || '',
      description: item.description || '',
      detailedDescription: item.detailedDescription,
      ingredients: item.ingredients,
      allergens: item.allergens,
      dietaryInfo: item.dietaryInfo || {
        vegetarian: false,
        vegan: false,
        glutenFree: false,
        dairyFree: false,
        spicy: false
      },
      nutritionalInfo: item.nutritionalInfo || {
        calories: 0,
        protein: 0,
        carbs: 0,
        fat: 0
      },
      portionSize: item.portionSize,
      preparationTime: item.preparationTime,
      price: item.price || 0,
      originalPrice: item.originalPrice,
      popular: item.popular || false,
      new: item.new !== undefined ? item.new : true,
      chefRecommended: item.chefRecommended || false,
      tags: item.tags,
      createdAt: new Date().toISOString(),
      isDinner: item.isDinner !== undefined ? item.isDinner : true,
      soldOut: item.soldOut || false,
      images: item.images || ['/placeholder.svg']
    };

    setMenuItems(prev => [...prev, newItem]);
    
    // Save to localStorage for persistence
    const updatedItems = [...menuItems, newItem];
    localStorage.setItem('menuItems', JSON.stringify(updatedItems));
    
    console.log('✅ MenuItem added successfully:', newItem);
  };

  const updateMenuItem = (itemId: number, updates: Partial<MenuItem>) => {
    setMenuItems(prev => prev.map(item => 
      item.itemId === itemId 
        ? { ...item, ...updates }
        : item
    ));
    
    // Save to localStorage
    const updatedItems = menuItems.map(item => 
      item.itemId === itemId 
        ? { ...item, ...updates }
        : item
    );
    localStorage.setItem('menuItems', JSON.stringify(updatedItems));
    
    console.log('✅ MenuItem updated successfully:', { itemId, updates });
  };

  const deleteMenuItem = (itemId: number) => {
    setMenuItems(prev => prev.filter(item => item.itemId !== itemId));
    
    // Save to localStorage
    const updatedItems = menuItems.filter(item => item.itemId !== itemId);
    localStorage.setItem('menuItems', JSON.stringify(updatedItems));
    
    console.log('✅ MenuItem deleted successfully:', itemId);
  };

  const toggleItemVisibility = (itemId: number) => {
    setMenuItems(prev => prev.map(item => 
      item.itemId === itemId 
        ? { ...item, soldOut: !item.soldOut }
        : item
    ));
    
    // Save to localStorage
    const updatedItems = menuItems.map(item => 
      item.itemId === itemId 
        ? { ...item, soldOut: !item.soldOut }
        : item
    );
    localStorage.setItem('menuItems', JSON.stringify(updatedItems));
    
    console.log('✅ MenuItem visibility toggled:', itemId);
  };

  const addCategory = (category: Partial<Category>) => {
    const newCategory: Category = {
      categoryId: Date.now(),
      categoryName: category.categoryName || '',
    };
    // In a real app, you'd update state here
    console.log('✅ Category added:', newCategory);
  };

  // ✅ Updated: Use API categories by default, only use mock categories if in a restaurant demo context
  const displayCategories = currentRestaurant
    ? (currentCategories.length > 0 ? currentCategories : apiCategories) 
    : apiCategories;

  // Stubbed subcategory definitions matching Category dynamically
  const subCategories: SubCategory[] = displayCategories.map(cat => ({
    subCategoryId: cat.categoryId,
    categoryId: cat.categoryId,
    subCategoryName: "All " + cat.categoryName
  }));

  const getSubCategoriesByCategory = (categoryId: number): SubCategory[] => {
    const cat = displayCategories.find(c => c.categoryId === categoryId);
    if (!cat) return [];
    return [{
      subCategoryId: cat.categoryId,
      categoryId: cat.categoryId,
      subCategoryName: "All " + cat.categoryName
    }];
  };

  const getItemsBySubCategory = (subCategoryId: number): MenuItem[] => {
    return getItemsByCategory(subCategoryId);
  };

  return (
    <MenuContext.Provider value={{
      menuItems,
      categories: displayCategories,
      subCategories,
      selectedCategory,
      setSelectedCategory,
      getFeaturedItems,
      getItemsByCategory,
      getSubCategoriesByCategory,
      getItemsBySubCategory,
      searchItems,
      getDinnerItems,
      getLunchItems,
      getRestaurantMenuData,
      getRestaurantCategories,
      getItemsByRestaurantCategory,
      addMenuItem,
      updateMenuItem,
      deleteMenuItem,
      toggleItemVisibility,
      addCategory,
      isLoading: isLoadingApiItems
    }}>
      {children}
    </MenuContext.Provider>
  );
};