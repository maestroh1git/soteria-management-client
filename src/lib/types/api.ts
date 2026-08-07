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

export interface MonthlySummary {
  period: { month: number; year: number };
  summary: {
    totalEmployees: number;
    totalGrossSalary: number;
    totalNetSalary: number;
    totalTax: number;
    totalDeductions: number;
  };
  employeeBreakdown: Array<{
    employeeId: string;
    employeeName: string;
    employeeNumber: string;
    grossSalary: number;
    totalDeductions: number;
    netSalary: number;
  }>;
}

export interface TaxSummary {
  year: number;
  totalTaxCollected: number;
  monthlyBreakdown: Array<{
    month: number;
    totalTax: number;
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
    totalGross: number;
    totalNet: number;
    avgSalary: number;
  }>;
}

export interface YearEndReport {
  year: number;
  monthlySummaries: MonthlySummary[];
  taxSummary: TaxSummary;
  loanPortfolio: LoanPortfolioReport;
  totals: {
    totalGrossSalary: number;
    totalNetSalary: number;
    totalTax: number;
    totalDeductions: number;
  };
}
