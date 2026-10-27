import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Delete, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AuthShell, FormError } from '@/components/AuthShell';
import { usePinLoginMutation } from '@/store/endpoints/auth';
import { errorMessage } from '@/lib/apiError';

export const DEVICE_KEY = 'sk.deviceToken';

const readDevice = () => {
  try { return localStorage.getItem(DEVICE_KEY); } catch { return null; }
};

// Shared POS terminal: staff switch users with their PIN.
export const PinLoginPage: React.FC = () => {
  const navigate = useNavigate();
  const deviceToken = readDevice();
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [login, { isLoading }] = usePinLoginMutation();

  if (!deviceToken) {
    return (
      <AuthShell title="Not a POS terminal" subtitle="An owner can register this browser under Settings → POS terminals">
        <Button asChild className="w-full"><Link to="/admin/login">Log in with password</Link></Button>
      </AuthShell>
    );
  }

  const submit = async (value: string) => {
    setError('');
    try {
      await login({ pin: value, deviceToken }).unwrap();
      navigate('/admin/orders');
    } catch (e) {
      setError(errorMessage(e));
      setPin('');
    }
  };

  const press = (d: string) => {
    if (isLoading) return;
    const next = (pin + d).slice(0, 6);
    setPin(next);
  };

  return (
    <AuthShell title="Enter your PIN">
      <div className="space-y-4">
        <div className="flex justify-center gap-3 h-6">
          {Array.from({ length: Math.max(4, pin.length) }, (_, i) => (
            <span key={i} className={`h-4 w-4 rounded-full ${i < pin.length ? 'bg-blue-600' : 'bg-gray-200'}`} />
          ))}
        </div>
        <FormError>{error}</FormError>
        <div className="grid grid-cols-3 gap-3">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((d) => (
            <Button key={d} variant="outline" className="h-16 text-2xl" onClick={() => press(d)}>{d}</Button>
          ))}
          <Button variant="ghost" className="h-16" onClick={() => setPin(pin.slice(0, -1))} aria-label="Delete"><Delete className="h-6 w-6" /></Button>
          <Button variant="outline" className="h-16 text-2xl" onClick={() => press('0')}>0</Button>
          <Button className="h-16" disabled={pin.length < 4 || isLoading} onClick={() => submit(pin)}>
            {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Go'}
          </Button>
        </div>
        <p className="text-center text-sm"><Link to="/admin/login" className="text-blue-600 hover:underline">Use password instead</Link></p>
      </div>
    </AuthShell>
  );
};
