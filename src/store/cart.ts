import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { Id, OrderItemInput } from '@/types/api';

// The customer's QR cart. Lines keep display info (name, price) for the cart
// UI, but only OrderItemInput fields are sent: the server prices the order.
export interface CartLine extends OrderItemInput {
  key: string;
  name: string;
  variantName?: string;
  addons: { id: Id; name: string; price: number }[];
  unitPrice: number;
}

export interface PlacedRef { trackingToken: string; orderNo: number; tableName?: string; at: string }

interface CartState {
  qrToken: string | null;
  lines: CartLine[];
  customer: { name: string; phone: string };
  placed: PlacedRef[];
}

const KEY = 'sk.cart';

const load = (): CartState => {
  const empty: CartState = { qrToken: null, lines: [], customer: { name: '', phone: '' }, placed: [] };
  try {
    return { ...empty, ...JSON.parse(localStorage.getItem(KEY) || '{}') };
  } catch {
    return empty;
  }
};

export const lineKey = (l: Pick<CartLine, 'itemId' | 'variantId' | 'addonIds' | 'note'>) =>
  [l.itemId, l.variantId ?? '', [...(l.addonIds ?? [])].sort().join('+'), l.note ?? ''].join('|');

const cart = createSlice({
  name: 'cart',
  initialState: load,
  reducers: {
    // Scanning a different table's QR starts a fresh cart.
    tableScanned(state, action: PayloadAction<string>) {
      if (state.qrToken !== action.payload) {
        state.qrToken = action.payload;
        state.lines = [];
      }
    },
    added(state, action: PayloadAction<Omit<CartLine, 'key'>>) {
      const key = lineKey(action.payload);
      const existing = state.lines.find((l) => l.key === key);
      if (existing) existing.qty = Math.min(50, existing.qty + action.payload.qty);
      else state.lines.push({ ...action.payload, key });
    },
    qtyChanged(state, action: PayloadAction<{ key: string; qty: number }>) {
      const line = state.lines.find((l) => l.key === action.payload.key);
      if (!line) return;
      if (action.payload.qty <= 0) state.lines = state.lines.filter((l) => l.key !== action.payload.key);
      else line.qty = Math.min(50, action.payload.qty);
    },
    cleared(state) {
      state.lines = [];
    },
    customerSaved(state, action: PayloadAction<{ name: string; phone: string }>) {
      state.customer = action.payload;
    },
    orderPlaced(state, action: PayloadAction<PlacedRef>) {
      state.lines = [];
      state.placed = [action.payload, ...state.placed.filter((p) => p.trackingToken !== action.payload.trackingToken)].slice(0, 20);
    },
  },
});

export const { tableScanned, added, qtyChanged, cleared, customerSaved, orderPlaced } = cart.actions;
export default cart.reducer;

export const persistCart = (state: { cart: CartState }) => {
  try { localStorage.setItem(KEY, JSON.stringify(state.cart)); } catch { /* private mode */ }
};

export const cartCount = (lines: CartLine[]) => lines.reduce((s, l) => s + l.qty, 0);
export const cartSubtotal = (lines: CartLine[]) =>
  lines.reduce((s, l) => s + (l.unitPrice + l.addons.reduce((a, x) => a + x.price, 0)) * l.qty, 0);
