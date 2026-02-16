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
  return await api.get('/roles') as unknown as Role[];
}

export async function getRole(id: string): Promise<Role> {
  return await api.get(`/roles/${id}`) as unknown as Role;
}

export async function createRole(dto: CreateRoleDto): Promise<Role> {
  return await api.post('/roles', dto) as unknown as Role;
}

export async function updateRole(id: string, dto: UpdateRoleDto): Promise<Role> {
  return await api.patch(`/roles/${id}`, dto) as unknown as Role;
}

export async function deleteRole(id: string): Promise<void> {
  await api.delete(`/roles/${id}`);
}

// ── Permissions ─────────────────────────────────────────────
export async function getPermissions(): Promise<Permission[]> {
  return await api.get('/permissions') as unknown as Permission[];
}
