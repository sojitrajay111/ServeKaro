import { createApi } from '@reduxjs/toolkit/query/react';
import { baseQuery } from './baseQuery';

// Endpoints are injected per area from ./endpoints/*. Realtime events
// (hooks/useRealtime) invalidate these tags so screens refresh on their own.
export const api = createApi({
  reducerPath: 'api',
  baseQuery,
  tagTypes: [
    'Me', 'Menu', 'Table', 'Area', 'Order', 'Kot', 'Bill', 'Shift', 'Report',
    'Staff', 'Role', 'Outlet', 'Restaurant', 'TaxGroup', 'Device', 'Audit', 'Tracking',
  ],
  refetchOnReconnect: true,
  endpoints: () => ({}),
});
