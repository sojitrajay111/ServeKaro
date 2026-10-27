import React, { createContext, useCallback, useContext, useRef, useState } from 'react';
import { ShieldCheck } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { isApiError, toastError } from '@/lib/apiError';
import type { Approval } from '@/types/api';

type Runner = <T>(action: (approval?: Approval) => Promise<T>) => Promise<T | undefined>;

const ApprovalContext = createContext<Runner | null>(null);

/**
 * withApproval(fn): runs fn(). If the server says a manager must approve,
 * asks for a manager PIN and runs fn({ pin }) again. Other errors are toasted.
 */
export const useApproval = () => {
  const run = useContext(ApprovalContext);
  if (!run) throw new Error('useApproval must be inside ApprovalProvider');
  return run;
};

export function ApprovalProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [pin, setPin] = useState('');
  const [message, setMessage] = useState('');
  const pending = useRef<((pin: string | null) => void) | null>(null);

  const askPin = (msg: string) => new Promise<string | null>((resolve) => {
    setPin('');
    setMessage(msg);
    pending.current = resolve;
    setOpen(true);
  });

  const close = (value: string | null) => {
    setOpen(false);
    pending.current?.(value);
    pending.current = null;
  };

  const run: Runner = useCallback(async (action) => {
    let approval: Approval | undefined;
    for (;;) {
      try {
        return await action(approval);
      } catch (e) {
        if (isApiError(e) && (e.code === 'APPROVAL_REQUIRED' || e.code === 'APPROVAL_INVALID')) {
          const entered = await askPin(e.code === 'APPROVAL_INVALID' ? 'That PIN cannot approve this. Try another.' : e.message);
          if (!entered) return undefined;
          approval = { pin: entered };
          continue;
        }
        toastError(e);
        return undefined;
      }
    }
  }, []);

  return (
    <ApprovalContext.Provider value={run}>
      {children}
      <Dialog open={open} onOpenChange={(o) => !o && close(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><ShieldCheck className="h-5 w-5 text-accent" /> Manager approval</DialogTitle>
            <DialogDescription>{message}</DialogDescription>
          </DialogHeader>
          <form onSubmit={(e) => { e.preventDefault(); if (/^\d{4,6}$/.test(pin)) close(pin); }}>
            <Input
              autoFocus
              type="password"
              inputMode="numeric"
              autoComplete="off"
              placeholder="Manager PIN"
              maxLength={6}
              value={pin}
              onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
              className="text-center text-2xl tracking-[0.5em] h-14"
            />
            <DialogFooter className="mt-4">
              <Button type="button" variant="outline" onClick={() => close(null)}>Cancel</Button>
              <Button type="submit" disabled={!/^\d{4,6}$/.test(pin)}>Approve</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </ApprovalContext.Provider>
  );
}
