import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Provider } from "react-redux";
import { store } from "@/store/store";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { SessionBootstrap } from "@/components/SessionBootstrap";
import { useCan } from "@/hooks/useCan";
import LandingPage from "./pages/LandingPage";
import RestaurantSignUp from "./pages/RestaurantSignUp";
import RestaurantMenu, { TableMenuPage } from "./pages/RestaurantMenu";
import About from "./pages/About";
import { OrdersPage, TrackOrderPage } from "./pages/customer/OrdersPage";
import NotFound from "./pages/NotFound";
import { AdminLayout } from "./pages/admin/AdminLayout";
import { AdminDashboard } from "./pages/admin/AdminDashboard";
import { MenuManagement } from "./pages/admin/MenuManagement";
import { QRCodesPage } from "./pages/admin/QRCodesPage";
import { AdminSettings } from "./pages/admin/AdminSettings";
import { OrderTakingDashboard } from "./pages/admin/OrderTakingDashboard";
import { LoginPage } from "./pages/admin/LoginPage";
import { PinLoginPage } from "./pages/admin/PinLoginPage";
import { ForgotPasswordPage } from "./pages/admin/ForgotPasswordPage";
import { AcceptInvitePage, VerifyEmailPage } from "./pages/admin/AcceptInvitePage";
import { LiveTableView } from "./pages/admin/LiveTableView";
import { KitchenDisplay } from "./pages/admin/KitchenDisplay";
import { BillingPage } from "./pages/admin/BillingPage";
import { ProfilePage } from "./pages/admin/ProfilePage";
import { SalesAnalytics } from "./pages/admin/SalesAnalytics";
import { WaiterManagement } from "./pages/admin/WaiterManagement";
import type { Permission } from "@/types/api";

// /admin lands on the first screen this role can use (a chef goes to the kitchen).
function AdminHome() {
  const can = useCan();
  if (can("reports.view")) return <AdminDashboard />;
  const first: [Permission, string][] = [
    ["orders.create", "/admin/live"], ["kot.update", "/admin/kitchen"], ["payments.collect", "/admin/billing"], ["menu.view", "/admin/menu"],
  ];
  const to = first.find(([p]) => can(p))?.[1] ?? "/admin/profile";
  return <Navigate to={to} replace />;
}

const guard = (permission: Permission, element: JSX.Element) => <ProtectedRoute permission={permission}>{element}</ProtectedRoute>;

const App = () => (
  <HelmetProvider>
    <Provider store={store}>
      <TooltipProvider>
        <Sonner richColors position="top-center" />
        <SessionBootstrap />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/signup" element={<RestaurantSignUp />} />
            <Route path="/about" element={<About />} />
            <Route path="/verify-email" element={<VerifyEmailPage />} />

            {/* Customer */}
            <Route path="/t/:qrToken" element={<TableMenuPage />} />
            <Route path="/menu/:restaurantId" element={<RestaurantMenu />} />
            <Route path="/order/:trackingToken" element={<TrackOrderPage />} />
            <Route path="/my-orders" element={<OrdersPage />} />
            <Route path="/menu" element={<Navigate to="/" replace />} />
            <Route path="/demo" element={<Navigate to="/" replace />} />

            {/* Staff auth */}
            <Route path="/admin/login" element={<LoginPage />} />
            <Route path="/admin/pin" element={<PinLoginPage />} />
            <Route path="/admin/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/admin/accept-invite" element={<AcceptInvitePage />} />

            <Route path="/admin" element={<ProtectedRoute><AdminLayout /></ProtectedRoute>}>
              <Route index element={<AdminHome />} />
              <Route path="live" element={guard("orders.create", <LiveTableView />)} />
              <Route path="orders" element={guard("orders.create", <OrderTakingDashboard />)} />
              <Route path="kitchen" element={guard("kot.update", <KitchenDisplay />)} />
              <Route path="billing" element={guard("payments.collect", <BillingPage />)} />
              <Route path="menu" element={guard("menu.view", <MenuManagement />)} />
              <Route path="qr-codes" element={guard("tables.manage", <QRCodesPage />)} />
              <Route path="waiters" element={guard("staff.manage", <WaiterManagement />)} />
              <Route path="analytics" element={guard("reports.view", <SalesAnalytics />)} />
              <Route path="settings" element={guard("settings.edit", <AdminSettings />)} />
              <Route path="profile" element={<ProfilePage />} />
            </Route>

            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </Provider>
  </HelmetProvider>
);

export default App;
