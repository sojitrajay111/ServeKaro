# ServeKaro — Frontend

Restaurant QR menu, ordering and POS web app. Customers scan a table QR code, browse the menu, and place orders from their phone. Restaurant staff run the floor from an admin panel: live tables, kitchen display, order taking and billing, menu, waiters, QR codes, analytics and settings.

- Backend (current): ASP.NET Core API at `http://menubackend.runasp.net/api`. It's on free hosting and may take ~30s to wake up.
- Backend (in progress): [ServeKaro-Backend](https://github.com/sojitrajay111/ServeKaro-Backend), NestJS + MongoDB.

## Tech stack

| Layer | Library |
|---|---|
| Framework | React 18 + TypeScript + Vite |
| Routing | React Router v6 |
| Server state | Redux Toolkit + RTK Query, plus a fetch-based service layer |
| Real-time | SignalR (`@microsoft/signalr`) for live orders |
| UI | shadcn/ui + Tailwind CSS, Framer Motion, Lucide icons |
| Forms | React Hook Form + Zod |
| Charts | Recharts |
| Toasts | Sonner |
| SEO | react-helmet-async |

## Getting started

```bash
npm install
npm run dev       # http://localhost:8080
npm run build     # production build into dist/
npm run preview   # serve the production build
npm run lint
```

Then open:

- Customer menu: http://localhost:8080/menu/bella-vista (or `/menu/bella-vista/1` for table 1)
- Admin panel: http://localhost:8080/admin/login (needs an account on the backend; register at `/signup`)

If menu data is empty, the backend is probably still waking up. Wait and refresh.

## Environment variables

`.env` (committed):

```env
VITE_API_BASE_URL=/api
```

`/api` keeps requests same-origin. They're forwarded to the backend by:

- **dev**: the Vite proxy in `vite.config.ts` (`/api` and the `/orderHub` websocket)
- **production**: the rewrites in `vercel.json`

To point the app at a different backend, change the target in **both** files.

Optional, in `.env.local`:

```env
VITE_GOOGLE_PLACE_ID=your_place_id   # used when forwarding customer reviews to Google
```

## Routes

| Path | Page | Access |
|---|---|---|
| `/` | Landing page | Public |
| `/signup` | Restaurant registration | Public |
| `/menu/:restaurantId` | Customer menu | Public |
| `/menu/:restaurantId/:tableId` | Customer menu for a table | Public |
| `/my-orders` | Customer order tracking | Public |
| `/about` | About page | Public |
| `/admin/login`, `/admin/forgot-password` | Staff login / OTP password reset | Public |
| `/admin` | Dashboard | Staff |
| `/admin/live` | Live table view | Staff |
| `/admin/kitchen` | Kitchen display | Staff |
| `/admin/orders` | Order taking + billing | Staff |
| `/admin/menu` | Menu management | Staff |
| `/admin/waiters` | Waiter management | Staff |
| `/admin/qr-codes` | Table QR codes | Staff |
| `/admin/analytics` | Sales analytics | Staff |
| `/admin/profile` | Profile | Staff |
| `/admin/settings` | Restaurant settings | `admin` role only |

## Order flow

1. Customer scans a table QR → `/menu/:restaurantId/:tableId`.
2. Items go into the cart; checkout POSTs the order to `/Order` (`tableId: null` for takeaway).
3. The backend pushes it over SignalR (`/orderHub`) to every logged-in staff screen: dashboard, live tables, kitchen.
4. Staff move it through `Pending → Preparing → Ready → Completed`.
5. The customer sees their orders from this session on `/my-orders` (see limitations).

## Project layout

```
src/
├── App.tsx            providers + routes
├── pages/             customer pages; pages/admin/ for the staff panel
├── components/        customer/, admin/, ui/ (generated shadcn/ui)
├── contexts/          Auth, Restaurant, Orders, Menu, Cart, Search
├── store/             RTK Query (menu endpoints)
├── services/          fetch client, apiService.ts, endpoints.ts
└── hooks/useOrderHub.ts   SignalR connection
```

`MenuBackend API.postman_collection.json` documents the backend endpoints. See [CLAUDE.md](CLAUDE.md) for architecture details: the two API layers, provider order, and data mapping.

## Known limitations

- The backend is single-restaurant: restaurant data comes from `/Settings`, and the id is hard-coded as `restaurant-001`.
- `/my-orders` is in-memory only: it's lost on refresh and doesn't receive live status updates, because the SignalR connection only opens for logged-in staff.
- Tax rate is fixed at 8.75% until the backend returns it in settings.
- QR scan counts (`QRCodesPage`) and trending views/likes (`TrendingSection`) are random placeholder numbers.
- Promotional banners and the review section's fallback rating are hard-coded.
- No test suite.

## Deployment

Deployed on Vercel from this repo using `vercel.json`: `npm run build`, output `dist/`, SPA fallback to `index.html`, `/api/*` rewritten to the backend.
