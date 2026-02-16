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
  const { data } = await api.get<Employee[]>('/employees', { params });
  return data;
}

export async function getEmployee(id: string): Promise<Employee> {
  const { data } = await api.get<Employee>(`/employees/${id}`);
  return data;
}

export async function createEmployee(dto: CreateEmployeeDto): Promise<Employee> {
  const { data } = await api.post<Employee>('/employees', dto);
  return data;
}

export async function updateEmployee(id: string, dto: UpdateEmployeeDto): Promise<Employee> {
  const { data } = await api.patch<Employee>(`/employees/${id}`, dto);
  return data;
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
  const { data } = await api.get<EmployeeBankDetails[]>(`/employees/${employeeId}/bank-details`);
  return data;
}

export async function addBankDetails(dto: CreateBankDetailsDto): Promise<EmployeeBankDetails> {
  const { data } = await api.post<EmployeeBankDetails>('/employees/bank-details', dto);
  return data;
}

export async function updateBankDetails(
  id: string,
  dto: Partial<CreateBankDetailsDto>,
): Promise<EmployeeBankDetails> {
  const { data } = await api.patch<EmployeeBankDetails>(`/employees/bank-details/${id}`, dto);
  return data;
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
  const { data } = await api.get<EmployeeSalaryComponent[]>(
    `/employees/${employeeId}/salary-components`,
    { params: { includeInactive } },
  );
  return data;
}

export async function addEmployeeSalaryComponent(
  dto: EmployeeSalaryComponentDto,
): Promise<EmployeeSalaryComponent> {
  const { data } = await api.post<EmployeeSalaryComponent>('/employees/salary-components', dto);
  return data;
}

export async function updateEmployeeSalaryComponent(
  id: string,
  dto: Partial<EmployeeSalaryComponentDto>,
): Promise<EmployeeSalaryComponent> {
  const { data } = await api.patch<EmployeeSalaryComponent>(
    `/employees/salary-components/${id}`,
    dto,
  );
  return data;
}

export async function deactivateEmployeeSalaryComponent(
  id: string,
  effectiveDate: string,
): Promise<EmployeeSalaryComponent> {
  const { data } = await api.patch<EmployeeSalaryComponent>(
    `/employees/salary-components/${id}/deactivate`,
    { effectiveDate },
  );
  return data;
}
