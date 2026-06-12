'use client';

import { useMemo, useState } from 'react';
import { Search, X } from 'lucide-react';

import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { LoadingSkeleton } from '@/components/common/loading-skeleton';
import { EmptyState } from '@/components/common/empty-state';
import { useTenants } from '@/lib/hooks/use-admin-tenants';
import { usePlatformAuditLogs } from '@/lib/hooks/use-platform-metrics';
import type { PlatformAuditFilters } from '@/lib/api/platform';
import { cn } from '@/lib/utils';

const ACTION_COLORS: Record<string, string> = {
  CREATE: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  UPDATE: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  DELETE: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  APPROVE: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  REJECT: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  LOGIN: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400',
  LOGIN_FAILED: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
  REGISTER: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
};

const CATEGORY_COLORS: Record<string, string> = {
  FINANCIAL: 'bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400',
  EMPLOYEE: 'bg-green-50 text-green-600 dark:bg-green-950/40 dark:text-green-400',
  CONFIGURATION: 'bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400',
  SECURITY: 'bg-red-50 text-red-600 dark:bg-red-950/40 dark:text-red-400',
};

const ACTIONS = [
  'CREATE', 'UPDATE', 'DELETE', 'APPROVE', 'REJECT', 'LOGIN', 'LOGIN_FAILED', 'REGISTER',
];
const CATEGORIES = ['FINANCIAL', 'EMPLOYEE', 'CONFIGURATION', 'SECURITY'];

const DEFAULT_FILTERS: PlatformAuditFilters = { page: 1, limit: 50 };

function Pill({ value, map }: { value: string; map: Record<string, string> }) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
        map[value] ?? 'bg-slate-100 text-slate-600',
      )}
    >
      {value}
    </span>
  );
}

function formatTs(ts: string) {
  const d = new Date(ts);
  if (isNaN(d.getTime())) return '—';
  return d.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function PlatformAuditPage() {
  const [filters, setFilters] = useState<PlatformAuditFilters>(DEFAULT_FILTERS);
  const { data: tenants = [] } = useTenants();
  const { data, isLoading } = usePlatformAuditLogs(filters);

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

  function update(patch: Partial<PlatformAuditFilters>) {
    setFilters((f) => ({ ...f, ...patch, page: 1 }));
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Audit Log</h1>
        <p className="text-muted-foreground">
          Every action across all tenants. Filter by tenant to scope it.
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-end gap-3">
        <Input
          placeholder="User ID or name…"
          value={filters.userId ?? ''}
          onChange={(e) => update({ userId: e.target.value || undefined })}
          className="w-52"
        />
        <Select
          value={filters.tenantId ?? '_all'}
          onValueChange={(v) => update({ tenantId: v === '_all' ? undefined : v })}
        >
          <SelectTrigger className="w-52">
            <SelectValue placeholder="Tenant" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="_all">All tenants</SelectItem>
            {tenants.map((t) => (
              <SelectItem key={t.id} value={t.id}>
                {t.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={filters.action ?? '_all'}
          onValueChange={(v) => update({ action: v === '_all' ? undefined : v })}
        >
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Action" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="_all">All actions</SelectItem>
            {ACTIONS.map((a) => (
              <SelectItem key={a} value={a}>
                {a}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={filters.category ?? '_all'}
          onValueChange={(v) => update({ category: v === '_all' ? undefined : v })}
        >
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="_all">All categories</SelectItem>
            {CATEGORIES.map((c) => (
              <SelectItem key={c} value={c}>
                {c}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
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

      {/* Table */}
      {isLoading ? (
        <LoadingSkeleton variant="table" />
      ) : !data?.items.length ? (
        <EmptyState
          icon={Search}
          title="No audit events found"
          description="Try adjusting your filters or date range."
        />
      ) : (
        <>
          <div className="overflow-hidden rounded-md border bg-white dark:bg-slate-950">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="px-4 py-3 text-left font-medium">Timestamp</th>
                  <th className="px-4 py-3 text-left font-medium">Tenant</th>
                  <th className="px-4 py-3 text-left font-medium">User</th>
                  <th className="px-4 py-3 text-left font-medium">Action</th>
                  <th className="px-4 py-3 text-left font-medium">Entity</th>
                  <th className="px-4 py-3 text-left font-medium">Category</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {data.items.map((log) => (
                  <tr key={log.id} className="hover:bg-muted/30">
                    <td className="whitespace-nowrap px-4 py-3 text-muted-foreground">
                      {formatTs(log.createdAt)}
                    </td>
                    <td className="px-4 py-3 font-medium">
                      {tenantName(log.tenantId)}
                    </td>
                    <td className="px-4 py-3">
                      {log.userName ? (
                        <span className="font-medium">{log.userName}</span>
                      ) : (
                        <span className="text-xs text-muted-foreground">
                          {log.userId?.slice(0, 8) ?? 'System'}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <Pill value={log.action} map={ACTION_COLORS} />
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-medium">{log.entityType}</span>
                      {log.entityId && (
                        <span className="ml-1.5 font-mono text-xs text-muted-foreground">
                          {log.entityId.slice(0, 8)}…
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <Pill value={log.category} map={CATEGORY_COLORS} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {data.totalPages > 1 && (
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>
                Showing {(data.page - 1) * data.limit + 1}–
                {Math.min(data.page * data.limit, data.total)} of{' '}
                {data.total.toLocaleString()} events
              </span>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={data.page <= 1}
                  onClick={() => setFilters((f) => ({ ...f, page: data.page - 1 }))}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={data.page >= data.totalPages}
                  onClick={() => setFilters((f) => ({ ...f, page: data.page + 1 }))}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
