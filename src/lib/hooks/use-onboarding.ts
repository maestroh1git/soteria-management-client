'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getDepartments } from '@/lib/api/departments';
import { getRoles } from '@/lib/api/roles';
import { getSalaryComponents } from '@/lib/api/salary-components';
import { getTaxRules } from '@/lib/api/tax';
import { getEmployees } from '@/lib/api/employees';
import { getPayPeriods } from '@/lib/api/pay-periods';
import { updateMyTenant } from '@/lib/api/tenants';
import { useMyTenant } from './use-tenant';
import { useAuth } from './use-auth';
import { useSessions, useClassArms } from './use-academics';
import { useStudents } from './use-students';
import { useFeeItems } from './use-fees';
import { PayPeriodStatus } from '@/lib/types/enums';
import type { Tenant } from '@/lib/types/api';

// ── Thin existence hooks (share the same query keys as the list pages, so
//    react-query dedupes — no extra network when a page already loaded them).
//    `enabled` lets callers skip endpoints the current role would 403 on. ──
export function useRolesList(enabled = true) {
  return useQuery({ queryKey: ['roles'], queryFn: getRoles, enabled });
}
export function useDepartmentsList(enabled = true) {
  return useQuery({ queryKey: ['departments'], queryFn: getDepartments, enabled });
}
export function useSalaryComponentsList(enabled = true) {
  return useQuery({ queryKey: ['salary-components'], queryFn: () => getSalaryComponents(), enabled });
}
export function useTaxRulesList(enabled = true) {
  return useQuery({ queryKey: ['tax-rules'], queryFn: getTaxRules, enabled });
}
export function useEmployeesList(enabled = true) {
  return useQuery({ queryKey: ['employees', undefined], queryFn: () => getEmployees(), enabled });
}
export function usePayPeriodsList(enabled = true) {
  return useQuery({ queryKey: ['pay-periods', undefined], queryFn: () => getPayPeriods(), enabled });
}

export interface OnboardingStep {
  key: string;
  label: string;
  description: string;
  href: string;
  done: boolean;
  /** Optional steps don't count toward "all done" / the progress denominator. */
  optional?: boolean;
}

export interface OnboardingProgress {
  steps: OnboardingStep[];
  /** Steps keyed by `key` for targeted reads (e.g. empty-states). */
  byKey: Record<string, OnboardingStep>;
  completedRequired: number;
  totalRequired: number;
  allRequiredDone: boolean;
  /** True once the user explicitly dismissed the checklist (persisted in tenant.settings). */
  dismissed: boolean;
  /** Only OWNER/ADMIN can perform setup — the dashboard card is gated on this. */
  canSetup: boolean;
  isLoading: boolean;
}

/** A profile is "complete enough" once it has an address and at least one tax id. */
function isOrgProfileComplete(tenant?: Tenant | null): boolean {
  if (!tenant) return false;
  return Boolean(tenant.address && (tenant.tinNumber || tenant.cacNumber));
}

function readDismissed(tenant?: Tenant | null): boolean {
  const onboarding = (tenant?.settings as
    | { onboarding?: { dismissedAt?: string } }
    | null
    | undefined)?.onboarding;
  return Boolean(onboarding?.dismissedAt);
}

