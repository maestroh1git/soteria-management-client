import { useQuery } from '@tanstack/react-query';
import {
  getAuditLogs,
  getAuditSummary,
  getEntityHistory,
  getUserActivity,
  type AuditFilters,
} from '@/lib/api/audit';

export function useAuditLogs(filters?: AuditFilters) {
  return useQuery({
    queryKey: ['audit-logs', filters],
    queryFn: () => getAuditLogs(filters),
  });
}

export function useAuditSummary() {
  return useQuery({
    queryKey: ['audit-logs', 'summary'],
    queryFn: getAuditSummary,
    staleTime: 1000 * 60 * 5,
  });
}

export function useEntityHistory(entityType: string, entityId: string) {
  return useQuery({
    queryKey: ['audit-logs', 'entity', entityType, entityId],
    queryFn: () => getEntityHistory(entityType, entityId),
    enabled: !!entityId,
    staleTime: 1000 * 60 * 2,
  });
}

export function useUserActivity(userId: string) {
  return useQuery({
    queryKey: ['audit-logs', 'user', userId],
    queryFn: () => getUserActivity(userId),
    enabled: !!userId,
  });
}
