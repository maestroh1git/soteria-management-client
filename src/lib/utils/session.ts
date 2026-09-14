/**
 * Ending a session.
 *
 * The token lives in two places: localStorage, which the API client reads, and
 * a cookie, which the middleware reads. Clearing only one of them leaves the
 * app wedged — the middleware still believes you are signed in, so it bounces
 * you off /login back to a dashboard that can no longer load anything.
 */

/** Set by the auth pages purely so the middleware can read them. */
const AUTH_COOKIES = ['auth-token', 'user-roles', 'must-change-password'];

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
