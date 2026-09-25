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
  // Me and Home
  '/': 'signedIn',
  '/me': 'signedIn',
  '/me/classes': 'signedIn',
  '/me/leave': 'signedIn',
  '/me/profile': 'signedIn',
  '/portal': 'guardians',
  '/admin': 'platform.read',

  // Everyone who decides anything; the inbox holds only what they decide.
  '/approvals': [
    'payroll.approve',
    'payroll.adjustments.decide',
    'leave.decide',
    'expenses.decide',
    'fees.concessions.decide',
    'loans.decide',
  ],

  // People
  '/employees': 'employees.read',
  '/students': 'students.read',

  // Admissions
  '/admissions': 'admissions.read',
  // Its own entry, not inherited from /admissions: deciding what the school
  // asks is a registrar's call, and the API draws the same line.
  '/admissions/question-sets': 'admissions.setQuestions',
  // Everyone who books or takes a sitting (5.16).
  '/admissions/diary': 'admissions.assess',

  // School day
  // Set up by the registrar; read by every Educator for the classes they
  // teach and the pupils they recognise.
  '/classes': ['academics.manage', 'awards.grant'],
  // The register and the day's departures.
  '/attendance': 'attendance.departures.read',
  // The people who make the calls: Educators and the attendance office.
  '/attendance/at-risk': 'attendance.report',
  // Read by staff who plan around it; edited by the office (the screen asks
  // `can('attendance.calendar.manage')`).
  '/attendance/calendar': 'attendance.report',
  '/attendance/gate': 'attendance.gate',
  '/awards': 'awards.read',

  // Pay
  '/payroll': 'payPeriods.read',
  '/payslips': 'payslips.read',
  '/loans': 'loans.read',
  '/leave': 'leave.read',

  // Money
  '/fees': 'fees.read',
  '/fees/arrears': 'fees.read',
  '/fees/invoices': 'fees.read',
  '/fees/payments': 'fees.read',
  // Approvers read concessions to decide them, without reading the rest of Fees.
  '/fees/concessions': 'fees.concessions.read',
  '/fees/optional': 'fees.read',
  '/expenses': 'expenses.read',
  '/budgets': 'budgets.read',
  '/banking': 'banking.reconcile',
  '/ledger': 'ledger.read',

  // Insight
  '/reports': 'reports.monthly',
  '/audit-logs': 'audit.read',

  // Setup: the hub admits anyone who may open one of its sections; each
  // section keeps its own entry, so the hub never shows a door that is shut.
  '/setup': [
    'organisation.manage',
    'users.manage',
    'events.read',
    'departments.manage',
    'positions.manage',
    'grades.manage',
    'banks.read',
    'salaryComponents.read',
    'tax.read',
    'academics.manage',
  ],
  '/setup/organisation': 'organisation.manage',
  '/setup/team': 'users.manage',
  '/setup/events': 'events.read',
  '/setup/departments': 'departments.manage',
  '/setup/positions': 'positions.manage',
  '/setup/grades': 'grades.manage',
  '/setup/bank-list': 'banks.read',
  '/setup/salary-components': 'salaryComponents.read',
  '/setup/tax-rules': 'tax.read',
};

/**
 * Where pages used to live (Wave 4 moved them). next.config.ts redirects each,
 * so bookmarks and links in old emails keep working.
 */
export const MOVED_ROUTES: Record<string, string> = {
  '/settings': '/setup/organisation',
  '/events': '/setup/events',
  '/departments': '/setup/departments',
  '/roles': '/setup/positions',
  '/grades': '/setup/grades',
  '/banks': '/setup/bank-list',
  '/salary-components': '/setup/salary-components',
  '/tax-rules': '/setup/tax-rules',
};
