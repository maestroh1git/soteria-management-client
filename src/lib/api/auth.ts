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

export const authApi = {
  login: (data: LoginRequest): Promise<AuthResponse> =>
    api.post('/auth/login', data),

  register: (data: RegisterRequest): Promise<AuthResponse> =>
    api.post('/auth/register', data),
};
