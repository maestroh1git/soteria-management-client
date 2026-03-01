import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  getTaxRules,
  createTaxRule,
  updateTaxRule,
  deleteTaxRule,
  type CreateTaxRuleDto,
  type UpdateTaxRuleDto,
} from '@/lib/api/tax';

const QUERY_KEY = ['tax-rules'];

export function useTaxRules() {
  return useQuery({
    queryKey: QUERY_KEY,
    queryFn: getTaxRules,
  });
}

export function useCreateTaxRule() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dto: CreateTaxRuleDto) => createTaxRule(dto),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEY });
      toast.success('Tax rule created');
    },
    onError: () => toast.error('Failed to create tax rule'),
  });
}

export function useUpdateTaxRule() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: UpdateTaxRuleDto }) =>
      updateTaxRule(id, dto),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEY });
      toast.success('Tax rule updated');
    },
    onError: () => toast.error('Failed to update tax rule'),
  });
}

export function useDeleteTaxRule() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteTaxRule(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEY });
      toast.success('Tax rule deleted');
    },
    onError: () => toast.error('Failed to delete tax rule'),
  });
}
