'use client';

import { useState } from 'react';
import { Shield, User, Activity, Lock, Search, X } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/common/empty-state';
import { useAuditLogs, useAuditSummary } from '@/lib/hooks/use-audit';
import type { AuditFilters, AuditLog } from '@/lib/api/audit';
import { cn } from '@/lib/utils';

// ── Shared helpers ────────────────────────────────────────────────────────────

const ACTION_COLORS: Record<string, string> = {
  CREATE:        'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  UPDATE:        'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  DELETE:        'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  APPROVE:       'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  REJECT:        'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  DISBURSE:      'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400',
  PROCESS:       'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400',
  MARK_PAID:     'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400',
  BULK_PAYMENT:  'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400',
  LOGIN:         'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400',
  REGISTER:      'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  LOGIN_FAILED:  'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
};

const CATEGORY_COLORS: Record<string, string> = {
  FINANCIAL:     'bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400',
  EMPLOYEE:      'bg-green-50 text-green-600 dark:bg-green-950/40 dark:text-green-400',
  CONFIGURATION: 'bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400',
  SECURITY:      'bg-red-50 text-red-600 dark:bg-red-950/40 dark:text-red-400',
};

export function ActionBadge({ action }: { action: string }) {
  return (
    <span className={cn('inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium', ACTION_COLORS[action] ?? 'bg-slate-100 text-slate-600')}>
      {action}
    </span>
  );
}

export function CategoryBadge({ category }: { category: string }) {
  return (
    <span className={cn('inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium', CATEGORY_COLORS[category] ?? 'bg-slate-100 text-slate-600')}>
      {category}
    </span>
  );
}

