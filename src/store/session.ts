import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { Permission, Profile } from '@/types/api';

// The access token lives only in memory. On reload, the httpOnly refresh
// cookie gets a new one (see SessionBootstrap).
export interface SessionState {
  status: 'checking' | 'authenticated' | 'anonymous';
  accessToken: string | null;
  profile: Profile | null;
  outletId: string | null;
}

const OUTLET_KEY = 'sk.outletId';

const readOutlet = () => {
  try { return localStorage.getItem(OUTLET_KEY); } catch { return null; }
};
const writeOutlet = (id: string | null) => {
  try {
    if (id) localStorage.setItem(OUTLET_KEY, id);
    else localStorage.removeItem(OUTLET_KEY);
  } catch { /* private mode */ }
};

const initialState: SessionState = { status: 'checking', accessToken: null, profile: null, outletId: readOutlet() };

// Keep the chosen outlet if the user still has it, otherwise take the first.
const pickOutlet = (profile: Profile, current: string | null, preferred?: string) => {
  const ids = profile.outlets.map((o) => o.id);
  if (preferred && ids.includes(preferred)) return preferred;
  if (current && ids.includes(current)) return current;
  return ids[0] ?? null;
};

const session = createSlice({
  name: 'session',
  initialState,
  reducers: {
    tokenRefreshed(state, action: PayloadAction<string>) {
      state.accessToken = action.payload;
    },
    signedIn(state, action: PayloadAction<Profile & { accessToken: string; outletId?: string }>) {
      const { accessToken, outletId, ...profile } = action.payload;
      state.status = 'authenticated';
      state.accessToken = accessToken;
      state.profile = profile;
      state.outletId = pickOutlet(profile, state.outletId, outletId);
      writeOutlet(state.outletId);
    },
    profileLoaded(state, action: PayloadAction<Profile>) {
      state.profile = action.payload;
      state.status = 'authenticated';
      state.outletId = pickOutlet(action.payload, state.outletId);
      writeOutlet(state.outletId);
    },
    outletChanged(state, action: PayloadAction<string>) {
      state.outletId = action.payload;
      writeOutlet(action.payload);
    },
    signedOut(state) {
      state.status = 'anonymous';
      state.accessToken = null;
      state.profile = null;
    },
  },
});

export const { tokenRefreshed, signedIn, profileLoaded, outletChanged, signedOut } = session.actions;
export default session.reducer;

type WithSession = { session: SessionState };
export const selectSession = (s: WithSession) => s.session;
export const selectProfile = (s: WithSession) => s.session.profile;
export const selectOutletId = (s: WithSession) => s.session.outletId;
export const selectCan = (permission: Permission) => (s: WithSession) => {
  const p = s.session.profile;
  return Boolean(p && (p.role.isOwner || p.permissions.includes(permission)));
};
