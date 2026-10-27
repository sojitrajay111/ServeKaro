import { useEffect, useRef } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { signedOut, tokenRefreshed } from '@/store/session';
import { authApi, useRestoreSessionMutation } from '@/store/endpoints/auth';

// On first load, trade the refresh cookie for an access token and load the
// profile. Customer pages don't wait for this; admin routes do (ProtectedRoute).
export function SessionBootstrap() {
  const dispatch = useAppDispatch();
  const status = useAppSelector((s) => s.session.status);
  const [restore] = useRestoreSessionMutation();
  const started = useRef(false);

  useEffect(() => {
    if (status !== 'checking' || started.current) return;
    started.current = true;
    (async () => {
      try {
        const { accessToken } = await restore().unwrap();
        dispatch(tokenRefreshed(accessToken));
        await dispatch(authApi.endpoints.me.initiate()).unwrap();
      } catch {
        dispatch(signedOut());
      }
    })();
  }, [status, restore, dispatch]);

  return null;
}
