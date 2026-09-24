import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
    getUser,
    inviteGuardian,
    updateUser,
    changePassword,
} from '@/lib/api/users';
import type { UpdateUserDto, ChangePasswordDto } from '@/lib/api/users';
import { SESSION_KEY } from './use-session';
import { getApiErrorMessage } from '@/lib/utils/api-error';

export function useUser(id: string) {
  return useQuery({
    queryKey: ['users', id],
    queryFn: () => getUser(id),
    enabled: !!id,
  });
}

/** A parent-portal login for a pupil's guardian (D4); Registrars may send it. */
export function useInviteGuardian() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ guardianId, email }: { guardianId: string; email?: string }) =>
      inviteGuardian(guardianId, email),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ['users'] });
      if (res.emailed) toast.success(`Invite sent to ${res.user.email}`);
    },
    onError: (error: unknown) =>
      toast.error(getApiErrorMessage(error, 'The invite could not be sent.')),
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
