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
  PERCENTAGE_OF_GROSS = 'PERCENTAGE_OF_GROSS',
  CUSTOM = 'CUSTOM',
}

// From: modules/employees/entities/salary-component.entity.ts
export enum ComponentApplicability {
  ALL_STAFF = 'ALL_STAFF',
  MANAGEMENT = 'MANAGEMENT',
  SUPERVISORS = 'SUPERVISORS',
  FULL_TIME = 'FULL_TIME',
  PART_TIME = 'PART_TIME',
  CONTRACT = 'CONTRACT',
  SUPPORT_STAFF = 'SUPPORT_STAFF',
  // Legacy school values
  TEACHING_STAFF = 'TEACHING_STAFF',
  ADMIN_STAFF = 'ADMIN_STAFF',
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

// From: core/tenancy/entities/tenant.entity.ts
export enum OrganizationType {
  SCHOOL = 'SCHOOL',
  HOSPITAL = 'HOSPITAL',
  CORPORATE = 'CORPORATE',
  NGO = 'NGO',
  GOVERNMENT = 'GOVERNMENT',
  NONPROFIT = 'NONPROFIT',
  HOSPITALITY = 'HOSPITALITY',
  OTHER = 'OTHER',
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