export function useOnboardingProgress(): OnboardingProgress {
  const { hasRole, tenantOrgType } = useAuth();
  const canSetup = hasRole(['tenant_owner', 'ADMIN']);
  const isSchool = tenantOrgType === 'SCHOOL';

  // Only OWNER/ADMIN see the checklist, and they can read every resource below —
  // so gate the queries on canSetup to avoid 403 noise for other roles.
  const tenant = useMyTenant();
  const departments = useDepartmentsList(canSetup);
  const roles = useRolesList(canSetup);
  const components = useSalaryComponentsList(canSetup);
  const taxRules = useTaxRulesList(canSetup);
  const employees = useEmployeesList(canSetup);
  const payPeriods = usePayPeriodsList(canSetup);

  // The school side. Only fetched for a school — a business or clinic has no
  // classes to set up, and the sidebar already hides those screens from them.
  const schoolQueries = canSetup && isSchool;
  const sessions = useSessions(schoolQueries);
  const classArms = useClassArms(undefined, schoolQueries);
  const students = useStudents(undefined, schoolQueries);
  const feeItems = useFeeItems(false, schoolQueries);

  const periods = payPeriods.data ?? [];
  const payrollRun = periods.some(
    (p) =>
      p.status === PayPeriodStatus.PROCESSING ||
      p.status === PayPeriodStatus.CLOSED,
  );

  const steps: OnboardingStep[] = [
    {
      key: 'profile',
      label: 'Complete your organization profile',
      description: 'Add your address and tax IDs — they appear on payslips and reports.',
      href: '/settings',
      done: isOrgProfileComplete(tenant.data),
    },
    {
      key: 'departments',
      label: 'Create a department',
      description: 'Group roles for structure and department cost reports.',
      href: '/departments',
      done: (departments.data?.length ?? 0) > 0,
      optional: true,
    },
    {
      key: 'roles',
      label: 'Create a role',
      description: 'Every employee must be assigned a role.',
      href: '/roles',
      done: (roles.data?.length ?? 0) > 0,
    },
    {
      key: 'components',
      label: 'Add salary components',
      description: 'Earnings and deductions — payroll is calculated from these.',
      href: '/salary-components',
      done: (components.data?.length ?? 0) > 0,
    },
    {
      key: 'tax',
      label: 'Set up tax rules',
      description: 'Define PAYE / statutory deductions so net pay is correct.',
      href: '/tax-rules',
      done: (taxRules.data?.length ?? 0) > 0,
    },
    {
      key: 'employees',
      label: 'Add employees',
      description:
        'Assign each a role. Standard pay lines attach automatically; add their bank details so they can be paid.',
      href: '/employees',
      done: (employees.data?.length ?? 0) > 0,
    },
    {
      key: 'payperiod',
      label: 'Create a pay period',
      description: 'The month you’re paying for (start, end, payment date).',
      href: '/payroll',
      done: periods.length > 0,
    },
    {
      key: 'payroll',
      label: 'Run your first payroll',
      description: 'Process to create drafts, review them, then approve.',
      href: '/payroll',
      done: payrollRun,
    },

    // ── The school side ───────────────────────────────────────────────────
    //
    // Optional, deliberately: a school that only wants payroll should not be
    // nagged about classes it will never create, and the checklist should not
    // report itself unfinished forever. They appear so the path is visible —
    // the first school to use this got as far as "I could not activate
    // classes, so I was not able to add pupils" with nothing on screen telling
    // them what had to come first.
    ...(isSchool
      ? ([
          {
            key: 'session',
            label: 'Set the academic session and its terms',
            description:
              'Everything else on the school side hangs off this — mark one session and one term current.',
            href: '/classes',
            done: (sessions.data?.length ?? 0) > 0,
            optional: true,
          },
          {
            key: 'classes',
            label: 'Create class levels, then the classes in them',
            description:
              'Fees are priced per level; a register belongs to a class. You cannot add a class until a level exists.',
            href: '/classes',
            done: (classArms.data?.length ?? 0) > 0,
            optional: true,
          },
          {
            key: 'students',
            label: 'Add the pupils',
            description:
              'Import the roll from a spreadsheet, or add them one at a time. Each needs a class.',
            href: '/students',
            done: (students.data?.length ?? 0) > 0,
            optional: true,
          },
          {
            key: 'fees',
            label: 'Set out what the school charges',
            description:
              'The fee list and what each costs per class, per term. Nothing is billed until you say so.',
            href: '/fees',
            done: (feeItems.data?.length ?? 0) > 0,
            optional: true,
          },
        ] as OnboardingStep[])
      : []),
  ];

  const required = steps.filter((s) => !s.optional);
  const completedRequired = required.filter((s) => s.done).length;

  const byKey: Record<string, OnboardingStep> = {};
  for (const s of steps) byKey[s.key] = s;

  return {
    steps,
    byKey,
    completedRequired,
    totalRequired: required.length,
    allRequiredDone: completedRequired === required.length,
    dismissed: readDismissed(tenant.data),
    canSetup,
    isLoading:
      tenant.isLoading ||
      departments.isLoading ||
      roles.isLoading ||
      components.isLoading ||
      taxRules.isLoading ||
      employees.isLoading ||
      payPeriods.isLoading,
  };
}

/** Persist checklist dismissal in tenant.settings (cross-device). */
export function useDismissOnboarding() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () =>
      updateMyTenant({
        settings: { onboarding: { dismissedAt: new Date().toISOString() } },
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tenant', 'me'] }),
  });
}
