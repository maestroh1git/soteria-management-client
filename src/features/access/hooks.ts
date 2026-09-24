'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useResourceMutation } from '@/lib/hooks/use-resource-mutation';
import { SESSION_KEY } from '@/lib/hooks/use-session';
import { getApiErrorMessage } from '@/lib/utils/api-error';
import {
  createUser,
  deleteUser,
  getUsers,
  resendInvite,
  updateUser,
  type CreateUserDto,
} from '@/lib/api/users';

export const TEAM_KEY = ['users'] as const;
// A change to someone's access may be your own; the session follows.
const invalidate = [TEAM_KEY, SESSION_KEY];

export function useTeam() {
  return useQuery({ queryKey: TEAM_KEY, queryFn: getUsers });
}

/** Invite a member of staff. Errors land on the invite form. */
export function useInvite() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dto: CreateUserDto) => createUser(dto),
    onSuccess: () => qc.invalidateQueries({ queryKey: TEAM_KEY }),
  });
}

export function useResendInvite() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => resendInvite(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: TEAM_KEY }),
    onError: (err) => toast.error(getApiErrorMessage(err, 'The invite could not be sent.')),
  });
}

export function useChangeAccess() {
  return useResourceMutation(
    ({ id, systemRoles }: { id: string; systemRoles: string[] }) =>
      updateUser(id, { systemRoles }),
    { invalidate, success: 'Access updated', inForm: true },
  );
}

/** Switch a login off. Their records stay; they cannot sign in. */
export function useDeactivate() {
  return useResourceMutation((id: string) => deleteUser(id), {
    invalidate,
    success: 'Deactivated — they can no longer sign in',
  });
}

export function useReactivate() {
  return useResourceMutation((id: string) => updateUser(id, { isActive: true }), {
    invalidate,
    success: 'Reactivated',
  });
}
