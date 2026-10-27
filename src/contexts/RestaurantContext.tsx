import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { useParams } from 'react-router-dom';
import { settingsApi, tableApi } from '@/services/apiService';
import { useAuth } from '@/contexts/AuthContext';

// Restaurant Data Types
export interface Restaurant {
  id: string;
  slug: string;
  name: string;
  description: string;
  logo: string;
  coverImage: string;
  address: string;
  phone: string;
  email: string;
  website: string;
  cuisine: string;
  priceRange: 'budget' | 'moderate' | 'expensive' | 'luxury';
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  settings: RestaurantSettings;
  theme: RestaurantTheme;
}

export interface RestaurantSettings {
  allowOnlineOrdering: boolean;
  requireCustomerInfo: boolean;
  showNutritionalInfo: boolean;
  enableReviews: boolean;
  enableWaitlist: boolean;
  orderPreparationTime: number; // in minutes
  minimumOrderAmount: number;
  deliveryFee: number;
  serviceFee: number;
  taxRate: number;
  currency: string;
  timezone: string;
  language: string;
}

export interface RestaurantTheme {
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  backgroundColor: string;
  textColor: string;
  fontFamily: string;
  logoPosition: 'left' | 'center' | 'right';
  menuLayout: 'grid' | 'list' | 'card';
  showPrices: boolean;
  showDescriptions: boolean;
  showImages: boolean;
  enableAnimations: boolean;
}

export interface Table {
  id: string;
  restaurantId: string;
  tableNumber: string;
  tableName?: string;
  qrCode: string;
  qrCodeUrl: string;
  isActive: boolean;
  capacity: number;
  location: string; // e.g., "Main Dining", "Patio", "Bar"
  tableStatus?: string;
  activeOrderId?: number | null;
  createdAt: string;
}

// Context Type
interface RestaurantContextType {
  // Current Restaurant
  currentRestaurant: Restaurant | null;
  setCurrentRestaurant: (restaurant: Restaurant | null) => void;
  loadRestaurantBySlug: (slug: string) => Restaurant | null;
  
  // Restaurant Management
  restaurants: Restaurant[];
  getRestaurantById: (id: string) => Restaurant | null;
  getRestaurantBySlug: (slug: string) => Restaurant | null;
  addRestaurant: (restaurant: Partial<Restaurant>) => Restaurant;
  updateRestaurant: (id: string, updates: Partial<Restaurant>) => void;
  deleteRestaurant: (id: string) => void;
  
  // Table Management
  tables: Table[];
  getTablesByRestaurant: (restaurantId: string) => Table[];
  addTable: (table: Partial<Table>) => void;
  updateTable: (id: string, updates: Partial<Table>) => void;
  deleteTable: (id: string) => void;
  
  // Refresh from backend
  refreshSettings: () => Promise<void>;

  // Loading States
  isLoading: boolean;
  error: string | null;
}

const RestaurantContext = createContext<RestaurantContextType | undefined>(undefined);

export const useRestaurant = () => {
  const context = useContext(RestaurantContext);
  if (context === undefined) {
    throw new Error('useRestaurant must be used within a RestaurantProvider');
  }
  return context;
};

interface RestaurantProviderProps {
  children: ReactNode;
}

