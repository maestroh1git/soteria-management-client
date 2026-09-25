'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { X } from 'lucide-react';
import type { ColumnDef } from '@tanstack/react-table';

import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/layout/page-header';
import { DataTable } from '@/components/common/data-table';
import { StatusBadge } from '@/components/common/status-badge';
import { statusOf, statusOptions } from '@/lib/status/registry';
import { tenantHref } from '@/features/admin/tenant-columns';
import { useTenants } from '@/lib/hooks/use-admin-tenants';
import { usePlatformAuditLogs } from '@/lib/hooks/use-platform-metrics';
import type { PlatformAuditFilters } from '@/lib/api/platform';
import type { AuditLog } from '@/lib/api/audit';
import { formatDateTime } from '@/lib/utils/dates';

const ACTIONS = [
  'CREATE', 'UPDATE', 'DELETE', 'APPROVE', 'REJECT', 'LOGIN', 'LOGIN_FAILED', 'REGISTER',
];

const DEFAULT_FILTERS: PlatformAuditFilters = { page: 1, limit: 50 };

export default function PlatformAuditPage() {
  const [filters, setFilters] = useState<PlatformAuditFilters>(DEFAULT_FILTERS);
  const { data: tenants = [] } = useTenants();
  const { data, isLoading, isError } = usePlatformAuditLogs(filters);

  const tenantName = useMemo(() => {
    const map = new Map(tenants.map((t) => [t.id, t.name]));
    return (id?: string) => (id ? (map.get(id) ?? `${id.slice(0, 8)}…`) : 'Platform');
  }, [tenants]);

  const hasFilters = !!(
    filters.tenantId ||
    filters.action ||
    filters.category ||
    filters.userId ||
    filters.fromDate ||
    filters.toDate
  );

  const columns: ColumnDef<AuditLog>[] = [
    {
      id: 'when',
      header: 'When',
      cell: ({ row }) => (
        <span className="whitespace-nowrap text-muted-foreground">
          {formatDateTime(row.original.createdAt)}
        </span>
      ),
    },
    {
      id: 'tenant',
      header: 'Tenant',
      cell: ({ row }) =>
        row.original.tenantId ? (
          <Link
            href={tenantHref({ id: row.original.tenantId })}
            className="font-medium hover:underline underline-offset-2"
          >
            {tenantName(row.original.tenantId)}
          </Link>
        ) : (
          <span className="font-medium">Platform</span>
        ),
    },
    {
      id: 'user',
      header: 'User',
      meta: { cardTitle: true },
      cell: ({ row }) =>
        row.original.userName ? (
          <span className="font-medium">{row.original.userName}</span>
        ) : (
          <span className="text-xs text-muted-foreground">
            {row.original.userId?.slice(0, 8) ?? 'System'}
          </span>
        ),
    },
    {
      id: 'action',
      header: 'Action',
      cell: ({ row }) => <StatusBadge kind="auditAction" status={row.original.action} />,
    },
    {
      id: 'entity',
      header: 'Record',
      cell: ({ row }) => (
        <>
          <span className="font-medium">{row.original.entityType}</span>
          {row.original.entityId && (
            <span className="ml-1.5 font-mono text-xs text-muted-foreground">
              {row.original.entityId.slice(0, 8)}…
            </span>
          )}
        </>
      ),
    },
    {
      id: 'category',
      header: 'Category',
      cell: ({ row }) => <StatusBadge kind="auditCategory" status={row.original.category} />,
    },
  ];

  function update(patch: Partial<PlatformAuditFilters>) {
    setFilters((f) => ({ ...f, ...patch, page: 1 }));
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Audit log"
        description="Every action across all tenants. Filter by tenant to scope it."
      />

      {/* Filters */}
      <div className="flex flex-wrap items-end gap-3">
        <Input
          placeholder="User ID or name…"
          value={filters.userId ?? ''}
          onChange={(e) => update({ userId: e.target.value || undefined })}
          className="w-52"
        />
        <div className="flex items-center gap-2">
          <Input
            type="date"
            className="w-36"
            value={filters.fromDate ?? ''}
            onChange={(e) => update({ fromDate: e.target.value || undefined })}
          />
          <span className="text-sm text-muted-foreground">to</span>
          <Input
            type="date"
            className="w-36"
            value={filters.toDate ?? ''}
            onChange={(e) => update({ toDate: e.target.value || undefined })}
          />
        </div>
        {hasFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setFilters(DEFAULT_FILTERS)}
            className="gap-1.5"
          >
            <X className="h-3.5 w-3.5" /> Clear
          </Button>
        )}
      </div>

      <DataTable
        columns={columns}
        data={data?.items ?? []}
        loading={isLoading}
        isError={isError}
        errorSubject="the audit events"
        pagination={
          data
            ? { page: data.page, limit: data.limit, total: data.total, totalPages: data.totalPages }
            : undefined
        }
        onPageChange={(page) => setFilters((f) => ({ ...f, page }))}
        onLimitChange={(limit) => update({ limit })}
        filters={[
          {
            id: 'tenant',
            label: 'tenants',
            value: filters.tenantId,
            options: tenants.map((t) => ({ value: t.id, label: t.name })),
          },
          {
            id: 'action',
            label: 'actions',
            value: filters.action,
            options: ACTIONS.map((a) => ({ value: a, label: statusOf('auditAction', a).label })),
          },
          {
            id: 'category',
            label: 'categories',
            value: filters.category,
            options: statusOptions('auditCategory'),
          },
        ]}
        onFilterChange={(id, value) =>
          update(
            id === 'tenant'
              ? { tenantId: value }
              : id === 'action'
                ? { action: value }
                : { category: value },
          )
        }
        emptyTitle={hasFilters ? 'No audit events match' : 'No audit events yet'}
        emptyDescription={hasFilters ? 'Try other filters or dates.' : undefined}
      />
    </div>
  );
}
