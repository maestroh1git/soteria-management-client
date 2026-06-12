import api from './client';
import type { KybStatus } from '@/lib/types/enums';
import type { AuditFilters, AuditLogPage } from './audit';

export interface PlatformMetrics {
  tenants: {
    total: number;
    active: number;
    suspended: number;
    awaitingKybReview: number;
    byKyb: Record<KybStatus, number>;
    newLast30Days: number;
  };
  employees: {
    total: number;
    active: number;
  };
  payroll: {
    paidSalaries: number;
    totalPaidAmount: number;
  };
}

/** Cross-tenant platform aggregates (super-admin only). */
export async function getPlatformMetrics(): Promise<PlatformMetrics> {
  return await api.get('/platform/metrics') as unknown as PlatformMetrics;
}

/** Cross-tenant audit filters — same as tenant filters plus a tenant scope. */
export interface PlatformAuditFilters extends AuditFilters {
  tenantId?: string;
}

/** Query the platform-wide audit log (super-admin only). */
export async function getPlatformAuditLogs(
  filters?: PlatformAuditFilters,
): Promise<AuditLogPage> {
  return await api.get('/platform/audit-logs', {
    params: filters,
  }) as unknown as AuditLogPage;
}
