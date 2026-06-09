'use client';

import { useAuthStore } from '@/stores/auth-store';
import { useMyTenant } from './use-tenant';

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

  // Tenant details are no longer embedded in the auth payload — fetch from
  // /tenants/me (query is gated on isAuthenticated inside useMyTenant).
  const { data: tenant } = useMyTenant();

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
    tenantName: tenant?.name ?? user?.tenant?.name ?? 'Organization',
    tenantOrgType:
      tenant?.organizationType ?? user?.tenant?.organizationType ?? null,
  };
}
