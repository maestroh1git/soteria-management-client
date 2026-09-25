'use client';

import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getSession } from '@/lib/api/session';
import { useAuthStore } from '@/stores/auth-store';
import { writeRolesCookie } from '@/lib/utils/session';
import { useHydrated } from './use-hydrated';

export const SESSION_KEY = ['auth', 'session'] as const;

/**
 * The signed-in person as the API sees them now.
 *
 * Refetched whenever the window regains focus and after any change to a user's
 * access (useUpdateUser invalidates it), so a role granted or taken away in
 * Settings reaches the person's screens without them signing out. Before this
 * the client learned roles once, at sign-in (system map, A6).
 */
export function useSession() {
    const hydrated = useHydrated();
    const signedIn = useAuthStore((s) => s.isAuthenticated);
    return useQuery({
        queryKey: SESSION_KEY,
        queryFn: getSession,
        enabled: hydrated && signedIn,
        staleTime: 30 * 1000,
        refetchOnWindowFocus: 'always',
        retry: false,
    });
}

/**
 * Keeps the stored user and the middleware's roles cookie in step with the
 * session. Mounted once in each signed-in shell.
 */
export function SessionSync() {
    const { data } = useSession();
    const setUser = useAuthStore((s) => s.setUser);

    useEffect(() => {
        if (!data) return;
        const current = useAuthStore.getState().user;
        if (!current) return;
        const was = [...(current.systemRoles ?? [])].sort().join(',');
        const now = [...data.user.systemRoles].sort().join(',');
        if (was !== now) {
            setUser({ ...current, systemRoles: data.user.systemRoles });
            writeRolesCookie(data.user.systemRoles);
        }
    }, [data, setUser]);

    return null;
}

/**
 * The caller's own employee record, if their login has one. Decisions about
 * it (their own leave, their own loan) are for another approver; the API
 * refuses them, and screens hide the buttons to match.
 */
export function useMyEmployeeId(): string | null {
    // SessionSync loads the session from the layout, so it can already be
    // cached while a page's boundary hydrates; answer as the server did first.
    const hydrated = useHydrated();
    const { data } = useSession();
    return hydrated ? (data?.identity.employeeId ?? null) : null;
}
