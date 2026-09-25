'use client';

import { useQuery } from '@tanstack/react-query';
import { useResourceMutation } from '@/lib/hooks/use-resource-mutation';
import {
  createRole,
  deleteRole,
  getRoles,
  updateRole,
  type CreateRoleDto,
  type UpdateRoleDto,
} from './api';

/**
 * Positions — a job in the organisation ("Mathematics Educator"), not
 * someone's access. The API still calls them roles (/roles).
 */
export const POSITIONS_KEY = ['roles'] as const;
const invalidate = [POSITIONS_KEY];

export function usePositions(enabled = true) {
  return useQuery({ queryKey: POSITIONS_KEY, queryFn: getRoles, enabled });
}

export function useCreatePosition() {
  return useResourceMutation((dto: CreateRoleDto) => createRole(dto), {
    invalidate,
    success: 'Position added',
  });
}

export function useUpdatePosition() {
  return useResourceMutation(
    ({ id, dto }: { id: string; dto: UpdateRoleDto }) => updateRole(id, dto),
    { invalidate, success: 'Position updated' },
  );
}

export function useDeletePosition() {
  return useResourceMutation((id: string) => deleteRole(id), {
    invalidate,
    success: 'Position deleted',
  });
}
