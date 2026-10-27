import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Loader2, Mail, KeyRound } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { AuthShell, FormError, FieldError } from '@/components/AuthShell';
import { useForgotPasswordMutation, useResetPasswordMutation } from '@/store/endpoints/auth';
import { errorMessage, fieldError } from '@/lib/apiError';

export const ForgotPasswordPage: React.FC = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState<'request' | 'reset'>('request');
  const [login, setLogin] = useState('');
  const [otp, setOtp] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState<unknown>(null);

  const [requestCode, requesting] = useForgotPasswordMutation();
  const [reset, resetting] = useResetPasswordMutation();

  const sendCode = async (e?: React.FormEvent) => {
    e?.preventDefault();
    setError(null);
    try {
      await requestCode({ login: login.trim() }).unwrap();
      setStep('reset');
      toast.success('If that account exists, a 6-digit code is on its way to its email');
    } catch (err) {
      setError(err);
    }
  };

  const submitReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (password !== confirm) {
      setError({ code: 'X', message: 'Passwords do not match' });
      return;
    }
    try {
      await reset({ login: login.trim(), otp, newPassword: password }).unwrap();
      toast.success('Password changed. Log in with the new one.');
      navigate('/admin/login');
    } catch (err) {
      setError(err);
    }
  };

  if (step === 'request') {
    return (
      <AuthShell title="Forgot password" subtitle="We'll email you a code to set a new one">
        <form onSubmit={sendCode} className="space-y-4">
          <div>
            <Label htmlFor="login">Email or phone</Label>
            <div className="relative mt-1">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input id="login" className="pl-10" value={login} onChange={(e) => setLogin(e.target.value)} autoComplete="username" autoFocus />
            </div>
          </div>
          <FormError>{error ? errorMessage(error) : null}</FormError>
          <Button type="submit" className="w-full" disabled={requesting.isLoading || login.trim().length < 3}>
            {requesting.isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Send code
          </Button>
          <p className="text-center text-sm"><Link to="/admin/login" className="text-blue-600 hover:underline">Back to login</Link></p>
        </form>
      </AuthShell>
    );
  }

  return (
    <AuthShell title="Set a new password" subtitle={`Enter the code sent for ${login}`}>
      <form onSubmit={submitReset} className="space-y-4">
        <div className="flex flex-col items-center gap-2">
          <Label>6-digit code</Label>
          <InputOTP maxLength={6} value={otp} onChange={setOtp} autoFocus>
            <InputOTPGroup>
              {[0, 1, 2, 3, 4, 5].map((i) => <InputOTPSlot key={i} index={i} />)}
            </InputOTPGroup>
          </InputOTP>
          <p className="text-xs text-gray-500">The code expires in 10 minutes.</p>
        </div>
        <div>
          <Label htmlFor="pw">New password</Label>
          <div className="relative mt-1">
            <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input id="pw" type="password" className="pl-10" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="new-password" />
          </div>
          <FieldError>{fieldError(error, 'newPassword')}</FieldError>
        </div>
        <div>
          <Label htmlFor="pw2">Confirm password</Label>
          <Input id="pw2" type="password" className="mt-1" value={confirm} onChange={(e) => setConfirm(e.target.value)} autoComplete="new-password" />
        </div>
        <FormError>{error && !fieldError(error, 'newPassword') ? errorMessage(error) : null}</FormError>
        <Button type="submit" className="w-full" disabled={resetting.isLoading || otp.length !== 6 || password.length < 8}>
          {resetting.isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Change password
        </Button>
        <div className="flex justify-between text-sm">
          <button type="button" className="text-blue-600 hover:underline" onClick={() => sendCode()} disabled={requesting.isLoading}>Send a new code</button>
          <button type="button" className="text-gray-500 hover:underline" onClick={() => setStep('request')}>Use a different account</button>
        </div>
      </form>
    </AuthShell>
  );
};
