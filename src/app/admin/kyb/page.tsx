'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ShieldCheck, ShieldX } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/layout/page-header';
import { DataTable } from '@/components/common/data-table';
import type { ColumnDef } from '@tanstack/react-table';
import { tenantHref } from '@/features/admin/tenant-columns';
import { ConfirmDialog } from '@/components/common/confirm-dialog';
import { RejectKybDialog } from '@/components/admin/reject-kyb-dialog';
import { useTenants, useUpdateKybStatus } from '@/lib/hooks/use-admin-tenants';
import { KybStatus } from '@/lib/types/enums';
import type { Tenant } from '@/lib/types/api';
import { formatDate } from '@/lib/utils/dates';

export default function KybQueuePage() {
  const { data: tenants = [], isLoading, isError } = useTenants();
  const kybMutation = useUpdateKybStatus();
  const [pending, setPending] = useState<{
    tenant: Tenant;
    status: KybStatus.VERIFIED | KybStatus.REJECTED;
  } | null>(null);

  const queue = tenants
    .filter((t) => t.kybStatus === KybStatus.SUBMITTED)
    .sort(
      (a, b) =>
        new Date(a.kybSubmittedAt ?? a.createdAt).getTime() -
        new Date(b.kybSubmittedAt ?? b.createdAt).getTime(),
    );

  const isReject = pending?.status === KybStatus.REJECTED;

  const columns: ColumnDef<Tenant>[] = [
    {
      id: 'tenant',
      header: 'Tenant',
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
    {
      id: 'cac',
      header: 'CAC',
      cell: ({ row }) => <span className="font-mono text-xs">{row.original.cacNumber || '—'}</span>,
    },
    {
      id: 'tin',
      header: 'TIN',
      cell: ({ row }) => <span className="font-mono text-xs">{row.original.tinNumber || '—'}</span>,
    },
    {
      id: 'submitted',
      header: 'Submitted',
      cell: ({ row }) => (
        <span className="text-muted-foreground">{formatDate(row.original.kybSubmittedAt)}</span>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="KYB review queue"
        description="Tenants that have sent their compliance details for verification, oldest first."
      />

      <DataTable
        columns={columns}
        data={queue}
        loading={isLoading}
        isError={isError}
        errorSubject="the review queue"
        rowActions={(t) => (
          <div className="flex items-center justify-end gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setPending({ tenant: t, status: KybStatus.VERIFIED })}
            >
              <ShieldCheck className="mr-1.5 h-4 w-4 text-emerald-600" />
              Verify
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setPending({ tenant: t, status: KybStatus.REJECTED })}
            >
              <ShieldX className="mr-1.5 h-4 w-4 text-red-600" />
              Reject
            </Button>
          </div>
        )}
        emptyTitle="The queue is clear"
        emptyDescription="No tenants are waiting for a KYB review."
      />

      <ConfirmDialog
        open={!!pending && !isReject}
        onOpenChange={(open) => !open && setPending(null)}
        title="Verify KYB"
        description={
          pending
            ? `Mark "${pending.tenant.name}" as KYB-verified? This confirms their compliance identifiers have been reviewed.`
            : ''
        }
        confirmLabel="Verify"
        loading={kybMutation.isPending}
        onConfirm={async () => {
          if (!pending) return;
          await kybMutation.mutateAsync({
            id: pending.tenant.id,
            status: pending.status,
          });
          setPending(null);
        }}
      />

      <RejectKybDialog
        open={!!pending && isReject}
        onOpenChange={(open) => !open && setPending(null)}
        tenantName={pending?.tenant.name}
        loading={kybMutation.isPending}
        onConfirm={async (reason) => {
          if (!pending) return;
          await kybMutation.mutateAsync({
            id: pending.tenant.id,
            status: KybStatus.REJECTED,
            rejectionReason: reason,
          });
          setPending(null);
        }}
      />
    </div>
  );
}
