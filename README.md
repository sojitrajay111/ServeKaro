# MenuTech — Restaurant Digital Menu Platform

A React/TypeScript frontend for a multi-restaurant digital menu and ordering system. Customers browse menus by QR code, add items to a cart, and place orders. Restaurant staff manage menus, tables, QR codes, and orders through a protected admin panel.

**Backend:** `http://menubackend.runasp.net/api` (ASP.NET Core — hosted on somee.com, may sleep on inactivity)

---

## Tech Stack

| Layer | Library |
|---|---|
| Framework | React 18 + TypeScript + Vite |
| Routing | React Router v6 |
| State | Redux Toolkit + RTK Query |
| UI | shadcn/ui + Tailwind CSS |
| Animations | Framer Motion |
| Icons | Lucide React |
| Forms | React Hook Form + Zod |
| Charts | Recharts |
| Toasts | Sonner |
| SEO | react-helmet-async |

---

## Quick Start

```bash
# Install dependencies
yarn install

# Start dev server (proxies /api → backend)
yarn dev

# Production build
yarn build
```

The dev server proxies all `/api/*` requests to the ASP.NET backend via Vite config.

---

## Environment Variables

Create a `.env.local` file:

```env
# Override the backend URL (optional — defaults below are used if not set)
VITE_API_BASE_URL=http://menubackend.runasp.net/api

# Google Places ID for review submission
VITE_GOOGLE_PLACE_ID=your_place_id_here
```

In dev mode, requests go to `/api` (Vite proxy). In production, they go directly to `VITE_API_BASE_URL`.

---

## Project Structure

```
src/
├── App.tsx                    # Root — providers + routing
├── main.tsx
├── index.css                  # Global styles + pill-button CSS class
│
├── pages/
│   ├── LandingPage.tsx        # Marketing homepage (/, fully static)
│   ├── RestaurantMenu.tsx     # Customer menu (/menu/:restaurantId/:tableId?)
│   ├── RestaurantSignUp.tsx   # Restaurant onboarding (/signup)
│   ├── About.tsx              # About page — HARDCODED to Bella Vista
│   ├── Menu.tsx               # Legacy menu page (/menu)
│   ├── Index.tsx              # Legacy demo page (/demo)
│   └── admin/
│       ├── AdminLayout.tsx    # Sidebar + header shell for all admin pages
│       ├── AdminDashboard.tsx # Overview stats + quick actions
│       ├── MenuManagement.tsx # CRUD for menu items (partial API)
│       ├── OrderTakingDashboard.tsx  # Table-based order taking
│       ├── QRCodesPage.tsx    # QR code generation + management
│       ├── AdminSettings.tsx  # Restaurant config + table management
│       ├── SalesAnalytics.tsx # STUB — returns null
│       └── LoginPage.tsx      # Admin login with demo credentials
│
├── components/
│   ├── Header.tsx             # Customer nav bar
│   ├── Footer.tsx             # Customer footer — HARDCODED
│   ├── MenuCard.tsx           # Menu item card (image left, info right)
│   ├── MobileSidebar.tsx      # Mobile slide-out nav — HARDCODED
│   ├── ProtectedRoute.tsx     # Auth guard for /admin routes
│   ├── QRGenerator.tsx        # QR code modal (uses qrserver.com API)
│   └── customer/
│       ├── CartSidebar.tsx    # Right-side cart drawer
│       ├── CheckoutModal.tsx  # Order form (dine-in/takeout/delivery)
│       ├── ReviewModal.tsx    # Customer feedback form
│       ├── PromotionalBanner.tsx  # Rotating promo banner — HARDCODED
│       ├── TrendingSection.tsx    # Popular/new items tabs — MOCKED stats
│       ├── MenuLegend.tsx         # Icon legend (veg, spicy, etc.)
│       └── RestaurantReviewSection.tsx  # Reviews display
│
├── contexts/
│   ├── AuthContext.tsx         # Login state + localStorage session
│   ├── RestaurantContext.tsx   # Current restaurant + tables (demo data)
│   ├── MenuContext.tsx         # Menu items + categories (demo + API)
│   ├── CartContext.tsx         # Cart items + open/close state
│   ├── OrdersContext.tsx       # Active orders (localStorage + cross-tab sync)
│   └── SearchContext.tsx       # Global search state
│
├── store/
│   ├── store.ts               # Redux store config
│   ├── api.ts                 # RTK Query base API (baseUrl + auth headers)
│   └── menuApi.ts             # RTK Query endpoints: categories, items, search
│
└── services/
    ├── api.ts                 # fetch-based HTTP client (used by apiService.ts)
    ├── apiService.ts          # High-level service functions (auth, restaurant, menu, orders, reviews)
    ├── backendApiService.ts   # Thin wrapper for Google Review submission
    └── endpoints.ts           # Centralized URL definitions
```

---

## Routes

