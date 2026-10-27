// High-level API service functions
// This file provides convenient functions for common API operations

import api, { ApiResponse, ApiError } from './api';
import endpoints from './endpoints';
import { authService } from './api';

// Types
export interface LoginCredentials {
  username: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  name: string;
  restaurantName?: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'manager';
  restaurantId: string;
  username: string;
}

export interface LoginResponse {
  user: User;
  token: string;
  expiresIn: number;
}

// Authentication Service
export const authApi = {
  login: async (credentials: LoginCredentials): Promise<LoginResponse> => {
    try {
      const response = await api.post<any>(endpoints.auth.login, {
        username: credentials.username,
        password: credentials.password,
      });

      const responseData = response.data;
      if (responseData && responseData.success === false) {
        throw {
          message: responseData.message || 'Login failed',
          status: 200
        } as ApiError;
      }

      const tokenData = responseData?.data || responseData;
      const token = tokenData?.token || (typeof tokenData === 'string' ? tokenData : null);

      if (token && typeof token === 'string') {
        authService.setToken(token);
      } else {
        throw {
          message: 'No authorization token returned from server',
          status: 200
        } as ApiError;
      }

      const role = tokenData?.role || 'admin';
      const user: User = {
        id: '1',
        email: credentials.username.includes('@') ? credentials.username : `${credentials.username}@restaurant.com`,
        name: 'Admin User',
        role: role.toLowerCase() === 'owner' ? 'admin' : 'manager',
        restaurantId: 'restaurant-001',
        username: credentials.username,
      };

      return {
        user,
        token,
        expiresIn: 36000,
      };
    } catch (error) {
      throw error as ApiError;
    }
  },

  logout: async (): Promise<void> => {
    try {
      // In flat backend, no explicit logout endpoint exists, so we clear the token.
      authService.removeToken();
    } catch (error) {
      console.error('Logout API error:', error);
    }
  },

  register: async (data: RegisterData): Promise<LoginResponse> => {
    try {
      const response = await api.post<any>(endpoints.auth.signup, {
        username: data.name.replace(/\s+/g, '').toLowerCase() || data.email.split('@')[0],
        email: data.email,
        password: data.password,
      });

      const token = response.data?.token || response.data;
      if (token && typeof token === 'string') {
        authService.setToken(token);
      }

      const user: User = {
        id: '1',
        email: data.email,
        name: data.name,
        role: 'admin',
        restaurantId: 'restaurant-001',
        username: data.name.replace(/\s+/g, '').toLowerCase() || data.email.split('@')[0],
      };

      return {
        user,
        token: typeof token === 'string' ? token : '',
        expiresIn: 36000,
      };
    } catch (error) {
      throw error as ApiError;
    }
  },

  getCurrentUser: async (): Promise<User> => {
    // Return local/decoded user session data since me endpoint doesn't exist
    const savedUser = localStorage.getItem('restaurantUser');
    if (savedUser) {
      return JSON.parse(savedUser);
    }
    return {
      id: '1',
      email: 'admin@servekaro.com',
      name: 'Admin User',
      role: 'admin',
      restaurantId: 'restaurant-001',
      username: 'admin',
    };
  },

  refreshToken: async (): Promise<string> => {
    const token = authService.getToken();
    return token || '';
  },

  forgotPassword: async (email: string): Promise<any> => {
    try {
      const response = await api.post<any>(endpoints.auth.forgotPassword, { email });
      return response.data || response;
    } catch (error) {
      throw error as ApiError;
    }
  },

  verifyOtp: async (email: string, otpCode: string): Promise<any> => {
    try {
      const response = await api.post<any>(endpoints.auth.verifyOtp, { email, otpCode });
      return response.data || response;
    } catch (error) {
      throw error as ApiError;
    }
  },

  resetPassword: async (resetToken: string, newPassword: string): Promise<any> => {
    try {
      const response = await api.post<any>(endpoints.auth.resetPassword, { resetToken, newPassword });
      return response.data || response;
    } catch (error) {
      throw error as ApiError;
    }
  },

  getProfile: async (): Promise<User> => {
    try {
      const response = await api.get<any>(endpoints.auth.profile);
      const resData = response.data?.data || response.data;
      return {
        id: resData.id?.toString() || '1',
        email: resData.email || '',
        name: resData.name || '',
        role: resData.role || 'admin',
        restaurantId: resData.restaurantId || 'restaurant-001',
        username: resData.username || '',
      };
    } catch (error) {
      throw error as ApiError;
    }
  },

  updateProfile: async (profileData: { username: string; name: string; email: string; password?: string }): Promise<User> => {
    try {
      const response = await api.post<any>(endpoints.auth.updateProfile, profileData);
      const resData = response.data?.data || response.data;
      return {
        id: resData.id?.toString() || '1',
        email: resData.email || '',
        name: resData.name || '',
        role: resData.role || 'admin',
        restaurantId: resData.restaurantId || 'restaurant-001',
        username: resData.username || '',
      };
    } catch (error) {
      throw error as ApiError;
    }
  },

  createWaiter: async (waiterData: { username: string; email: string }): Promise<any> => {
    try {
      const response = await api.post<any>(endpoints.auth.createWaiter, waiterData);
      return response.data || response;
    } catch (error) {
      throw error as ApiError;
    }
  },

  getWaiters: async (): Promise<any> => {
    try {
      const response = await api.get<any>(endpoints.auth.getWaiters);
      return response.data || response;
    } catch (error) {
      throw error as ApiError;
    }
  },
};

