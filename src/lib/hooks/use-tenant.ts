import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { getMyTenant, updateMyTenant } from '@/lib/api/tenants';
import type { UpdateTenantProfileDto } from '@/lib/api/tenants';

export function useMyTenant() {
  return useQuery({
    queryKey: ['tenant', 'me'],
    queryFn: getMyTenant,
  });
}

export function useUpdateTenant() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: UpdateTenantProfileDto) => updateMyTenant(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tenant', 'me'] });
      toast.success('Organization profile saved');
    },
    onError: () => toast.error('Failed to save organization profile'),
  });
}
