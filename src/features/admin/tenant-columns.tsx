'use client';

import Link from 'next/link';
import type { ColumnDef } from '@tanstack/react-table';
import { StatusBadge } from '@/components/common/status-badge';
import type { Tenant } from '@/lib/types/api';
import { formatDate } from '@/lib/utils/dates';

/** Where a tenant's record lives in the console. */
export const tenantHref = (t: Pick<Tenant, 'id'>) => `/admin/tenants/${t.id}`;

/**
 * A tenant as a row, for the overview's recent list and the full list: the
 * same columns, words and colours in both.
 */
export function tenantColumns({ withType = false } = {}): ColumnDef<Tenant>[] {
  return [
    {
      id: 'name',
      header: 'Name',
      meta: { cardTitle: true },
      cell: ({ row }) => (
        <div>
          <Link href={tenantHref(row.original)} className="font-medium hover:underline underline-offset-2">
            {row.original.name}
          </Link>
          <p className="text-xs text-muted-foreground">{row.original.slug}</p>
        </div>
      ),
    },
    ...(withType
      ? [
          {
            id: 'type',
            header: 'Type',
            cell: ({ row }) => (
              <span className="text-muted-foreground">{row.original.organizationType ?? '—'}</span>
            ),
          } satisfies ColumnDef<Tenant>,
        ]
      : []),
    {
      id: 'kyb',
      header: 'KYB',
      cell: ({ row }) => <StatusBadge kind="kyb" status={row.original.kybStatus} />,
    },
    {
      id: 'status',
      header: 'Status',
      cell: ({ row }) => (
        <StatusBadge kind="tenant" status={row.original.isActive ? 'ACTIVE' : 'SUSPENDED'} />
      ),
    },
    {
      id: 'created',
      header: 'Created',
      cell: ({ row }) => (
        <span className="text-muted-foreground">{formatDate(row.original.createdAt)}</span>
      ),
    },
  ];
}
