# CLAUDE.md — MenuTech Frontend

This file gives Claude Code the context needed to work effectively in this codebase. Read it before making changes.

---

## What This Project Is

A React/TypeScript SPA for a restaurant digital menu platform. Two audiences:

1. **Customers** — scan a QR code → browse the menu → add items to cart → checkout
2. **Restaurant admins** — manage menu items, tables, QR codes, view orders

Backend: ASP.NET Core at `http://menubackend.runasp.net/api`. It may be unreachable (free hosting sleeps). All public menu endpoints (`/Menu/*`) are the only ones currently integrated.

---

## Architecture Decisions

### Two API Layers (don't consolidate without discussion)
There are intentionally two HTTP layers:

| Layer | File | Used for |
|---|---|---|
| RTK Query | `src/store/api.ts` + `src/store/menuApi.ts` | Customer menu pages — categories, items, search |
| fetch wrapper | `src/services/api.ts` + `src/services/apiService.ts` | Auth, restaurants, orders, reviews |

`src/services/endpoints.ts` centralises all URL strings for the fetch layer. Always update it when adding new endpoints to that layer.

### Context vs Redux
- **Redux/RTK Query** — server data (menu items, categories) with caching
- **React Context** — client state (cart, auth session, current restaurant, active orders)
- Do not move Context state into Redux or vice versa without good reason

### OrdersContext — localStorage + cross-tab sync
`src/contexts/OrdersContext.tsx` stores active table orders in localStorage and syncs across tabs via the `storage` event. This is intentional — it lets the customer-facing menu tab and the admin order dashboard tab see the same orders in real-time without a WebSocket.

---

## Key Files

| File | Purpose |
|---|---|
| `src/App.tsx` | Provider tree + route definitions. `CartSidebar` must stay inside `BrowserRouter` (uses `useParams` via `CheckoutModal`) |
| `src/store/menuApi.ts` | RTK Query endpoints. `CategoryID` (capital ID) is required by the backend — not `categoryId` |
| `src/contexts/RestaurantContext.tsx` | Hardcoded demo restaurants (Bella Vista, Golden Dragon) + tables. `loadRestaurantBySlug` sets `currentRestaurant` in context AND returns the restaurant |
| `src/contexts/AuthContext.tsx` | Demo-mode auth. Credentials hardcoded. No real API called |
| `src/pages/RestaurantMenu.tsx` | Main customer page. Reads categories + items via RTK Query. Search uses `useSearchMenuItemsQuery` with `skip` option |
| `src/pages/admin/OrderTakingDashboard.tsx` | Admin order flow. Orders submitted locally only (`// TODO: Send to API` at line 147) |
| `src/components/customer/CheckoutModal.tsx` | Checkout form. Order is simulated (setTimeout). No API call |
| `src/index.css` | Defines `pill-button`, `pill-button-active`, `glass-card` custom classes |

---

## What's Real vs Mocked

### Hits the Backend
- `GET /Menu/categories` — fetched on every menu page load
- `GET /Menu/items?CategoryID=N` — fetched per category section
- `GET /Menu/items/search?q=` — fired when search query >= 2 chars
- `GET /Menu/items/:id`, `GET /Menu/items/featured` — available but rarely called

### Fully Mocked / Not Wired
- Auth — hardcoded demo credentials in `AuthContext`
- Restaurant data — hardcoded in `RestaurantContext` (Bella Vista, Golden Dragon)
- Orders — localStorage only
- Admin settings save — UI only, no API call
- Analytics stats — random/hardcoded numbers
- Image uploads — UI only, `<input type="file">` with no handler
- Notifications — placeholder
- Reviews — simulated with setTimeout
- QR scan tracking — random numbers

---

## Incomplete Pages (don't waste time polishing internals)

