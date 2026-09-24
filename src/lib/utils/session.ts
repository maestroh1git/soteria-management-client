/**
 * Ending a session.
 *
 * The token lives in two places: localStorage, which the API client reads, and
 * a cookie, which the middleware reads. Clearing only one of them leaves the
 * app wedged — the middleware still believes you are signed in, so it bounces
 * you off /login back to a dashboard that can no longer load anything.
 */

/** Written by startSession purely so the middleware can read them. */
const AUTH_COOKIES = ['auth-token', 'user-roles', 'must-change-password'];

const SESSION_SECONDS = 60 * 60 * 24 * 7;

/** Pages a signed-out user is allowed to sit on. */
const AUTH_PATHS = [
    '/login',
    '/register',
    '/accept-invite',
    '/forgot-password',
    '/reset-password',
    '/change-password',
];

export function isAuthPath(pathname: string): boolean {
    return AUTH_PATHS.some((p) => pathname === p || pathname.startsWith(p + '/'));
}

export function clearSession(): void {
    if (typeof window === 'undefined') return;
    try {
        localStorage.removeItem('auth-token');
        localStorage.removeItem('auth-store');
    } catch {
        // Storage can throw in private mode; the cookies still have to go.
    }
    for (const name of AUTH_COOKIES) {
        document.cookie = `${name}=; path=/; max-age=0`;
    }
}

/**
 * Starting a session: the token where the API client reads it, and the cookies
 * the middleware reads.
 *
 * The one place a sign-in writes them. Login, register, accept-invite,
 * reset-password and change-password each used to write their own, and they
 * drifted: registering set no roles cookie at all, so the middleware's role
 * check silently skipped a new owner (system map, finding A6).
 */
export function startSession(session: {
    token: string;
    user: { systemRoles?: string[]; mustChangePassword?: boolean } | null;
}): void {
    if (typeof window === 'undefined') return;
    try {
        localStorage.setItem('auth-token', session.token);
    } catch {
        // Private mode can refuse storage; the cookies below still matter.
    }
    const set = (name: string, value: string) => {
        document.cookie = `${name}=${value}; path=/; max-age=${SESSION_SECONDS}`;
    };
    set('auth-token', 'true');
    set(
        'user-roles',
        encodeURIComponent(JSON.stringify(session.user?.systemRoles ?? [])),
    );
    if (session.user?.mustChangePassword) {
        set('must-change-password', 'true');
    } else {
        document.cookie = 'must-change-password=; path=/; max-age=0';
    }
}
