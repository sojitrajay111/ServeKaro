import React from 'react';
import { motion } from 'framer-motion';
import { ChefHat } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

// Shared frame for login-adjacent pages (forgot password, invite, verify email).
export function AuthShell({ title, subtitle, children, wide = false }: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  wide?: boolean;
}) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-3 sm:p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className={`w-full ${wide ? 'max-w-2xl' : 'max-w-md'}`}
      >
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-blue-600 rounded-full mb-3">
            <ChefHat className="h-7 w-7 text-white" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">{title}</h1>
          {subtitle && <p className="text-sm sm:text-base text-gray-600 mt-1">{subtitle}</p>}
        </div>
        <Card className="shadow-lg border-0">
          <CardHeader className="pb-2"><CardTitle className="sr-only">{title}</CardTitle></CardHeader>
          <CardContent>{children}</CardContent>
        </Card>
      </motion.div>
    </div>
  );
}

export const FormError = ({ children }: { children?: React.ReactNode }) =>
  children ? (
    <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-md text-sm">{children}</div>
  ) : null;

export const FieldError = ({ children }: { children?: React.ReactNode }) =>
  children ? <p className="text-xs text-red-600 mt-1">{children}</p> : null;
