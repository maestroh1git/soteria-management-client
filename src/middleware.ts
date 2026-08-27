import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Auth pages. Unauthenticated users may reach them, and authenticated users
// are redirected AWAY from them — you do not log in twice.
const publicRoutes = ['/login', '/register', '/accept-invite'];

/**
 * Routes open to anyone, matched by prefix.
 *
 * Distinct from `publicRoutes` in the direction that matters: nobody is
 * redirected away from these. A parent with no account must reach them, and a
 * registrar who is logged in must still be able to open their own application
 * form to see what parents see.
 *
 * Prefix-matched because both carry a parameter — the school's slug and the
 * application's token. Exact matching, which is what `publicRoutes` uses, would
 * send every parent to a login page they can never pass.
 */
const openRoutes = ['/apply', '/application', '/invoice'];

const isOpenRoute = (pathname: string) =>
  openRoutes.some(
    (route) => pathname === route || pathname.startsWith(route + '/'),
  );

// Route-to-roles map for authorization
// undefined means accessible to all authenticated users
const routeRoleMap: Record<string, string[] | undefined> = {
  '/': undefined,
  '/admin': ['super_admin'],
  '/employees': ['tenant_owner', 'ADMIN', 'PAYROLL_OFFICER', 'VIEWER'],
  '/roles': ['tenant_owner', 'ADMIN'],
  '/departments': ['tenant_owner', 'ADMIN'],
  '/payroll': ['tenant_owner', 'ADMIN', 'PAYROLL_OFFICER', 'FINANCE_ADMIN', 'APPROVER'],
  '/salary-components': ['tenant_owner', 'ADMIN', 'PAYROLL_OFFICER'],
  '/loans': ['tenant_owner', 'ADMIN', 'PAYROLL_OFFICER', 'FINANCE_ADMIN', 'APPROVER'],
  '/tax-rules': ['tenant_owner', 'ADMIN', 'FINANCE_ADMIN'],
  '/payslips': ['tenant_owner', 'ADMIN', 'PAYROLL_OFFICER'],
  '/reports': ['tenant_owner', 'ADMIN', 'FINANCE_ADMIN', 'VIEWER'],
  '/settings': ['tenant_owner', 'ADMIN'],
};

function getUserRoles(request: NextRequest): string[] | null {
  const cookie = request.cookies.get('user-roles')?.value;
  if (!cookie) return null;
  try {
    return JSON.parse(decodeURIComponent(cookie)) as string[];
  } catch {
    return null;
  }
}

function getRouteKey(pathname: string): string | null {
  // Exact match first
  if (routeRoleMap[pathname] !== undefined || pathname in routeRoleMap) {
    return pathname;
  }
  // Prefix match for nested routes (e.g., /employees/123)
  for (const route of Object.keys(routeRoleMap)) {
    if (route !== '/' && pathname.startsWith(route + '/')) {
      return route;
    }
  }
  return null;
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip middleware for static files, API routes, _next
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.includes('.')
  ) {
    return NextResponse.next();
  }

  // Check for auth token in cookie
  const token = request.cookies.get('auth-token')?.value;
  const isPublicRoute = publicRoutes.includes(pathname);
  const isChangePasswordRoute = pathname === '/change-password';
  const mustChangePassword =
    request.cookies.get('must-change-password')?.value === 'true';
  const userRoles = getUserRoles(request);
  const isSuperAdmin = userRoles?.includes('super_admin') ?? false;
  const isAdminRoute = pathname === '/admin' || pathname.startsWith('/admin/');

  // Open to everyone, logged in or not, and never redirected either way.
  if (isOpenRoute(pathname)) {
    return NextResponse.next();
  }

  // Unauthenticated user trying to access protected route
  if (!token && !isPublicRoute && !isChangePasswordRoute) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('from', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Authenticated user with must-change-password flag
  if (token && mustChangePassword && !isChangePasswordRoute && !isPublicRoute) {
    return NextResponse.redirect(new URL('/change-password', request.url));
  }

  // Authenticated user trying to access auth pages (except change-password) →
  // send platform operators to the console, tenant users to the dashboard.
  if (token && isPublicRoute) {
    if (mustChangePassword) {
      return NextResponse.redirect(new URL('/change-password', request.url));
    }
    return NextResponse.redirect(
      new URL(isSuperAdmin ? '/admin' : '/', request.url),
    );
  }

  // Platform operators have no tenant context — keep them inside /admin so they
  // never hit the (broken-for-them) tenant dashboard.
  if (
    token &&
    isSuperAdmin &&
    !isAdminRoute &&
    !isChangePasswordRoute
  ) {
    return NextResponse.redirect(new URL('/admin', request.url));
  }

  // Route-level role guard
  if (token && !isPublicRoute && !isChangePasswordRoute) {
    const routeKey = getRouteKey(pathname);
    if (routeKey !== null) {
      const allowedRoles = routeRoleMap[routeKey];
      if (allowedRoles && userRoles) {
        const hasAccess = allowedRoles.some((role) =>
          userRoles.includes(role),
        );
        if (!hasAccess) {
          const url = new URL('/', request.url);
          url.searchParams.set('unauthorized', 'true');
          return NextResponse.redirect(url);
        }
      }
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
