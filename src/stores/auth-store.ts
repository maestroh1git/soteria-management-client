import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User } from '@/lib/types/api';
import { authApi, type LoginRequest, type RegisterRequest } from '@/lib/api/auth';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  // Actions
  login: (data: LoginRequest) => Promise<void>;
  register: (data: RegisterRequest) => Promise<void>;
  logout: () => void;
  setError: (error: string | null) => void;
  hasRole: (roles: string[]) => boolean;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      login: async (data: LoginRequest) => {
        set({ isLoading: true, error: null });
        try {
          const response = await authApi.login(data);
          localStorage.setItem('auth-token', response.token);
          set({
            user: response.user,
            token: response.token,
            isAuthenticated: true,
            isLoading: false,
          });
        } catch (err: unknown) {
          const message =
            err && typeof err === 'object' && 'message' in err
              ? String((err as { message: string | string[] }).message)
              : 'Login failed';
          set({ isLoading: false, error: message });
          throw err;
        }
      },

      register: async (data: RegisterRequest) => {
        set({ isLoading: true, error: null });
        try {
          const response = await authApi.register(data);
          localStorage.setItem('auth-token', response.token);
          set({
            user: response.user,
            token: response.token,
            isAuthenticated: true,
            isLoading: false,
          });
        } catch (err: unknown) {
          const message =
            err && typeof err === 'object' && 'message' in err
              ? String((err as { message: string | string[] }).message)
              : 'Registration failed';
          set({ isLoading: false, error: message });
          throw err;
        }
      },

      logout: () => {
        localStorage.removeItem('auth-token');
        set({
          user: null,
          token: null,
          isAuthenticated: false,
          error: null,
        });
      },

      setError: (error) => set({ error }),

      hasRole: (roles: string[]) => {
        const user = get().user;
        if (!user) return false;
        return user.systemRoles.some((role) =>
          roles.map((r) => r.toLowerCase()).includes(role.toLowerCase()),
        );
      },
    }),
    {
      name: 'auth-store',
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
    },
  ),
);
