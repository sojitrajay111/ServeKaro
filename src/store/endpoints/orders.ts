import { api } from '../api';
import { idempotencyKey } from '../baseQuery';
import type { Approval, Id, Kot, KotStatus, Order, OrderItemInput, OrderStatus, OrderType, Paged } from '@/types/api';

export interface CreateOrderInput {
  type: OrderType;
  tableId?: Id;
  covers?: number;
  customer?: { name?: string; phone?: string };
  note?: string;
  items: OrderItemInput[];
  sendKot?: boolean;
}

export interface OrdersFilter {
  status?: OrderStatus[];
  type?: OrderType;
  tableId?: Id;
  from?: string;
  to?: string;
  page?: number;
  limit?: number;
}

const qs = (f: OrdersFilter = {}) => {
  const p = new URLSearchParams();
  if (f.status?.length) p.set('status', f.status.join(','));
  if (f.type) p.set('type', f.type);
  if (f.tableId) p.set('tableId', f.tableId);
  if (f.from) p.set('from', f.from);
  if (f.to) p.set('to', f.to);
  p.set('page', String(f.page ?? 1));
  p.set('limit', String(f.limit ?? 100));
  return p.toString();
};

const orderTags = (id: Id) => [{ type: 'Order' as const, id }, { type: 'Order' as const, id: 'LIST' }, 'Table' as const, 'Kot' as const];

export const ordersApi = api.injectEndpoints({
  endpoints: (b) => ({
    orders: b.query<Paged<Order>, OrdersFilter | void>({
      query: (f) => `/orders?${qs(f || {})}`,
      providesTags: (r) => [{ type: 'Order', id: 'LIST' }, ...(r?.data.map((o) => ({ type: 'Order' as const, id: o.id })) ?? [])],
    }),
    order: b.query<Order, Id>({
      query: (id) => `/orders/${id}`,
      providesTags: (_r, _e, id) => [{ type: 'Order', id }],
    }),
    createOrder: b.mutation<Order, CreateOrderInput>({
      query: (body) => ({ url: '/orders', method: 'POST', body, headers: { 'Idempotency-Key': idempotencyKey() } }),
      invalidatesTags: [{ type: 'Order', id: 'LIST' }, 'Table', 'Kot', 'Report'],
    }),
    addItems: b.mutation<Order, { id: Id; items: OrderItemInput[]; sendKot?: boolean }>({
      query: ({ id, ...body }) => ({ url: `/orders/${id}/items`, method: 'POST', body, headers: { 'Idempotency-Key': idempotencyKey() } }),
      invalidatesTags: (_r, _e, { id }) => orderTags(id),
    }),
    sendKot: b.mutation<Kot[], Id>({
      query: (id) => ({ url: `/orders/${id}/kot`, method: 'POST' }),
      invalidatesTags: (_r, _e, id) => orderTags(id),
    }),
    cancelItem: b.mutation<Order, { id: Id; itemId: Id; qty: number; reason: string }>({
      query: ({ id, itemId, ...body }) => ({ url: `/orders/${id}/items/${itemId}/cancel`, method: 'POST', body }),
      invalidatesTags: (_r, _e, { id }) => orderTags(id),
    }),
    updateOrder: b.mutation<Order, { id: Id; covers?: number; customer?: { name?: string; phone?: string }; note?: string; captainId?: Id }>({
      query: ({ id, ...body }) => ({ url: `/orders/${id}`, method: 'PATCH', body }),
      invalidatesTags: (_r, _e, { id }) => [{ type: 'Order', id }],
    }),
    acceptOrder: b.mutation<Order, Id>({
      query: (id) => ({ url: `/orders/${id}/accept`, method: 'POST' }),
      invalidatesTags: (_r, _e, id) => orderTags(id),
    }),
    rejectOrder: b.mutation<Order, { id: Id; reason: string }>({
      query: ({ id, reason }) => ({ url: `/orders/${id}/reject`, method: 'POST', body: { reason } }),
      invalidatesTags: (_r, _e, { id }) => orderTags(id),
    }),
    cancelOrder: b.mutation<Order, { id: Id; reason: string; approval?: Approval }>({
      query: ({ id, ...body }) => ({ url: `/orders/${id}/cancel`, method: 'POST', body }),
      invalidatesTags: (_r, _e, { id }) => [...orderTags(id), 'Report'],
    }),

    kots: b.query<Kot[], { status?: KotStatus[]; stationId?: Id } | void>({
      query: (f) => {
        const p = new URLSearchParams();
        if (f?.status?.length) p.set('status', f.status.join(','));
        if (f?.stationId) p.set('stationId', f.stationId);
        return `/kots?${p}`;
      },
      providesTags: ['Kot'],
    }),
    updateKot: b.mutation<Kot, { id: Id; status: KotStatus }>({
      query: ({ id, status }) => ({ url: `/kots/${id}`, method: 'PATCH', body: { status } }),
      invalidatesTags: ['Kot'],
    }),
    reprintKot: b.mutation<Kot, Id>({
      query: (id) => ({ url: `/kots/${id}/reprint`, method: 'POST' }),
    }),
  }),
});

export const {
  useOrdersQuery, useOrderQuery, useCreateOrderMutation, useAddItemsMutation, useSendKotMutation,
  useCancelItemMutation, useUpdateOrderMutation, useAcceptOrderMutation, useRejectOrderMutation,
  useCancelOrderMutation, useKotsQuery, useUpdateKotMutation, useReprintKotMutation,
} = ordersApi;
