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
import { Badge } from '@/components/ui/badge';
import { KybBadge } from '@/components/admin/kyb-badge';
import { useTenants } from '@/lib/hooks/use-admin-tenants';
import { usePlatformMetrics } from '@/lib/hooks/use-platform-metrics';
import { formatDate } from '@/lib/utils/dates';
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
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Platform Overview</h1>
        <p className="text-muted-foreground">
          Tenants, verification, and activity across the platform
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard
          title="Total Tenants"
          value={t.total}
          subtitle={`${t.newLast30Days} new in last 30 days`}
          icon={Building2}
        />
        <StatCard title="Active" value={t.active} icon={CheckCircle2} />
        <StatCard title="Suspended" value={t.suspended} icon={Ban} />
        <StatCard
          title="Awaiting KYB Review"
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
          title="Payroll Paid"
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
          <h2 className="text-lg font-semibold">Recent Tenants</h2>
          <Button asChild variant="ghost" size="sm">
            <Link href="/admin/tenants">View all</Link>
          </Button>
        </div>
        <div className="rounded-md border bg-white dark:bg-slate-950">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="px-4 py-3 text-left font-medium">Name</th>
                <th className="px-4 py-3 text-left font-medium">KYB</th>
                <th className="px-4 py-3 text-left font-medium">Status</th>
                <th className="px-4 py-3 text-left font-medium">Created</th>
              </tr>
            </thead>
            <tbody>
              {recent.map((tenant) => (
                <tr
                  key={tenant.id}
                  className="border-b last:border-0 hover:bg-muted/30"
                >
                  <td className="px-4 py-3">
                    <Link
                      href={`/admin/tenants/${tenant.id}`}
                      className="font-medium text-violet-700 hover:underline dark:text-violet-400"
                    >
                      {tenant.name}
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    <KybBadge status={tenant.kybStatus} />
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={tenant.isActive ? 'default' : 'secondary'}>
                      {tenant.isActive ? 'Active' : 'Suspended'}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {formatDate(tenant.createdAt)}
                  </td>
                </tr>
              ))}
              {recent.length === 0 && (
                <tr>
                  <td
                    colSpan={4}
                    className="py-12 text-center text-muted-foreground"
                  >
                    No tenants yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