| Path | Page | Auth |
|---|---|---|
| `/` | Landing page | Public |
| `/signup` | Restaurant onboarding | Public |
| `/menu/:restaurantId` | Customer menu | Public |
| `/menu/:restaurantId/:tableId` | Customer menu (table-specific) | Public |
| `/demo` | Legacy demo menu | Public |
| `/menu` | Legacy menu page | Public |
| `/about` | About page | Public |
| `/admin/login` | Admin login | Public |
| `/admin` | Dashboard | Admin |
| `/admin/menu` | Menu management | Admin |
| `/admin/orders` | Order taking | Admin |
| `/admin/qr-codes` | QR codes | Admin |
| `/admin/settings` | Settings (admin role only) | Admin |

---

## Authentication

Auth is **demo-mode only** — credentials are hardcoded in `AuthContext.tsx`. No real backend auth is called. Session persists 8 hours via `localStorage`.

**Demo credentials:**

| Restaurant | Email | Password | Role |
|---|---|---|---|
| Bella Vista | admin@bellavista.com | admin123 | admin |
| Bella Vista | manager@bellavista.com | manager123 | manager |
| Golden Dragon | admin@goldendragon.com | admin123 | admin |
| Golden Dragon | manager@goldendragon.com | manager123 | manager |

---

## API Integration — What's Real vs Mocked

### Real (hits backend via RTK Query)
| Endpoint | Used By |
|---|---|
| `GET /Menu/categories` | RestaurantMenu, OrderTakingDashboard, MenuManagement |
| `GET /Menu/items?CategoryID=N` | RestaurantMenu, OrderTakingDashboard |
| `GET /Menu/items/search?q=` | RestaurantMenu search bar |
| `GET /Menu/items/:id` | menuApi |
| `GET /Menu/items/featured` | menuApi |

### Mocked / Not Wired
| Feature | Status |
|---|---|
| Auth (login/logout) | Hardcoded demo credentials |
| Restaurant CRUD | In-memory `RestaurantContext` only |
| Order submission | localStorage via `OrdersContext` only |
| Admin settings save | No API call — shows alert |
| Analytics/stats | Hardcoded numbers |
| QR scan tracking | Random numbers |
| Review submission | Simulated with setTimeout |
| Image upload | UI only — no file handling |
| Notifications | Placeholder dropdown |

---

## Order Flow

1. Customer scans QR → `/menu/:restaurantId/:tableId`
2. Browses categories → clicks MenuCard → added to `CartContext`
3. Cart sidebar opens → `CheckoutModal` collects customer info
4. On submit → order stored in `OrdersContext` (localStorage)
5. Admin sees order in `OrderTakingDashboard` (cross-tab via storage event)
6. Admin updates status: pending → preparing → ready → complete

> Orders do **not** hit the backend API yet. The `// TODO: Send to API` comment in `OrderTakingDashboard.tsx:147` marks the integration point.

---

## Known Issues & Missing Features

### Broken / Incomplete
- `SalesAnalytics.tsx` — completely empty, returns null
- `About.tsx`, `Footer.tsx`, `Header.tsx`, `MobileSidebar.tsx` — hardcoded to "Bella Vista"
- Image upload in `RestaurantSignUp` and `AdminSettings` — UI only, no file handling
- `EditItemModal` — opens but save is not wired to API
- Menu item delete/toggle in `MenuManagement` — shows confirm but no API call
- `AdminSettings` save — no API call
- Google Reviews — stubbed, `VITE_GOOGLE_PLACE_ID` must be set and backend must support it

### UI / UX Gaps
- `PromotionalBanner` — all promotions hardcoded, no admin management
- `TrendingSection` — views/likes are random, "Today's Special" hardcoded
- `RestaurantReviewSection` — reviews and 4.8 rating hardcoded as fallback
- `NotFound.tsx` — minimal, no illustration or suggestions
- No dark mode toggle
- No pagination on large item lists

### Not Yet Built
- `SalesAnalytics` page (stub exists at `/admin/analytics` but not routed)
- Customer accounts / login
- Payment processing
- Reservation system
- Push notifications
- Offline / PWA support
- Multi-language (i18n)

---

## State Management

Two parallel API layers exist (legacy fetch-based + RTK Query). Customer-facing menu pages use **RTK Query** via `store/menuApi.ts`. Admin and auth flows use the **fetch-based** `services/api.ts` + `services/apiService.ts`.

```
RTK Query (store/menuApi.ts)   →  /Menu/* public endpoints
fetch-based (services/api.ts)  →  /auth/*, /restaurants/*, /orders/*, etc.
```

Contexts handle non-API state:
- `RestaurantContext` — current restaurant + tables (demo data, not fetched)
- `CartContext` — shopping cart
- `OrdersContext` — active orders with localStorage persistence + cross-tab sync
- `AuthContext` — session management

---

## Development Notes

- Run `yarn dev` — backend URL must be reachable or menu data will show empty (categories/items come from backend)
- The backend may be sleeping on first request (somee.com free tier) — refresh if it times out
- To test the customer menu: navigate to `/menu/bella-vista` or `/menu/bella-vista/1`
- To test admin: go to `/admin/login`, use demo credentials above
- `pill-button` and `pill-button-active` CSS classes are defined in `index.css`
- `glass-card` CSS class is defined in `index.css`
