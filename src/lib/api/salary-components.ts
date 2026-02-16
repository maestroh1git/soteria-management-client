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
  return await api.get('/salary-components', { params }) as unknown as SalaryComponent[];
}

export async function getSalaryComponent(id: string): Promise<SalaryComponent> {
  return await api.get(`/salary-components/${id}`) as unknown as SalaryComponent;
}

export async function createSalaryComponent(dto: CreateSalaryComponentDto): Promise<SalaryComponent> {
  return await api.post('/salary-components', dto) as unknown as SalaryComponent;
}

export async function updateSalaryComponent(
  id: string,
  dto: UpdateSalaryComponentDto,
): Promise<SalaryComponent> {
  return await api.patch(`/salary-components/${id}`, dto) as unknown as SalaryComponent;
}

export async function deleteSalaryComponent(id: string): Promise<void> {
  await api.delete(`/salary-components/${id}`);
}
