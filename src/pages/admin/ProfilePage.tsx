import React, { useEffect, useState } from 'react';
import { KeyRound, Loader2, Save } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { FieldError } from '@/components/AuthShell';
import { useChangePasswordMutation, useUpdateMeMutation } from '@/store/endpoints/auth';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { profileLoaded, tokenRefreshed } from '@/store/session';
import { fieldError, isApiError, toastError } from '@/lib/apiError';

export const ProfilePage: React.FC = () => {
  const dispatch = useAppDispatch();
  const profile = useAppSelector((s) => s.session.profile);
  const [form, setForm] = useState({ name: '', email: '', phone: '' });
  const [pw, setPw] = useState({ current: '', next: '', confirm: '' });
  const [error, setError] = useState<unknown>(null);
  const [pwError, setPwError] = useState<unknown>(null);
  const [update, updating] = useUpdateMeMutation();
  const [changePassword, changing] = useChangePasswordMutation();

  useEffect(() => {
    if (profile) setForm({ name: profile.user.name, email: profile.user.email ?? '', phone: profile.user.phone ?? '' });
  }, [profile]);

  if (!profile) return null;

  const save = async () => {
    setError(null);
    try {
      const updated = await update({
        name: form.name.trim(),
        ...(form.email.trim() && { email: form.email.trim() }),
        ...(form.phone.trim() && { phone: form.phone.trim() }),
      }).unwrap();
      dispatch(profileLoaded(updated));
      toast.success('Profile saved');
    } catch (e) {
      setError(e);
      if (!isApiError(e) || !e.errors) toastError(e);
    }
  };

  const savePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwError(null);
    if (pw.next !== pw.confirm) return setPwError({ code: 'X', message: '', errors: { confirm: ['Passwords do not match'] } });
    try {
      const { accessToken } = await changePassword({ currentPassword: pw.current, newPassword: pw.next }).unwrap();
      dispatch(tokenRefreshed(accessToken));
      setPw({ current: '', next: '', confirm: '' });
      toast.success('Password changed. Other devices were signed out.');
    } catch (err) {
      setPwError(err);
      if (!isApiError(err) || !err.errors) toastError(err);
    }
  };

  return (
    <div className="max-w-2xl space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">{profile.user.name} <Badge variant="secondary">{profile.role.name}</Badge></CardTitle>
          <CardDescription>{profile.outlets.map((o) => o.name).join(', ')}</CardDescription>
        </CardHeader>
        <CardContent className="grid sm:grid-cols-2 gap-3">
          <div className="sm:col-span-2"><Label>Name</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /><FieldError>{fieldError(error, 'name')}</FieldError></div>
          <div>
            <Label>Email {profile.user.email && !profile.user.emailVerified && <span className="text-amber-600 text-xs">(not verified)</span>}</Label>
            <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            <FieldError>{fieldError(error, 'email')}</FieldError>
          </div>
          <div><Label>Mobile</Label><Input inputMode="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /><FieldError>{fieldError(error, 'phone')}</FieldError></div>
          <div className="sm:col-span-2 flex items-center justify-between">
            <span className="text-sm text-gray-500">POS PIN: {profile.user.hasPin ? 'set' : 'not set (ask the owner)'}</span>
            <Button onClick={save} disabled={updating.isLoading}>{updating.isLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />} Save</Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base flex items-center gap-2"><KeyRound className="h-4 w-4" /> Change password</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={savePassword} className="grid sm:grid-cols-3 gap-3">
            <div><Label>Current</Label><Input type="password" autoComplete="current-password" value={pw.current} onChange={(e) => setPw({ ...pw, current: e.target.value })} /><FieldError>{fieldError(pwError, 'currentPassword')}</FieldError></div>
            <div><Label>New</Label><Input type="password" autoComplete="new-password" value={pw.next} onChange={(e) => setPw({ ...pw, next: e.target.value })} /><FieldError>{fieldError(pwError, 'newPassword')}</FieldError></div>
            <div><Label>Confirm</Label><Input type="password" autoComplete="new-password" value={pw.confirm} onChange={(e) => setPw({ ...pw, confirm: e.target.value })} /><FieldError>{fieldError(pwError, 'confirm')}</FieldError></div>
            <div className="sm:col-span-3"><Button type="submit" variant="outline" disabled={changing.isLoading || pw.next.length < 8}>Change password</Button></div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};
