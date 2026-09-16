/**
 * Which roles may reach which route. One map, read by two places.
 *
 * The sidebar and the middleware each used to carry their own copy. They never
 * actually contradicted each other — but only 21 of 36 sidebar routes had a
 * middleware entry at all, so /students, /fees, /ledger and a dozen others were
 * hidden by the sidebar and guarded by nothing. The API still refused the data,
 * so nothing leaked; typing the URL simply rendered a broken page instead of a
 * clean refusal, and the middleware map read as authoritative when it was not.
 *
 * Deliberately a plain module: no React, no icons, no imports at all. The
 * middleware runs in the edge runtime, and pulling nav-config in would drag
 * lucide with it.
 *
 * `undefined` means every authenticated user. A route that is absent is not
 * guarded here — see ROUTE_ROLES_EXEMPT below for the ones where that is a
 * decision rather than an oversight.
 */
export const ROUTE_ROLES: Record<string, string[] | undefined> = {
  "/": undefined,
  "/admin": ["super_admin"],
  "/admissions": [
    "tenant_owner",
    "ADMIN",
    "admissions.registrar",
    "admissions.officer",
  ],
  "/attendance": [
    "tenant_owner",
    "ADMIN",
    "academic.attendance_officer",
    "academic.teacher",
  ],
  "/audit-logs": ["tenant_owner", "ADMIN", "FINANCE_ADMIN"],
  "/banking": ["tenant_owner", "ADMIN", "FINANCE_ADMIN"],
  "/banks": ["tenant_owner", "ADMIN", "PAYROLL_OFFICER"],
  "/budgets": ["tenant_owner", "ADMIN", "FINANCE_ADMIN", "APPROVER"],
  "/classes": [
    "tenant_owner",
    "ADMIN",
    "admissions.registrar",
    "academic.teacher",
  ],
  "/departments": ["tenant_owner", "ADMIN"],
  "/employees": ["tenant_owner", "ADMIN", "PAYROLL_OFFICER", "VIEWER"],
  "/events": ["tenant_owner", "ADMIN"],
  "/expenses": ["tenant_owner", "ADMIN", "FINANCE_ADMIN", "APPROVER"],
  "/fees": ["tenant_owner", "ADMIN", "FINANCE_ADMIN", "admissions.registrar"],
  "/grades": ["tenant_owner", "ADMIN"],
  "/leave": ["tenant_owner", "ADMIN", "PAYROLL_OFFICER", "APPROVER"],
  "/ledger": ["tenant_owner", "ADMIN", "FINANCE_ADMIN"],
  "/loans": [
    "tenant_owner",
    "ADMIN",
    "PAYROLL_OFFICER",
    "FINANCE_ADMIN",
    "APPROVER",
  ],
  "/me": undefined,
  "/payroll": [
    "tenant_owner",
    "ADMIN",
    "PAYROLL_OFFICER",
    "FINANCE_ADMIN",
    "APPROVER",
  ],
  "/payslips": ["tenant_owner", "ADMIN", "PAYROLL_OFFICER"],
  "/portal": ["PARENT"],
  "/reports": ["tenant_owner", "ADMIN", "FINANCE_ADMIN", "VIEWER"],
  "/roles": ["tenant_owner", "ADMIN"],
  "/salary-components": ["tenant_owner", "ADMIN", "PAYROLL_OFFICER"],
  "/settings": ["tenant_owner", "ADMIN"],
  "/students": [
    "tenant_owner",
    "ADMIN",
    "admissions.registrar",
    "admissions.officer",
    "academic.teacher",
  ],
  "/tax-rules": ["tenant_owner", "ADMIN", "FINANCE_ADMIN"],
  "/awards": ["tenant_owner", "ADMIN", "academic.teacher", "VIEWER"],
  "/attendance/at-risk": ["tenant_owner", "ADMIN", "FINANCE_ADMIN"],
  "/attendance/calendar": ["tenant_owner", "ADMIN"],
  "/attendance/gate": ["tenant_owner", "ADMIN", "academic.attendance_officer"],
  "/fees/arrears": ["tenant_owner", "ADMIN", "FINANCE_ADMIN"],
  "/fees/invoices": [
    "tenant_owner",
    "ADMIN",
    "FINANCE_ADMIN",
    "admissions.registrar",
  ],
  "/fees/payments": [
    "tenant_owner",
    "ADMIN",
    "FINANCE_ADMIN",
    "admissions.registrar",
  ],
  "/me/classes": undefined,
  "/me/leave": undefined,
  "/me/profile": undefined,
};

/**
 * Routes with no entry above, on purpose.
 *
 * `/me/*` resolves its subject from the token — self-service, the parent portal
 * and a form teacher's own classes all answer "your own things" and return
 * nothing to anyone else. A role gate there adds no protection and has already
 * done harm once: gating `/me/classes` on `academic.teacher` hid a teacher's own
 * class from them, because being an Educator is a job role on the employee
 * record and does not grant that system role.
 */
export const ROUTE_ROLES_EXEMPT = ["/me"];

/**
 * The entry guarding a path: exact match first, then the LONGEST matching
 * prefix.
 *
 * Longest wins because first-match order handed a nested route the roles of its
 * parent — with both '/attendance' and '/attendance/gate' in the map, a route
 * under the gate would have inherited the wider register roles.
 */
export function routeRolesFor(pathname: string): {
  roles: string[] | undefined;
  key: string | null;
} {
  if (pathname in ROUTE_ROLES) {
    return { roles: ROUTE_ROLES[pathname], key: pathname };
  }
  let best: string | null = null;
  for (const route of Object.keys(ROUTE_ROLES)) {
    if (route === "/" || !pathname.startsWith(route + "/")) continue;
    if (!best || route.length > best.length) best = route;
  }
  return { roles: best ? ROUTE_ROLES[best] : undefined, key: best };
}
