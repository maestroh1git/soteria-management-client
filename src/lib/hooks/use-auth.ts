'use client';

import { useAuthStore } from '@/stores/auth-store';

export function useAuth() {
  const {
    user,
    token,
    isAuthenticated,
    isLoading,
    error,
    login,
    register,
    logout,
    setError,
    hasRole,
  } = useAuthStore();

  return {
    user,
    token,
    isAuthenticated,
    isLoading,
    error,
    login,
    register,
    logout,
    setError,
    hasRole,

    // Convenience getters
    fullName: user ? `${user.firstName} ${user.lastName}` : '',
    initials: user
      ? `${user.firstName[0]}${user.lastName[0]}`.toUpperCase()
      : '',
    tenantName: user?.tenant?.name ?? 'School',
  };
}
