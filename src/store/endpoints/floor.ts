import { api } from '../api';
import type { Area, Id, Order, Table } from '@/types/api';

export type TableInput = { name: string; areaId?: Id | null; capacity?: number; isActive?: boolean; sortOrder?: number };

export const floorApi = api.injectEndpoints({
  endpoints: (b) => ({
    areas: b.query<Area[], void>({
      query: () => '/areas',
      providesTags: ['Area'],
    }),
    createArea: b.mutation<Area, { name: string; sortOrder?: number }>({
      query: (body) => ({ url: '/areas', method: 'POST', body }),
      invalidatesTags: ['Area'],
    }),
    updateArea: b.mutation<Area, { id: Id; name?: string; sortOrder?: number }>({
      query: ({ id, ...body }) => ({ url: `/areas/${id}`, method: 'PATCH', body }),
      invalidatesTags: ['Area'],
    }),
    deleteArea: b.mutation<null, Id>({
      query: (id) => ({ url: `/areas/${id}`, method: 'DELETE' }),
      invalidatesTags: ['Area'],
    }),

    tables: b.query<Table[], void>({
      query: () => '/tables',
      providesTags: ['Table'],
    }),
    createTable: b.mutation<Table, TableInput>({
      query: (body) => ({ url: '/tables', method: 'POST', body }),
      invalidatesTags: ['Table'],
    }),
    updateTable: b.mutation<Table, { id: Id } & Partial<TableInput>>({
      query: ({ id, ...body }) => ({ url: `/tables/${id}`, method: 'PATCH', body }),
      invalidatesTags: ['Table'],
    }),
    deleteTable: b.mutation<null, Id>({
      query: (id) => ({ url: `/tables/${id}`, method: 'DELETE' }),
      invalidatesTags: ['Table'],
    }),
    rotateQr: b.mutation<Table, Id>({
      query: (id) => ({ url: `/tables/${id}/qr/rotate`, method: 'POST' }),
      invalidatesTags: ['Table'],
    }),
    transferTable: b.mutation<Order, { id: Id; toTableId: Id }>({
      query: ({ id, toTableId }) => ({ url: `/tables/${id}/transfer`, method: 'POST', body: { toTableId } }),
      invalidatesTags: ['Table', 'Order'],
    }),
    mergeTables: b.mutation<Order, Id[]>({
      query: (tableIds) => ({ url: '/tables/merge', method: 'POST', body: { tableIds } }),
      invalidatesTags: ['Table', 'Order'],
    }),
  }),
});

export const {
  useAreasQuery, useCreateAreaMutation, useUpdateAreaMutation, useDeleteAreaMutation,
  useTablesQuery, useCreateTableMutation, useUpdateTableMutation, useDeleteTableMutation,
  useRotateQrMutation, useTransferTableMutation, useMergeTablesMutation,
} = floorApi;
