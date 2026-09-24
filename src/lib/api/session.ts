import api from './client';
import type { Action } from '@/lib/auth/actions';

/**
 * GET /auth/session: who I am and what I may do, read fresh by the API on
 * every call. See SessionController in the API.
 */
export interface Session {
    user: {
        id: string;
        email: string;
        firstName: string;
        lastName: string;
        systemRoles: string[];
        mustChangePassword: boolean;
        tenantId: string | null;
    };
    tenant: {
        id: string;
        name: string;
        slug: string;
        organizationType: string | null;
    } | null;
    /** The actions this person may perform. */
    capabilities: Action[];
    /** What is theirs by identity rather than role. */
    identity: {
        principalType: string;
        employeeId: string | null;
        guardianId: string | null;
        /** Class arms they are the educator of. */
        formTeacherOf: string[];
    };
}

export async function getSession(): Promise<Session> {
    return (await api.get('/auth/session')) as unknown as Session;
}
