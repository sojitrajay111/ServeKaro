import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { Loader2, ShieldAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAppSelector } from '@/store/hooks';
import { useCan } from '@/hooks/useCan';
import type { Permission } from '@/types/api';

interface ProtectedRouteProps {
  children: React.ReactNode;
  permission?: Permission;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, permission }) => {
  const status = useAppSelector((s) => s.session.status);
  const can = useCan();
  const location = useLocation();

  if (status === 'checking') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-accent" />
          <p className="text-gray-600">Checking your session…</p>
        </div>
      </div>
    );
  }

  if (status === 'anonymous') {
    return <Navigate to="/admin/login" state={{ from: location }} replace />;
  }

  if (permission && !can(permission)) {
    return (
      <div className="flex items-center justify-center p-8 min-h-[60vh]">
        <div className="text-center max-w-sm">
          <div className="bg-red-100 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
            <ShieldAlert className="w-8 h-8 text-red-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">No access</h2>
          <p className="text-gray-600 mb-6">Your role doesn't include this screen. Ask the owner if you need it.</p>
          <Button variant="outline" onClick={() => window.history.back()}>Go back</Button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};
