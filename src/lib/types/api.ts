import {
  EmployeeGender,
  EmployeeStatus,
  SalaryStatus,
  PayPeriodStatus,
  LoanType,
  LoanStatus,
  ComponentType,
  ComponentStatus,
  PayslipStatus,
  CalculationType,
  ComponentApplicability,
  TaxRuleType,
  TaxBase,
  RoleType,
  KybStatus,
} from './enums';

// ============================================================
// Shared / Generic types
// ============================================================

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

/**
 * Normalized error surfaced to the UI by the axios response interceptor.
 * The backend wraps errors as:
 *   { success: false, error: { code, message, details }, timestamp, path }
 * (see global-exception.filter on the server). `message` is normalized to a
 * single string here; `details` holds the per-field validation messages when
 * `code === 'VALIDATION_ERROR'`.
 */
export interface ApiError {
  statusCode: number;
  message: string | string[];
  code?: string;
  details?: string[] | null;
  /** @deprecated legacy field; use `code`. Kept for older call sites. */
  error?: string;
}

/** Raw error body shape returned by the backend global exception filter. */
export interface BackendErrorBody {
  success?: boolean;
  error?: {
    code?: string;
    message?: string | string[];
    details?: string[] | null;
  };
  /** Legacy/non-wrapped responses may put the message at the top level. */
  message?: string | string[];
}

export interface AuthResponse {
  accessToken: string;
  user: User;
}

// ============================================================
// Core entities
// ============================================================

/**
 * Note: the auth endpoints (login/register/change-password) return only a
 * TRIMMED subset of this shape — `id, email, firstName, lastName, systemRoles,
 * mustChangePassword, tenantId`. The remaining fields are only populated by the
 * `/users` directory endpoints, so they are optional. Don't read `tenant` /
 * `employee` / `isActive` off the logged-in user from the auth store; fetch the
 * tenant via `/tenants/me` (see useMyTenant) instead.
 */
export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  mustChangePassword: boolean;
  systemRoles: string[];
  tenantId: string | null;
  // Only present on `/users` directory responses, not the trimmed auth payload:
  isActive?: boolean;
  employeeId?: string | null;
  tenant?: Tenant | null;
  employee?: Employee | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface Tenant {
  id: string;
  name: string;
  slug: string;
  schemaName: string;
  organizationType: string | null;
  industry: string | null;
  settings: Record<string, unknown> | null;
  isActive: boolean;
  // Organization profile
  address: string | null;
  phone: string | null;
  website: string | null;
  logoUrl: string | null;
  primaryColor: string | null;
  // KYB / Compliance
  cacNumber: string | null;
  tinNumber: string | null;
  vatNumber: string | null;
  nsitfNumber: string | null;
  itfNumber: string | null;
  nhfNumber: string | null;
  kybStatus: KybStatus;
  kybSubmittedAt: string | null;
  kybVerifiedAt: string | null;
  kybRejectionReason: string | null;
  createdAt: string;
  updatedAt: string;
}

// ============================================================
// Employee module
// ============================================================

/** Year-to-date totals, computed on demand from salaries + salary_details. */
export interface YtdTotals {
  year: number;
  contractualSalary: number;
  additionalEarnings: number;
  grossSalary: number;
  totalDeductions: number;
  netSalary: number;
  /** Per named deduction, e.g. { 'Interim Tax Provision': 12600 }. */
  deductionsByComponent: Record<string, number>;
  /** Periods counted, so a part-year figure is not mistaken for a full one. */
  periodsIncluded: number;
}

export type LeaveStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED';

