import api from './client';

export interface AuditLog {
  id: string;
  userId?: string;
  userName?: string;
  tenantId?: string;
  action: string;
  entityType: string;
  entityId?: string;
  oldValues?: Record<string, unknown>;
  newValues?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
  category: 'FINANCIAL' | 'EMPLOYEE' | 'CONFIGURATION' | 'SECURITY';
  createdAt: string;
}

export interface AuditLogPage {
  items: AuditLog[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface AuditSummary {
  byCategory: { category: string; count: number }[];
  byAction: { action: string; count: number }[];
  recentActivity: { date: string; count: number }[];
}

export interface AuditFilters {
  entityType?: string;
  entityId?: string;
  userId?: string;
  action?: string;
  category?: string;
  fromDate?: string;
  toDate?: string;
  page?: number;
  limit?: number;
}

export async function getAuditLogs(filters?: AuditFilters): Promise<AuditLogPage> {
  return api.get('/audit-logs', { params: filters });
}

export async function getAuditSummary(): Promise<AuditSummary> {
  return api.get('/audit-logs/summary');
}

export async function getEntityHistory(entityType: string, entityId: string): Promise<AuditLog[]> {
  return api.get(`/audit-logs/entity/${entityType}/${entityId}`);
}

export async function getUserActivity(userId: string): Promise<AuditLog[]> {
  return api.get(`/audit-logs/user/${userId}`);
}
