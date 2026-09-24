import type { Action } from './actions';

/**
 * What each route needs before it will load: the action that reads its data.
 *
 * The route's roles are not written here or anywhere else in the client. They
 * are the roles the API's registry gives that action (actions.generated.json),
 * so a change to who may read payroll moves the endpoint, this route, the
 * middleware and the sidebar together (ROADMAP-EXECUTION.md, C2.2).
 *
 * Each entry is one of:
 * - an action, or several (anyone holding one of them may enter);
 * - `'signedIn'`: every authenticated person;
 * - `'guardians'`: the parent portal, which is not an action in the API's
 *   registry (guardians see only their own children's records).
 *
 * Plain module, no React: the middleware reads it.
 */
export type RouteNeed = Action | readonly Action[] | 'signedIn' | 'guardians';

export const ROUTE_MANIFEST: Record<string, RouteNeed> = {
  '/': 'signedIn',
  '/me': 'signedIn',
  '/me/classes': 'signedIn',
  '/me/leave': 'signedIn',
  '/me/profile': 'signedIn',
  '/portal': 'guardians',
  '/admin': 'platform.read',

  // Organisation
  '/settings': 'organisation.manage',
  '/audit-logs': 'audit.read',
  '/events': 'events.read',

  // Staff
  '/employees': 'employees.read',
  '/departments': 'departments.manage',
  '/roles': 'positions.manage',
  '/grades': 'grades.manage',
  '/banks': 'banks.read',
  '/salary-components': 'salaryComponents.read',
  '/leave': 'leave.read',

  // Pay
  '/payroll': 'payPeriods.read',
  '/payslips': 'payslips.read',
  '/loans': 'loans.read',
  '/tax-rules': 'tax.read',
  '/reports': 'reports.monthly',

  // Money
  '/ledger': 'ledger.read',
  '/expenses': 'expenses.read',
  '/budgets': 'budgets.read',
  '/banking': 'banking.reconcile',
  '/fees': 'fees.read',
  '/fees/arrears': 'fees.read',
  '/fees/invoices': 'fees.read',
  '/fees/payments': 'fees.read',

  // School
  '/students': 'students.read',
  // Set up by the registrar; read by every Educator for the classes they
  // teach and the pupils they recognise.
  '/classes': ['academics.manage', 'awards.grant'],
  '/admissions': 'admissions.read',
  // Its own entry, not inherited from /admissions: deciding what the school
  // asks is a registrar's call, and the API draws the same line.
  '/admissions/question-sets': 'admissions.setQuestions',
  // The register and the day's departures.
  '/attendance': 'attendance.departures.read',
  // The people who make the calls: Educators and the attendance office.
  '/attendance/at-risk': 'attendance.report',
  // Read by staff who plan around it; edited by the office (the screen asks
  // `can('attendance.calendar.manage')`).
  '/attendance/calendar': 'attendance.report',
  '/attendance/gate': 'attendance.gate',
  '/awards': 'awards.read',
};
