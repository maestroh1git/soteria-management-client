'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { Search, Building2 } from 'lucide-react';

import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { LoadingSkeleton } from '@/components/common/loading-skeleton';
import { EmptyState } from '@/components/common/empty-state';
import { KybBadge } from '@/components/admin/kyb-badge';
import { useTenants } from '@/lib/hooks/use-admin-tenants';
import { KybStatus } from '@/lib/types/enums';
import { formatDate } from '@/lib/utils/dates';

type StatusFilter = 'all' | 'active' | 'suspended';
type KybFilter = 'all' | KybStatus;

export default function AdminTenantsPage() {
  const { data: tenants = [], isLoading } = useTenants();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<StatusFilter>('all');
  const [kyb, setKyb] = useState<KybFilter>('all');

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return tenants.filter((t) => {
      if (q && !t.name.toLowerCase().includes(q) && !t.slug.toLowerCase().includes(q)) {
        return false;
      }
      if (status === 'active' && !t.isActive) return false;
      if (status === 'suspended' && t.isActive) return false;
      if (kyb !== 'all' && t.kybStatus !== kyb) return false;
      return true;
    });
  }, [tenants, search, status, kyb]);

  if (isLoading) return <LoadingSkeleton variant="table" />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Tenants</h1>
        <p className="text-muted-foreground">
          Every organization on the platform
        </p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by name or slug…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={status} onValueChange={(v) => setStatus(v as StatusFilter)}>
          <SelectTrigger className="sm:w-40">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="suspended">Suspended</SelectItem>
          </SelectContent>
        </Select>
        <Select value={kyb} onValueChange={(v) => setKyb(v as KybFilter)}>
          <SelectTrigger className="sm:w-48">
            <SelectValue placeholder="KYB status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All KYB</SelectItem>
            <SelectItem value={KybStatus.PENDING}>Pending</SelectItem>
            <SelectItem value={KybStatus.SUBMITTED}>Awaiting Review</SelectItem>
            <SelectItem value={KybStatus.VERIFIED}>Verified</SelectItem>
            <SelectItem value={KybStatus.REJECTED}>Rejected</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-md border bg-white dark:bg-slate-950">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="px-4 py-3 text-left font-medium">Name</th>
              <th className="px-4 py-3 text-left font-medium">Type</th>
              <th className="px-4 py-3 text-left font-medium">KYB</th>
              <th className="px-4 py-3 text-left font-medium">Status</th>
              <th className="px-4 py-3 text-left font-medium">Created</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((t) => (
              <tr key={t.id} className="border-b last:border-0 hover:bg-muted/30">
                <td className="px-4 py-3">
                  <Link
                    href={`/admin/tenants/${t.id}`}
                    className="font-medium text-violet-700 hover:underline dark:text-violet-400"
                  >
                    {t.name}
                  </Link>
                  <p className="text-xs text-muted-foreground">{t.slug}</p>
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  {t.organizationType ?? '—'}
                </td>
                <td className="px-4 py-3">
                  <KybBadge status={t.kybStatus} />
                </td>
                <td className="px-4 py-3">
                  <Badge variant={t.isActive ? 'default' : 'secondary'}>
                    {t.isActive ? 'Active' : 'Suspended'}
                  </Badge>
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  {formatDate(t.createdAt)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <EmptyState
            icon={Building2}
            title="No tenants match"
            description="Try adjusting your search or filters."
          />
        )}
      </div>
    </div>
  );
}
