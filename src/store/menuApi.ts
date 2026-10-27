// Menu API slice using RTK Query
import { api } from './api';

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
  subCategoryId: number;
  foodName: string;
  description: string;
  price: number;
  createdAt: string;
  isDinner: boolean;
  soldOut: boolean;
  categoryId: number;
  approxTime?: string;
  weight?: string;
  isVeg?: boolean;
  isPopular?: boolean;
  isNewItem?: boolean;
  isChefsChoice?: boolean;
  images?: { imageId: number; menuItemId: number; imageUrl: string; publicId: string; isPrimary: boolean; createdAt: string }[];
}

export interface ApiResponse<T> {
  data: T;
  success: boolean;
  message?: string;
}

// Menu API endpoints
export const menuApi = api.injectEndpoints({
  endpoints: (builder) => ({
    // Get all categories
    getCategories: builder.query<Category[], void>({
      query: () => ({
        url: '/Menu/categories',
        method: 'GET',
        credentials: 'omit',
      }),
      transformResponse: (response: ApiResponse<Category[]>) => {
        return response.data || [];
      },
      providesTags: ['Category'],
    }),

    // Get subcategories by category ID
    getSubCategories: builder.query<SubCategory[], number>({
      query: (categoryId) => ({
        url: `/Menu/categories/${categoryId}/subcategories`,
        method: 'GET',
        credentials: 'omit',
      }),
      transformResponse: (response: ApiResponse<SubCategory[]>) => {
        return response.data || [];
      },
      providesTags: ['SubCategory'],
    }),

    // Get menu items by category (subcategory removed)
    getMenuItems: builder.query<MenuItem[], { categoryId?: number }>({
      query: ({ categoryId }) => {
        const params = new URLSearchParams();
        // API uses CategoryID (capital ID) not categoryId
        if (categoryId) params.append('CategoryID', categoryId.toString());
        // subCategoryId removed - not used in project
        return {
          url: `/Menu/items${params.toString() ? `?${params.toString()}` : ''}`,
          method: 'GET',
          credentials: 'omit',
        };
      },
      transformResponse: (response: ApiResponse<MenuItem[]>) => {
        return response.data || [];
      },
      providesTags: ['MenuItem'],
    }),

    // Get single menu item
    getMenuItem: builder.query<MenuItem, number>({
      query: (itemId) => ({
        url: `/Menu/items/${itemId}`,
        method: 'GET',
        credentials: 'omit',
      }),
      transformResponse: (response: ApiResponse<MenuItem>) => {
        return response.data;
      },
      providesTags: (result, error, itemId) => [{ type: 'MenuItem', id: itemId }],
    }),

    // Get featured items
    getFeaturedItems: builder.query<MenuItem[], void>({
      query: () => ({
        url: '/Menu/items/featured',
        method: 'GET',
        credentials: 'omit',
      }),
      transformResponse: (response: ApiResponse<MenuItem[]>) => {
        return response.data || [];
      },
      providesTags: ['MenuItem'],
    }),

    // Search menu items
    searchMenuItems: builder.query<MenuItem[], string>({
      query: (query) => ({
        url: `/Menu/items/search?q=${encodeURIComponent(query)}`,
        method: 'GET',
        credentials: 'omit',
      }),
      transformResponse: (response: ApiResponse<MenuItem[]>) => {
        return response.data || [];
      },
      providesTags: ['MenuItem'],
    }),

    // Save/Update menu item
    saveMenuItem: builder.mutation<MenuItem, Partial<MenuItem>>({
      query: (item) => ({
        url: '/Menu/items',
        method: 'POST',
        body: item,
      }),
      invalidatesTags: ['MenuItem'],
    }),

    // Delete menu item
    deleteMenuItem: builder.mutation<void, number>({
      query: (itemId) => ({
        url: `/Menu/items/${itemId}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['MenuItem'],
    }),

    // Add category
    addCategory: builder.mutation<Category, Partial<Category>>({
      query: (category) => ({
        url: '/Menu/categories',
        method: 'POST',
        body: category,
      }),
      transformResponse: (response: ApiResponse<Category>) => {
        return response.data;
      },
      invalidatesTags: ['Category'],
    }),

    // Delete category
    deleteCategory: builder.mutation<void, number>({
      query: (categoryId) => ({
        url: `/Menu/categories/${categoryId}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Category'],
    }),
  }),
});

// Export hooks for usage in components
export const {
  useGetCategoriesQuery,
  useGetSubCategoriesQuery,
  useGetMenuItemsQuery,
  useGetMenuItemQuery,
  useGetFeaturedItemsQuery,
  useSearchMenuItemsQuery,
  useLazyGetCategoriesQuery,
  useLazyGetSubCategoriesQuery,
  useLazyGetMenuItemsQuery,
  useLazySearchMenuItemsQuery,
  useSaveMenuItemMutation,
  useDeleteMenuItemMutation,
  useAddCategoryMutation,
  useDeleteCategoryMutation,
} = menuApi;


