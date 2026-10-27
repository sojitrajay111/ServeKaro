import { api } from '../api';
import type { Id, Outlet, Permission, Restaurant, Role, TaxGroup, User } from '@/types/api';

export interface StaffInput {
  name: string;
  phone: string;
  email?: string;
  roleId: Id;
  outletIds: Id[];
  pin?: string;
}

export const adminApi = api.injectEndpoints({
  endpoints: (b) => ({
    restaurant: b.query<Restaurant, void>({
      query: () => '/restaurant',
      providesTags: ['Restaurant'],
    }),
    updateRestaurant: b.mutation<Restaurant, Partial<Omit<Restaurant, 'id'>>>({
      query: (body) => ({ url: '/restaurant', method: 'PATCH', body }),
      invalidatesTags: ['Restaurant'],
    }),

    outlet: b.query<Outlet, Id>({
      query: (id) => `/outlets/${id}`,
      providesTags: (_r, _e, id) => [{ type: 'Outlet', id }],
    }),
    updateOutlet: b.mutation<Outlet, { id: Id } & Partial<Omit<Outlet, 'id'>>>({
      query: ({ id, ...body }) => ({ url: `/outlets/${id}`, method: 'PATCH', body }),
      invalidatesTags: (_r, _e, { id }) => [{ type: 'Outlet', id }, 'Me'],
    }),

    staff: b.query<User[], void>({
      query: () => '/staff',
      providesTags: ['Staff'],
    }),
    createStaff: b.mutation<User, StaffInput>({
      query: (body) => ({ url: '/staff', method: 'POST', body }),
      invalidatesTags: ['Staff'],
    }),
    updateStaff: b.mutation<User, { id: Id } & Partial<Omit<StaffInput, 'pin'>> & { isActive?: boolean }>({
      query: ({ id, ...body }) => ({ url: `/staff/${id}`, method: 'PATCH', body }),
      invalidatesTags: ['Staff'],
    }),
    resetPin: b.mutation<null, { id: Id; pin: string }>({
      query: ({ id, pin }) => ({ url: `/staff/${id}/reset-pin`, method: 'POST', body: { pin } }),
      invalidatesTags: ['Staff'],
    }),
    resendInvite: b.mutation<null, Id>({
      query: (id) => ({ url: `/staff/${id}/resend-invite`, method: 'POST' }),
    }),

    roles: b.query<{ roles: Role[]; permissions: Permission[] }, void>({
      query: () => '/roles',
      providesTags: ['Role'],
    }),
    createRole: b.mutation<Role, Omit<Role, 'id' | 'isOwner'>>({
      query: (body) => ({ url: '/roles', method: 'POST', body }),
      invalidatesTags: ['Role'],
    }),
    updateRole: b.mutation<Role, { id: Id } & Partial<Omit<Role, 'id' | 'isOwner'>>>({
      query: ({ id, ...body }) => ({ url: `/roles/${id}`, method: 'PATCH', body }),
      invalidatesTags: ['Role'],
    }),
    deleteRole: b.mutation<null, Id>({
      query: (id) => ({ url: `/roles/${id}`, method: 'DELETE' }),
      invalidatesTags: ['Role'],
    }),

    taxGroups: b.query<TaxGroup[], void>({
      query: () => '/tax-groups',
      providesTags: ['TaxGroup'],
    }),
    createTaxGroup: b.mutation<TaxGroup, Omit<TaxGroup, 'id'>>({
      query: (body) => ({ url: '/tax-groups', method: 'POST', body }),
      invalidatesTags: ['TaxGroup', 'Menu'],
    }),
    updateTaxGroup: b.mutation<TaxGroup, TaxGroup>({
      query: ({ id, ...body }) => ({ url: `/tax-groups/${id}`, method: 'PATCH', body }),
      invalidatesTags: ['TaxGroup', 'Menu'],
    }),
    deleteTaxGroup: b.mutation<null, Id>({
      query: (id) => ({ url: `/tax-groups/${id}`, method: 'DELETE' }),
      invalidatesTags: ['TaxGroup', 'Menu'],
    }),
  }),
});

export const {
  useRestaurantQuery, useUpdateRestaurantMutation, useOutletQuery, useUpdateOutletMutation,
  useStaffQuery, useCreateStaffMutation, useUpdateStaffMutation, useResetPinMutation, useResendInviteMutation,
  useRolesQuery, useCreateRoleMutation, useUpdateRoleMutation, useDeleteRoleMutation,
  useTaxGroupsQuery, useCreateTaxGroupMutation, useUpdateTaxGroupMutation, useDeleteTaxGroupMutation,
} = adminApi;