// Settings Service
export const settingsApi = {
  get: async (): Promise<any> => {
    try {
      const response = await api.get<{ data: any }>(endpoints.settings.get);
      return response.data.data;
    } catch (error) {
      throw error as ApiError;
    }
  },

  update: async (settingsData: any): Promise<any> => {
    try {
      const response = await api.put<any>(endpoints.settings.update, settingsData);
      return response.data;
    } catch (error) {
      throw error as ApiError;
    }
  },
};

// Restaurant Service (Backward Compatibility Wrapper for Settings)
export const restaurantApi = {
  getAll: async (): Promise<any[]> => [],
  getById: async (id: string): Promise<any> => {
    return settingsApi.get();
  },
  getBySlug: async (slug: string): Promise<any> => {
    return settingsApi.get();
  },
  create: async (data: Partial<any>): Promise<any> => {
    return settingsApi.update(data);
  },
  update: async (id: string, data: Partial<any>): Promise<any> => {
    return settingsApi.update(data);
  },
  delete: async (id: string): Promise<void> => {},
  updateSettings: async (id: string, settings: any): Promise<any> => {
    return settingsApi.update(settings);
  },
  updateTheme: async (id: string, theme: any): Promise<any> => {
    const current = await settingsApi.get();
    return settingsApi.update({
      ...current,
      primaryColor: theme.primaryColor,
      accentColor: theme.accentColor,
    });
  },
};

