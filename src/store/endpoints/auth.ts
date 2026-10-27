import { api } from '../api';
import { signedIn, signedOut, profileLoaded } from '../session';
import type { AuthResult, Device, Profile } from '@/types/api';

export interface SignupInput {
  restaurantName: string;
  outletName: string;
  city: string;
  ownerName: string;
  email: string;
  phone: string;
  password: string;
}

// Any endpoint returning AuthResult signs the user in.
const signInOnSuccess = async (_: unknown, { dispatch, queryFulfilled }: { dispatch: (a: unknown) => unknown; queryFulfilled: Promise<{ data: AuthResult }> }) => {
  try {
    const { data } = await queryFulfilled;
    dispatch(signedIn(data));
  } catch { /* the form shows the error */ }
};

export const authApi = api.injectEndpoints({
  endpoints: (b) => ({
    login: b.mutation<AuthResult, { login: string; password: string }>({
      query: (body) => ({ url: '/auth/login', method: 'POST', body }),
      onQueryStarted: signInOnSuccess,
    }),
    signup: b.mutation<AuthResult, SignupInput>({
      query: (body) => ({ url: '/auth/signup', method: 'POST', body }),
      onQueryStarted: signInOnSuccess,
    }),
    pinLogin: b.mutation<AuthResult, { pin: string; deviceToken: string }>({
      query: ({ pin, deviceToken }) => ({
        url: '/auth/pin-login', method: 'POST', body: { pin }, headers: { 'X-Device-Token': deviceToken },
      }),
      onQueryStarted: signInOnSuccess,
    }),
    // Called once on page load: the httpOnly cookie gets a fresh access token.
    restoreSession: b.mutation<{ accessToken: string }, void>({
      query: () => ({ url: '/auth/refresh', method: 'POST' }),
    }),
    logout: b.mutation<null, void>({
      query: () => ({ url: '/auth/logout', method: 'POST' }),
      async onQueryStarted(_, { dispatch, queryFulfilled }) {
        await queryFulfilled.catch(() => {});
        dispatch(signedOut());
        dispatch(api.util.resetApiState());
      },
    }),
    me: b.query<Profile, void>({
      query: () => '/auth/me',
      providesTags: ['Me'],
      async onQueryStarted(_, { dispatch, queryFulfilled }) {
        try { dispatch(profileLoaded((await queryFulfilled).data)); } catch { /* handled by baseQuery */ }
      },
    }),
    updateMe: b.mutation<Profile, { name?: string; email?: string; phone?: string }>({
      query: (body) => ({ url: '/auth/me', method: 'PATCH', body }),
      invalidatesTags: ['Me'],
    }),
    changePassword: b.mutation<{ accessToken: string }, { currentPassword: string; newPassword: string }>({
      query: (body) => ({ url: '/auth/change-password', method: 'POST', body }),
    }),
    forgotPassword: b.mutation<null, { login: string }>({
      query: (body) => ({ url: '/auth/forgot-password', method: 'POST', body }),
    }),
    resetPassword: b.mutation<null, { login: string; otp: string; newPassword: string }>({
      query: (body) => ({ url: '/auth/reset-password', method: 'POST', body }),
    }),
    acceptInvite: b.mutation<null, { token: string; password: string }>({
      query: (body) => ({ url: '/auth/accept-invite', method: 'POST', body }),
    }),
    verifyEmail: b.mutation<null, { token: string }>({
      query: (body) => ({ url: '/auth/verify-email', method: 'POST', body }),
    }),
    devices: b.query<Device[], void>({
      query: () => '/auth/devices',
      providesTags: ['Device'],
    }),
    registerDevice: b.mutation<{ device: Device; deviceToken: string }, { name: string }>({
      query: (body) => ({ url: '/auth/devices', method: 'POST', body }),
      invalidatesTags: ['Device'],
    }),
    removeDevice: b.mutation<null, string>({
      query: (id) => ({ url: `/auth/devices/${id}`, method: 'DELETE' }),
      invalidatesTags: ['Device'],
    }),
  }),
});

export const {
  useLoginMutation, useSignupMutation, usePinLoginMutation, useRestoreSessionMutation, useLogoutMutation, useMeQuery,
  useUpdateMeMutation, useChangePasswordMutation, useForgotPasswordMutation, useResetPasswordMutation,
  useAcceptInviteMutation, useVerifyEmailMutation, useDevicesQuery, useRegisterDeviceMutation, useRemoveDeviceMutation,
} = authApi;
