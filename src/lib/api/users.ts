import api from './client';
import type { User } from '@/lib/types/api';

export interface CreateUserDto {
  email: string;
  firstName: string;
  lastName: string;
  employeeId: string;
  systemRoles: string[];
}

/**
 * Inviting a user creates a pending account and emails them a link to set their
 * own password. When mail is not configured (or the send failed) the API hands
 * the link back so the admin can pass it on by hand.
 */
export interface InviteResponse {
  user: User;
  emailed: boolean;
  inviteUrl?: string;
}

export interface UpdateUserDto {
  systemRoles?: string[];
  isActive?: boolean;
}

export interface ChangePasswordDto {
  currentPassword: string;
  newPassword: string;
}

export interface ChangePasswordResponse {
  message: string;
  token: string;
  user: User;
}

// ── API calls ───────────────────────────────────────────────

export async function getUsers(): Promise<User[]> {
  return (await api.get('/users')) as unknown as User[];
}

export async function getUser(id: string): Promise<User> {
  return (await api.get(`/users/${id}`)) as unknown as User;
}

export async function createUser(data: CreateUserDto): Promise<InviteResponse> {
  return (await api.post('/users', data)) as unknown as InviteResponse;
}

export async function updateUser(
  id: string,
  data: UpdateUserDto,
): Promise<User> {
  return (await api.patch(`/users/${id}`, data)) as unknown as User;
}

export async function deleteUser(id: string): Promise<User> {
  return (await api.delete(`/users/${id}`)) as unknown as User;
}

export async function changePassword(
  data: ChangePasswordDto,
): Promise<ChangePasswordResponse> {
  return (await api.post(
    '/auth/change-password',
    data,
  )) as unknown as ChangePasswordResponse;
}
