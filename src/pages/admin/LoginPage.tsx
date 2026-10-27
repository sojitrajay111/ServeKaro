import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Navigate, useLocation, Link } from 'react-router-dom';
import SEO from '@/components/SEO';
import { 
  Eye, 
  EyeOff, 
  Lock, 
  User, 
  ChefHat,
  Loader2,
  Shield
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAppSelector } from '@/store/hooks';
import { useLoginMutation } from '@/store/endpoints/auth';
import { errorMessage } from '@/lib/apiError';

export const LoginPage: React.FC = () => {
  const status = useAppSelector((s) => s.session.status);
  const [login, { isLoading }] = useLoginMutation();
  const location = useLocation();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const authLoading = status === 'checking';

  if (status === 'authenticated') {
    const from = (location.state as { from?: { pathname: string } } | null)?.from?.pathname || '/admin';
    return <Navigate to={from} replace />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!username.trim() || !password) {
      setError('Please fill in all fields');
      return;
    }
    try {
      await login({ login: username.trim(), password }).unwrap();
    } catch (err) {
      setError(errorMessage(err, 'Could not sign in'));
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="flex items-center gap-2">
          <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
          <span className="text-gray-600">Checking authentication...</span>
        </div>
      </div>
    );
  }

  return (
    <>
      <SEO
        title="Restaurant Admin Login - ServeKaro Dashboard"
        description="Login to your ServeKaro restaurant dashboard. Manage your digital menu, QR codes, orders, and analytics from your admin panel."
        keywords="restaurant admin login, menu management, QR code management, restaurant dashboard, admin panel"
        url="https://servekaro.com/admin/login"
      />
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-1 sm:p-4 lg:p-6 overflow-x-hidden">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-[320px] sm:max-w-sm md:max-w-md lg:max-w-lg mx-auto min-w-0"
      >
        {/* Header */}
        <div className="text-center mb-4 sm:mb-6 lg:mb-8">
          <motion.div
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="inline-flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 md:w-16 md:h-16 bg-blue-600 rounded-full mb-2 sm:mb-3 md:mb-4"
          >
            <ChefHat className="h-5 w-5 sm:h-6 sm:w-6 md:h-8 md:w-8 text-white" />
          </motion.div>
          <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-gray-900 mb-1 sm:mb-2">
            Restaurant Admin
          </h1>
          <p className="text-xs sm:text-sm md:text-base text-gray-600 px-1 sm:px-2">
            Sign in to manage your restaurant
          </p>
        </div>

        {/* Login Card */}
        <Card className="shadow-lg border-0 overflow-hidden">
          <CardHeader className="space-y-1 pb-2 sm:pb-3 md:pb-4 px-2 sm:px-4 md:px-6">
            <CardTitle className="text-base sm:text-lg md:text-xl lg:text-2xl text-center">Welcome Back</CardTitle>
            <p className="text-center text-gray-600 text-xs sm:text-sm md:text-base px-1">
              Enter your credentials to access the dashboard
            </p>
          </CardHeader>
          
          <CardContent className="px-2 sm:px-4 md:px-6 pb-2 sm:pb-4 md:pb-6">
            <form onSubmit={handleSubmit} className="space-y-2 sm:space-y-3 md:space-y-4">
              {/* Username Field */}
              <div className="space-y-1 sm:space-y-2">
                <Label htmlFor="username" className="text-xs sm:text-sm md:text-base">Email or phone</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-3 w-3 sm:h-4 sm:w-4 text-gray-400 z-10 pointer-events-none" />
                  <Input
                    id="username"
                    type="text"
                    autoComplete="username"
                    placeholder="you@restaurant.com or 98765 43210"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="pl-8 sm:pl-10 h-8 sm:h-10 md:h-11 text-xs sm:text-sm md:text-base w-full"
                    disabled={isLoading}
                  />
                </div>
              </div>

              {/* Password Field */}
              <div className="space-y-1 sm:space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="text-xs sm:text-sm md:text-base">Password</Label>
                  <Link
                    to="/admin/forgot-password"
                    className="text-xs sm:text-sm text-blue-600 hover:text-blue-800 hover:underline font-medium"
                  >
                    Forgot Password?
                  </Link>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-3 w-3 sm:h-4 sm:w-4 text-gray-400 z-10 pointer-events-none" />
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-8 sm:pl-10 pr-8 sm:pr-10 h-8 sm:h-10 md:h-11 text-xs sm:text-sm md:text-base w-full"
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2 sm:right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1 touch-manipulation"
                  >
                    {showPassword ? <EyeOff className="h-3 w-3 sm:h-4 sm:w-4" /> : <Eye className="h-3 w-3 sm:h-4 sm:w-4" />}
                  </button>
                </div>
              </div>

              {/* Error Message */}
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-red-50 border border-red-200 text-red-700 px-3 sm:px-4 py-2 sm:py-3 rounded-md text-xs sm:text-sm"
                >
                  {error}
                </motion.div>
              )}

              {/* Login Button */}
              <Button
                type="submit"
                className="w-full h-8 sm:h-10 md:h-11 text-xs sm:text-sm md:text-base font-medium touch-manipulation"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4 animate-spin" />
                    <span className="hidden sm:inline">Signing In...</span>
                    <span className="sm:hidden">Loading...</span>
                  </>
                ) : (
                  <>
                    <Shield className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                    Sign In
                  </>
                )}
              </Button>
            </form>



            {/* Additional Info */}
            <div className="mt-2 sm:mt-3 md:mt-4 p-1.5 sm:p-2 md:p-3 bg-blue-50 rounded-lg">
              <div className="flex items-center gap-1 sm:gap-1.5 text-blue-800 text-xs font-medium mb-1">
                <Shield className="h-3 w-3 flex-shrink-0" />
                <span>Secure Access</span>
              </div>
              <ul className="text-xs text-blue-700 space-y-0.5">
                <li>• You stay signed in on this device for 30 days</li>
                <li>• Changing your password signs out every other device</li>
                <li>• Voids, discounts and refunds are logged</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center mt-2 sm:mt-3 md:mt-4 text-xs text-gray-500 px-1">
          <p className="mb-0.5">New restaurant? <Link to="/signup" className="text-accent font-medium hover:underline">Create an account</Link></p>
          <p className="text-xs">Powered by ServeKaro</p>
        </div>
      </motion.div>
      </div>
    </>
  );
};
