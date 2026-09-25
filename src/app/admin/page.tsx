'use client';

import Link from 'next/link';
import {
  Building2,
  CheckCircle2,
  Ban,
  ClipboardCheck,
  Users,
  Banknote,
  ArrowRight,
} from 'lucide-react';

import { StatCard } from '@/components/common/stat-card';
import { LoadingSkeleton } from '@/components/common/loading-skeleton';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/layout/page-header';
import { DataTable } from '@/components/common/data-table';
import { tenantColumns, tenantHref } from '@/features/admin/tenant-columns';
import { useTenants } from '@/lib/hooks/use-admin-tenants';
import { usePlatformMetrics } from '@/lib/hooks/use-platform-metrics';
import { formatCompactCurrency } from '@/lib/utils/currency';

export default function AdminOverviewPage() {
  const { data: metrics, isLoading: metricsLoading } = usePlatformMetrics();
  const { data: tenants = [] } = useTenants();

  if (metricsLoading || !metrics) return <LoadingSkeleton variant="card" />;

  const { tenants: t, employees, payroll } = metrics;

  const recent = [...tenants]
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    )
    .slice(0, 6);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Platform overview"
        description="Tenants, verification and activity across the platform."
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard
          title="Tenants"
          value={t.total}
          subtitle={`${t.newLast30Days} new in last 30 days`}
          icon={Building2}
        />
        <StatCard title="Active" value={t.active} icon={CheckCircle2} />
        <StatCard title="Suspended" value={t.suspended} icon={Ban} />
        <StatCard
          title="Awaiting KYB review"
          value={t.awaitingKybReview}
          icon={ClipboardCheck}
        />
        <StatCard
          title="Employees"
          value={employees.total.toLocaleString()}
          subtitle={`${employees.active.toLocaleString()} active`}
          icon={Users}
        />
        <StatCard
          title="Payroll paid"
          value={formatCompactCurrency(payroll.totalPaidAmount)}
          subtitle={`${payroll.paidSalaries.toLocaleString()} paid salaries`}
          icon={Banknote}
        />
      </div>

      {t.awaitingKybReview > 0 && (
        <Card className="border-amber-200 bg-amber-50/50 dark:border-amber-900/50 dark:bg-amber-950/20">
          <CardContent className="flex items-center justify-between p-4">
            <div className="flex items-center gap-3">
              <ClipboardCheck className="h-5 w-5 text-amber-600" />
              <p className="text-sm">
                <span className="font-semibold">{t.awaitingKybReview}</span>{' '}
                tenant{t.awaitingKybReview === 1 ? '' : 's'} awaiting KYB
                verification.
              </p>
            </div>
            <Button asChild variant="outline" size="sm">
              <Link href="/admin/kyb">
                Review queue <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}

      <div>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Recent tenants</h2>
          <Button asChild variant="ghost" size="sm">
            <Link href="/admin/tenants">View all</Link>
          </Button>
        </div>
        <DataTable
          columns={tenantColumns()}
          data={recent}
          rowHref={tenantHref}
          emptyTitle="No tenants yet"
        />
      </div>
    </div>
  );
}
