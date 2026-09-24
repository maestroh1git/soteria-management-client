'use client';

import { useCallback } from 'react';
import { useAuth } from './use-auth';
import { useSession } from './use-session';
import { rolesCan, type Action } from '@/lib/auth/actions';

/**
 * `const can = useCan(); can('payroll.approve')`.
 *
 * The one question a screen asks before offering an action. Answered from the
 * person's own capabilities as the API reports them (GET /auth/session), so it
 * follows the server's rules exactly and stays current when their access
 * changes. Until the session has loaded, from their stored roles and the
 * generated registry, which say the same thing as of sign-in.
 *
 * Hydration-safe: false on the first render, like the server's HTML.
 */
export function useCan(): (action: Action) => boolean {
    const { user } = useAuth();
    const { data: session } = useSession();
    const capabilities = session?.capabilities;
    const roles = user?.systemRoles;
    return useCallback(
        (action: Action) => {
            if (!roles) return false;
            if (capabilities) return capabilities.includes(action);
            return rolesCan(roles, action);
        },
        [capabilities, roles],
    );
}
