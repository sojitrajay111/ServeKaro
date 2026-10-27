import React, { useState } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Menu, Home, ChefHat, Settings, QrCode, LogOut, ChevronLeft, ChevronRight, ShoppingCart,
  UtensilsCrossed, BarChart3, ConciergeBell, Receipt, LayoutGrid,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ApprovalProvider } from '@/components/admin/ApprovalDialog';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { outletChanged } from '@/store/session';
import { api } from '@/store/api';
import { useLogoutMutation } from '@/store/endpoints/auth';
import { useStaffRealtime } from '@/hooks/useRealtime';
import { useCan } from '@/hooks/useCan';
import type { Permission } from '@/types/api';

const NAV: { name: string; href: string; icon: typeof Home; permission?: Permission }[] = [
  { name: 'Dashboard', href: '/admin', icon: Home, permission: 'reports.view' },
  { name: 'Tables', href: '/admin/live', icon: LayoutGrid, permission: 'orders.create' },
  { name: 'Take Order', href: '/admin/orders', icon: ShoppingCart, permission: 'orders.create' },
  { name: 'Kitchen', href: '/admin/kitchen', icon: UtensilsCrossed, permission: 'kot.update' },
  { name: 'Bills & Shift', href: '/admin/billing', icon: Receipt, permission: 'payments.collect' },
  { name: 'Menu', href: '/admin/menu', icon: ChefHat, permission: 'menu.view' },
  { name: 'Tables & QR', href: '/admin/qr-codes', icon: QrCode, permission: 'tables.manage' },
  { name: 'Staff', href: '/admin/waiters', icon: ConciergeBell, permission: 'staff.manage' },
  { name: 'Reports', href: '/admin/analytics', icon: BarChart3, permission: 'reports.view' },
  { name: 'Settings', href: '/admin/settings', icon: Settings, permission: 'settings.edit' },
];

export const AdminLayout: React.FC = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const dispatch = useAppDispatch();
  const can = useCan();
  const { profile, outletId } = useAppSelector((s) => s.session);
  const [logout] = useLogoutMutation();
  const live = useStaffRealtime();

  const navigation = NAV.filter((n) => !n.permission || can(n.permission));
  const outlet = profile?.outlets.find((o) => o.id === outletId);

  const isActive = (href: string) => (href === '/admin' ? location.pathname === '/admin' : location.pathname.startsWith(href));
  const title = navigation.find((n) => isActive(n.href))?.name || (location.pathname.includes('profile') ? 'Profile' : 'Dashboard');

  const switchOutlet = (id: string) => {
    dispatch(outletChanged(id));
    // Everything cached belongs to the old outlet.
    dispatch(api.util.resetApiState());
  };

  const initial = profile?.user.name.charAt(0).toUpperCase() || 'U';

  return (
    <ApprovalProvider>
      <div className="h-screen bg-gray-50 flex overflow-hidden">
        {mobileOpen && <div className="fixed inset-0 bg-black/50 z-40 md:hidden" onClick={() => setMobileOpen(false)} />}

        <motion.aside
          className={`bg-white shadow-lg border-r border-gray-200 flex flex-col z-50 flex-shrink-0
            fixed h-screen md:static md:h-full transition-transform duration-300 md:transform-none
            ${mobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}
          animate={{ width: collapsed ? 64 : 256 }}
          transition={{ duration: 0.3 }}
        >
          <div className="p-4 border-b border-gray-200 flex items-center justify-between">
            {!collapsed && (
              <div className="min-w-0">
                <h1 className="text-xl font-bold text-gray-900 truncate">{outlet?.name || 'ServeKaro'}</h1>
                <p className="text-sm text-gray-500">{profile?.role.name}</p>
              </div>
            )}
            <Button variant="ghost" size="sm" onClick={() => setCollapsed(!collapsed)} className="p-1 h-8 w-8 hidden md:inline-flex">
              {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
            </Button>
          </div>

          <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
            {navigation.map(({ name, href, icon: Icon }) => (
              <Link
                key={href}
                to={href}
                title={collapsed ? name : undefined}
                onClick={() => setMobileOpen(false)}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                  isActive(href) ? 'bg-accent text-accent-foreground shadow-sm' : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <Icon className="h-5 w-5 flex-shrink-0" />
                {!collapsed && <span className="font-medium">{name}</span>}
              </Link>
            ))}
          </nav>

          <div className="p-4 border-t border-gray-200">
            <div className={`flex items-center gap-3 ${collapsed ? 'flex-col' : ''}`}>
              <Link to="/admin/profile" className="flex items-center gap-3 flex-1 min-w-0 hover:bg-gray-50 p-1.5 rounded-xl group" title="Profile">
                <div className="w-8 h-8 bg-gradient-to-br from-accent to-accent/80 rounded-full flex items-center justify-center text-accent-foreground flex-shrink-0">
                  <span className="text-sm font-medium">{initial}</span>
                </div>
                {!collapsed && (
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate group-hover:text-accent">{profile?.user.name}</p>
                    <Badge variant="secondary" className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0 bg-accent/15 text-accent border-transparent">
                      {profile?.role.name}
                    </Badge>
                  </div>
                )}
              </Link>
              <Button variant="ghost" size="sm" className="p-1 h-8 w-8 hover:bg-red-100 hover:text-red-600" onClick={() => logout()} title="Log out">
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </motion.aside>

        <div className="flex-1 flex flex-col overflow-hidden min-w-0">
          <header className="bg-white shadow-sm border-b border-gray-200 px-3 sm:px-4 lg:px-6 py-3">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <Button variant="ghost" size="sm" className="md:hidden p-2" onClick={() => setMobileOpen(!mobileOpen)}>
                  <Menu className="h-5 w-5" />
                </Button>
                <h2 className="text-lg sm:text-2xl font-semibold text-gray-900 truncate">{title}</h2>
              </div>

              <div className="flex items-center gap-2 flex-shrink-0">
                {profile && profile.outlets.length > 1 && (
                  <Select value={outletId ?? undefined} onValueChange={switchOutlet}>
                    <SelectTrigger className="w-40 h-9"><SelectValue placeholder="Outlet" /></SelectTrigger>
                    <SelectContent>
                      {profile.outlets.map((o) => <SelectItem key={o.id} value={o.id}>{o.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                )}
                <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-gray-50 border border-gray-100 rounded-full select-none" title={live ? 'Receiving live updates' : 'Not connected: screens update when you refresh'}>
                  <span className={`w-2 h-2 rounded-full ${live ? 'bg-green-500' : 'bg-red-500 animate-pulse'}`} />
                  <span className="text-gray-600 font-black uppercase text-[9px] tracking-wide">{live ? 'Live' : 'Offline'}</span>
                </div>
                {outlet && (
                  <Button variant="outline" size="sm" asChild>
                    <Link to={`/menu/${outlet.slug}`} target="_blank">View menu</Link>
                  </Button>
                )}
              </div>
            </div>
          </header>

          <main className="flex-1 overflow-auto bg-gray-50 p-2 sm:p-3 lg:p-6">
            <Outlet />
          </main>
        </div>
      </div>
    </ApprovalProvider>
  );
};
