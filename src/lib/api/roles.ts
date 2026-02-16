import api from './client';
import type { Role, Permission } from '@/lib/types/api';

export interface CreateRoleDto {
  name: string;
  description?: string;
  baseSalaryRange?: { min: number; max: number };
  departmentId?: string;
  roleType?: string;
  reportingTo?: string;
  isDottedLine?: boolean;
  permissionIds: string[];
}

export type UpdateRoleDto = Partial<CreateRoleDto>;

export async function getRoles(): Promise<Role[]> {
  const { data } = await api.get<Role[]>('/roles');
  return data;
}

export async function getRole(id: string): Promise<Role> {
  const { data } = await api.get<Role>(`/roles/${id}`);
  return data;
}

export async function createRole(dto: CreateRoleDto): Promise<Role> {
  const { data } = await api.post<Role>('/roles', dto);
  return data;
}

export async function updateRole(id: string, dto: UpdateRoleDto): Promise<Role> {
  const { data } = await api.patch<Role>(`/roles/${id}`, dto);
  return data;
}

export async function deleteRole(id: string): Promise<void> {
  await api.delete(`/roles/${id}`);
}

// ── Permissions ─────────────────────────────────────────────
export async function getPermissions(): Promise<Permission[]> {
  const { data } = await api.get<Permission[]>('/permissions');
  return data;
}
