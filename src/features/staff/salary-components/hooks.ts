'use client';

import { useQuery } from '@tanstack/react-query';
import { useResourceMutation } from '@/lib/hooks/use-resource-mutation';
import {
  createSalaryComponent,
  deleteSalaryComponent,
  getSalaryComponents,
  updateSalaryComponent,
  type CreateSalaryComponentDto,
  type UpdateSalaryComponentDto,
} from './api';

export const SALARY_COMPONENTS_KEY = ['salary-components'] as const;
const invalidate = [SALARY_COMPONENTS_KEY];

export function useSalaryComponents(enabled = true) {
  return useQuery({
    queryKey: SALARY_COMPONENTS_KEY,
    queryFn: () => getSalaryComponents(),
    enabled,
  });
}

export function useCreateSalaryComponent() {
  return useResourceMutation(
    (dto: CreateSalaryComponentDto) => createSalaryComponent(dto),
    { invalidate, success: 'Salary component added' },
  );
}

export function useUpdateSalaryComponent() {
  return useResourceMutation(
    ({ id, dto }: { id: string; dto: UpdateSalaryComponentDto }) =>
      updateSalaryComponent(id, dto),
    { invalidate, success: 'Salary component updated' },
  );
}

export function useDeleteSalaryComponent() {
  return useResourceMutation((id: string) => deleteSalaryComponent(id), {
    invalidate,
    success: 'Salary component deleted',
  });
}
