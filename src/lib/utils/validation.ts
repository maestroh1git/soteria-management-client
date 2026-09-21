import { z } from 'zod';
import {
  EMPLOYMENT_TYPES,
  TERMINATION_REASONS,
  EmployeeGender,
  EmployeeStatus, ComponentType, CalculationType, RoleType } from '@/lib/types/enums';

// ── Password policy (mirrors backend S11) ───────────────────
// register + change-password require ≥8 chars incl. lowercase, uppercase,
// and a digit. Keep this in sync with the server-side rule.
export const PASSWORD_POLICY_HINT =
  'At least 8 characters, including an uppercase letter, a lowercase letter, and a number.';

export const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/[a-z]/, 'Include at least one lowercase letter')
  .regex(/[A-Z]/, 'Include at least one uppercase letter')
  .regex(/[0-9]/, 'Include at least one number');

// ── Employee schemas ────────────────────────────────────────
/**
 * The fields, without the cross-field rules.
 *
 * Kept separate because zod refuses `.pick()` on a schema that carries
 * refinements, and the self-service schema below is a subset of these fields.
 * The refinements are attached once, in createEmployeeSchema — they are about
 * pairs of fields (a termination reason needs a date), so a subset that does
 * not contain both has nothing to check anyway.
 */
const employeeFields = z.object({
  // Optional: left blank, the server allocates the next number in the tenant's
  // sequence. Only supply one when importing a record that already has it.
  employeeNumber: z.string().optional(),
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  middleName: z.string().optional(),
  email: z.string().email('Enter a valid email'),
  phone: z.string().min(1, 'Phone number is required'),
  dateOfBirth: z.string().min(1, 'Date of birth is required'),
  gender: z.nativeEnum(EmployeeGender, { message: 'Gender is required' }),
  address: z.string().optional(),
  nin: z
    .string()
    .regex(/^\d{11}$/, 'NIN must be 11 digits')
    .optional()
    .or(z.literal('')),
  bvn: z
    .string()
    .regex(/^\d{11}$/, 'BVN must be 11 digits')
    .optional()
    .or(z.literal('')),
  // ── Statutory identifiers ──
  // Optional, every one of them: a school records a new hire on their first
  // day and the paperwork follows. The rules mirror the server's exactly, so
  // the form never accepts something the API will reject — and the employee's
  // page reports whatever is still blank, with what it costs to leave it.
  tin: z
    .string()
    .regex(/^[0-9-]{8,20}$/, 'TIN must be 8-20 digits, dashes allowed')
    .optional()
    .or(z.literal('')),
  // Checked against the served list at submit time rather than hard-coded here,
  // so the two can never disagree about what a state is called.
  taxState: z.string().optional(),
  lasrraId: z
    .string()
    .regex(/^[A-Za-z0-9-]{6,20}$/, 'LASRRA number must be 6-20 letters or digits')
    .optional()
    .or(z.literal('')),
  rsaPin: z
    .string()
    .regex(/^PEN\d{12}$/i, 'RSA PIN is PEN followed by 12 digits')
    .optional()
    .or(z.literal('')),
  pfaName: z.string().max(120).optional(),
  nhfNumber: z
    .string()
    .regex(/^[A-Za-z0-9-]{6,20}$/, 'NHF number must be 6-20 letters or digits')
    .optional()
    .or(z.literal('')),
  // ── Engagement ──
  employmentType: z.enum(EMPLOYMENT_TYPES).optional().or(z.literal('')),
  contractEndDate: z.string().optional(),
  // ── Next of kin ──
  nextOfKinName: z.string().max(120).optional(),
  nextOfKinPhone: z.string().max(40).optional(),
  nextOfKinRelationship: z.string().max(40).optional(),
  joinDate: z.string().min(1, 'Join date is required'),
  roleId: z.string().uuid('Select a valid role'),
  gradeId: z.string().uuid().optional(),
  countryId: z.string().uuid().optional(),
  status: z.nativeEnum(EmployeeStatus).optional(),
  // ── Exit ──
  // Shown only when editing, and only alongside a termination date. Present on
  // the create schema so one form component covers both branches; the create
  // page never renders them.
  terminationDate: z.string().optional(),
  terminationReason: z.enum(TERMINATION_REASONS).optional().or(z.literal('')),
  lastWorkingDay: z.string().optional(),
});

