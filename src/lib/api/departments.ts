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
  const { data } = await api.get<Department[]>('/departments');
  return data;
}

export async function getDepartment(id: string): Promise<Department> {
  const { data } = await api.get<Department>(`/departments/${id}`);
  return data;
}

export async function createDepartment(dto: CreateDepartmentDto): Promise<Department> {
  const { data } = await api.post<Department>('/departments', dto);
  return data;
}

export async function updateDepartment(id: string, dto: UpdateDepartmentDto): Promise<Department> {
  const { data } = await api.patch<Department>(`/departments/${id}`, dto);
  return data;
}

export async function deleteDepartment(id: string): Promise<void> {
  await api.delete(`/departments/${id}`);
}

export async function deactivateDepartment(id: string): Promise<Department> {
  const { data } = await api.post<Department>(`/departments/${id}/deactivate`);
  return data;
}

export async function activateDepartment(id: string): Promise<Department> {
  const { data } = await api.post<Department>(`/departments/${id}/activate`);
  return data;
}
