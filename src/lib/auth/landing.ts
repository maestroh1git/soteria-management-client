import { rolesCan } from './actions';

/**
 * Where someone belongs, decided in one place.
 *
 * Login, accepting an invite and resetting a password each used to read the
 * roles themselves, and disagreed: the two newer pages sent a guardian to the
 * portal, login sent them to the staff dashboard for the middleware to bounce.
 */

type WithRoles = { systemRoles?: readonly string[] } | null | undefined;

/** A platform operator: no tenant, lives in the admin console. */
export function isPlatformOperator(user: WithRoles): boolean {
  return rolesCan(user?.systemRoles ?? [], 'platform.read');
}

/** A guardian: their home is the parent portal. */
export function isGuardian(user: WithRoles): boolean {
  return !!user?.systemRoles?.includes('PARENT');
}

/**
 * The first screen after signing in. `from` is where the middleware stopped
 * them, honoured when it is inside their own part of the app.
 */
export function landingFor(user: WithRoles, from?: string | null): string {
  if (isPlatformOperator(user)) return '/admin';
  if (isGuardian(user)) return from?.startsWith('/portal') ? from : '/portal';
  return from || '/';
}
