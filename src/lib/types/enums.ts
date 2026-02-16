// ============================================================
// Backend enum mirrors — keep in sync with backend entities
// ============================================================

// From: modules/employees/entities/employee.entity.ts
export enum EmployeeGender {
  MALE = 'MALE',
  FEMALE = 'FEMALE',
  OTHER = 'OTHER',
}

export enum EmployeeStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  TERMINATED = 'TERMINATED',
}

// From: modules/payroll/entities/salary.entity.ts
export enum SalaryStatus {
  DRAFT = 'DRAFT',
  APPROVED = 'APPROVED',
  PAID = 'PAID',
  CANCELLED = 'CANCELLED',
}

// From: modules/payroll/entities/pay-period.entity.ts
export enum PayPeriodStatus {
  OPEN = 'OPEN',
  PROCESSING = 'PROCESSING',
  CLOSED = 'CLOSED',
}

// From: modules/loans/entities/loan.entity.ts
export enum LoanType {
  STANDARD_LOAN = 'STANDARD_LOAN',
  SALARY_ADVANCE = 'SALARY_ADVANCE',
}

export enum LoanStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  ACTIVE = 'ACTIVE',
  FULLY_PAID = 'FULLY_PAID',
  DEFAULTED = 'DEFAULTED',
  CANCELLED = 'CANCELLED',
}

// From: modules/payroll/entities/salary-detail.entity.ts
export enum ComponentType {
  EARNING = 'EARNING',
  DEDUCTION = 'DEDUCTION',
  TAX = 'TAX',
}

// From: modules/payslips/entities/payslip.entity.ts
export enum PayslipStatus {
  GENERATED = 'GENERATED',
  SENT = 'SENT',
  VIEWED = 'VIEWED',
  FAILED = 'FAILED',
}

// From: modules/employees/entities/salary-component.entity.ts
export enum CalculationType {
  FIXED = 'FIXED',
  PERCENTAGE_OF_BASE = 'PERCENTAGE_OF_BASE',
}

// From: modules/tax/entities/tax-rule.entity.ts
export enum TaxRuleType {
  FLAT_RATE = 'FLAT_RATE',
  PROGRESSIVE = 'PROGRESSIVE',
}

// From: modules/employees/entities/role.entity.ts
export enum RoleType {
  FULL_TIME = 'FULL_TIME',
  PART_TIME = 'PART_TIME',
  CONTRACTOR = 'CONTRACTOR',
}

// System roles from user entity
export enum SystemRole {
  TENANT_OWNER = 'tenant_owner',
  ADMIN = 'ADMIN',
  PAYROLL_OFFICER = 'PAYROLL_OFFICER',
  FINANCE_ADMIN = 'FINANCE_ADMIN',
  APPROVER = 'APPROVER',
  VIEWER = 'VIEWER',
  EMPLOYEE = 'EMPLOYEE',
}