export const RestaurantProvider = ({ children }: RestaurantProviderProps) => {
  // State
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [tables, setTables] = useState<Table[]>([]);
  const [currentRestaurant, setCurrentRestaurant] = useState<Restaurant | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Helper to add mock/fallback restaurant locally if settings call fails
  const addRestaurantLocally = (restaurantData: Partial<Restaurant>): Restaurant => {
    const newRestaurant: Restaurant = {
      id: restaurantData.id || `restaurant-${Date.now()}`,
      slug: restaurantData.slug || restaurantData.name?.toLowerCase().replace(/\s+/g, '-') || `restaurant-${Date.now()}`,
      name: restaurantData.name || 'New Restaurant',
      description: restaurantData.description || '',
      logo: restaurantData.logo || '',
      coverImage: restaurantData.coverImage || '',
      address: restaurantData.address || '',
      phone: restaurantData.phone || '',
      email: restaurantData.email || '',
      website: restaurantData.website || '',
      cuisine: restaurantData.cuisine || 'International',
      priceRange: restaurantData.priceRange || 'moderate',
      isActive: restaurantData.isActive ?? true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      settings: restaurantData.settings || {
        allowOnlineOrdering: true,
        requireCustomerInfo: false,
        showNutritionalInfo: false,
        enableReviews: true,
        enableWaitlist: false,
        orderPreparationTime: 20,
        minimumOrderAmount: 10.00,
        deliveryFee: 0,
        serviceFee: 0,
        taxRate: 8.75,
        currency: 'USD',
        timezone: 'America/New_York',
        language: 'en'
      },
      theme: restaurantData.theme || {
        primaryColor: '#3B82F6',
        secondaryColor: '#F59E0B',
        accentColor: '#EF4444',
        backgroundColor: '#FFFFFF',
        textColor: '#1F2937',
        fontFamily: 'Inter',
        logoPosition: 'left',
        menuLayout: 'card',
        showPrices: true,
        showDescriptions: true,
        showImages: true,
        enableAnimations: true
      }
    };
    return newRestaurant;
  };

  const { isAuthenticated } = useAuth();

  // Load Settings from Backend on mount
  useEffect(() => {
    const initData = async () => {
      setIsLoading(true);
      try {
        const settings = await settingsApi.get();
        let loadedRestaurant: Restaurant;
        
        if (settings) {
          loadedRestaurant = {
            id: 'restaurant-001',
            slug: settings.slug || 'bella-vista',
            name: settings.restaurantName || 'Bella Vista',
            description: 'Welcome to our digital menu.',
            logo: settings.logoUrl || '',
            coverImage: '',
            address: settings.address || '',
            phone: settings.phone || '',
            email: settings.email || '',
            website: '',
            cuisine: 'International',
            priceRange: 'moderate',
            isActive: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            settings: {
              allowOnlineOrdering: true,
              requireCustomerInfo: false,
              showNutritionalInfo: settings.showNutritionalInfo ?? false,
              enableReviews: true,
              enableWaitlist: false,
              orderPreparationTime: 20,
              minimumOrderAmount: 0,
              deliveryFee: 0,
              serviceFee: 0,
              taxRate: 8.75,
              currency: settings.currency || 'USD',
              timezone: 'UTC',
              language: 'en'
            },
            theme: {
              primaryColor: settings.primaryColor || '#3B82F6',
              secondaryColor: '#F59E0B',
              accentColor: settings.accentColor || '#EF4444',
              backgroundColor: '#FFFFFF',
              textColor: '#1F2937',
              fontFamily: 'Inter',
              logoPosition: 'left',
              menuLayout: 'card',
              showPrices: true,
              showDescriptions: true,
              showImages: true,
              enableAnimations: true
            }
          };
          setRestaurants([loadedRestaurant]);
          setCurrentRestaurant(loadedRestaurant);
        } else {
          // Fallback if settings response is null/empty
          const fallback = addRestaurantLocally({
            name: 'Bella Vista',
            description: 'Authentic Italian Cuisine',
            cuisine: 'Italian'
          });
          setRestaurants([fallback]);
          setCurrentRestaurant(fallback);
        }
      } catch (err) {
        console.error('Failed to load initial settings data from backend API:', err);
        // Fallback to local default
        const fallback = addRestaurantLocally({
          name: 'Bella Vista',
          description: 'Authentic Italian Cuisine',
          cuisine: 'Italian'
        });
        setRestaurants([fallback]);
        setCurrentRestaurant(fallback);
      } finally {
        setIsLoading(false);
      }
    };

    initData();
  }, []);

  // Load Tables when authenticated
  useEffect(() => {
    const loadTables = async () => {
      if (!isAuthenticated) return;
      try {
        const backendTables = await tableApi.getTables();
        if (backendTables) {
          const mappedTables: Table[] = backendTables.map((bt: any) => ({
            id: bt.tableId.toString(),
            restaurantId: 'restaurant-001',
            tableNumber: bt.tableNumber,
            tableName: bt.tableName,
            qrCode: bt.qrUrl || '',
            qrCodeUrl: bt.qrUrl || '',
            isActive: bt.isActive,
            capacity: bt.capacity || 4,
            location: bt.location || 'Main Dining',
            tableStatus: bt.tableStatus,
            activeOrderId: bt.activeOrderId,
            createdAt: bt.createdAt || new Date().toISOString()
          }));
          setTables(mappedTables);
        }
      } catch (err) {
        console.error('Failed to load tables from backend API:', err);
      }
    };

    loadTables();
  }, [isAuthenticated]);

  // Restaurant Management Functions
  const getRestaurantById = useCallback((id: string): Restaurant | null => {
    return restaurants.find(restaurant => restaurant.id === id) || null;
  }, [restaurants]);

  const getRestaurantBySlug = useCallback((slug: string): Restaurant | null => {
    return restaurants.find(restaurant => restaurant.slug === slug) || null;
  }, [restaurants]);

  // Function to load restaurant by slug
  const loadRestaurantBySlug = useCallback((slug: string) => {
    const restaurant = getRestaurantBySlug(slug);
    if (restaurant) {
      setCurrentRestaurant(restaurant);
      setError(null);
      return restaurant;
    } else {
      setError(`Restaurant with slug "${slug}" not found`);
      setCurrentRestaurant(null);
      return null;
    }
  }, [getRestaurantBySlug]);

  const addRestaurant = (restaurantData: Partial<Restaurant>) => {
    const newRestaurant = addRestaurantLocally(restaurantData);
    setRestaurants(prev => [...prev, newRestaurant]);
    return newRestaurant;
  };

  const updateRestaurant = async (id: string, updates: Partial<Restaurant>) => {
    setIsLoading(true);
    try {
      // Get the existing settings first
      const currentSettings = await settingsApi.get();
      const newSettings = {
        ...currentSettings,
        restaurantName: updates.name ?? currentSettings?.restaurantName,
        slug: updates.slug ?? currentSettings?.slug,
        address: updates.address ?? currentSettings?.address,
        phone: updates.phone ?? currentSettings?.phone,
        email: updates.email ?? currentSettings?.email,
        logoUrl: updates.logo ?? currentSettings?.logoUrl,
        primaryColor: updates.theme?.primaryColor ?? currentSettings?.primaryColor,
        accentColor: updates.theme?.accentColor ?? currentSettings?.accentColor,
        showNutritionalInfo: updates.settings?.showNutritionalInfo ?? currentSettings?.showNutritionalInfo,
      };

      await settingsApi.update(newSettings);

      // Update state locally
      setRestaurants(prev => 
        prev.map(restaurant => 
          restaurant.id === id 
            ? { 
                ...restaurant, 
                ...updates, 
                settings: { ...(restaurant.settings), ...(updates.settings || {}) },
                theme: { ...(restaurant.theme), ...(updates.theme || {}) },
                updatedAt: new Date().toISOString() 
              }
            : restaurant
        )
      );
      
      if (currentRestaurant?.id === id) {
        setCurrentRestaurant(prev => prev ? { 
          ...prev, 
          ...updates, 
          settings: { ...(prev.settings), ...(updates.settings || {}) },
          theme: { ...(prev.theme), ...(updates.theme || {}) },
          updatedAt: new Date().toISOString() 
        } : null);
      }
    } catch (err) {
      console.error('Error saving restaurant settings to backend PUT /Settings:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const deleteRestaurant = (id: string) => {
    setRestaurants(prev => prev.filter(restaurant => restaurant.id !== id));
    if (currentRestaurant?.id === id) {
      setCurrentRestaurant(null);
    }
  };

  // Table Management Functions
  const getTablesByRestaurant = (restaurantId: string): Table[] => {
    return tables;
  };

  const addTable = async (tableData: Partial<Table>) => {
    setIsLoading(true);
    try {
      const response = await tableApi.createTable('restaurant-001', {
        tableNumber: tableData.tableNumber || '1',
        tableName: tableData.tableName || (tableData.location ? `${tableData.location} Table ${tableData.tableNumber}` : `Table ${tableData.tableNumber}`),
        location: tableData.location || 'Main Dining',
        capacity: tableData.capacity || 4,
        isActive: tableData.isActive ?? true
      });
      
      const bt = response?.data || response;
      if (bt) {
        const newTable: Table = {
          id: bt.tableId.toString(),
          restaurantId: 'restaurant-001',
          tableNumber: bt.tableNumber,
          tableName: bt.tableName,
          qrCode: bt.qrUrl || '',
          qrCodeUrl: bt.qrUrl || '',
          isActive: bt.isActive,
          capacity: bt.capacity,
          location: bt.location || 'Main Dining',
          tableStatus: bt.tableStatus,
          activeOrderId: bt.activeOrderId,
          createdAt: bt.createdAt || new Date().toISOString()
        };
        setTables(prev => [...prev, newTable]);
      } else {
        throw new Error('Invalid response from server');
      }
    } catch (err) {
      console.error('Error adding table via backend POST /Table:', err);
      // Fallback local update
      const fallbackTable: Table = {
        id: tableData.id || `table-${Date.now()}`,
        restaurantId: 'restaurant-001',
        tableNumber: tableData.tableNumber || '1',
        tableName: tableData.tableName || `Table ${tableData.tableNumber}`,
        qrCode: tableData.qrCode || '',
        qrCodeUrl: tableData.qrCodeUrl || '',
        isActive: tableData.isActive ?? true,
        capacity: tableData.capacity || 4,
        location: tableData.location || 'Main Dining',
        createdAt: new Date().toISOString()
      };
      setTables(prev => [...prev, fallbackTable]);
    } finally {
      setIsLoading(false);
    }
  };

  const updateTable = async (id: string, updates: Partial<Table>) => {
    setIsLoading(true);
    try {
      const existing = tables.find(t => t.id === id);
      if (!existing) return;
      const response = await tableApi.updateTable('restaurant-001', id, {
        tableNumber: updates.tableNumber ?? existing.tableNumber,
        tableName: updates.tableName ?? existing.tableName,
        location: updates.location ?? existing.location,
        capacity: updates.capacity ?? existing.capacity,
        isActive: updates.isActive ?? existing.isActive
      });
      
      const bt = response?.data || response;
      if (bt) {
        setTables(prev => 
          prev.map(table => 
            table.id === id 
              ? { 
                  ...table, 
                  tableNumber: bt.tableNumber,
                  tableName: bt.tableName,
                  qrCode: bt.qrUrl || '',
                  qrCodeUrl: bt.qrUrl || '',
                  isActive: bt.isActive,
                  capacity: bt.capacity,
                  location: bt.location || 'Main Dining',
                  tableStatus: bt.tableStatus,
                  activeOrderId: bt.activeOrderId
                }
              : table
          )
        );
      } else {
        throw new Error('Invalid response from server');
      }
    } catch (err) {
      console.error('Error updating table via backend PUT/POST /Table:', err);
      // Fallback local update
      setTables(prev => 
        prev.map(table => 
          table.id === id 
            ? { ...table, ...updates }
            : table
        )
      );
    } finally {
      setIsLoading(false);
    }
  };

  const deleteTable = async (id: string) => {
    setIsLoading(true);
    try {
      await tableApi.deleteTable('restaurant-001', id);
    } catch (err) {
      console.error('Error deleting table via backend DELETE /Table/{id}:', err);
    } finally {
      setTables(prev => prev.filter(table => table.id !== id));
      setIsLoading(false);
    }
  };

  const refreshSettings = async () => {
    try {
      const data = await settingsApi.get();
      if (data) {
        setCurrentRestaurant(prev => prev ? {
          ...prev,
          name:    data.restaurantName  || prev.name,
          slug:    data.slug            || prev.slug,
          address: data.address         || prev.address,
          phone:   data.phone           || prev.phone,
          email:   data.email           || prev.email,
          website: data.website         || prev.website,
          theme: {
            ...prev.theme,
            primaryColor: data.primaryColor || prev.theme?.primaryColor,
            accentColor:  data.accentColor  || prev.theme?.accentColor,
          },
          settings: {
            ...prev.settings,
            currency: data.currency || prev.settings?.currency,
          },
        } : null);
      }
    } catch (err) {
      console.error('refreshSettings failed:', err);
    }
  };

  const value: RestaurantContextType = {
    // Current Restaurant
    currentRestaurant,
    setCurrentRestaurant,
    loadRestaurantBySlug,
    
    // Restaurant Management
    restaurants,
    getRestaurantById,
    getRestaurantBySlug,
    addRestaurant,
    updateRestaurant,
    deleteRestaurant,
    
    // Table Management
    tables,
    getTablesByRestaurant,
    addTable,
    updateTable,
    deleteTable,
    
    // Refresh from backend
    refreshSettings,

    // Loading States
    isLoading,
    error
  };

  return (
    <RestaurantContext.Provider value={value}>
      {children}
    </RestaurantContext.Provider>
  );
};

