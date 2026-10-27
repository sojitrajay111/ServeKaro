import { useEffect, useState } from 'react';
import { io, type Socket } from 'socket.io-client';
import { toast } from 'sonner';
import { api } from '@/store/api';
import { store } from '@/store/store';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import type { Order } from '@/types/api';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || window.location.origin;

const connect = (withAuth: boolean): Socket =>
  io(SOCKET_URL, {
    path: '/realtime',
    transports: ['websocket'],
    // A function, so every reconnect sends the latest (refreshed) token.
    ...(withAuth && { auth: (cb: (d: object) => void) => cb({ token: store.getState().session.accessToken }) }),
  });

const WAITER_REASON = { waiter: 'needs a waiter', bill: 'asked for the bill', water: 'asked for water' } as const;

/**
 * Staff screens: one connection for the admin panel. Server events invalidate
 * cached queries, so every open screen refetches what changed.
 */
export function useStaffRealtime() {
  const dispatch = useAppDispatch();
  const authed = useAppSelector((s) => s.session.status === 'authenticated');
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    if (!authed) return;
    const socket = connect(true);
    socket.on('connect', () => setConnected(true));
    socket.on('disconnect', () => setConnected(false));
    // Anything missed while offline: refetch on reconnect.
    socket.io.on('reconnect', () => dispatch(api.util.invalidateTags(['Order', 'Table', 'Kot', 'Bill'])));
    const invalidate = (...tags: Parameters<typeof api.util.invalidateTags>[0]) => dispatch(api.util.invalidateTags(tags));

    socket.on('order.created', (order: Order) => {
      invalidate({ type: 'Order', id: 'LIST' }, 'Table', 'Report');
      if (order.status === 'awaiting_acceptance') {
        toast.info(`New QR order #${order.orderNo}${order.tableName ? ` · ${order.tableName}` : ''}`, { duration: 10_000 });
      }
    });
    socket.on('order.updated', (order: Order) => {
      invalidate({ type: 'Order', id: order.id }, { type: 'Order', id: 'LIST' }, 'Table');
      if (order.items.some((i) => i.status === 'awaiting_acceptance')) {
        toast.info(`More items from ${order.tableName ?? `order #${order.orderNo}`} need accepting`);
      }
    });
    socket.on('kot.created', () => invalidate('Kot'));
    socket.on('kot.updated', () => invalidate('Kot', { type: 'Order', id: 'LIST' }));
    socket.on('table.updated', () => invalidate('Table'));
    socket.on('bill.updated', () => invalidate({ type: 'Bill', id: 'LIST' }, 'Order', 'Table', 'Report', 'Shift'));
    socket.on('menu.stock', () => invalidate('Menu'));
    socket.on('waiter.called', (e: { tableName: string; reason: keyof typeof WAITER_REASON }) => {
      toast.warning(`${e.tableName} ${WAITER_REASON[e.reason]}`, { duration: 15_000 });
    });
    socket.on('connect_error', (err) => {
      // Token expired between refreshes: the next API call refreshes it, and
      // socket.io retries with the new one.
      if (err.message !== 'UNAUTHENTICATED') console.warn('[realtime]', err.message);
    });

    return () => { socket.close(); setConnected(false); };
  }, [authed, dispatch]);

  return connected;
}

/** Kitchen screen for one station: also receives that station's KOTs. */
export function useStationRoom(stationId: string | null) {
  const authed = useAppSelector((s) => s.session.status === 'authenticated');
  useEffect(() => {
    if (!authed || !stationId) return;
    const socket = connect(true);
    socket.on('connect', () => socket.emit('join:station', { stationId }));
    return () => { socket.close(); };
  }, [authed, stationId]);
}

/** Customer tracking page: refetch the order whenever the kitchen or cashier updates it. */
export function useOrderTracking(trackingToken: string | undefined) {
  const dispatch = useAppDispatch();
  useEffect(() => {
    if (!trackingToken) return;
    const socket = connect(false);
    const refresh = () => dispatch(api.util.invalidateTags([{ type: 'Tracking', id: trackingToken }]));
    socket.on('connect', () => socket.emit('join:order', { trackingToken }));
    socket.on('kot.updated', refresh);
    socket.on('order.updated', refresh);
    socket.on('bill.updated', refresh);
    return () => { socket.close(); };
  }, [trackingToken, dispatch]);
}

/** Customer menu: grey out items the moment they're marked sold out. */
export function useMenuStock(slug: string | undefined) {
  const dispatch = useAppDispatch();
  useEffect(() => {
    if (!slug) return;
    const socket = connect(false);
    socket.on('connect', () => socket.emit('join:menu', { slug }));
    socket.on('menu.stock', () => dispatch(api.util.invalidateTags(['Menu'])));
    return () => { socket.close(); };
  }, [slug, dispatch]);
}