// Menu Service
export const menuApi = {
  getCategories: async (): Promise<any[]> => {
    try {
      const response = await api.get<{ data: any[] }>(endpoints.menu.categories.list);
      return response.data.data || [];
    } catch (error) {
      throw error as ApiError;
    }
  },

  createCategory: async (restaurantId: string, data: any): Promise<any> => {
    try {
      const response = await api.post<any>(endpoints.menu.categories.create, data);
      return response.data;
    } catch (error) {
      throw error as ApiError;
    }
  },

  updateCategory: async (restaurantId: string, categoryId: string, data: any): Promise<any> => {
    try {
      const response = await api.post<any>(endpoints.menu.categories.create, {
        categoryId: parseInt(categoryId),
        categoryName: data.categoryName,
      });
      return response.data;
    } catch (error) {
      throw error as ApiError;
    }
  },

  deleteCategory: async (restaurantId: string, categoryId: string): Promise<void> => {
    try {
      await api.delete(endpoints.menu.categories.delete(categoryId));
    } catch (error) {
      throw error as ApiError;
    }
  },

  getMenuItems: async (categoryId?: string): Promise<any[]> => {
    try {
      const response = await api.get<{ data: any[] }>(endpoints.menu.items.list(categoryId));
      return response.data.data || [];
    } catch (error) {
      throw error as ApiError;
    }
  },

  getMenuItem: async (restaurantId: string, itemId: string): Promise<any> => {
    try {
      const items = await menuApi.getMenuItems();
      return items.find((item: any) => item.itemId.toString() === itemId);
    } catch (error) {
      throw error as ApiError;
    }
  },

  createMenuItem: async (restaurantId: string, data: any): Promise<any> => {
    try {
      const response = await api.post<any>(endpoints.menu.items.create, data);
      return response.data;
    } catch (error) {
      throw error as ApiError;
    }
  },

  updateMenuItem: async (restaurantId: string, itemId: string, data: any): Promise<any> => {
    try {
      const response = await api.post<any>(endpoints.menu.items.create, {
        ...data,
        itemId: parseInt(itemId),
      });
      return response.data;
    } catch (error) {
      throw error as ApiError;
    }
  },

  deleteMenuItem: async (restaurantId: string, itemId: string): Promise<void> => {
    try {
      await api.delete(endpoints.menu.items.delete(itemId));
    } catch (error) {
      throw error as ApiError;
    }
  },

  toggleItemVisibility: async (restaurantId: string, itemId: string): Promise<any> => {
    try {
      const items = await menuApi.getMenuItems();
      const item = items.find((item: any) => item.itemId.toString() === itemId);
      if (item) {
        return menuApi.updateMenuItem(restaurantId, itemId, {
          ...item,
          soldOut: !item.soldOut,
        });
      }
    } catch (error) {
      throw error as ApiError;
    }
  },

  getFeaturedItems: async (): Promise<any[]> => {
    try {
      const items = await menuApi.getMenuItems();
      return items.filter((item: any) => item.isPopular || item.isChefsChoice);
    } catch (error) {
      throw error as ApiError;
    }
  },

  searchMenuItems: async (restaurantId: string, query: string): Promise<any[]> => {
    try {
      const items = await menuApi.getMenuItems();
      const q = query.toLowerCase();
      return items.filter(
        (item: any) =>
          item.foodName?.toLowerCase().includes(q) ||
          item.description?.toLowerCase().includes(q)
      );
    } catch (error) {
      throw error as ApiError;
    }
  },

  uploadMenuItemImage: async (
    restaurantId: string,
    itemId: string,
    imageFile: File
  ): Promise<any> => {
    try {
      const formData = new FormData();
      formData.append('Images', imageFile);
      formData.append('MenuItemId', itemId);
      formData.append('IsPrimary', 'true');

      const response = await api.upload<any>(
        endpoints.menuImage.upload,
        formData
      );
      return response.data;
    } catch (error) {
      throw error as ApiError;
    }
  },
};

// Table Service
export const tableApi = {
  getTables: async (): Promise<any[]> => {
    try {
      const response = await api.get<{ data: any[] }>(endpoints.tables.list);
      return response.data.data || [];
    } catch (error) {
      throw error as ApiError;
    }
  },

  createTable: async (restaurantId: string, data: any): Promise<any> => {
    try {
      const response = await api.post<any>(endpoints.tables.create, {
        tableId: data.tableId || 0,
        tableNumber: data.tableNumber,
        tableName: data.tableName || `Table ${data.tableNumber}`,
        location: data.location || 'Main Dining',
        capacity: data.capacity || 4,
        isActive: data.isActive ?? true,
      });
      return response.data;
    } catch (error) {
      throw error as ApiError;
    }
  },

  updateTable: async (restaurantId: string, tableId: string, data: any): Promise<any> => {
    try {
      // Create and update use same POST endpoint with ID specified
      const response = await api.post<any>(endpoints.tables.create, {
        tableId: parseInt(tableId),
        tableNumber: data.tableNumber,
        tableName: data.tableName || `Table ${data.tableNumber}`,
        location: data.location || 'Main Dining',
        capacity: data.capacity || 4,
        isActive: data.isActive ?? true,
      });
      return response.data;
    } catch (error) {
      throw error as ApiError;
    }
  },

  deleteTable: async (restaurantId: string, tableId: string): Promise<void> => {
    try {
      await api.delete(endpoints.tables.delete(tableId));
    } catch (error) {
      throw error as ApiError;
    }
  },

  generateQRCode: async (restaurantId: string, tableId: string): Promise<any> => {
    try {
      const response = await api.get<any>(endpoints.tables.get(tableId));
      return { qrCodeUrl: response.data?.data?.qrUrl || '' };
    } catch (error) {
      throw error as ApiError;
    }
  },
};

