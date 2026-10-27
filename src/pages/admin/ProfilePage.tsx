import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { User, Mail, Shield, KeyRound, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

export const ProfilePage: React.FC = () => {
  const { user, fetchUserProfile, updateUserProfile } = useAuth();
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [username, setUsername] = useState(user?.username || '');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Sync state if user context loads later
  useEffect(() => {
    if (user) {
      setName(user.name);
      setEmail(user.email);
      setUsername(user.username || '');
    }
  }, [user]);

  // Fetch fresh profile details from backend on mount
  useEffect(() => {
    fetchUserProfile();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) {
      toast.error('Username cannot be empty');
      return;
    }
    if (!name.trim()) {
      toast.error('Name cannot be empty');
      return;
    }
    if (!email.trim()) {
      toast.error('Email cannot be empty');
      return;
    }
    if (password) {
      if (password.length < 6) {
        toast.error('Password must be at least 6 characters long');
        return;
      }
      if (password !== confirmPassword) {
        toast.error('Passwords do not match');
        return;
      }
    }

    setIsSubmitting(true);
    try {
      const updateData: { username: string; name: string; email: string; password?: string } = { username, name, email };
      if (password) {
        updateData.password = password;
      }
      await updateUserProfile(updateData);
      toast.success('Profile updated successfully');
      setPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      toast.error(err.message || 'Failed to update profile');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8 py-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-gray-900 uppercase tracking-tight">User Profile</h1>
        <p className="text-sm text-gray-500">Manage your account information and security credentials</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Sidebar Info Card */}
        <Card className="md:col-span-1 border-gray-200/60 shadow-sm bg-white rounded-2xl h-fit overflow-hidden">
          <div className="h-2 bg-gradient-to-r from-accent to-accent/50" />
          <CardContent className="p-6 flex flex-col items-center text-center space-y-4">
            <div className="w-20 h-20 bg-gradient-to-br from-accent/20 to-accent rounded-full flex items-center justify-center text-accent-foreground shadow-inner">
              <span className="text-3xl font-black">
                {user?.name?.charAt(0).toUpperCase() || 'U'}
              </span>
            </div>
            <div>
              <h2 className="text-lg font-black text-gray-900 truncate max-w-full">{user?.name || 'Admin User'}</h2>
              <p className="text-xs text-gray-400 font-mono truncate max-w-full">{user?.email}</p>
            </div>
            
            <div className="pt-2 w-full border-t border-gray-100 flex flex-col items-center space-y-2">
              <div className="flex items-center gap-1.5 text-xs text-gray-500">
                <Shield className="w-3.5 h-3.5 text-accent" />
                <span>Account Role</span>
              </div>
              <Badge variant="secondary" className="px-3 py-1 font-bold text-[10px] uppercase tracking-wider bg-accent/10 text-accent hover:bg-accent/15 border-transparent">
                {user?.role || 'ADMIN'}
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Edit Form Card */}
        <Card className="md:col-span-2 border-gray-200/60 shadow-sm bg-white rounded-2xl">
          <CardHeader>
            <CardTitle className="text-lg font-bold text-gray-900">Profile Details</CardTitle>
            <CardDescription className="text-xs">Update your display name, login email and security password.</CardDescription>
          </CardHeader>
          <CardContent className="p-6 pt-0">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Username */}
              <div className="space-y-2">
                <Label htmlFor="profile-username" className="text-xs font-bold uppercase tracking-wider text-gray-500">Username</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    id="profile-username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Enter your username"
                    className="pl-10 h-11 rounded-xl border-gray-200"
                    required
                    disabled={isSubmitting}
                  />
                </div>
              </div>

              {/* Name */}
              <div className="space-y-2">
                <Label htmlFor="profile-name" className="text-xs font-bold uppercase tracking-wider text-gray-500">Full Name</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    id="profile-name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter your full name"
                    className="pl-10 h-11 rounded-xl border-gray-200"
                    required
                    disabled={isSubmitting}
                  />
                </div>
              </div>

              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor="profile-email" className="text-xs font-bold uppercase tracking-wider text-gray-500">Email Address</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    id="profile-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email address"
                    className="pl-10 h-11 rounded-xl border-gray-200"
                    required
                    disabled={isSubmitting}
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-gray-100 space-y-4">
                <div>
                  <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                    <KeyRound className="w-4 h-4 text-accent" />
                    Change Password
                  </h3>
                  <p className="text-[11px] text-gray-400 mt-0.5">Leave blank if you don't want to change your password</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* New Password */}
                  <div className="space-y-2">
                    <Label htmlFor="profile-password" className="text-xs font-bold uppercase tracking-wider text-gray-500">New Password</Label>
                    <Input
                      id="profile-password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Min 6 characters"
                      className="h-11 rounded-xl border-gray-200"
                      disabled={isSubmitting}
                    />
                  </div>

                  {/* Confirm Password */}
                  <div className="space-y-2">
                    <Label htmlFor="profile-confirm-password" className="text-xs font-bold uppercase tracking-wider text-gray-500">Confirm Password</Label>
                    <Input
                      id="profile-confirm-password"
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Re-enter password"
                      className="h-11 rounded-xl border-gray-200"
                      disabled={isSubmitting}
                    />
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <div className="pt-4 border-t border-gray-100 flex justify-end">
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-accent hover:bg-accent/90 text-accent-foreground px-8 h-12 rounded-xl font-bold transition-all shadow-md shadow-accent/10"
                >
                  {isSubmitting ? 'Saving Changes...' : 'Save Changes'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
