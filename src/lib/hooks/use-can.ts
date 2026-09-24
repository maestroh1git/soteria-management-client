'use client';

import { useCallback } from 'react';
import { useAuth } from './use-auth';
import { rolesCan, type Action } from '@/lib/auth/actions';

/**
 * `const can = useCan(); can('payroll.approve')`.
 *
 * The one question a screen asks before offering an action. Hydration-safe
 * through useAuth: false on the first render, like the server's HTML.
 */
export function useCan(): (action: Action) => boolean {
    const { user } = useAuth();
    const roles = user?.systemRoles;
    return useCallback(
        (action: Action) => (roles ? rolesCan(roles, action) : false),
        [roles],
    );
}
