import { useQuery } from '@tanstack/react-query';
import {
  getPlatformMetrics,
  getPlatformAuditLogs,
  type PlatformAuditFilters,
} from '@/lib/api/platform';

/** Cross-tenant platform metrics for the super-admin overview. */
export function usePlatformMetrics() {
  return useQuery({
    queryKey: ['admin', 'platform-metrics'],
    queryFn: getPlatformMetrics,
    staleTime: 60 * 1000,
  });
}

/** Cross-tenant audit log for the super-admin console. */
export function usePlatformAuditLogs(filters?: PlatformAuditFilters) {
  return useQuery({
    queryKey: ['admin', 'platform-audit', filters],
    queryFn: () => getPlatformAuditLogs(filters),
  });
}
