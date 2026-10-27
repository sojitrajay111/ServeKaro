import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Provider } from "react-redux";
import { store } from "@/store/store";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { MenuProvider } from "@/contexts/MenuContext";
import { RestaurantProvider } from "@/contexts/RestaurantContext";
import { SearchProvider } from "@/contexts/SearchContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { CartProvider } from "@/contexts/CartContext";
import { CartSidebar } from "@/components/customer/CartSidebar";
import { FloatingCartButton } from "@/components/customer/FloatingCartButton";
import { OrdersProvider } from "@/contexts/OrdersContext";
import LandingPage from "./pages/LandingPage";
import RestaurantSignUp from "./pages/RestaurantSignUp";
import RestaurantMenu from "./pages/RestaurantMenu";
import About from "./pages/About";
import { OrdersPage } from "./pages/customer/OrdersPage";
import NotFound from "./pages/NotFound";
import { AdminLayout } from "./pages/admin/AdminLayout";
import { AdminDashboard } from "./pages/admin/AdminDashboard";
import { MenuManagement } from "./pages/admin/MenuManagement";
import { QRCodesPage } from "./pages/admin/QRCodesPage";
import { AdminSettings } from "./pages/admin/AdminSettings";
import { OrderTakingDashboard } from "./pages/admin/OrderTakingDashboard";
import { LoginPage } from "./pages/admin/LoginPage";
import { ForgotPasswordPage } from "./pages/admin/ForgotPasswordPage";
import { LiveTableView } from "./pages/admin/LiveTableView";
import { KitchenDisplay } from "./pages/admin/KitchenDisplay";
import { ProfilePage } from "./pages/admin/ProfilePage";
import { SalesAnalytics } from "./pages/admin/SalesAnalytics";
import { WaiterManagement } from "@/pages/admin/WaiterManagement";
const App = () => (
  <HelmetProvider>
    <Provider store={store}>
      <TooltipProvider>
        <AuthProvider>
          <OrdersProvider>
            <SearchProvider>
              <RestaurantProvider>
                <MenuProvider>
                  <CartProvider>
                <Toaster />
                <Sonner />
                <BrowserRouter>
                <CartSidebar />
                <FloatingCartButton />
          <Routes>
            <Route path="/" element={<LandingPage />} />
            
            {/* Restaurant Registration */}
            <Route path="/signup" element={<RestaurantSignUp />} />
            
            {/* Restaurant Menu - Customer-facing */}
            <Route path="/menu/:restaurantId" element={<RestaurantMenu />} />
            <Route path="/menu/:restaurantId/:tableId" element={<RestaurantMenu />} />
            
            {/* Legacy Routes - redirect to landing */}
            <Route path="/demo" element={<Navigate to="/" replace />} />
            <Route path="/menu" element={<Navigate to="/" replace />} />
            <Route path="/about" element={<About />} />
            <Route path="/my-orders" element={<OrdersPage />} />
            
            {/* Admin Login Route */}
            <Route path="/admin/login" element={<LoginPage />} />
            <Route path="/admin/forgot-password" element={<ForgotPasswordPage />} />

            {/* Protected Admin Routes (no footer) */}
            <Route 
              path="/admin" 
              element={
                <ProtectedRoute>
                  <AdminLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<AdminDashboard />} />
              <Route path="live" element={<LiveTableView />} />
              <Route path="kitchen" element={<KitchenDisplay />} />
              <Route path="menu" element={<MenuManagement />} />
              <Route path="orders" element={<OrderTakingDashboard />} />
              <Route path="waiters" element={<WaiterManagement />} />
              <Route path="qr-codes" element={<QRCodesPage />} />
              <Route path="analytics" element={<SalesAnalytics />} />
              <Route path="profile" element={<ProfilePage />} />
              <Route 
                path="settings" 
                element={
                  <ProtectedRoute requireRole="admin">
                    <AdminSettings />
                  </ProtectedRoute>
                } 
              />
            </Route>
            
            {/* 404 Route */}
            <Route path="*" element={<NotFound />} />
          </Routes>
                </BrowserRouter>
                </CartProvider>
              </MenuProvider>
            </RestaurantProvider>
          </SearchProvider>
        </OrdersProvider>
      </AuthProvider>
      </TooltipProvider>
    </Provider>
  </HelmetProvider>
);

export default App;
