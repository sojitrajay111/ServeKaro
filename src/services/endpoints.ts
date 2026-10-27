// API Endpoints configuration
// Centralized endpoint definitions for easy maintenance

const endpoints = {
  // Authentication
  auth: {
    login: '/Auth/login',
    signup: '/Auth/signup',
    forgotPassword: '/Auth/forgot-password',
    verifyOtp: '/Auth/verify-otp',
    resetPassword: '/Auth/reset-password',
    profile: '/Auth/profile',
    updateProfile: '/Auth/update-profile',
    createWaiter: '/Auth/create-waiter',
    getWaiters: '/Auth/waiters',
  },

  // Menu Categories & Items
  menu: {
    categories: {
      list: '/Menu/categories',
      create: '/Menu/categories',
      delete: (id: number | string) => `/Menu/categories/${id}`,
    },
    items: {
      list: (categoryId?: number | string) => {
        const query = categoryId ? `?CategoryID=${categoryId}` : '';
        return `/Menu/items${query}`;
      },
      create: '/Menu/items',
      delete: (id: number | string) => `/Menu/items/${id}`,
    },
  },

  // Menu Images
  menuImage: {
    upload: '/MenuImage/upload',
    update: '/MenuImage/menu-images',
    delete: (imageId: number | string) => `/MenuImage/delete/${imageId}`,
    getByMenuItem: (menuItemId: number | string) => `/MenuImage/menu-item?menuItemId=${menuItemId}`,
  },

  // Orders
  orders: {
    list: (status?: string) => `/Order${status ? `?status=${status}` : ''}`,
    create: '/Order',
    kitchen: '/Order/kitchen',
    dashboard: '/Order/dashboard',
    get: (id: number | string) => `/Order/${id}`,
    updateStatus: (id: number | string) => `/Order/${id}/status`,
  },

  // Settings
  settings: {
    get: '/Settings',
    update: '/Settings',
  },

  // Tables
  tables: {
    list: '/Table',
    create: '/Table',
    get: (id: number | string) => `/Table/${id}`,
    delete: (id: number | string) => `/Table/${id}`,
  },
};

export default endpoints;