export const createEmployeeSchema = employeeFields
  .refine(
    (values) => !values.terminationReason || !!values.terminationDate,
    {
      message: 'Set the termination date this reason belongs to',
      path: ['terminationDate'],
    },
  )
  .refine(
    (values) =>
      !values.contractEndDate ||
      !values.joinDate ||
      values.contractEndDate >= values.joinDate,
    {
      message: 'A contract cannot end before it starts',
      path: ['contractEndDate'],
    },
  );

export const updateEmployeeSchema = createEmployeeSchema;

/**
 * What an employee may change about themselves on /me.
 *
 * The rules are picked from the admin schema rather than rewritten, so the
 * same TIN is valid whoever types it — and the list is the allowlist the
 * server enforces. Anything absent (bank details, name, role, pay) is absent
 * deliberately; see UpdateMyDetailsDto on the server for why each one is out.
 */
export const myDetailsSchema = employeeFields.pick({
  phone: true,
  address: true,
  nin: true,
  bvn: true,
  tin: true,
  taxState: true,
  lasrraId: true,
  rsaPin: true,
  pfaName: true,
  nhfNumber: true,
  nextOfKinName: true,
  nextOfKinPhone: true,
  nextOfKinRelationship: true,
});

export type MyDetailsValues = z.infer<typeof myDetailsSchema>;

// ── Grade schemas ───────────────────────────────────────────
export const createGradeSchema = z.object({
  code: z.string().min(1, 'Code is required').max(20, 'Code is too long'),
  name: z.string().min(1, 'Name is required').max(100, 'Name is too long'),
  description: z.string().optional(),
  sortOrder: z.number().int().min(0).optional(),
});

export type CreateGradeValues = z.infer<typeof createGradeSchema>;

export type CreateEmployeeValues = z.infer<typeof createEmployeeSchema>;
export type UpdateEmployeeValues = z.infer<typeof updateEmployeeSchema>;

// ── Department schemas ──────────────────────────────────────
export const createDepartmentSchema = z.object({
  name: z.string().min(1, 'Department name is required'),
  description: z.string().optional(),
  headOfDepartment: z.string().uuid().optional().or(z.literal('')),
  parentDepartmentId: z.string().uuid().optional().or(z.literal('')),
});

export type CreateDepartmentValues = z.infer<typeof createDepartmentSchema>;

// ── Role schemas ────────────────────────────────────────────
export const createRoleSchema = z.object({
  name: z.string().min(1, 'Role name is required'),
  description: z.string().optional(),
  departmentId: z.string().uuid().optional().or(z.literal('')),
  roleType: z.nativeEnum(RoleType).optional(),
  baseSalaryRange: z
    .object({
      min: z.coerce.number().min(0),
      max: z.coerce.number().min(0),
    })
    .optional(),
  reportingTo: z.string().uuid().optional().or(z.literal('')),
  isDottedLine: z.boolean().optional(),
  permissionIds: z.array(z.string().uuid()).min(0),
});

export type CreateRoleValues = z.infer<typeof createRoleSchema>;

// ── Salary Component schemas ────────────────────────────────
export const createSalaryComponentSchema = z.object({
  name: z.string().min(1, 'Component name is required'),
  type: z.nativeEnum(ComponentType, { message: 'Select component type' }),
  isBase: z.boolean().optional(),
  calculationType: z.nativeEnum(CalculationType, {
    message: 'Select calculation type',
  }),
  value: z.coerce.number().min(0, 'Value must be positive'),
  formula: z.string().optional(),
  taxable: z.boolean().optional(),
  showOnPayslip: z.boolean().optional(),
  applicability: z.string().optional(),
  roleId: z.string().uuid().optional().or(z.literal('')),
  countryId: z.string().uuid().optional().or(z.literal('')),
});

