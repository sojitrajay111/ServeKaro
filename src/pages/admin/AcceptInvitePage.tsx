import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle2, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AuthShell, FormError } from '@/components/AuthShell';
import { useAcceptInviteMutation, useVerifyEmailMutation } from '@/store/endpoints/auth';
import { errorMessage } from '@/lib/apiError';

// /admin/accept-invite?token=... from the staff invite email.
export const AcceptInvitePage: React.FC = () => {
  const [params] = useSearchParams();
  const token = params.get('token') || '';
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [accept, { isLoading }] = useAcceptInviteMutation();

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirm) return setError('Passwords do not match');
    try {
      await accept({ token, password }).unwrap();
      toast.success('All set. Log in with your email or phone.');
      navigate('/admin/login');
    } catch (err) {
      setError(errorMessage(err));
    }
  };

  if (!token) {
    return <AuthShell title="Invite link is incomplete"><p className="text-gray-600">Open the link from your invite email again.</p></AuthShell>;
  }

  return (
    <AuthShell title="Welcome to the team" subtitle="Choose a password to finish setting up your account">
      <form onSubmit={submit} className="space-y-4">
        <div>
          <Label htmlFor="pw">Password</Label>
          <Input id="pw" type="password" className="mt-1" autoFocus autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} />
          <p className="text-xs text-gray-500 mt-1">At least 8 characters.</p>
        </div>
        <div>
          <Label htmlFor="pw2">Confirm password</Label>
          <Input id="pw2" type="password" className="mt-1" autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} />
        </div>
        <FormError>{error}</FormError>
        <Button type="submit" className="w-full" disabled={isLoading || password.length < 8}>
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Set password
        </Button>
      </form>
    </AuthShell>
  );
};

// /verify-email?token=... from the signup email.
export const VerifyEmailPage: React.FC = () => {
  const [params] = useSearchParams();
  const [verify, { isLoading, isSuccess, error }] = useVerifyEmailMutation();
  const token = params.get('token');

  useEffect(() => {
    if (token) verify({ token });
  }, [token, verify]);

  return (
    <AuthShell title="Email verification">
      <div className="text-center space-y-4 py-4">
        {isLoading && <Loader2 className="h-8 w-8 animate-spin mx-auto text-blue-600" />}
        {isSuccess && (
          <>
            <CheckCircle2 className="h-12 w-12 text-green-600 mx-auto" />
            <p className="text-gray-700">Your email is verified.</p>
          </>
        )}
        {(error || !token) && <FormError>{token ? errorMessage(error) : 'This link is incomplete.'}</FormError>}
        <Button asChild variant="outline"><Link to="/admin">Go to dashboard</Link></Button>
      </div>
    </AuthShell>
  );
};
