import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import SEO from '@/components/SEO';
import { 
  ChefHat, 
  Mail, 
  Lock, 
  Shield, 
  ArrowLeft, 
  CheckCircle2, 
  Loader2, 
  Eye, 
  EyeOff,
  KeyRound
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { authApi } from '@/services/apiService';
import { toast } from 'sonner';

export const ForgotPasswordPage: React.FC = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1); // 1: Email, 2: OTP, 3: New Password, 4: Success
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [resetToken, setResetToken] = useState('');

  // Handle Email Submission (Step 1)
  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      toast.error('Please enter your email address');
      return;
    }
    
    setIsLoading(true);
    try {
      await authApi.forgotPassword(email);
      toast.success('OTP sent successfully to your email');
      setStep(2);
    } catch (error: any) {
      console.error('Forgot password error:', error);
      toast.error(error.message || 'Failed to send OTP. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle OTP Verification (Step 2)
  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp) {
      toast.error('Please enter the OTP code');
      return;
    }

    setIsLoading(true);
    try {
      const response = await authApi.verifyOtp(email, otp);
      console.log('OTP Verification Response:', response);
      
      // Standardize token retrieval from response structure
      const token = response.token || response.resetToken || (response.data && (response.data.token || response.data.resetToken)) || response;
      
      if (token) {
        const finalToken = typeof token === 'string' ? token : (token.resetToken || token.token || otp);
        setResetToken(finalToken);
      } else {
        setResetToken(otp);
      }
      
      toast.success('OTP verified successfully');
      setStep(3);
    } catch (error: any) {
      console.error('Verify OTP error:', error);
      toast.error(error.message || 'Invalid OTP code. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Resend OTP
  const handleResendOtp = async () => {
    setIsLoading(true);
    try {
      await authApi.forgotPassword(email);
      toast.success('A new OTP has been sent to your email');
    } catch (error: any) {
      toast.error(error.message || 'Failed to resend OTP');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Password Reset (Step 3)
  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword || !confirmPassword) {
      toast.error('Please fill in all fields');
      return;
    }

    if (newPassword.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    setIsLoading(true);
    try {
      const tokenToUse = resetToken || otp;
      await authApi.resetPassword(tokenToUse, newPassword);
      toast.success('Password reset successfully!');
      setStep(4);
    } catch (error: any) {
      console.error('Reset password error:', error);
      toast.error(error.message || 'Failed to reset password. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <SEO
        title="Reset Password - ServeKaro Restaurant Admin"
        description="Reset your restaurant admin password to gain secure access back to your ServeKaro dashboard."
        keywords="reset password, forgot password, restaurant admin, dashboard login"
        url="https://servekaro.com/admin/forgot-password"
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
              Manage your digital menu and QR orders
            </p>
          </div>

          <Card className="shadow-lg border-0 overflow-hidden">
            <CardHeader className="space-y-1 pb-2 sm:pb-3 md:pb-4 px-2 sm:px-4 md:px-6">
              <CardTitle className="text-base sm:text-lg md:text-xl lg:text-2xl text-center">
                {step === 1 && 'Forgot Password'}
                {step === 2 && 'Verify Security Code'}
                {step === 3 && 'Create New Password'}
                {step === 4 && 'Password Reset Complete'}
              </CardTitle>
              <p className="text-center text-gray-600 text-xs sm:text-sm md:text-base px-1">
                {step === 1 && 'Enter your email to receive a password reset OTP'}
                {step === 2 && `Enter the OTP sent to ${email}`}
                {step === 3 && 'Enter and confirm your new secure password'}
                {step === 4 && 'Your password has been successfully updated'}
              </p>
            </CardHeader>

            <CardContent className="px-2 sm:px-4 md:px-6 pb-2 sm:pb-4 md:pb-6">
              <AnimatePresence mode="wait">
                {/* Step 1: Email Request */}
                {step === 1 && (
                  <motion.form
                    key="step-email"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 10 }}
                    onSubmit={handleEmailSubmit}
                    className="space-y-4"
                  >
                    <div className="space-y-2">
                      <Label htmlFor="email" className="text-xs sm:text-sm md:text-base">Email Address</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-3 w-3 sm:h-4 sm:w-4 text-gray-400 z-10 pointer-events-none" />
                        <Input
                          id="email"
                          type="email"
                          placeholder="admin@restaurant.com"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="pl-8 sm:pl-10 h-8 sm:h-10 md:h-11 text-xs sm:text-sm md:text-base w-full"
                          disabled={isLoading}
                        />
                      </div>
                    </div>

                    <Button
                      type="submit"
                      className="w-full h-8 sm:h-10 md:h-11 text-xs sm:text-sm md:text-base font-medium touch-manipulation"
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Sending Code...
                        </>
                      ) : (
                        'Send OTP Code'
                      )}
                    </Button>

                    <div className="text-center mt-2">
                      <Link
                        to="/admin/login"
                        className="inline-flex items-center gap-1 text-xs sm:text-sm text-gray-500 hover:text-blue-600 transition-colors"
                      >
                        <ArrowLeft className="h-3 w-3" />
                        Back to Sign In
                      </Link>
                    </div>
                  </motion.form>
                )}

                {/* Step 2: Verify OTP */}
                {step === 2 && (
                  <motion.form
                    key="step-otp"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 10 }}
                    onSubmit={handleOtpSubmit}
                    className="space-y-4"
                  >
                    <div className="space-y-2">
                      <Label htmlFor="otp" className="text-xs sm:text-sm md:text-base">One-Time Password (OTP)</Label>
                      <div className="relative">
                        <KeyRound className="absolute left-3 top-1/2 transform -translate-y-1/2 h-3 w-3 sm:h-4 sm:w-4 text-gray-400 z-10 pointer-events-none" />
                        <Input
                          id="otp"
                          type="text"
                          placeholder="Enter OTP code"
                          value={otp}
                          onChange={(e) => setOtp(e.target.value)}
                          className="pl-8 sm:pl-10 h-8 sm:h-10 md:h-11 text-xs sm:text-sm md:text-base w-full text-center tracking-widest font-mono"
                          disabled={isLoading}
                          maxLength={10}
                        />
                      </div>
                    </div>

                    <Button
                      type="submit"
                      className="w-full h-8 sm:h-10 md:h-11 text-xs sm:text-sm md:text-base font-medium touch-manipulation"
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Verifying...
                        </>
                      ) : (
                        'Verify OTP'
                      )}
                    </Button>

                    <div className="flex items-center justify-between mt-2 px-1">
                      <button
                        type="button"
                        onClick={() => setStep(1)}
                        className="inline-flex items-center gap-1 text-xs text-gray-500 hover:text-blue-600 transition-colors"
                        disabled={isLoading}
                      >
                        <ArrowLeft className="h-3 w-3" />
                        Change Email
                      </button>

                      <button
                        type="button"
                        onClick={handleResendOtp}
                        className="text-xs text-blue-600 hover:text-blue-800 hover:underline font-medium"
                        disabled={isLoading}
                      >
                        Resend OTP
                      </button>
                    </div>
                  </motion.form>
                )}

                {/* Step 3: Reset Password */}
                {step === 3 && (
                  <motion.form
                    key="step-password"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 10 }}
                    onSubmit={handlePasswordSubmit}
                    className="space-y-4"
                  >
                    {/* New Password */}
                    <div className="space-y-2">
                      <Label htmlFor="newPassword" className="text-xs sm:text-sm md:text-base">New Password</Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-3 w-3 sm:h-4 sm:w-4 text-gray-400 z-10 pointer-events-none" />
                        <Input
                          id="newPassword"
                          type={showPassword ? 'text' : 'password'}
                          placeholder="At least 6 characters"
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          className="pl-8 sm:pl-10 pr-10 h-8 sm:h-10 md:h-11 text-xs sm:text-sm md:text-base w-full"
                          disabled={isLoading}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1"
                        >
                          {showPassword ? <EyeOff className="h-3 w-3 sm:h-4 sm:w-4" /> : <Eye className="h-3 w-3 sm:h-4 sm:w-4" />}
                        </button>
                      </div>
                    </div>

                    {/* Confirm Password */}
                    <div className="space-y-2">
                      <Label htmlFor="confirmPassword" className="text-xs sm:text-sm md:text-base">Confirm New Password</Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-3 w-3 sm:h-4 sm:w-4 text-gray-400 z-10 pointer-events-none" />
                        <Input
                          id="confirmPassword"
                          type={showConfirmPassword ? 'text' : 'password'}
                          placeholder="Re-enter new password"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          className="pl-8 sm:pl-10 pr-10 h-8 sm:h-10 md:h-11 text-xs sm:text-sm md:text-base w-full"
                          disabled={isLoading}
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1"
                        >
                          {showConfirmPassword ? <EyeOff className="h-3 w-3 sm:h-4 sm:w-4" /> : <Eye className="h-3 w-3 sm:h-4 sm:w-4" />}
                        </button>
                      </div>
                    </div>

                    <Button
                      type="submit"
                      className="w-full h-8 sm:h-10 md:h-11 text-xs sm:text-sm md:text-base font-medium touch-manipulation"
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        'Reset Password'
                      )}
                    </Button>
                  </motion.form>
                )}

                {/* Step 4: Success Screen */}
                {step === 4 && (
                  <motion.div
                    key="step-success"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="text-center space-y-4 py-2"
                  >
                    <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-green-100 text-green-600 mx-auto">
                      <CheckCircle2 className="h-6 w-6" />
                    </div>
                    <p className="text-sm text-gray-600">
                      Your password has been reset successfully. You can now log in using your new credentials.
                    </p>
                    <Button
                      onClick={() => navigate('/admin/login')}
                      className="w-full h-10 font-medium"
                    >
                      Sign In Now
                    </Button>
                  </motion.div>
                )}
              </AnimatePresence>
            </CardContent>
          </Card>

          {/* Footer */}
          <div className="text-center mt-4 text-xs text-gray-500 px-1">
            <p className="mb-0.5">© 2024 Restaurant Management System</p>
            <p>Powered by ServeKaro Digital Menu</p>
          </div>
        </motion.div>
      </div>
    </>
  );
};
