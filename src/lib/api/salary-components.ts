import api from './client';
import type { SalaryComponent } from '@/lib/types/api';

export interface CreateSalaryComponentDto {
  name: string;
  type: string;
  isBase?: boolean;
  calculationType: string;
  value: number;
  formula?: string;
  taxable?: boolean;
  showOnPayslip?: boolean;
  roleId?: string;
  countryId?: string;
}

export type UpdateSalaryComponentDto = Partial<CreateSalaryComponentDto>;

export async function getSalaryComponents(params?: {
  type?: string;
  roleId?: string;
  countryId?: string;
}): Promise<SalaryComponent[]> {
  const { data } = await api.get<SalaryComponent[]>('/salary-components', { params });
  return data;
}

export async function getSalaryComponent(id: string): Promise<SalaryComponent> {
  const { data } = await api.get<SalaryComponent>(`/salary-components/${id}`);
  return data;
}

export async function createSalaryComponent(dto: CreateSalaryComponentDto): Promise<SalaryComponent> {
  const { data } = await api.post<SalaryComponent>('/salary-components', dto);
  return data;
}

export async function updateSalaryComponent(
  id: string,
  dto: UpdateSalaryComponentDto,
): Promise<SalaryComponent> {
  const { data } = await api.patch<SalaryComponent>(`/salary-components/${id}`, dto);
  return data;
}

export async function deleteSalaryComponent(id: string): Promise<void> {
  await api.delete(`/salary-components/${id}`);
}
