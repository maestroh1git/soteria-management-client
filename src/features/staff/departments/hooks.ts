'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { getApiErrorMessage } from '@/lib/utils/api-error';
import {
  activateDepartment,
  createDepartment,
  deactivateDepartment,
  deleteDepartment,
  getDepartments,
  updateDepartment,
  type CreateDepartmentDto,
  type UpdateDepartmentDto,
} from './api';

/**
 * Departments, through hooks (ROADMAP-EXECUTION.md, C3.8). The screen used to
 * call the API itself and write its own toasts; the key is shared with every
 * other reader of the list (the employee form, budgets, onboarding).
 */
export const DEPARTMENTS_KEY = ['departments'] as const;

export function useDepartments(enabled = true) {
  return useQuery({ queryKey: DEPARTMENTS_KEY, queryFn: getDepartments, enabled });
}

/**
 * `inForm`: the change is made from a FormDialog, which shows a refusal on
 * the form. Anything else (a row's toggle, a delete) says so in a toast.
 */
function useDepartmentMutation<V>(
  fn: (v: V) => Promise<unknown>,
  done: string | ((v: V) => string),
  inForm = false,
) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: fn,
    onSuccess: (_, v) => {
      qc.invalidateQueries({ queryKey: DEPARTMENTS_KEY });
      toast.success(typeof done === 'function' ? done(v) : done);
    },
    onError: inForm
      ? undefined
      : (err) => toast.error(getApiErrorMessage(err, 'That could not be done. Please try again.')),
  });
}

export function useCreateDepartment() {
  return useDepartmentMutation(
    (dto: CreateDepartmentDto) => createDepartment(dto),
    'Department added',
    true,
  );
}

export function useUpdateDepartment() {
  return useDepartmentMutation(
    ({ id, dto }: { id: string; dto: UpdateDepartmentDto }) => updateDepartment(id, dto),
    'Department updated',
    true,
  );
}

export function useDeleteDepartment() {
  return useDepartmentMutation((id: string) => deleteDepartment(id), 'Department deleted');
}

export function useSetDepartmentActive() {
  return useDepartmentMutation(
    ({ id, active }: { id: string; active: boolean }) =>
      active ? activateDepartment(id) : deactivateDepartment(id),
    ({ active }) => (active ? 'Department reactivated' : 'Department deactivated'),
  );
}
