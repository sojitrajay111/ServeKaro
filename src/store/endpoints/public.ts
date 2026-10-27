import { api } from '../api';
import { idempotencyKey } from '../baseQuery';
import type { OrderItemInput, PlacedOrder, PublicMenu, PublicOutlet, QrContext, TrackedOrder } from '@/types/api';

// Customer-facing endpoints: no login.
export const publicApi = api.injectEndpoints({
  endpoints: (b) => ({
    qrContext: b.query<QrContext, string>({
      query: (qrToken) => `/public/t/${qrToken}`,
      providesTags: ['Menu'],
    }),
    publicMenu: b.query<{ outlet: PublicOutlet; menu: PublicMenu }, string>({
      query: (slug) => `/public/outlets/${slug}/menu`,
      providesTags: ['Menu'],
    }),
    placeOrder: b.mutation<PlacedOrder, { qrToken: string; customer: { name: string; phone: string }; items: OrderItemInput[]; note?: string }>({
      query: (body) => ({ url: '/public/orders', method: 'POST', body, headers: { 'Idempotency-Key': idempotencyKey() } }),
      invalidatesTags: ['Tracking'],
    }),
    trackOrder: b.query<TrackedOrder, string>({
      query: (token) => `/public/orders/${token}`,
      providesTags: (_r, _e, token) => [{ type: 'Tracking', id: token }],
    }),
    callWaiter: b.mutation<null, { qrToken: string; reason: 'waiter' | 'bill' | 'water' }>({
      query: ({ qrToken, reason }) => ({ url: `/public/t/${qrToken}/call-waiter`, method: 'POST', body: { reason } }),
    }),
  }),
});

export const {
  useQrContextQuery, usePublicMenuQuery, usePlaceOrderMutation, useTrackOrderQuery, useCallWaiterMutation,
} = publicApi;