function formatTs(ts: string) {
  return new Date(ts).toLocaleString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

function changedKeys(log: AuditLog): string {
  if (!log.newValues && !log.oldValues) return '';
  const keys = new Set([
    ...Object.keys(log.oldValues ?? {}),
    ...Object.keys(log.newValues ?? {}),
  ]);
  return Array.from(keys).slice(0, 3).join(', ');
}

// ── Summary cards ─────────────────────────────────────────────────────────────

const CATEGORY_META = [
  { key: 'FINANCIAL',     label: 'Financial',     icon: Activity, color: 'text-blue-600' },
  { key: 'EMPLOYEE',      label: 'Employee',       icon: User,     color: 'text-green-600' },
  { key: 'CONFIGURATION', label: 'Configuration',  icon: Shield,   color: 'text-amber-600' },
  { key: 'SECURITY',      label: 'Security',       icon: Lock,     color: 'text-red-600' },
];

function SummaryCards() {
  const { data: summary, isLoading } = useAuditSummary();

  const countFor = (cat: string) =>
    summary?.byCategory.find((b) => b.category === cat)?.count ?? 0;

  return (
    <div className="grid gap-4 md:grid-cols-4">
      {CATEGORY_META.map(({ key, label, icon: Icon, color }) => (
        <Card key={key}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle>
            <Icon className={cn('h-4 w-4', color)} />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <p className="text-2xl font-bold">{countFor(key).toLocaleString()}</p>
            )}
            <p className="text-xs text-muted-foreground mt-1">audit events</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// ── Filters ───────────────────────────────────────────────────────────────────

const ENTITY_TYPES = ['Employee', 'Loan', 'PayPeriod', 'Salary', 'TaxRule', 'SalaryComponent', 'User'];
const ACTIONS = ['CREATE', 'UPDATE', 'DELETE', 'APPROVE', 'REJECT', 'DISBURSE', 'PROCESS', 'MARK_PAID', 'BULK_PAYMENT', 'LOGIN', 'LOGIN_FAILED', 'REGISTER'];
const CATEGORIES = ['FINANCIAL', 'EMPLOYEE', 'CONFIGURATION', 'SECURITY'];

interface FilterBarProps {
  filters: AuditFilters;
  onChange: (f: AuditFilters) => void;
  onReset: () => void;
}

function FilterBar({ filters, onChange, onReset }: FilterBarProps) {
  const hasFilters = !!(filters.entityType || filters.action || filters.category || filters.fromDate || filters.toDate || filters.userId);

  return (
    <div className="flex flex-wrap gap-3 items-end">
      <div className="flex-1 min-w-48">
        <Input
          placeholder="User ID or name…"
          value={filters.userId ?? ''}
          onChange={(e) => onChange({ ...filters, userId: e.target.value || undefined, page: 1 })}
        />
      </div>

      <Select
        value={filters.entityType ?? '_all'}
        onValueChange={(v) => onChange({ ...filters, entityType: v === '_all' ? undefined : v, page: 1 })}
      >
        <SelectTrigger className="w-44">
          <SelectValue placeholder="Entity type" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="_all">All entities</SelectItem>
          {ENTITY_TYPES.map((et) => <SelectItem key={et} value={et}>{et}</SelectItem>)}
        </SelectContent>
      </Select>

      <Select
        value={filters.action ?? '_all'}
        onValueChange={(v) => onChange({ ...filters, action: v === '_all' ? undefined : v, page: 1 })}
      >
        <SelectTrigger className="w-40">
          <SelectValue placeholder="Action" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="_all">All actions</SelectItem>
          {ACTIONS.map((a) => <SelectItem key={a} value={a}>{a}</SelectItem>)}
        </SelectContent>
      </Select>

      <Select
        value={filters.category ?? '_all'}
        onValueChange={(v) => onChange({ ...filters, category: v === '_all' ? undefined : v, page: 1 })}
      >
        <SelectTrigger className="w-40">
          <SelectValue placeholder="Category" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="_all">All categories</SelectItem>
          {CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
        </SelectContent>
      </Select>

      <div className="flex gap-2 items-center">
        <Input
          type="date"
          className="w-36"
          value={filters.fromDate ?? ''}
          onChange={(e) => onChange({ ...filters, fromDate: e.target.value || undefined, page: 1 })}
        />
        <span className="text-muted-foreground text-sm">to</span>
        <Input
          type="date"
          className="w-36"
          value={filters.toDate ?? ''}
          onChange={(e) => onChange({ ...filters, toDate: e.target.value || undefined, page: 1 })}
        />
      </div>

      {hasFilters && (
        <Button variant="ghost" size="sm" onClick={onReset} className="gap-1.5">
          <X className="h-3.5 w-3.5" /> Clear
        </Button>
      )}
    </div>
  );
}

// ── Log table ─────────────────────────────────────────────────────────────────

function LogTable({ filters }: { filters: AuditFilters }) {
  const { data, isLoading } = useAuditLogs(filters);

  if (isLoading) {
    return (
      <div className="rounded-lg border bg-card divide-y">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 px-4 py-3">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-5 w-20 rounded-full" />
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-5 w-24 rounded-full" />
          </div>
        ))}
      </div>
    );
  }

  if (!data?.items.length) {
    return (
      <EmptyState
        title="No audit logs found"
        description="Try adjusting your filters or date range."
        icon={Search}
      />
    );
  }

  return (
    <div className="rounded-lg border bg-card overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b bg-muted/50">
            <th className="px-4 py-3 text-left font-medium">Timestamp</th>
            <th className="px-4 py-3 text-left font-medium">User</th>
            <th className="px-4 py-3 text-left font-medium">Action</th>
            <th className="px-4 py-3 text-left font-medium">Entity</th>
            <th className="px-4 py-3 text-left font-medium">Category</th>
            <th className="px-4 py-3 text-left font-medium">Changes</th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {data.items.map((log) => (
            <tr key={log.id} className="hover:bg-muted/30 transition-colors">
              <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                {formatTs(log.createdAt)}
              </td>
              <td className="px-4 py-3">
                {log.userName ? (
                  <span className="font-medium">{log.userName}</span>
                ) : (
                  <span className="text-muted-foreground text-xs">{log.userId?.slice(0, 8) ?? 'System'}</span>
                )}
              </td>
              <td className="px-4 py-3">
                <ActionBadge action={log.action} />
              </td>
              <td className="px-4 py-3">
                <span className="font-medium">{log.entityType}</span>
                {log.entityId && (
                  <span className="ml-1.5 text-xs text-muted-foreground font-mono">
                    {log.entityId.slice(0, 8)}…
                  </span>
                )}
              </td>
              <td className="px-4 py-3">
                <CategoryBadge category={log.category} />
              </td>
              <td className="px-4 py-3 text-xs text-muted-foreground max-w-48 truncate">
                {changedKeys(log) || '—'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ── Pagination ─────────────────────────────────────────────────────────────────

function Pagination({ filters, onChange }: { filters: AuditFilters; onChange: (f: AuditFilters) => void }) {
  const { data } = useAuditLogs(filters);
  if (!data || data.totalPages <= 1) return null;

  const page = data.page;
  return (
    <div className="flex items-center justify-between text-sm text-muted-foreground">
      <span>
        Showing {((page - 1) * data.limit) + 1}–{Math.min(page * data.limit, data.total)} of {data.total.toLocaleString()} events
      </span>
      <div className="flex gap-2">
        <Button
          variant="outline" size="sm"
          disabled={page <= 1}
          onClick={() => onChange({ ...filters, page: page - 1 })}
        >
          Previous
        </Button>
        <Button
          variant="outline" size="sm"
          disabled={page >= data.totalPages}
          onClick={() => onChange({ ...filters, page: page + 1 })}
        >
          Next
        </Button>
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

const DEFAULT_FILTERS: AuditFilters = { page: 1, limit: 50 };

export default function AuditLogsPage() {
  const [filters, setFilters] = useState<AuditFilters>(DEFAULT_FILTERS);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Audit Logs</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Complete record of all actions performed in the system.
        </p>
      </div>

      <SummaryCards />

      <Card>
        <CardHeader>
          <CardTitle className="text-base font-medium">Event Log</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <FilterBar
            filters={filters}
            onChange={setFilters}
            onReset={() => setFilters(DEFAULT_FILTERS)}
          />
          <LogTable filters={filters} />
          <Pagination filters={filters} onChange={setFilters} />
        </CardContent>
      </Card>
    </div>
  );
}
