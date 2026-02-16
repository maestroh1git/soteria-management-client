import api from './client';
import type { Department } from '@/lib/types/api';

export interface CreateDepartmentDto {
  name: string;
  description?: string;
  headOfDepartment?: string;
  parentDepartmentId?: string;
}

export interface UpdateDepartmentDto {
  name?: string;
  description?: string;
  headOfDepartment?: string;
  parentDepartmentId?: string;
  active?: boolean;
}

export async function getDepartments(): Promise<Department[]> {
  return await api.get('/departments') as unknown as Department[];
}

export async function getDepartment(id: string): Promise<Department> {
  return await api.get(`/departments/${id}`) as unknown as Department;
}

export async function createDepartment(dto: CreateDepartmentDto): Promise<Department> {
  return await api.post('/departments', dto) as unknown as Department;
}

export async function updateDepartment(id: string, dto: UpdateDepartmentDto): Promise<Department> {
  return await api.patch(`/departments/${id}`, dto) as unknown as Department;
}

export async function deleteDepartment(id: string): Promise<void> {
  await api.delete(`/departments/${id}`);
}

export async function deactivateDepartment(id: string): Promise<Department> {
  return await api.post(`/departments/${id}/deactivate`) as unknown as Department;
}

export async function activateDepartment(id: string): Promise<Department> {
  return await api.post(`/departments/${id}/activate`) as unknown as Department;
}
