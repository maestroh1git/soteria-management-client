import api from '@/lib/api/client';
import type { Role } from '@/lib/types/api';

export interface CreateRoleDto {
  name: string;
  description?: string;
  baseSalaryRange?: { min: number; max: number };
  departmentId?: string;
  roleType?: string;
  reportingTo?: string;
  isDottedLine?: boolean;
  /**
   * Access everyone in the position has, on top of their own (5.17). Sent only
   * by someone who manages access; the API refuses it from anyone else.
   */
  accessRoles?: string[];
}

export type UpdateRoleDto = Partial<CreateRoleDto>;

export async function getRoles(): Promise<Role[]> {
  return await api.get('/roles') as unknown as Role[];
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
