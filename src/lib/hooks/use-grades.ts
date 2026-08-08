import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  getGrades,
  getGrade,
  createGrade,
  updateGrade,
  deleteGrade,
  type CreateGradeDto,
  type UpdateGradeDto,
} from '@/lib/api/grades';

export function useGrades(includeInactive = false) {
  return useQuery({
    queryKey: ['grades', { includeInactive }],
    queryFn: () => getGrades(includeInactive),
  });
}

export function useGrade(id: string) {
  return useQuery({
    queryKey: ['grades', id],
    queryFn: () => getGrade(id),
    enabled: !!id,
  });
}

export function useCreateGrade() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dto: CreateGradeDto) => createGrade(dto),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['grades'] });
      toast.success('Grade created');
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useUpdateGrade() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: UpdateGradeDto }) =>
      updateGrade(id, dto),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['grades'] });
      toast.success('Grade updated');
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useDeleteGrade() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteGrade(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['grades'] });
      toast.success('Grade deleted');
    },
    // The API refuses to delete a grade employees are assigned to, since that
    // would strip the band from historical advices. Surface that reason.
    onError: (e: Error) => toast.error(e.message),
  });
}
