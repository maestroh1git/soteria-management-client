import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { getMyTenant, updateMyTenant } from '@/lib/api/tenants';
import type { UpdateTenantProfileDto } from '@/lib/api/tenants';
import { useAuthStore } from '@/stores/auth-store';

export function useMyTenant() {
  // The logged-in user no longer carries the tenant object (trimmed JWT/login
  // payload), so the tenant is fetched here. Gate on auth to avoid firing an
  // unauthenticated request on the login/register screens. Also gate on a
  // tenantId: platform operators (super_admin) have none, and /tenants/me
  // would 404 for them.
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const tenantId = useAuthStore((s) => s.user?.tenantId);
  return useQuery({
    queryKey: ['tenant', 'me'],
    queryFn: getMyTenant,
    enabled: isAuthenticated && !!tenantId,
    staleTime: 5 * 60 * 1000,
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
