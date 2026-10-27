import { fetchBaseQuery, retry, type BaseQueryFn, type FetchArgs, type FetchBaseQueryError } from '@reduxjs/toolkit/query/react';
import type { ApiError } from '@/types/api';
import { tokenRefreshed, signedOut, type SessionState } from './session';

export const API_URL = import.meta.env.VITE_API_BASE_URL || '/api/v1';

const raw = fetchBaseQuery({
  baseUrl: API_URL,
  credentials: 'include', // refresh cookie
  prepareHeaders: (headers, { getState }) => {
    const { accessToken, outletId } = (getState() as { session: SessionState }).session;
    if (accessToken && !headers.has('authorization')) headers.set('authorization', `Bearer ${accessToken}`);
    if (outletId && !headers.has('x-outlet-id')) headers.set('x-outlet-id', outletId);
    return headers;
  },
});

const toApiError = (e: FetchBaseQueryError): ApiError => {
  if (typeof e.status === 'number') {
    const body = (e.data ?? {}) as Partial<ApiError>;
    return { status: e.status, code: body.code || 'ERROR', message: body.message || 'Something went wrong', errors: body.errors };
  }
  const message = e.status === 'FETCH_ERROR' ? 'Cannot reach the server. Check your internet.' : 'Something went wrong';
  return { status: e.status, code: e.status, message };
};

// Successful responses are { success, data, meta? }. Hand components `data`
// (or { data, meta } for paged lists).
const unwrap = (body: unknown) => {
  if (body && typeof body === 'object' && 'success' in body) {
    const b = body as unknown as { data: unknown; meta?: unknown };
    return b.meta ? { data: b.data, meta: b.meta } : b.data;
  }
  return body;
};

// One refresh at a time; parallel 401s wait for the same promise.
let refreshing: Promise<boolean> | null = null;

const NO_REFRESH = ['/auth/login', '/auth/signup', '/auth/refresh', '/auth/pin-login', '/auth/reset-password', '/auth/forgot-password'];

const withAuth: BaseQueryFn<string | FetchArgs, unknown, FetchBaseQueryError> = async (args, api, extra) => {
  let result = await raw(args, api, extra);
  const url = typeof args === 'string' ? args : args.url;

  if (result.error?.status === 401 && !NO_REFRESH.some((p) => url.startsWith(p))) {
    refreshing ??= (async () => {
      const r = await raw({ url: '/auth/refresh', method: 'POST' }, api, extra);
      const token = (r.data as { data?: { accessToken?: string } })?.data?.accessToken;
      if (token) api.dispatch(tokenRefreshed(token));
      else api.dispatch(signedOut());
      return Boolean(token);
    })().finally(() => { refreshing = null; });

    if (await refreshing) result = await raw(args, api, extra);
  }
  return result;
};

// Retry network failures only where repeating is safe: reads, and writes that
// carry an Idempotency-Key (the server dedupes them).
const withRetry = retry(
  async (args: string | FetchArgs, api, extra) => {
    const result = await withAuth(args, api, extra);
    if (result.error) {
      const a: FetchArgs = typeof args === 'string' ? { url: args, method: 'GET' } : args;
      const method = (a.method || 'GET').toUpperCase();
      const safe = method === 'GET' || Boolean((a.headers as Record<string, string> | undefined)?.['Idempotency-Key']);
      // Returning the error makes retry() try again; fail() stops it.
      if (result.error.status !== 'FETCH_ERROR' || !safe) retry.fail(result.error, result.meta);
    }
    return result;
  },
  { maxRetries: 2 },
);

export const baseQuery: BaseQueryFn<string | FetchArgs, unknown, ApiError> = async (args, api, extra) => {
  const result = await withRetry(args, api, extra);
  if (result.error) return { error: toApiError(result.error as FetchBaseQueryError), meta: result.meta };
  return { data: unwrap(result.data), meta: result.meta };
};

export const idempotencyKey = () =>
  (globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`);
