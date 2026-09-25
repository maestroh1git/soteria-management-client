import { useQuery } from '@tanstack/react-query';
import { useCan } from './use-can';
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

/**
 * A record's audit history. Asked for only by someone who may read it
 * (`audit.entityHistory`): a loan's approver may not, and used to get a
 * refused request every time they opened one.
 */
export function useEntityHistory(entityType: string, entityId: string) {
  const can = useCan();
  return useQuery({
    queryKey: ['audit-logs', 'entity', entityType, entityId],
    queryFn: () => getEntityHistory(entityType, entityId),
    enabled: !!entityId && can('audit.entityHistory'),
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