| Page | Status |
|---|---|
| `SalesAnalytics.tsx` | Returns null — completely empty stub |
| `About.tsx` | Hardcoded to "Bella Vista" — needs restaurant context wiring |
| `Footer.tsx` | Hardcoded to "Bella Vista" — needs restaurant context wiring |
| `Header.tsx` | Restaurant name hardcoded — needs restaurant context |
| `MobileSidebar.tsx` | Hardcoded content |
| `PromotionalBanner.tsx` | 3 hardcoded promotions, no admin management |
| `TrendingSection.tsx` | Views/likes are random numbers |
| `RestaurantReviewSection.tsx` | 4.8 rating and all reviews are hardcoded fallback |

---

## Patterns in Use

### Adding a New RTK Query Endpoint
1. Add the endpoint in `src/store/menuApi.ts` using `api.injectEndpoints`
2. Export the hook
3. Call the hook in the component with `{ skip: condition }` if conditional

### Adding a New Page
1. Create in `src/pages/`
2. Add the route in `src/App.tsx`
3. If admin-only, wrap with `<ProtectedRoute>` and nest under the `/admin` parent route

### Toast Notifications
Use `toast` from `sonner` (already installed). Never use `alert()` or `window.confirm()`.
```tsx
import { toast } from 'sonner';
toast.success('Done!');
toast.error('Something failed.');
```

### Tax Rate
Always read from restaurant settings — never hardcode a number:
```tsx
const { currentRestaurant } = useRestaurant();
const taxRate = (currentRestaurant?.settings.taxRate ?? 8.5) / 100;
```
`settings.taxRate` is stored as a percentage (e.g. `8.75` = 8.75%), so divide by 100 to get the multiplier.

### Menu Item Mapping (RestaurantMenu + OrderTakingDashboard)
The API `MenuItem` shape differs from the `MenuContext.MenuItem` shape. When passing an API item to `<MenuCard>`, map the fields:
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

---

## TypeScript Notes

- Strict mode is NOT enabled. Many components use `any` for API responses in `apiService.ts`.
- `CategorySection` in `RestaurantMenu.tsx` must be typed: `{ category: { categoryId: number; categoryName: string } }`
- The backend uses `CategoryID` (capital ID) as a query param — see `menuApi.ts` line 76

---

## CSS / Styling

- Tailwind CSS with shadcn/ui component library
- Custom utility classes in `src/index.css`:
  - `.pill-button` — rounded category filter button
  - `.pill-button-active` — selected state for pill buttons
  - `.glass-card` — semi-transparent card used in MenuCard
  - `.scrollbar-hide` — hides scrollbar while keeping scroll functionality
- Do not add inline styles. Use Tailwind classes.
- The colour palette is CSS variable–driven (defined in `index.css`) — use `text-foreground`, `bg-background`, `text-primary`, etc., not hardcoded hex values.

---

## Missing Features (Backlog)

High priority gaps to implement:

1. **SalesAnalytics page** — wire up Recharts with real order data
2. **Order API integration** — `OrderTakingDashboard` and `CheckoutModal` need to POST orders to backend
3. **Image upload** — `RestaurantSignUp` Step 3 and `AdminSettings` branding section
4. **MenuManagement edit/delete** — `EditItemModal` save + delete/toggle API calls
5. **AdminSettings save** — PUT to `/restaurants/:id/settings` and `/restaurants/:id`
6. **Dynamic Header/Footer/About** — replace hardcoded "Bella Vista" with `currentRestaurant` from context
7. **PromotionalBanner admin** — add promotion management to AdminSettings
8. **Real auth** — replace demo credentials with actual `/auth/login` API call
9. **Pagination** — MenuManagement item list needs it for large menus
10. **Error boundaries** — no error boundaries exist; unhandled promise rejections will crash pages silently

---

## Running Locally

```bash
yarn install
yarn dev       # http://localhost:5173
yarn build     # production build
yarn preview   # serve the production build locally
```

If the backend is sleeping (first request times out), wait ~30s and refresh — somee.com free hosting cold-starts slowly.

Test URLs after `yarn dev`:
- Customer menu: `http://localhost:5173/menu/bella-vista`
- Customer menu with table: `http://localhost:5173/menu/bella-vista/1`
- Admin login: `http://localhost:5173/admin/login`
