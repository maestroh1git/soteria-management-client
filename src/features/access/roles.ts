import { SystemRole } from '@/lib/types/enums';
import type { User } from '@/lib/types/api';

/**
 * Access: what a person may do in the software (glossary: "access", not
 * "role", which is a job). The stored values are the API's system roles.
 */
export const ACCESS_LABELS: Record<string, string> = {
  [SystemRole.TENANT_OWNER]: 'Owner',
  [SystemRole.ADMIN]: 'Admin',
  [SystemRole.PAYROLL_OFFICER]: 'Payroll Officer',
  [SystemRole.FINANCE_ADMIN]: 'Finance Admin',
  [SystemRole.APPROVER]: 'Approver',
  [SystemRole.VIEWER]: 'Viewer',
  [SystemRole.EMPLOYEE]: 'Employee',
  // "Educator" rather than "Teacher": the product's word. The stored value
  // stays `academic.teacher`; renaming it is a data migration.
  [SystemRole.ACADEMIC_TEACHER]: 'Educator',
  [SystemRole.ATTENDANCE_OFFICER]: 'Attendance Officer',
  [SystemRole.ADMISSIONS_REGISTRAR]: 'Admissions Registrar',
  [SystemRole.ADMISSIONS_OFFICER]: 'Admissions Officer',
  // Shown, never offered: a parent login comes from the guardian invite,
  // which links a guardian record.
  [SystemRole.PARENT]: 'Parent',
};

/** One line on what each access is for, shown where it is granted. */
export const ACCESS_DESCRIPTIONS: Record<string, string> = {
  [SystemRole.TENANT_OWNER]: 'Everything, including making someone else an owner.',
  [SystemRole.ADMIN]: 'Everything except ownership.',
  [SystemRole.PAYROLL_OFFICER]: 'Staff records, pay runs, payslips, loans.',
  [SystemRole.FINANCE_ADMIN]: 'Fees, expenses, budgets, the ledger and bank.',
  [SystemRole.APPROVER]: 'Approves pay runs, loans, leave and expenses.',
  [SystemRole.VIEWER]: 'Reads staff, pay and reports; changes nothing.',
  [SystemRole.EMPLOYEE]: 'Their own pay, leave and profile.',
  [SystemRole.ACADEMIC_TEACHER]: 'Pupils, classes, attendance and awards.',
  [SystemRole.ATTENDANCE_OFFICER]: 'The register, the gate and follow-ups.',
  [SystemRole.ADMISSIONS_REGISTRAR]: 'Admissions decisions, the roll and classes.',
  [SystemRole.ADMISSIONS_OFFICER]: 'Applications and assessments.',
};

/** Access that only means something in a school. */
export const SCHOOL_ACCESS = [
  SystemRole.ACADEMIC_TEACHER,
  SystemRole.ATTENDANCE_OFFICER,
  SystemRole.ADMISSIONS_REGISTRAR,
  SystemRole.ADMISSIONS_OFFICER,
];

export const GRANTABLE_ACCESS = [
  SystemRole.ADMIN,
  SystemRole.PAYROLL_OFFICER,
  SystemRole.FINANCE_ADMIN,
  SystemRole.APPROVER,
  SystemRole.VIEWER,
  SystemRole.EMPLOYEE,
];

/** What this person may grant: owners may also grant ownership. */
export function grantableAccess(orgType: string | null, canGrantOwnership: boolean): string[] {
  const base: string[] =
    orgType === 'SCHOOL' ? [...GRANTABLE_ACCESS, ...SCHOOL_ACCESS] : [...GRANTABLE_ACCESS];
  return canGrantOwnership ? [SystemRole.TENANT_OWNER, ...base] : base;
}

/** The access a login holds — a colleague's, as data. */
export function accessOf(user: User): string[] {
  // eslint-disable-next-line no-restricted-syntax -- a colleague's access, displayed
  return user.systemRoles;
}

/** Where a login stands, for the status badge (registry kind "account"). */
export function accountStatus(user: User): 'ACTIVE' | 'INVITED' | 'INACTIVE' {
  return user.isActive ? 'ACTIVE' : user.invitePending ? 'INVITED' : 'INACTIVE';
}
