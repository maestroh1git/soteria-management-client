'use client';

import { useQuery } from '@tanstack/react-query';
import { useResourceMutation } from '@/lib/hooks/use-resource-mutation';
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
const invalidate = [DEPARTMENTS_KEY];

export function useDepartments(enabled = true) {
  return useQuery({ queryKey: DEPARTMENTS_KEY, queryFn: getDepartments, enabled });
}

export function useCreateDepartment() {
  return useResourceMutation((dto: CreateDepartmentDto) => createDepartment(dto), {
    invalidate,
    success: 'Department added',
    inForm: true,
  });
}

export function useUpdateDepartment() {
  return useResourceMutation(
    ({ id, dto }: { id: string; dto: UpdateDepartmentDto }) => updateDepartment(id, dto),
    { invalidate, success: 'Department updated', inForm: true },
  );
}

export function useDeleteDepartment() {
  return useResourceMutation((id: string) => deleteDepartment(id), {
    invalidate,
    success: 'Department deleted',
  });
}

export function useSetDepartmentActive() {
  return useResourceMutation(
    ({ id, active }: { id: string; active: boolean }) =>
      active ? activateDepartment(id) : deactivateDepartment(id),
    {
      invalidate,
      success: ({ active }) => (active ? 'Department reactivated' : 'Department deactivated'),
    },
  );
}
