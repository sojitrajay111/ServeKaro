import { configureStore } from '@reduxjs/toolkit';
import { setupListeners } from '@reduxjs/toolkit/query';
import { api } from './api';
import session from './session';
import cart, { persistCart } from './cart';

export const store = configureStore({
  reducer: {
    session,
    cart,
    [api.reducerPath]: api.reducer,
  },
  middleware: (getDefaultMiddleware) => getDefaultMiddleware().concat(api.middleware),
});

// refetchOnFocus / refetchOnReconnect
setupListeners(store.dispatch);

let lastCart = store.getState().cart;
store.subscribe(() => {
  const state = store.getState();
  if (state.cart !== lastCart) {
    lastCart = state.cart;
    persistCart(state);
  }
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
