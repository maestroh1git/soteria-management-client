import api from './client';
import type { Grade } from '@/lib/types/api';

export interface CreateGradeDto {
  code: string;
  name: string;
  description?: string;
  sortOrder?: number;
  active?: boolean;
}

export type UpdateGradeDto = Partial<CreateGradeDto>;

export async function getGrades(includeInactive = false): Promise<Grade[]> {
  const query = includeInactive ? '?includeInactive=true' : '';
  return (await api.get(`/grades${query}`)) as unknown as Grade[];
}

export async function getGrade(id: string): Promise<Grade> {
  return (await api.get(`/grades/${id}`)) as unknown as Grade;
}

export async function createGrade(dto: CreateGradeDto): Promise<Grade> {
  return (await api.post('/grades', dto)) as unknown as Grade;
}

export async function updateGrade(
  id: string,
  dto: UpdateGradeDto,
): Promise<Grade> {
  return (await api.patch(`/grades/${id}`, dto)) as unknown as Grade;
}

export async function deleteGrade(id: string): Promise<void> {
  await api.delete(`/grades/${id}`);
}
