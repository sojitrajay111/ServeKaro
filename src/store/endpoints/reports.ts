import { api } from '../api';
import { API_URL } from '../baseQuery';
import type { AuditEntry, Dashboard, DayEnd, Id, ItemRow, Paged, PaymentRow, SalesRow, TaxReport } from '@/types/api';

export interface Range { from: string; to: string }
const range = ({ from, to }: Range) => `from=${from}&to=${to}`;

export const reportsApi = api.injectEndpoints({
  endpoints: (b) => ({
    dashboard: b.query<Dashboard, string | void>({
      query: (date) => `/reports/dashboard${date ? `?date=${date}` : ''}`,
      providesTags: ['Report'],
    }),
    salesReport: b.query<SalesRow[], Range>({
      query: (r) => `/reports/sales?${range(r)}`,
      providesTags: ['Report'],
    }),
    paymentsReport: b.query<PaymentRow[], Range>({
      query: (r) => `/reports/payments?${range(r)}`,
      providesTags: ['Report'],
    }),
    itemsReport: b.query<ItemRow[], Range & { categoryId?: Id }>({
      query: ({ categoryId, ...r }) => `/reports/items?${range(r)}${categoryId ? `&categoryId=${categoryId}` : ''}`,
      providesTags: ['Report'],
    }),
    categoriesReport: b.query<ItemRow[], Range>({
      query: (r) => `/reports/categories?${range(r)}`,
      providesTags: ['Report'],
    }),
    taxReport: b.query<TaxReport, Range>({
      query: (r) => `/reports/tax?${range(r)}`,
      providesTags: ['Report'],
    }),
    dayEnd: b.query<DayEnd, string | void>({
      query: (date) => `/day-end${date ? `?date=${date}` : ''}`,
      providesTags: ['Report', 'Shift'],
    }),
    auditLogs: b.query<Paged<AuditEntry>, { action?: string; page?: number } | void>({
      query: (f) => `/audit-logs?page=${f?.page ?? 1}&limit=50${f?.action ? `&action=${f.action}` : ''}`,
      providesTags: ['Audit'],
    }),
  }),
});

export const {
  useDashboardQuery, useSalesReportQuery, usePaymentsReportQuery, useItemsReportQuery,
  useCategoriesReportQuery, useTaxReportQuery, useDayEndQuery, useAuditLogsQuery,
} = reportsApi;

// CSV export: a file download, not cached data, so plain fetch with the token.
export async function downloadCsv(report: string, r: Range, token: string | null, outletId: string | null) {
  const res = await fetch(`${API_URL}/reports/${report}?${range(r)}&format=csv`, {
    credentials: 'include',
    headers: { ...(token && { Authorization: `Bearer ${token}` }), ...(outletId && { 'X-Outlet-Id': outletId }) },
  });
  if (!res.ok) throw new Error('Export failed');
  const url = URL.createObjectURL(await res.blob());
  const a = Object.assign(document.createElement('a'), { href: url, download: `${report}-${r.from}-${r.to}.csv` });
  a.click();
  URL.revokeObjectURL(url);
}
