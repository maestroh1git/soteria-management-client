import api from './client';
import type {
  CompletenessSummary,
  Employee,
  EmployeeBankDetails,
  EmployeeCompleteness,
  EmployeeSalaryComponent,
  NigerianState,
} from '@/lib/types/api';

// ── Employee CRUD ───────────────────────────────────────────
export interface CreateEmployeeDto {
  /** Omit to have the server allocate the next number in the tenant sequence. */
  employeeNumber?: string;
  firstName: string;
  lastName: string;
  middleName?: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  gender: string;
  address?: string;
  nin?: string;
  bvn?: string;
  tin?: string;
  taxState?: string;
  lasrraId?: string;
  rsaPin?: string;
  pfaName?: string;
  nhfNumber?: string;
  employmentType?: string;
  contractEndDate?: string;
  nextOfKinName?: string;
  nextOfKinPhone?: string;
  nextOfKinRelationship?: string;
  joinDate: string;
  roleId: string;
  gradeId?: string;
  countryId?: string;
  status?: string;
}

/**
 * Exit fields are update-only, mirroring the server DTO: a new hire is not
 * leaving, and offering the fields on create is an invitation to record a
 * contradiction.
 *
 * Every field also accepts null, which is how a value is *cleared*. Omitting a
 * field means "leave it as it was", so without null a TIN typed in error could
 * be corrected but never removed. The server treats null as empty
 * (class-validator's @IsOptional passes it through) and writes it.
 */
export type UpdateEmployeeDto = {
  [K in keyof CreateEmployeeDto]?: CreateEmployeeDto[K] | null;
} & {
  terminationDate?: string | null;
  terminationReason?: string | null;
  lastWorkingDay?: string | null;
};

export async function getEmployees(params?: {
  status?: string;
  roleId?: string;
  search?: string;
}): Promise<Employee[]> {
  return await api.get('/employees', { params }) as unknown as Employee[];
}

export async function getEmployee(id: string): Promise<Employee> {
  return await api.get(`/employees/${id}`) as unknown as Employee;
}

export async function createEmployee(dto: CreateEmployeeDto): Promise<Employee> {
  return await api.post('/employees', dto) as unknown as Employee;
}

export async function updateEmployee(id: string, dto: UpdateEmployeeDto): Promise<Employee> {
  return await api.patch(`/employees/${id}`, dto) as unknown as Employee;
}

export async function deleteEmployee(id: string): Promise<void> {
  await api.delete(`/employees/${id}`);
}

// ── Record completeness ─────────────────────────────────────
// Every statutory field is optional; these endpoints are what keeps optional
// from meaning invisible.
export async function getEmployeeCompleteness(
  id: string,
): Promise<EmployeeCompleteness> {
  return await api.get(
    `/employees/${id}/completeness`,
  ) as unknown as EmployeeCompleteness;
}

export async function getCompletenessSummary(): Promise<CompletenessSummary> {
  return await api.get(
    '/employees/completeness/summary',
  ) as unknown as CompletenessSummary;
}

/** The 36 states and FCT, served so the form can never offer a value the
 *  server would reject. */
export async function getTaxStates(): Promise<NigerianState[]> {
  return await api.get(
    '/employees/reference/tax-states',
  ) as unknown as NigerianState[];
}

// ── Bank Details ────────────────────────────────────────────
export interface CreateBankDetailsDto {
  employeeId: string;
  bankName: string;
  accountNumber: string;
  accountName: string;
  branchCode?: string;
  isDefault?: boolean;
}

export async function getBankDetails(employeeId: string): Promise<EmployeeBankDetails[]> {
  return await api.get(`/employees/${employeeId}/bank-details`) as unknown as EmployeeBankDetails[];
}

export async function addBankDetails(dto: CreateBankDetailsDto): Promise<EmployeeBankDetails> {
  return await api.post('/employees/bank-details', dto) as unknown as EmployeeBankDetails;
}

export async function updateBankDetails(
  id: string,
  dto: Partial<CreateBankDetailsDto>,
): Promise<EmployeeBankDetails> {
  return await api.patch(`/employees/bank-details/${id}`, dto) as unknown as EmployeeBankDetails;
}

export async function deleteBankDetails(id: string): Promise<void> {
  await api.delete(`/employees/bank-details/${id}`);
}

// ── Employee Salary Components ──────────────────────────────
export interface EmployeeSalaryComponentDto {
  employeeId: string;
  salaryComponentId: string;
  value: number;
  effectiveFrom: string;
  effectiveTo?: string;
}

export async function getEmployeeSalaryComponents(
  employeeId: string,
  includeInactive?: boolean,
): Promise<EmployeeSalaryComponent[]> {
  return await api.get(
    `/employees/${employeeId}/salary-components`,
    { params: { includeInactive } },
  ) as unknown as EmployeeSalaryComponent[];
}

export async function addEmployeeSalaryComponent(
  dto: EmployeeSalaryComponentDto,
): Promise<EmployeeSalaryComponent> {
  return await api.post('/employees/salary-components', dto) as unknown as EmployeeSalaryComponent;
}

export async function updateEmployeeSalaryComponent(
  id: string,
  dto: Partial<EmployeeSalaryComponentDto>,
): Promise<EmployeeSalaryComponent> {
  return await api.patch(
    `/employees/salary-components/${id}`,
    dto,
  ) as unknown as EmployeeSalaryComponent;
}

export async function deactivateEmployeeSalaryComponent(
  id: string,
  effectiveDate: string,
): Promise<EmployeeSalaryComponent> {
  return await api.patch(
    `/employees/salary-components/${id}/deactivate`,
    { effectiveDate },
  ) as unknown as EmployeeSalaryComponent;
}

// ── Birthday queries ─────────────────────────────────────────
export interface BirthdayEmployee {
  id: string;
  firstName: string;
  lastName: string;
  employeeNumber: string;
  dateOfBirth: string;
  dayOfBirth: number;
  roleName: string | null;
  isToday: boolean;
}

export async function getBirthdaysThisMonth(): Promise<BirthdayEmployee[]> {
  return await api.get('/employees/birthdays/this-month') as unknown as BirthdayEmployee[];
}
