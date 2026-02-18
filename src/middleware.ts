import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Routes that don't require authentication
const publicRoutes = ['/login', '/register'];

// Route-to-roles map for authorization
// undefined means accessible to all authenticated users
const routeRoleMap: Record<string, string[] | undefined> = {
  '/': undefined,
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

  // Authenticated user trying to access auth pages (except change-password) → redirect to dashboard
  if (token && isPublicRoute) {
    if (mustChangePassword) {
      return NextResponse.redirect(new URL('/change-password', request.url));
    }
    return NextResponse.redirect(new URL('/', request.url));
  }

  // Route-level role guard
  if (token && !isPublicRoute && !isChangePasswordRoute) {
    const routeKey = getRouteKey(pathname);
    if (routeKey !== null) {
      const allowedRoles = routeRoleMap[routeKey];
      if (allowedRoles) {
        const userRolesCookie = request.cookies.get('user-roles')?.value;
        if (userRolesCookie) {
          try {
            const userRoles: string[] = JSON.parse(
              decodeURIComponent(userRolesCookie),
            );
            const hasAccess = allowedRoles.some((role) =>
              userRoles.includes(role),
            );
            if (!hasAccess) {
              const url = new URL('/', request.url);
              url.searchParams.set('unauthorized', 'true');
              return NextResponse.redirect(url);
            }
          } catch {
            // If cookie is malformed, allow through (backend will catch it)
          }
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
