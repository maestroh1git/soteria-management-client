/**
 * Who may do what — every action a screen offers, named once, with the roles
 * the API accepts for it.
 *
 * Screens ask `can('payroll.approve')`; they never list roles. Before this,
 * twenty pages each carried their own `hasRole([...])` list, most pages carried
 * none, and the result was buttons the API refused: an Approver offered
 * "Process payroll", a Registrar offered every fee write, a Payroll Officer
 * offered "Approve" on the loans they raise (system map, finding A3).
 *
 * Interim, by design (ROADMAP-EXECUTION.md, C1.1). Each entry is copied from the
 * `@Roles(...)` on the endpoint named beside it. Wave 2 replaces this map with
 * the server's own list (`GET /auth/session` capabilities), and the screens
 * keep calling `can()` unchanged. Until then, when an API role list changes,
 * change it here too.
 *
 * Plain module, no React: the middleware and the nav read these as well.
 */

const O = 'tenant_owner';
const A = 'ADMIN';
const P = 'PAYROLL_OFFICER';
const F = 'FINANCE_ADMIN';
const Ap = 'APPROVER';
const V = 'VIEWER';
const R = 'admissions.registrar';
const T = 'academic.teacher';
const AT = 'academic.attendance_officer';

export const ACTIONS = {
    // ── Staff ─────────────────────────────────────────────────────────────
    /** GET /employees */
    'employees.read': [O, A, P, V],
    /** POST/PATCH/DELETE /employees, bank details, pay lines, import */
    'employees.manage': [O, A, P],
    /** GET /roles — the position picker on the employee form */
    'positions.read': [O, A, P, V],
    /** POST/PATCH/DELETE /roles */
    'positions.manage': [O, A],
    /** GET /departments */
    'departments.read': [O, A, P, F, Ap, V],
    /** GET /salary-components */
    'salaryComponents.read': [O, A, P],

    // ── Pay ───────────────────────────────────────────────────────────────
    /** POST /pay-periods */
    'payPeriods.create': [O, A, P],
    /** GET /payroll/salaries */
    'payroll.readSalaries': [O, A, P, F, Ap, V],
    /** POST /payroll/process, DELETE /payroll/salaries/draft */
    'payroll.process': [O, A, P],
    /** PATCH /payroll/salaries/:id/approve, POST /payroll/bulk-approve */
    'payroll.approve': [O, A, Ap],
    /** PATCH /payroll/salaries/:id/pay, POST /payroll/bulk-payment */
    'payroll.pay': [O, A, P],
    /** GET /payroll/payment-file/:id (the file the bank receives) */
    'payroll.paymentFile': [O, A, F],
    /** GET /payroll/payment-file/:id/preview */
    'payroll.paymentFile.preview': [O, A, F, P],
    /** POST /payroll-adjustments, PATCH, DELETE */
    'payroll.adjustments.raise': [O, A, P],
    /** POST /payroll-adjustments/:id/approve|reject */
    'payroll.adjustments.decide': [O, A, Ap],
    /** POST /payslips/generate*, /send* */
    'payslips.manage': [O, A, P],
    /** POST /loans, /loans/advances */
    'loans.create': [O, A, P],
    /** PATCH /loans/:id/approve|reject */
    'loans.decide': [O, A, Ap],
    /** PATCH /loans/:id/disburse */
    'loans.disburse': [O, A, P],
    /** POST /leave/requests (on someone's behalf), /:id/cancel */
    'leave.raise': [O, A, P],
    /** POST /leave/requests/:id/approve|reject */
    'leave.decide': [O, A, Ap],
    /** POST/PATCH /leave/types */
    'leave.types.manage': [O, A],

    /** POST/PATCH/DELETE /tax/rules (reads: O A P F V) */
    'tax.manage': [O, A, F],

    // ── Money ─────────────────────────────────────────────────────────────
    /** GET /ledger/* */
    'ledger.read': [O, A, F],
    /** GET /fees/* */
    'fees.read': [O, A, F, R],
    /** Every fee write: items, prices, invoices, receipts, concessions */
    'fees.write': [O, A, F],
    /** POST /expenses, submit, pay, cancel, reopen, receipts */
    'expenses.raise': [O, A, F],
    /** POST /expenses/:id/approve|reject */
    'expenses.decide': [O, A, F, Ap],
    /** POST/DELETE /budgets */
    'budgets.manage': [O, A, F],

    // ── Reports ───────────────────────────────────────────────────────────
    /** GET /reports/monthly-summary */
    'reports.monthly': [O, A, P, F, V],
    /** GET /reports/tax-summary, /loan-portfolio, /department-cost */
    'reports.detail': [O, A, P, F],
    /** GET /reports/year-end */
    'reports.yearEnd': [O, A, F],

    // ── School ────────────────────────────────────────────────────────────
    /** GET /students/:id — a pupil's full record */
    'students.read': [O, A, R, 'admissions.officer', T],
    /** POST/PATCH /students, guardians, medical, documents, import */
    'students.manage': [O, A, R],
    /** POST/PATCH /academics/* */
    'academics.manage': [O, A, R],
    /** GET /attendance/summary/day, /at-risk, /calendar */
    'attendance.report': [O, A, AT, T, F, V],
    /** POST /attendance/calendar/generate, PATCH /attendance/calendar/* */
    'attendance.calendar.manage': [O, A],
    /** POST /students/:id/awards, DELETE */
    'awards.grant': [O, A, T],

    // ── Organisation ──────────────────────────────────────────────────────
    /** POST/PATCH/DELETE /users — including a parent's portal invite */
    'users.manage': [O, A],
} as const satisfies Record<string, readonly string[]>;

export type Action = keyof typeof ACTIONS;

/** Whether a set of system roles may perform an action. */
export function rolesCan(roles: readonly string[], action: Action): boolean {
    const allowed: readonly string[] = ACTIONS[action];
    return roles.some((r) => allowed.includes(r));
}
