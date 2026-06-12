'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ShieldCheck, ShieldX, ClipboardCheck } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { LoadingSkeleton } from '@/components/common/loading-skeleton';
import { EmptyState } from '@/components/common/empty-state';
import { ConfirmDialog } from '@/components/common/confirm-dialog';
import { RejectKybDialog } from '@/components/admin/reject-kyb-dialog';
import { useTenants, useUpdateKybStatus } from '@/lib/hooks/use-admin-tenants';
import { KybStatus } from '@/lib/types/enums';
import type { Tenant } from '@/lib/types/api';
import { formatDate } from '@/lib/utils/dates';

export default function KybQueuePage() {
  const { data: tenants = [], isLoading } = useTenants();
  const kybMutation = useUpdateKybStatus();
  const [pending, setPending] = useState<{
    tenant: Tenant;
    status: KybStatus.VERIFIED | KybStatus.REJECTED;
  } | null>(null);

  if (isLoading) return <LoadingSkeleton variant="table" />;

  const queue = tenants
    .filter((t) => t.kybStatus === KybStatus.SUBMITTED)
    .sort(
      (a, b) =>
        new Date(a.kybSubmittedAt ?? a.createdAt).getTime() -
        new Date(b.kybSubmittedAt ?? b.createdAt).getTime(),
    );

  const isReject = pending?.status === KybStatus.REJECTED;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">KYB Review Queue</h1>
        <p className="text-muted-foreground">
          Tenants that have submitted compliance details for verification
        </p>
      </div>

      {queue.length === 0 ? (
        <EmptyState
          icon={ClipboardCheck}
          title="Queue is clear"
          description="No tenants are currently awaiting KYB review."
        />
      ) : (
        <div className="rounded-md border bg-white dark:bg-slate-950">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="px-4 py-3 text-left font-medium">Tenant</th>
                <th className="px-4 py-3 text-left font-medium">CAC</th>
                <th className="px-4 py-3 text-left font-medium">TIN</th>
                <th className="px-4 py-3 text-left font-medium">Submitted</th>
                <th className="px-4 py-3 text-right font-medium">Decision</th>
              </tr>
            </thead>
            <tbody>
              {queue.map((t) => (
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
                  <td className="px-4 py-3 font-mono text-xs">{t.cacNumber || '—'}</td>
                  <td className="px-4 py-3 font-mono text-xs">{t.tinNumber || '—'}</td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {formatDate(t.kybSubmittedAt)}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          setPending({ tenant: t, status: KybStatus.VERIFIED })
                        }
                      >
                        <ShieldCheck className="mr-1.5 h-4 w-4 text-emerald-600" />
                        Verify
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          setPending({ tenant: t, status: KybStatus.REJECTED })
                        }
                      >
                        <ShieldX className="mr-1.5 h-4 w-4 text-red-600" />
                        Reject
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

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
