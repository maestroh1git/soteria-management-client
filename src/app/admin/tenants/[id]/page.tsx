'use client';

import { use, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Ban, CheckCircle2, ShieldCheck, ShieldX } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LoadingSkeleton } from '@/components/common/loading-skeleton';
import { EmptyState } from '@/components/common/empty-state';
import { ConfirmDialog } from '@/components/common/confirm-dialog';
import { KybBadge } from '@/components/admin/kyb-badge';
import { RejectKybDialog } from '@/components/admin/reject-kyb-dialog';
import {
  useTenant,
  useUpdateKybStatus,
  useSetTenantActive,
} from '@/lib/hooks/use-admin-tenants';
import { KybStatus } from '@/lib/types/enums';
import { formatDate } from '@/lib/utils/dates';

type PendingAction =
  | { type: 'suspend' }
  | { type: 'reactivate' }
  | { type: 'kyb'; status: KybStatus }
  | null;

export default function TenantDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { data: tenant, isLoading, isError } = useTenant(id);
  const kybMutation = useUpdateKybStatus();
  const activeMutation = useSetTenantActive();
  const [pending, setPending] = useState<PendingAction>(null);

  if (isLoading) return <LoadingSkeleton variant="detail" />;
  if (isError || !tenant) {
    return (
      <EmptyState
        icon={ShieldX}
        title="Tenant not found"
        description="This tenant may have been removed, or you don't have access."
      />
    );
  }

  const confirm = {
    suspend: {
      title: 'Suspend tenant',
      description: `Suspend "${tenant.name}"? All of its users will be blocked from signing in and existing sessions are cut off immediately.`,
      confirmLabel: 'Suspend',
      variant: 'destructive' as const,
    },
    reactivate: {
      title: 'Reactivate tenant',
      description: `Reactivate "${tenant.name}"? Its users will be able to sign in again.`,
      confirmLabel: 'Reactivate',
      variant: 'default' as const,
    },
    verify: {
      title: 'Verify KYB',
      description: `Mark "${tenant.name}" as KYB-verified? This confirms their compliance identifiers have been reviewed.`,
      confirmLabel: 'Verify',
      variant: 'default' as const,
    },
  };

  // Rejection needs a reason, so it uses a dedicated dialog instead of the
  // plain confirm dialog used by the other actions.
  const isRejectPending =
    pending?.type === 'kyb' && pending.status === KybStatus.REJECTED;

  const dialog =
    pending?.type === 'suspend'
      ? confirm.suspend
      : pending?.type === 'reactivate'
        ? confirm.reactivate
        : pending?.type === 'kyb' && pending.status === KybStatus.VERIFIED
          ? confirm.verify
          : null;

  async function runPending() {
    if (!pending) return;
    if (pending.type === 'suspend') {
      await activeMutation.mutateAsync({ id, isActive: false });
    } else if (pending.type === 'reactivate') {
      await activeMutation.mutateAsync({ id, isActive: true });
    } else if (pending.type === 'kyb') {
      await kybMutation.mutateAsync({ id, status: pending.status });
    }
    setPending(null);
  }

  return (
    <div className="space-y-6">
      <Button asChild variant="ghost" size="sm" className="-ml-2">
        <Link href="/admin/tenants">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to tenants
        </Link>
      </Button>

      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold tracking-tight">{tenant.name}</h1>
            <Badge variant={tenant.isActive ? 'default' : 'secondary'}>
              {tenant.isActive ? 'Active' : 'Suspended'}
            </Badge>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>{tenant.slug}</span>
            <span>·</span>
            <KybBadge status={tenant.kybStatus} />
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {tenant.kybStatus !== KybStatus.VERIFIED && (
            <Button
              variant="outline"
              onClick={() => setPending({ type: 'kyb', status: KybStatus.VERIFIED })}
            >
              <ShieldCheck className="mr-2 h-4 w-4 text-emerald-600" /> Verify KYB
            </Button>
          )}
          {tenant.kybStatus !== KybStatus.REJECTED && (
            <Button
              variant="outline"
              onClick={() => setPending({ type: 'kyb', status: KybStatus.REJECTED })}
            >
              <ShieldX className="mr-2 h-4 w-4 text-red-600" /> Reject KYB
            </Button>
          )}
          {tenant.isActive ? (
            <Button variant="destructive" onClick={() => setPending({ type: 'suspend' })}>
              <Ban className="mr-2 h-4 w-4" /> Suspend
            </Button>
          ) : (
            <Button onClick={() => setPending({ type: 'reactivate' })}>
              <CheckCircle2 className="mr-2 h-4 w-4" /> Reactivate
            </Button>
          )}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Organization profile */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Organization</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Field label="Type" value={tenant.organizationType} />
            <Field label="Industry" value={tenant.industry} />
            <Field label="Address" value={tenant.address} />
            <Field label="Phone" value={tenant.phone} />
            <Field label="Website" value={tenant.website} />
            <Field label="Created" value={formatDate(tenant.createdAt)} />
            <Field label="Last updated" value={formatDate(tenant.updatedAt)} />
          </CardContent>
        </Card>

        {/* Compliance / KYB */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Compliance &amp; KYB</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between border-b pb-3">
              <span className="text-sm text-muted-foreground">Status</span>
              <KybBadge status={tenant.kybStatus} />
            </div>
            <Field label="CAC number" value={tenant.cacNumber} mono />
            <Field label="TIN" value={tenant.tinNumber} mono />
            <Field label="VAT number" value={tenant.vatNumber} mono />
            <Field label="NSITF" value={tenant.nsitfNumber} mono />
            <Field label="ITF" value={tenant.itfNumber} mono />
            <Field label="NHF" value={tenant.nhfNumber} mono />
            <Field label="Submitted" value={formatDate(tenant.kybSubmittedAt)} />
            <Field label="Verified" value={formatDate(tenant.kybVerifiedAt)} />
            {tenant.kybStatus === KybStatus.REJECTED &&
              tenant.kybRejectionReason && (
                <div className="rounded-md border border-red-200 bg-red-50 p-3 dark:border-red-900/50 dark:bg-red-950/20">
                  <p className="text-xs font-medium text-red-700 dark:text-red-400">
                    Rejection reason
                  </p>
                  <p className="mt-1 text-sm text-red-900 dark:text-red-200">
                    {tenant.kybRejectionReason}
                  </p>
                </div>
              )}
          </CardContent>
        </Card>
      </div>

      <ConfirmDialog
        open={!!pending && !isRejectPending}
        onOpenChange={(open) => !open && setPending(null)}
        title={dialog?.title ?? ''}
        description={dialog?.description ?? ''}
        confirmLabel={dialog?.confirmLabel}
        variant={dialog?.variant}
        loading={activeMutation.isPending || kybMutation.isPending}
        onConfirm={runPending}
      />

      <RejectKybDialog
        open={isRejectPending}
        onOpenChange={(open) => !open && setPending(null)}
        tenantName={tenant.name}
        loading={kybMutation.isPending}
        onConfirm={async (reason) => {
          await kybMutation.mutateAsync({
            id,
            status: KybStatus.REJECTED,
            rejectionReason: reason,
          });
          setPending(null);
        }}
      />
    </div>
  );
}

function Field({
  label,
  value,
  mono,
}: {
  label: string;
  value: string | null | undefined;
  mono?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className={`text-sm font-medium ${mono ? 'font-mono' : ''}`}>
        {value || '—'}
      </span>
    </div>
  );
}
