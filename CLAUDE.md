# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

ServeKaro frontend: a React 18 + TypeScript + Vite SPA (shadcn/ui, Tailwind) for a restaurant QR menu, ordering and POS platform. Two audiences:

- **Customers**: scan a table QR → `/menu/:restaurantId/:tableId` → browse, add to cart, place order → track it on `/my-orders`
- **Staff** (`/admin/*`, behind `ProtectedRoute`): dashboard, live tables, kitchen display, order taking + billing, menu management, waiters, QR codes, analytics, settings (settings requires `role === 'admin'`)

The current backend is an ASP.NET Core API at `http://menubackend.runasp.net` (free hosting, cold-starts slowly; wait ~30s and refresh if the first request times out). A replacement NestJS backend is being built in the separate `ServeKaro-Backend` repo, so keep the API contract centralised (see below) rather than spreading URLs across components.

## Commands

```bash
npm install
npm run dev        # http://localhost:8080 (vite.config.ts sets port 8080, host "::")
npm run build
npm run build:dev  # development-mode build
npm run lint       # eslint .
npm run preview
```

There is no test runner configured. `package-lock.json`, `yarn.lock` and `bun.lockb` all exist; use npm and don't regenerate the others.

Useful URLs in dev: `/menu/bella-vista`, `/menu/bella-vista/1` (with table), `/admin/login`.

## API wiring

`VITE_API_BASE_URL` is `/api` (in `.env`). Requests stay same-origin and are proxied to the backend: by Vite's dev proxy (`/api` and the `/orderHub` websocket) and by `vercel.json` rewrites in production. Change the backend target in **both** places.

There are two HTTP layers, intentionally:

| Layer | Files | Used for |
|---|---|---|
| RTK Query | `src/store/api.ts` (base slice), `src/store/menuApi.ts` (`injectEndpoints`) | Menu categories/items: queries for the customer menu, mutations for admin menu management |
| fetch wrapper | `src/services/api.ts` (`api.get/post/upload…`), `src/services/apiService.ts` (`authApi`, `settingsApi`, `menuApi`, `tableApi`, `orderApi`, `reviewApi`, `analyticsApi`, `publicMenuApi`) | Everything else |

- URL strings for the fetch layer live in `src/services/endpoints.ts`; add new ones there.
- Both layers read the JWT from `localStorage.authToken` and, on 401, clear it and redirect to `/admin/login` only when on an `/admin` path (customer pages must not redirect).
- `api.ts` tolerates empty/plain-text success bodies (the backend returns strings like "Settings updated successfully").
- The backend expects `CategoryID` (capital ID) as the items query param, not `categoryId`.
- `apiService.ts` and the contexts use `any` freely; TS `strict` and `noImplicitAny` are off.

## State and data flow

Provider order in `src/App.tsx`: Redux `Provider` → `AuthProvider` → `OrdersProvider` → `SearchProvider` → `RestaurantProvider` → `MenuProvider` → `CartProvider` → `BrowserRouter`. Providers can only use contexts above them (e.g. `OrdersProvider` uses `useAuth`). `CartSidebar` and `FloatingCartButton` are rendered globally inside `BrowserRouter`, and `CheckoutModal` derives `tableId` from the URL path.

- **AuthContext**: real login via `authApi.login`; user cached in `localStorage.restaurantUser` with an 8-hour expiry (`loginTime`). Roles: `admin` | `manager`; waiters/staff are created via `/Auth/create-waiter`.
- **RestaurantContext**: the backend is effectively **single-restaurant**. `settingsApi.get()` (`/Settings`) supplies the one restaurant, with id hard-coded to `'restaurant-001'` (also used in `OrdersContext` and `apiService`). It falls back to a local "Bella Vista" if the call fails. The `:restaurantId` slug in menu URLs is resolved against this list.
- **OrdersContext**: active orders come from `orderApi.getOrders()` when authenticated, plus live updates from SignalR (`src/hooks/useOrderHub.ts`: `ReceiveNewOrder`, `ReceiveStatusUpdate`, invokes `JoinAdminGroup`). `submitOrder` POSTs a `PlaceOrderDTO` (`tableId` numeric or `null` for takeaway). Statuses are lower-cased from the backend's `Pending/Preparing/Ready/…`; `completed`/`cancelled` are dropped from active orders. A client-only `browsing` status marks a table that has a cart open. `customerOrders` (shown on `/my-orders`) is plain in-memory state: not persisted, and only updated by the hub, which connects only for authenticated staff.
- **MenuContext**: wraps the RTK Query menu data in a local-shape `MenuItem` for older components (`CartSidebar`, `OrderTakingDashboard`, `AdminDashboard`, etc.).
- **SalesAnalytics** builds its Recharts charts client-side from `useOrders()` data (not from `analyticsApi`).

### API item → `MenuCard` mapping

API `MenuItem` and `MenuContext.MenuItem` differ. When passing an API item to `<MenuCard>`:

```tsx
item={{
  ...item,
  popular: item.isPopular,
  new: item.isNewItem,
  chefRecommended: item.isChefsChoice,
  dietaryInfo: { vegetarian: item.isVeg, vegan: false, glutenFree: false, dairyFree: false, spicy: false },
  images: item.images || []
}}
```

### Tax

Read the rate from `currentRestaurant?.settings.taxRate` (a percentage, so divide by 100). Don't hard-code it in components. `RestaurantContext` currently sets it to `8.75` because `/Settings` doesn't return one yet.

## Conventions

- New pages go in `src/pages/` (customer) or `src/pages/admin/` and get a route in `App.tsx`; admin pages nest under the `/admin` route so they inherit `ProtectedRoute` + `AdminLayout`.
- Notifications: `toast` from `sonner`. Don't use `alert()`/`window.confirm()`.
- Styling: Tailwind with CSS-variable colours (`bg-background`, `text-primary`, `text-accent`…; tokens in `src/index.css` and `src/styles/colors.css`). No hex values or inline styles. Custom classes in `index.css`: `pill-button`, `pill-button-active`, `glass-card`, `scrollbar-hide`.
- `src/components/ui/` is generated shadcn/ui code (`components.json`); add components with the shadcn CLI rather than hand-writing them.
- Import via the `@/` alias (→ `src/`).
- `MenuBackend API.postman_collection.json` documents the current backend endpoints.
