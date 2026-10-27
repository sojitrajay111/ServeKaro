import { useAppSelector } from '@/store/hooks';
import type { Permission } from '@/types/api';

// UI hint only: the server checks every permission again.
export function useCan() {
  const profile = useAppSelector((s) => s.session.profile);
  return (permission: Permission) => Boolean(profile && (profile.role.isOwner || profile.permissions.includes(permission)));
}
