import {
  EmployeeGender,
  EmployeeStatus,
  SalaryStatus,
  PayPeriodStatus,
  LoanType,
  LoanStatus,
  ComponentType,
  PayslipStatus,
  CalculationType,
  TaxRuleType,
  RoleType,
} from './enums';

// ============================================================
// Shared / Generic types
// ============================================================

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ApiError {
  statusCode: number;
  message: string | string[];
  error?: string;
}

export interface AuthResponse {
  accessToken: string;
  user: User;
}

// ============================================================
// Core entities
// ============================================================

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  isActive: boolean;
  employeeId: string | null;
  systemRoles: string[];
  tenantId: string | null;
  tenant: Tenant | null;
  createdAt: string;
  updatedAt: string;
}

export interface Tenant {
  id: string;
  name: string;
  slug: string;
  schemaName: string;
  settings: Record<string, unknown> | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// ============================================================
// Employee module
// ============================================================

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
  countryId: string | null;
  status: EmployeeStatus;
  role?: Role;
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
  componentType: ComponentType;
  calculationType: CalculationType;
  defaultValue: number;
  description: string | null;
  isDefault: boolean;
  isActive: boolean;
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
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface EmployeeBankDetails {
  id: string;
  employeeId: string;
  bankName: string;
  accountNumber: string;
  accountName: string;
  branchCode: string | null;
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
  principalAmount: number;
  interestAmount: number;
  balanceAfter: number;
  repaymentDate: string;
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
  filePath: string | null;
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
  isActive: boolean;
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
