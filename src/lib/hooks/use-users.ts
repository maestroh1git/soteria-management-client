import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
    getUser,
    createUser,
    updateUser,
    changePassword,
} from '@/lib/api/users';
import type {
  CreateUserDto,
  UpdateUserDto,
  ChangePasswordDto,
} from '@/lib/api/users';
import { SESSION_KEY } from './use-session';

export function useUser(id: string) {
  return useQuery({
    queryKey: ['users', id],
    queryFn: () => getUser(id),
    enabled: !!id,
  });
}

export function useCreateUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateUserDto) => createUser(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['users'] });
      toast.success('User created successfully');
    },
    onError: (error: { message?: string }) =>
      toast.error(error.message || 'Failed to create user'),
  });
}

export function useUpdateUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateUserDto }) =>
      updateUser(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['users'] });
      // If they changed their own access, their screens follow now.
      qc.invalidateQueries({ queryKey: SESSION_KEY });
      toast.success('User updated successfully');
    },
    onError: (error: { message?: string }) =>
      toast.error(error.message || 'Failed to update user'),
  });
}

export function useChangePassword() {
  return useMutation({
    mutationFn: (data: ChangePasswordDto) => changePassword(data),
    onSuccess: () => {
      toast.success('Password changed successfully');
    },
    onError: (error: { message?: string }) =>
      toast.error(error.message || 'Failed to change password'),
  });
}
