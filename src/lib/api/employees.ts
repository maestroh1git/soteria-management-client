import api from './client';
import type {
  Employee,
  EmployeeBankDetails,
  EmployeeSalaryComponent,
} from '@/lib/types/api';

// ── Employee CRUD ───────────────────────────────────────────
export interface CreateEmployeeDto {
  employeeNumber: string;
  firstName: string;
  lastName: string;
  middleName?: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  gender: string;
  address?: string;
  joinDate: string;
  roleId: string;
  countryId?: string;
  status?: string;
}

export type UpdateEmployeeDto = Partial<CreateEmployeeDto>;

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
