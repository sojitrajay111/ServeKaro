import React, { useState, useEffect } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Menu,
  Home,
  ChefHat,
  Settings,
  QrCode,
  LogOut,
  ChevronLeft,
  ChevronRight,
  ShoppingCart,
  Users,
  UtensilsCrossed,
  BarChart3,
  ConciergeBell,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { NotificationDropdown } from '@/components/admin/NotificationDropdown';
import { RestaurantSelector } from '@/components/admin/RestaurantSelector';
import { useAuth } from '@/contexts/AuthContext';
import { useRestaurant } from '@/contexts/RestaurantContext';
import { useOrders } from '@/contexts/OrdersContext';
import { useGetMenuItemsQuery } from '@/store/menuApi';

export const AdminLayout: React.FC = () => {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();
  const { user, logout } = useAuth();
  const { currentRestaurant, loadRestaurantBySlug, getRestaurantById } = useRestaurant();
  const { connectionState } = useOrders();
  const { data: menuItems = [] } = useGetMenuItemsQuery({});

  // Auto-load restaurant when user logs in
  useEffect(() => {
    if (user?.restaurantId && !currentRestaurant) {
      const restaurant = getRestaurantById(user.restaurantId);
      if (restaurant) {
        loadRestaurantBySlug(restaurant.slug);
      }
    }
  }, [user, currentRestaurant, loadRestaurantBySlug, getRestaurantById]);

  const navigation = [
    { name: 'Dashboard', href: '/admin', icon: Home },
    { name: 'Live Tables', href: '/admin/live', icon: Users },
    { name: 'Take Orders', href: '/admin/orders', icon: ShoppingCart },
    { name: 'Kitchen Display', href: '/admin/kitchen', icon: UtensilsCrossed },
    { name: 'Menu Management', href: '/admin/menu', icon: ChefHat },
    { name: 'Waiters', href: '/admin/waiters', icon: ConciergeBell },
    { name: 'QR Codes', href: '/admin/qr-codes', icon: QrCode },
    { name: 'Analytics', href: '/admin/analytics', icon: BarChart3 },
    { name: 'Settings', href: '/admin/settings', icon: Settings },
  ];

  const isActive = (href: string) => {
    if (href === '/admin') {
      return location.pathname === '/admin';
    }
    return location.pathname.startsWith(href);
  };

  return (
    <div className="h-screen bg-gray-50 flex overflow-hidden">
      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <motion.div 
        className={`bg-white shadow-lg border-r border-gray-200 flex flex-col z-50 flex-shrink-0
          ${isSidebarCollapsed ? 'w-16' : 'w-64'}
          fixed h-screen md:static md:h-full
          transform transition-transform duration-300 ease-in-out md:transform-none
          ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}
        animate={{ width: isSidebarCollapsed ? 64 : 256 }}
        transition={{ duration: 0.3 }}
      >
        {/* Logo */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            {!isSidebarCollapsed && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <h1 className="text-xl font-bold text-gray-900">
                  {currentRestaurant?.name || 'Restaurant'}
                </h1>
                <p className="text-sm text-gray-500">Admin Panel</p>
              </motion.div>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
              className="p-1 h-8 w-8"
            >
              {isSidebarCollapsed ? (
                <ChevronRight className="h-4 w-4" />
              ) : (
                <ChevronLeft className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>

        {/* Mobile Restaurant Selector */}
        <div className="px-4 py-2 lg:hidden">
          <RestaurantSelector className="w-full" />
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-2">
          {navigation.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            
            return (
              <Link
                key={item.name}
                to={item.href}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                  active
                    ? 'bg-accent text-accent-foreground shadow-sm'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
                onClick={() => {
                  // Close mobile menu when navigating
                  if (window.innerWidth < 1024) {
                    setIsMobileMenuOpen(false);
                  }
                }}
              >
                <Icon className="h-5 w-5 flex-shrink-0" />
                {!isSidebarCollapsed && (
                  <span className="font-medium">{item.name}</span>
                )}
                {!isSidebarCollapsed && item.name === 'Menu Management' && (
                  <Badge variant="secondary" className="ml-auto">
                    {menuItems.length}
                  </Badge>
                )}
              </Link>
            );
          })}
        </nav>

        {/* User Profile */}
        <div className="p-4 border-t border-gray-200">
          {!isSidebarCollapsed ? (
            <div className="flex items-center gap-3">
              <Link 
                to="/admin/profile" 
                className="flex items-center gap-3 flex-1 min-w-0 hover:bg-gray-50 p-1.5 rounded-xl transition-all group"
              >
                <div className="w-8 h-8 bg-gradient-to-br from-accent to-accent/80 rounded-full flex items-center justify-center text-accent-foreground group-hover:scale-105 transition-transform flex-shrink-0">
                  <span className="text-sm font-medium">
                    {user?.name.charAt(0).toUpperCase() || 'U'}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate group-hover:text-accent transition-colors">
                    {user?.name}
                  </p>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="text-[8px] font-bold uppercase tracking-wider px-1.5 py-0 bg-accent/15 text-accent border-transparent">
                      {user?.role}
                    </Badge>
                  </div>
                </div>
              </Link>
              <Button 
                variant="ghost" 
                size="sm" 
                className="p-1 h-8 w-8 hover:bg-red-100 hover:text-red-600 flex-shrink-0"
                onClick={logout}
                title="Logout"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <Link 
                to="/admin/profile"
                className="w-8 h-8 bg-gradient-to-br from-accent to-accent/80 rounded-full flex items-center justify-center text-accent-foreground hover:scale-105 transition-transform"
                title="View Profile"
              >
                <span className="text-sm font-medium">
                  {user?.name.charAt(0).toUpperCase() || 'U'}
                </span>
              </Link>
              <Button 
                variant="ghost" 
                size="sm" 
                className="w-full p-1 h-8 hover:bg-red-100 hover:text-red-600"
                onClick={logout}
                title="Logout"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      </motion.div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        {/* Top Header */}
        <header className="bg-white shadow-sm border-b border-gray-200 px-3 sm:px-4 lg:px-6 py-3 sm:py-4">
          <div className="flex items-center justify-between">
            {/* Left Side - Menu Button and Title */}
            <div className="flex items-center gap-2 sm:gap-4 flex-1 min-w-0">
              <Button
                variant="ghost"
                size="sm"
                className="md:hidden p-2 flex-shrink-0"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              >
                <Menu className="h-5 w-5" />
              </Button>
              
              {/* Desktop Title */}
              <div className="hidden sm:block flex-1 min-w-0">
                <h2 className="text-xl sm:text-2xl font-semibold text-gray-900 truncate">
                  {navigation.find(nav => isActive(nav.href))?.name || 'Dashboard'}
                </h2>
                <p className="text-sm text-gray-500 mt-1 hidden md:block">
                  Manage your restaurant's digital presence
                </p>
              </div>
              
              {/* Mobile Title */}
              <div className="sm:hidden flex-1 min-w-0">
                <h2 className="text-lg font-semibold text-gray-900 truncate">
                  {navigation.find(nav => isActive(nav.href))?.name || 'Dashboard'}
                </h2>
                {currentRestaurant && (
                  <p className="text-xs text-gray-500 truncate">
                    {currentRestaurant.name}
                  </p>
                )}
              </div>
            </div>
            
            {/* Right Side - Actions */}
            <div className="flex items-center gap-1 sm:gap-2 lg:gap-4 flex-shrink-0">
              {/* Restaurant Selector - Desktop only */}
              <RestaurantSelector className="hidden lg:flex" />
              
              {/* Notifications */}
              <NotificationDropdown />
              
              {/* SignalR Connection Status Badge */}
              <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-gray-50 border border-gray-100 rounded-full text-xs font-semibold select-none shadow-sm">
                <span className={`w-2 h-2 rounded-full ${
                  connectionState === 'Connected' ? 'bg-green-500' :
                  connectionState === 'Reconnecting' || connectionState === 'Connecting' ? 'bg-amber-500 animate-pulse' :
                  'bg-red-500'
                }`} />
                <span className="text-gray-600 tracking-wide font-black uppercase text-[9px]">
                  {connectionState === 'Connected' ? 'Live' :
                   connectionState === 'Reconnecting' ? 'Reconnecting' :
                   connectionState === 'Connecting' ? 'Connecting' :
                   'Offline'}
                </span>
              </div>
              
              {/* View Public Menu */}
              <Button 
                variant="outline" 
                size="sm" 
                asChild 
                className="text-xs sm:text-sm px-2 sm:px-3"
              >
                <Link to={`/menu/${currentRestaurant?.slug || ''}`} target="_blank">
                  <span className="hidden sm:inline">View Menu</span>
                  <span className="sm:hidden">Menu</span>
                </Link>
              </Button>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-auto bg-gray-50 p-2 sm:p-3 lg:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
