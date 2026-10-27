import { toast } from 'sonner';
import type { ApiError } from '@/types/api';

export const isApiError = (e: unknown): e is ApiError =>
  Boolean(e && typeof e === 'object' && 'code' in e && 'message' in e);

export const errorMessage = (e: unknown, fallback = 'Something went wrong') =>
  isApiError(e) ? e.message : fallback;

// First message for a field, for showing under an input.
export const fieldError = (e: unknown, field: string) =>
  isApiError(e) ? e.errors?.[field]?.[0] : undefined;

export const toastError = (e: unknown, fallback?: string) => toast.error(errorMessage(e, fallback));
