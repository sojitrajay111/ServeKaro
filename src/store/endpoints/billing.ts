import { api } from '../api';
import { idempotencyKey } from '../baseQuery';
import type { Approval, Bill, BillStatus, Discount, Id, Paged, PaymentMode, Shift } from '@/types/api';

const billChanged = (id: Id) => [{ type: 'Bill' as const, id }, { type: 'Bill' as const, id: 'LIST' }, 'Order' as const, 'Table' as const, 'Report' as const, 'Shift' as const];

export const billingApi = api.injectEndpoints({
  endpoints: (b) => ({
    bills: b.query<Paged<Bill>, { status?: BillStatus; from?: string; to?: string; q?: string; page?: number; limit?: number } | void>({
      query: (f) => {
        const p = new URLSearchParams({ page: String(f?.page ?? 1), limit: String(f?.limit ?? 50) });
        if (f?.status) p.set('status', f.status);
        if (f?.from) p.set('from', f.from);
        if (f?.to) p.set('to', f.to);
        if (f?.q) p.set('q', f.q);
        return `/bills?${p}`;
      },
      providesTags: (r) => [{ type: 'Bill', id: 'LIST' }, ...(r?.data.map((x) => ({ type: 'Bill' as const, id: x.id })) ?? [])],
    }),
    bill: b.query<Bill, Id>({
      query: (id) => `/bills/${id}`,
      providesTags: (_r, _e, id) => [{ type: 'Bill', id }],
    }),
    createBill: b.mutation<Bill, { orderId: Id; discount?: Discount; customer?: { name?: string; phone?: string; gstin?: string }; approval?: Approval }>({
      query: (body) => ({ url: '/bills', method: 'POST', body, headers: { 'Idempotency-Key': idempotencyKey() } }),
      invalidatesTags: [{ type: 'Bill', id: 'LIST' }, 'Order', 'Table', 'Report'],
    }),
    changeDiscount: b.mutation<Bill, { id: Id; discount: Discount | null; approval?: Approval }>({
      query: ({ id, ...body }) => ({ url: `/bills/${id}/discount`, method: 'PATCH', body }),
      invalidatesTags: (_r, _e, { id }) => billChanged(id),
    }),
    addPayment: b.mutation<Bill, { id: Id; mode: PaymentMode; amount: number; reference?: string }>({
      query: ({ id, ...body }) => ({ url: `/bills/${id}/payments`, method: 'POST', body, headers: { 'Idempotency-Key': idempotencyKey() } }),
      invalidatesTags: (_r, _e, { id }) => billChanged(id),
    }),
    refundPayment: b.mutation<Bill, { id: Id; paymentId: Id; amount: number; reason: string }>({
      query: ({ id, paymentId, ...body }) => ({ url: `/bills/${id}/payments/${paymentId}/refund`, method: 'POST', body }),
      invalidatesTags: (_r, _e, { id }) => billChanged(id),
    }),
    voidBill: b.mutation<Bill, { id: Id; reason: string; approval?: Approval; reopenOrder?: boolean }>({
      query: ({ id, ...body }) => ({ url: `/bills/${id}/void`, method: 'POST', body }),
      invalidatesTags: (_r, _e, { id }) => billChanged(id),
    }),
    complimentary: b.mutation<Bill, { id: Id; reason: string; approval?: Approval }>({
      query: ({ id, ...body }) => ({ url: `/bills/${id}/complimentary`, method: 'POST', body }),
      invalidatesTags: (_r, _e, { id }) => billChanged(id),
    }),
    reprintBill: b.mutation<Bill, Id>({
      query: (id) => ({ url: `/bills/${id}/reprint`, method: 'POST' }),
      invalidatesTags: (_r, _e, id) => [{ type: 'Bill', id }],
    }),

    currentShift: b.query<Shift | null, void>({
      query: () => '/shifts/current',
      providesTags: ['Shift'],
    }),
    shifts: b.query<Paged<Shift>, { page?: number } | void>({
      query: (f) => `/shifts?page=${f?.page ?? 1}&limit=30`,
      providesTags: ['Shift'],
    }),
    openShift: b.mutation<Shift, { openingCash: number }>({
      query: (body) => ({ url: '/shifts/open', method: 'POST', body }),
      invalidatesTags: ['Shift'],
    }),
    cashMovement: b.mutation<Shift, { kind: 'in' | 'out'; amount: number; reason: string }>({
      query: (body) => ({ url: '/shifts/current/cash', method: 'POST', body }),
      invalidatesTags: ['Shift'],
    }),
    closeShift: b.mutation<Shift, { countedCash: number; denominations?: Record<string, number>; note?: string }>({
      query: (body) => ({ url: '/shifts/current/close', method: 'POST', body }),
      invalidatesTags: ['Shift', 'Report'],
    }),
  }),
});

export const {
  useBillsQuery, useBillQuery, useCreateBillMutation, useChangeDiscountMutation, useAddPaymentMutation,
  useRefundPaymentMutation, useVoidBillMutation, useComplimentaryMutation, useReprintBillMutation,
  useCurrentShiftQuery, useShiftsQuery, useOpenShiftMutation, useCashMovementMutation, useCloseShiftMutation,
} = billingApi;
