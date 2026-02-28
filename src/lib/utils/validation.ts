import { z } from 'zod';
import { EmployeeGender, EmployeeStatus, ComponentType, CalculationType, RoleType } from '@/lib/types/enums';

// ── Employee schemas ────────────────────────────────────────
export const createEmployeeSchema = z.object({
  employeeNumber: z.string().min(1, 'Employee number is required'),
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  middleName: z.string().optional(),
  email: z.string().email('Enter a valid email'),
  phone: z.string().min(1, 'Phone number is required'),
  dateOfBirth: z.string().min(1, 'Date of birth is required'),
  gender: z.nativeEnum(EmployeeGender, { message: 'Gender is required' }),
  address: z.string().optional(),
  joinDate: z.string().min(1, 'Join date is required'),
  roleId: z.string().uuid('Select a valid role'),
  countryId: z.string().uuid().optional(),
  status: z.nativeEnum(EmployeeStatus).optional(),
});

export const updateEmployeeSchema = createEmployeeSchema.partial();

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
      min: z.number().min(0),
      max: z.number().min(0),
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
  value: z.number().min(0, 'Value must be positive'),
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
export const createPayPeriodSchema = z.object({
  name: z.string().min(1, 'Period name is required'),
  startDate: z.string().min(1, 'Start date is required'),
  endDate: z.string().min(1, 'End date is required'),
  paymentDate: z.string().min(1, 'Payment date is required'),
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
