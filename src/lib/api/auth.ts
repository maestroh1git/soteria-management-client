import api from './client';
import type { User } from '@/lib/types/api';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  organizationName?: string;
  organizationType?: string;
  industry?: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}

export interface AcceptInviteRequest {
  token: string;
  password: string;
}

export interface ResetPasswordRequest {
  token: string;
  password: string;
}

export const authApi = {
  login: (data: LoginRequest): Promise<AuthResponse> =>
    api.post('/auth/login', data),

  register: (data: RegisterRequest): Promise<AuthResponse> =>
    api.post('/auth/register', data),

  // Sets an invited account's first password and signs them in — same shape as
  // login, so the caller applies the session the same way.
  acceptInvite: (data: AcceptInviteRequest): Promise<AuthResponse> =>
    api.post('/auth/accept-invite', data),

  // Always resolves with the same generic message, whether or not the email
  // matched an account — the API does not reveal which.
  requestReset: (email: string): Promise<{ message: string }> =>
    api.post('/auth/request-reset', { email }),

  // Sets a new password from a reset link and signs them in.
  resetPassword: (data: ResetPasswordRequest): Promise<AuthResponse> =>
    api.post('/auth/reset-password', data),
};