export interface LeaveType {
  id: string;
  tenantId: string;
  name: string;
  description: string | null;
  /** Days granted per leave year. 0 means uncapped. */
  daysPerYear: string | number;
  /** Whether the employee is paid. The only field payroll consults. */
  paid: boolean;
  carriesOver: boolean;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface LeaveRequest {
  id: string;
  tenantId: string;
  employeeId: string;
  leaveTypeId: string;
  startDate: string;
  /** Inclusive. */
  endDate: string;
  days: string | number;
  reason: string | null;
  status: LeaveStatus;
  approvedBy: string | null;
  approvedAt: string | null;
  decisionNote: string | null;
  createdAt: string;
  updatedAt: string;
  employee?: Employee;
  leaveType?: LeaveType;
}

export interface LeaveBalance {
  leaveTypeId: string;
  leaveTypeName: string;
  entitlementDays: number;
  takenDays: number;
  pendingDays: number;
  /** Null when the type is uncapped. */
  remainingDays: number | null;
}

export type AdjustmentType = 'EARNING' | 'DEDUCTION' | 'WAIVER';
export type AdjustmentStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

/** A one-period change to an employee's pay, requiring management approval. */
export interface PayrollAdjustment {
  id: string;
  tenantId: string;
  employeeId: string;
  payPeriodId: string;
  type: AdjustmentType;
  /** Set for WAIVER — the standing component being suppressed. */
  componentId: string | null;
  label: string;
  /** Null for WAIVER, which removes an amount rather than adding one. */
  amount: string | number | null;
  reason: string | null;
  status: AdjustmentStatus;
  approvedBy: string | null;
  approvedAt: string | null;
  createdAt: string;
  updatedAt: string;
  employee?: Employee;
  component?: SalaryComponent | null;
}

export interface Grade {
  id: string;
  tenantId: string;
  /** Short identifier shown on payroll advices, e.g. 'GL1'. */
  code: string;
  name: string;
  description: string | null;
  sortOrder: number;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Employee {
  id: string;
  employeeNumber: string;
  firstName: string;
  lastName: string;
  middleName: string | null;
  email: string;
  phone: string;
  dateOfBirth: string;
  gender: EmployeeGender;
  address: string | null;
  joinDate: string;
  terminationDate: string | null;
  roleId: string;
  gradeId: string | null;
  countryId: string | null;
  status: EmployeeStatus;
  role?: Role;
  grade?: Grade | null;
  bankDetails?: EmployeeBankDetails[];
  salaryComponents?: EmployeeSalaryComponent[];
  createdAt: string;
  updatedAt: string;
}

export interface Department {
  id: string;
  name: string;
  description: string | null;
  headOfDepartment: string | null;
  parentDepartmentId: string | null;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Role {
  id: string;
  name: string;
  description: string | null;
  departmentId: string | null;
  department?: Department;
  roleType: RoleType;
  minSalary: number | null;
  maxSalary: number | null;
  permissions?: Permission[];
  createdAt: string;
  updatedAt: string;
}

export interface Permission {
  id: string;
  name: string;
  description: string | null;
  resource: string;
  action: string;
  createdAt: string;
  updatedAt: string;
}

export interface SalaryComponent {
  id: string;
  name: string;
  type: ComponentType;
  isBase: boolean;
  calculationType: CalculationType;
  value: number;
  formula: string | null;
  taxable: boolean;
  showOnPayslip: boolean;
  roleId: string | null;
  countryId: string | null;
  applicability: ComponentApplicability;
  conditionField: string | null;
  conditionValue: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface EmployeeSalaryComponent {
  id: string;
  employeeId: string;
  salaryComponentId: string;
  salaryComponent?: SalaryComponent;
  value: number;
  effectiveFrom: string;
  effectiveTo: string | null;
  status: ComponentStatus;
  createdAt: string;
  updatedAt: string;
}

export interface EmployeeBankDetails {
  id: string;
  employeeId: string;
  bankName: string;
  // accountNumber/accountName/branchCode are AES-256-GCM encrypted at rest and
  // @Exclude'd from every API response — they are never returned, only sent on
  // create/update. Optional here so read responses type-check.
  accountNumber?: string;
  accountName?: string;
  branchCode?: string | null;
  /**
   * Last four digits, e.g. `••••6789`. The only part of the number the server
   * returns — enough to tell two accounts at the same bank apart when choosing
   * which to correct, and not enough to pay into one.
   */
  accountNumberMasked?: string;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

// ============================================================
// Payroll module
// ============================================================

export interface PayPeriod {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  paymentDate: string;
  status: PayPeriodStatus;
  createdAt: string;
  updatedAt: string;
}

export interface Salary {
  id: string;
  employeeId: string;
  employee?: Employee;
  payPeriodId: string;
  payPeriod?: PayPeriod;
  grossSalary: number;
  totalDeductions: number;
  netSalary: number;
  calculatedAt: string;
  approvedBy: string | null;
  approvedAt: string | null;
  status: SalaryStatus;
  paymentReference: string | null;
  notes: string | null;
  details?: SalaryDetail[];
  createdAt: string;
  updatedAt: string;
}

export interface SalaryDetail {
  id: string;
  salaryId: string;
  componentName: string;
  componentType: ComponentType;
  amount: number;
  calculationNote: string | null;
}

export interface PayrollSettings {
  id: string;
  key: string;
  value: string;
  dataType: string;
  description: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PayrollProcessResult {
  totalEmployees: number;
  processedCount: number;
  skippedCount: number;
  totalGrossSalary: number;
  totalNetSalary: number;
  errors: Array<{ employeeId: string; message: string }>;
}

export interface BulkPaymentResult {
  totalProcessed: number;
  successful: Array<{ salaryId: string; paymentReference: string }>;
  failed: Array<{ salaryId: string; reason: string }>;
}

// ============================================================
// Tax module
// ============================================================

export interface TaxRule {
  id: string;
  name: string;
  type: TaxRuleType;
  taxBase: TaxBase;
  value: number | null;
  effectiveFrom: string;
  effectiveTo: string | null;
  isDefault: boolean;
  brackets?: TaxBracket[];
  createdAt: string;
  updatedAt: string;
}

export interface TaxBracket {
  id: string;
  taxRuleId: string;
  minAmount: number;
  maxAmount: number | null;
  rate: number;
  fixedAmount: number;
}

// ============================================================
// Loans module
// ============================================================

export interface Loan {
  id: string;
  employeeId: string;
  employee?: Employee;
  loanType: LoanType;
  amount: number;
  interestRate: number;
  termMonths: number;
  monthlyRepayment: number;
  totalRepayable: number;
  outstandingBalance: number;
  status: LoanStatus;
  applicationDate: string;
  approvalDate: string | null;
  approvedBy: string | null;
  disbursementDate: string | null;
  firstRepaymentDate: string | null;
  reason: string | null;
  notes: string | null;
  repayments?: LoanRepayment[];
  createdAt: string;
  updatedAt: string;
}

export interface LoanRepayment {
  id: string;
  loanId: string;
  salaryId: string | null;
  amount: number;
  principalPortion: number;
  interestPortion: number;
  balanceAfter: number;
  dueDate: string;
  paidDate: string | null;
  status: string;
  createdAt: string;
  updatedAt: string;
}

// ============================================================
// Payslips module
// ============================================================

export interface Payslip {
  id: string;
  salaryId: string;
  salary?: Salary;
  employeeId: string;
  employee?: Employee;
  fileName: string | null;
  accessToken: string;
  status: PayslipStatus;
  sentAt: string | null;
  viewedAt: string | null;
  generatedAt: string;
  createdAt: string;
  updatedAt: string;
}

// ============================================================
// Settings module
// ============================================================

export interface Country {
  id: string;
  name: string;
  code: string;
  currencyCode: string;
  currencySymbol: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

// ============================================================
// Filter / Query types
// ============================================================

export interface PaginationParams {
  page?: number;
  limit?: number;
}

export interface EmployeeFilters extends PaginationParams {
  search?: string;
  status?: EmployeeStatus;
  departmentId?: string;
}

export interface SalaryFilters extends PaginationParams {
  payPeriodId?: string;
  status?: SalaryStatus;
  employeeId?: string;
}

export interface PayPeriodFilters extends PaginationParams {
  status?: PayPeriodStatus;
  year?: number;
  month?: number;
  fromDate?: string;
  toDate?: string;
}

export interface LoanFilters extends PaginationParams {
  status?: LoanStatus;
  loanType?: LoanType;
  employeeId?: string;
}

export interface ReportFilters {
  month?: number;
  year?: number;
  departmentId?: string;
}

// ============================================================
// Report response types
// ============================================================

// Money arrives as strings and stays that way — `numeric` is exact in Postgres
// and parsing it into a float on the way through is how a report loses a kobo.
// `formatCurrency` and `CurrencyDisplay` both take `number | string`.
export interface MonthlySummary {
  period: { month: number; year: number };
  summary: {
    totalEmployees: number;
    totalGrossSalary: string;
    totalNetSalary: string;
    totalTax: string;
    totalDeductions: string;
  };
  employeeBreakdown: Array<{
    employeeId: string;
    employeeName: string;
    employeeNumber: string;
    grossSalary: string;
    totalDeductions: string;
    netSalary: string;
  }>;
}

export interface TaxSummary {
  year: number;
  totalTaxCollected: string;
  monthlyBreakdown: Array<{
    month: number;
    totalTax: string;
    employeeCount: number;
  }>;
}

export interface LoanPortfolioReport {
  totalActiveLoans: number;
  totalOutstandingBalance: number;
  totalDisbursed: number;
  loansByType: Array<{
    loanType: string;
    count: number;
    totalAmount: number;
    outstandingBalance: number;
  }>;
  loansByStatus: Array<{ status: string; count: number }>;
}

export interface DepartmentCostReport {
  month: number;
  year: number;
  departments: Array<{
    department: string;
    employeeCount: number;
    /** Read from the ledger, not from `salaries` — see PHASE2-FINANCE.md. */
    totalGross: string;
    totalNet: string;
    avgSalary: string;
  }>;
}

export interface YearEndReport {
  year: number;
  monthlySummaries: MonthlySummary[];
  taxSummary: TaxSummary;
  loanPortfolio: LoanPortfolioReport;
  totals: {
    totalGrossSalary: string;
    totalNetSalary: string;
    totalTax: string;
    totalDeductions: string;
  };
}