export type CreateSalaryComponentValues = z.infer<typeof createSalaryComponentSchema>;

// ── Bank Details schemas ────────────────────────────────────
export const createBankDetailsSchema = z.object({
  bankName: z.string().min(1, 'Bank name is required'),
  accountNumber: z.string().min(1, 'Account number is required'),
  accountName: z.string().min(1, 'Account name is required'),
  branchCode: z.string().optional(),
  isDefault: z.boolean().optional(),
});

export type CreateBankDetailsValues = z.infer<typeof createBankDetailsSchema>;

// ── Employee Salary Component assignment schema ─────────────
export const assignSalaryComponentSchema = z.object({
  salaryComponentId: z.string().uuid('Select a salary component'),
  value: z.coerce.number().min(0, 'Value must be positive'),
  effectiveFrom: z.string().min(1, 'Effective date is required'),
  effectiveTo: z.string().optional(),
});

export type AssignSalaryComponentValues = z.infer<typeof assignSalaryComponentSchema>;

// ── Pay Period schemas ──────────────────────────────────────
// The server refuses these orderings (409), so check them here too — a rule the
// payroll clerk only discovers after pressing Create is a rule stated too late.
export const createPayPeriodSchema = z
  .object({
    name: z.string().min(1, 'Period name is required'),
    startDate: z.string().min(1, 'Start date is required'),
    endDate: z.string().min(1, 'End date is required'),
    paymentDate: z.string().min(1, 'Payment date is required'),
  })
  .superRefine((v, ctx) => {
    if (v.startDate && v.endDate && v.endDate <= v.startDate) {
      ctx.addIssue({
        code: 'custom',
        path: ['endDate'],
        message: 'End date must be after the start date',
      });
    }
    if (v.endDate && v.paymentDate && v.paymentDate <= v.endDate) {
      ctx.addIssue({
        code: 'custom',
        path: ['paymentDate'],
        message: 'Payment date must be after the end date',
      });
    }
  });

export type CreatePayPeriodValues = z.infer<typeof createPayPeriodSchema>;

// ── Payroll schemas ─────────────────────────────────────────
export const processPayrollSchema = z.object({
  payPeriodId: z.string().uuid('Select a pay period'),
  dryRun: z.boolean().optional(),
});

export type ProcessPayrollValues = z.infer<typeof processPayrollSchema>;

export const salaryApprovalSchema = z.object({
  approverId: z.string().uuid('Approver is required'),
  notes: z.string().optional(),
});

export type SalaryApprovalValues = z.infer<typeof salaryApprovalSchema>;

export const salaryPaymentSchema = z.object({
  paymentReference: z.string().min(1, 'Payment reference is required'),
  notes: z.string().optional(),
});

export type SalaryPaymentValues = z.infer<typeof salaryPaymentSchema>;

// ── Loan schemas ────────────────────────────────────────────
export const createLoanSchema = z.object({
  employeeId: z.string().uuid('Select an employee'),
  amount: z.number().min(1, 'Amount must be at least 1'),
  interestRate: z.number().min(0, 'Interest rate cannot be negative'),
  termMonths: z.number().min(1, 'Term must be at least 1 month'),
  reason: z.string().optional(),
});

export type CreateLoanValues = z.infer<typeof createLoanSchema>;

export const createAdvanceSchema = z.object({
  employeeId: z.string().uuid('Select an employee'),
  amount: z.number().min(1, 'Amount must be at least 1'),
  reason: z.string().optional(),
});

export type CreateAdvanceValues = z.infer<typeof createAdvanceSchema>;

export const loanApprovalSchema = z.object({
  approverId: z.string().uuid('Approver is required'),
  notes: z.string().optional(),
});

export type LoanApprovalValues = z.infer<typeof loanApprovalSchema>;
