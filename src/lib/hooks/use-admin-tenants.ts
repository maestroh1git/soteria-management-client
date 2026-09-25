import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  listTenants,
  getTenant,
  updateTenantKybStatus,
  setTenantActive,
  onboardTenant,
} from '@/lib/api/tenants';
import type { KybStatus } from '@/lib/types/enums';
import { getApiErrorMessage } from '@/lib/utils/api-error';

/** All tenants across the platform (super-admin only). */
export function useTenants() {
  return useQuery({
    queryKey: ['admin', 'tenants'],
    queryFn: listTenants,
    staleTime: 60 * 1000,
  });
}

/** A single tenant by id (super-admin view). */
export function useTenant(id: string) {
  return useQuery({
    queryKey: ['admin', 'tenant', id],
    queryFn: () => getTenant(id),
    enabled: !!id,
  });
}

export function useUpdateKybStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      status,
      rejectionReason,
    }: {
      id: string;
      status: KybStatus;
      rejectionReason?: string;
    }) => updateTenantKybStatus(id, status, rejectionReason),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ['admin', 'tenants'] });
      qc.invalidateQueries({ queryKey: ['admin', 'tenant', vars.id] });
      toast.success('KYB status updated');
    },
    onError: (e) => toast.error(getApiErrorMessage(e, 'Failed to update KYB status')),
  });
}

export function useSetTenantActive() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      setTenantActive(id, isActive),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ['admin', 'tenants'] });
      qc.invalidateQueries({ queryKey: ['admin', 'tenant', vars.id] });
      toast.success(vars.isActive ? 'Tenant reactivated' : 'Tenant suspended');
    },
    onError: (e) => toast.error(getApiErrorMessage(e, 'Failed to update tenant')),
  });
}

/** Set up an organisation for a customer and invite its owner (5.13). */
export function useOnboardTenant() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: onboardTenant,
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['admin', 'tenants'] });
            qc.invalidateQueries({ queryKey: ['admin', 'platform-metrics'] });
        },
    });
}
