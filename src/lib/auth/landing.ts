import { rolesCan } from './actions';
import { getSession } from '@/lib/api/session';

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
export function landingFor(
  user: WithRoles,
  from?: string | null,
  identity?: { formTeacherOf: readonly string[] } | null,
): string {
  if (isPlatformOperator(user)) return '/admin';
  if (isGuardian(user)) return from?.startsWith('/portal') ? from : '/portal';
  if (from) return from;
  // A form teacher's day starts with their register (C4.8), unless they also
  // run part of the school, whose home is the dashboard.
  if (identity?.formTeacherOf.length && !runsTheSchool(user)) return '/me/classes';
  return '/';
}

/** Anyone whose work is the school's or the payroll's, not one class. */
function runsTheSchool(user: WithRoles): boolean {
  const roles = user?.systemRoles ?? [];
  return (
    rolesCan(roles, 'reports.monthly') ||
    rolesCan(roles, 'payroll.approve') ||
    rolesCan(roles, 'admissions.read') ||
    rolesCan(roles, 'fees.read') ||
    rolesCan(roles, 'attendance.gate')
  );
}

/**
 * `landingFor` once signed in: asks the session which classes are theirs,
 * which the sign-in response does not carry. A failed lookup lands them on
 * the dashboard, as before.
 */
export async function landingAfterSignIn(user: WithRoles, from?: string | null): Promise<string> {
  const session = await getSession().catch(() => null);
  return landingFor(user, from, session?.identity);
}
