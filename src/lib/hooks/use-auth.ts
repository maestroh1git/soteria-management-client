'use client';

import { useAuthStore } from '@/stores/auth-store';
import { useMyTenant } from './use-tenant';
import { useHydrated } from './use-hydrated';
import { routeRolesFor } from '@/lib/auth/route-roles';

const noRole = () => false;

export function useAuth() {
  const store = useAuthStore();
  const { isLoading, error, login, register, logout, setError } = store;

  // Signed-out until this component has hydrated, so its first render matches
  // the server's HTML. See useHydrated for why the store alone is too early.
  const hydrated = useHydrated();
  const user = hydrated ? store.user : null;
  const token = hydrated ? store.token : null;
  const isAuthenticated = hydrated && store.isAuthenticated;
  const hasRole = hydrated ? store.hasRole : noRole;
  /** Whether the middleware would let them open this path. The sidebar's test. */
  const mayReach = (href: string) => {
    const { roles } = routeRolesFor(href);
    return !roles || hasRole(roles);
  };

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
    mayReach,

    // Convenience getters
    fullName: user ? `${user.firstName} ${user.lastName}` : '',
    initials: user
      ? `${user.firstName[0]}${user.lastName[0]}`.toUpperCase()
      : '',
    // Tenant fields are gated the same way. The tenant query is started by the
    // layout, which hydrates first, so by the time a page's boundary hydrates
    // the real name can already be in the cache — and "Here's what's happening
    // at Greenfield Academy" against the server's "…at Organization" was the
    // last React #418 the persona tests found.
    tenantName: hydrated
      ? (tenant?.name ?? user?.tenant?.name ?? 'Organization')
      : 'Organization',
    tenantOrgType: hydrated
      ? (tenant?.organizationType ?? user?.tenant?.organizationType ?? null)
      : null,
    /** The school's public address — what /apply/[slug] is keyed by. */
    tenantSlug: hydrated ? (tenant?.slug ?? user?.tenant?.slug ?? null) : null,
  };
}
