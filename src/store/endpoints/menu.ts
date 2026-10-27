import { api } from '../api';
import type { AddonGroup, Category, Id, Menu, MenuImage, MenuItem, Station } from '@/types/api';

export type ItemInput = Omit<MenuItem, 'id' | 'images' | 'variants' | 'tags' | 'prepTimeMin' | 'sortOrder' | 'description' | 'addonGroupIds'> & {
  description?: string;
  variants?: { id?: Id; name: string; price: number }[];
  addonGroupIds?: Id[];
  tags?: MenuItem['tags'];
  prepTimeMin?: number;
  sortOrder?: number;
};
export type CategoryInput = Pick<Category, 'name'> & Partial<Omit<Category, 'id' | 'name'>>;
export type AddonGroupInput = Omit<AddonGroup, 'id' | 'addons'> & {
  addons: { id?: Id; name: string; price: number; foodType?: AddonGroup['addons'][number]['foodType']; isActive?: boolean }[];
};

// Everything menu-related lives in one cached GET /menu. Mutations invalidate
// it; sold-out toggles patch it in place so the POS doesn't flicker.
export const menuApi = api.injectEndpoints({
  endpoints: (b) => ({
    menu: b.query<Menu, void>({
      query: () => '/menu',
      providesTags: ['Menu'],
    }),

    createCategory: b.mutation<Category, CategoryInput>({
      query: (body) => ({ url: '/categories', method: 'POST', body }),
      invalidatesTags: ['Menu'],
    }),
    updateCategory: b.mutation<Category, { id: Id } & Partial<CategoryInput>>({
      query: ({ id, ...body }) => ({ url: `/categories/${id}`, method: 'PATCH', body }),
      invalidatesTags: ['Menu'],
    }),
    deleteCategory: b.mutation<null, Id>({
      query: (id) => ({ url: `/categories/${id}`, method: 'DELETE' }),
      invalidatesTags: ['Menu'],
    }),
    reorderCategories: b.mutation<null, Id[]>({
      query: (ids) => ({ url: '/categories/order', method: 'PUT', body: { ids } }),
      invalidatesTags: ['Menu'],
    }),

    createItem: b.mutation<MenuItem, ItemInput>({
      query: (body) => ({ url: '/items', method: 'POST', body }),
      invalidatesTags: ['Menu'],
    }),
    updateItem: b.mutation<MenuItem, { id: Id } & Partial<ItemInput>>({
      query: ({ id, ...body }) => ({ url: `/items/${id}`, method: 'PATCH', body }),
      invalidatesTags: ['Menu'],
    }),
    deleteItem: b.mutation<null, Id>({
      query: (id) => ({ url: `/items/${id}`, method: 'DELETE' }),
      invalidatesTags: ['Menu'],
    }),
    setStock: b.mutation<{ itemId: Id; inStock: boolean }, { id: Id; inStock: boolean }>({
      query: ({ id, inStock }) => ({ url: `/items/${id}/stock`, method: 'PATCH', body: { inStock } }),
      async onQueryStarted({ id, inStock }, { dispatch, queryFulfilled }) {
        const patch = dispatch(menuApi.util.updateQueryData('menu', undefined, (draft) => {
          const item = draft.items.find((i) => i.id === id);
          if (item) item.inStock = inStock;
        }));
        queryFulfilled.catch(patch.undo);
      },
    }),

    uploadItemImages: b.mutation<MenuImage[], { id: Id; files: File[] }>({
      query: ({ id, files }) => {
        const form = new FormData();
        files.forEach((f) => form.append('images', f));
        return { url: `/items/${id}/images`, method: 'POST', body: form };
      },
      invalidatesTags: ['Menu'],
    }),
    setPrimaryImage: b.mutation<MenuImage[], { id: Id; imageId: Id }>({
      query: ({ id, imageId }) => ({ url: `/items/${id}/images/${imageId}`, method: 'PATCH', body: { isPrimary: true } }),
      invalidatesTags: ['Menu'],
    }),
    deleteImage: b.mutation<MenuImage[], { id: Id; imageId: Id }>({
      query: ({ id, imageId }) => ({ url: `/items/${id}/images/${imageId}`, method: 'DELETE' }),
      invalidatesTags: ['Menu'],
    }),

    createAddonGroup: b.mutation<AddonGroup, AddonGroupInput>({
      query: (body) => ({ url: '/addon-groups', method: 'POST', body }),
      invalidatesTags: ['Menu'],
    }),
    updateAddonGroup: b.mutation<AddonGroup, { id: Id } & AddonGroupInput>({
      query: ({ id, ...body }) => ({ url: `/addon-groups/${id}`, method: 'PATCH', body }),
      invalidatesTags: ['Menu'],
    }),
    deleteAddonGroup: b.mutation<null, Id>({
      query: (id) => ({ url: `/addon-groups/${id}`, method: 'DELETE' }),
      invalidatesTags: ['Menu'],
    }),

    createStation: b.mutation<Station, { name: string }>({
      query: (body) => ({ url: '/stations', method: 'POST', body }),
      invalidatesTags: ['Menu'],
    }),
    updateStation: b.mutation<Station, { id: Id; name: string }>({
      query: ({ id, ...body }) => ({ url: `/stations/${id}`, method: 'PATCH', body }),
      invalidatesTags: ['Menu'],
    }),
    deleteStation: b.mutation<null, Id>({
      query: (id) => ({ url: `/stations/${id}`, method: 'DELETE' }),
      invalidatesTags: ['Menu'],
    }),
  }),
});

export const {
  useMenuQuery,
  useCreateCategoryMutation, useUpdateCategoryMutation, useDeleteCategoryMutation, useReorderCategoriesMutation,
  useCreateItemMutation, useUpdateItemMutation, useDeleteItemMutation, useSetStockMutation,
  useUploadItemImagesMutation, useSetPrimaryImageMutation, useDeleteImageMutation,
  useCreateAddonGroupMutation, useUpdateAddonGroupMutation, useDeleteAddonGroupMutation,
  useCreateStationMutation, useUpdateStationMutation, useDeleteStationMutation,
} = menuApi;