// Order Service
export const orderApi = {
  getOrders: async (status?: string): Promise<any[]> => {
    try {
      const response = await api.get<{ data: any[] }>(endpoints.orders.list(status));
      return response.data.data || [];
    } catch (error) {
      throw error as ApiError;
    }
  },

  getKitchenOrders: async (): Promise<any[]> => {
    try {
      const response = await api.get<{ data: any[] }>(endpoints.orders.kitchen);
      return response.data.data || [];
    } catch (error) {
      throw error as ApiError;
    }
  },

  getDashboardStats: async (): Promise<any> => {
    try {
      const response = await api.get<any>(endpoints.orders.dashboard);
      return response.data?.data || response.data;
    } catch (error) {
      throw error as ApiError;
    }
  },

  getOrderById: async (orderId: number | string): Promise<any> => {
    try {
      const response = await api.get<any>(endpoints.orders.get(orderId));
      return response.data?.data || response.data;
    } catch (error) {
      throw error as ApiError;
    }
  },

  createOrder: async (restaurantId: string, data: any): Promise<any> => {
    try {
      const response = await api.post<any>(endpoints.orders.create, data);
      return response.data;
    } catch (error) {
      throw error as ApiError;
    }
  },

  updateOrderStatus: async (
    restaurantId: string,
    orderId: string,
    status: string
  ): Promise<any> => {
    try {
      const titleCasedStatus = status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();
      const response = await api.put<any>(endpoints.orders.updateStatus(orderId), {
        newStatus: titleCasedStatus,
      });
      return response.data;
    } catch (error) {
      throw error as ApiError;
    }
  },
};

// Review Service (Simulated fallback, Google Reviews submits via backend)
export const reviewApi = {
  getReviews: async (restaurantId: string): Promise<any[]> => {
    return [];
  },

  createReview: async (restaurantId: string, data: any): Promise<any> => {
    return { success: true };
  },

  getGoogleReviews: async (restaurantId: string): Promise<any[]> => {
    return [];
  },

  submitGoogleReview: async (restaurantId: string, data: any): Promise<any> => {
    return { success: true };
  },
};

// Analytics Service (Fallback mapping using DashboardStats / Orders)
export const analyticsApi = {
  getSales: async (
    restaurantId: string,
    startDate?: string,
    endDate?: string
  ): Promise<any> => {
    const stats = await orderApi.getDashboardStats();
    return {
      totalSales: stats?.totalRevenue || 0,
      totalOrders: stats?.totalOrders || 0,
    };
  },

  getPopularItems: async (
    restaurantId: string,
    startDate?: string,
    endDate?: string
  ): Promise<any[]> => {
    return [];
  },

  getRevenue: async (
    restaurantId: string,
    startDate?: string,
    endDate?: string
  ): Promise<any> => {
    const stats = await orderApi.getDashboardStats();
    return {
      revenue: stats?.totalRevenue || 0,
    };
  },
};

// Public Menu Service (Uses the flat /Menu endpoints)
export const publicMenuApi = {
  getCategories: async (): Promise<any[]> => {
    try {
      const response = await api.get<{ data: any[] }>(endpoints.menu.categories.list, { credentials: 'omit' });
      return response.data.data || [];
    } catch (error) {
      console.error('Error fetching public categories:', error);
      return [];
    }
  },

  getSubCategories: async (categoryId: number): Promise<any[]> => {
    return [];
  },

  getMenuItems: async (categoryId?: number): Promise<any[]> => {
    try {
      const response = await api.get<{ data: any[] }>(endpoints.menu.items.list(categoryId), { credentials: 'omit' });
      return response.data.data || [];
    } catch (error) {
      console.error('Error fetching public menu items:', error);
      return [];
    }
  },

  getMenuItem: async (itemId: number): Promise<any> => {
    try {
      const items = await publicMenuApi.getMenuItems();
      return items.find((item: any) => item.itemId === itemId);
    } catch (error) {
      console.error('Error fetching public menu item:', error);
      return null;
    }
  },

  getFeaturedItems: async (): Promise<any[]> => {
    try {
      const items = await publicMenuApi.getMenuItems();
      return items.filter((item: any) => item.isPopular || item.isChefsChoice);
    } catch (error) {
      console.error('Error fetching public featured items:', error);
      return [];
    }
  },

  searchItems: async (query: string): Promise<any[]> => {
    try {
      const items = await publicMenuApi.getMenuItems();
      const q = query.toLowerCase();
      return items.filter(
        (item: any) =>
          item.foodName?.toLowerCase().includes(q) ||
          item.description?.toLowerCase().includes(q)
      );
    } catch (error) {
      console.error('Error searching public menu items:', error);
      return [];
    }
  },
};

// Export all services
export default {
  auth: authApi,
  settings: settingsApi,
  restaurant: restaurantApi,
  menu: menuApi,
  table: tableApi,
  order: orderApi,
  review: reviewApi,
  analytics: analyticsApi,
  publicMenu: publicMenuApi,
};
