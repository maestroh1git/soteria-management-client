'use client';

import Link from 'next/link';
import { AlertTriangle, ArrowRight, CheckCircle2 } from 'lucide-react';

import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/lib/hooks/use-auth';
import { useCompletenessSummary } from '@/lib/hooks/use-employees';

/**
 * Staff records that are not complete enough to pay or file on.
 *
 * The employee-level panel tells whoever opened one record what it is missing.
 * That is the wrong place for the person who has to remit PAYE on the 10th:
 * they are not going to open forty profiles. This is the same assessment from
 * the top — how many people cannot be paid, what is missing most often, and a
 * way straight to the worst of it.
 *
 * Renders nothing when there is nothing to act on. A dashboard tile that says
 * "0 problems" every day teaches people to stop reading that corner.
 */
export function StaffRecordsWidget() {
    const { hasRole } = useAuth();
    const canSee = hasRole(['tenant_owner', 'ADMIN', 'PAYROLL_OFFICER']);
    const { data } = useCompletenessSummary(canSee);

    if (!canSee || !data || data.employees === 0) return null;

    const blocked = data.employees - data.readyToPay;
    // Advisory-only gaps are not worth a dashboard tile; they live on the
    // record itself.
    const actionable = data.counts.CRITICAL + data.counts.IMPORTANT;
    if (actionable === 0) return null;

    const topGaps = data.gaps
        .filter((gap) => gap.severity !== 'ADVISORY')
        .slice(0, 3);

    return (
        <Card>
            <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-4">
                    <div>
                        <CardTitle className="flex items-center gap-2 text-base">
                            {blocked > 0 ? (
                                <AlertTriangle className="h-4 w-4 text-red-600" />
                            ) : (
                                <CheckCircle2 className="h-4 w-4 text-amber-600" />
                            )}
                            Staff records
                        </CardTitle>
                        <CardDescription>
                            {blocked > 0
                                ? `${blocked} of ${data.employees} cannot be paid or remitted for as things stand.`
                                : `Everyone can be paid. ${data.employees - data.complete} record${
                                      data.employees - data.complete === 1 ? '' : 's'
                                  } still missing details needed for a complete filing.`}
                        </CardDescription>
                    </div>
                    <Link
                        href="/employees"
                        className="flex shrink-0 items-center gap-1 text-sm text-blue-600 hover:underline dark:text-blue-400"
                    >
                        Staff <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                </div>
            </CardHeader>

            <CardContent className="space-y-4">
                {/* What is missing most often — the fix is usually one pass
                    through the same field for several people. */}
                <div className="flex flex-wrap gap-2">
                    {topGaps.map((gap) => (
                        <Badge
                            key={gap.field}
                            variant="outline"
                            title={gap.why}
                            className={
                                gap.severity === 'CRITICAL'
                                    ? 'border-red-200 bg-red-50 text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300'
                                    : 'border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-300'
                            }
                        >
                            {gap.label} · {gap.employees}
                        </Badge>
                    ))}
                </div>

                <ul className="space-y-2">
                    {data.incomplete
                        .filter((row) => row.counts.CRITICAL + row.counts.IMPORTANT > 0)
                        .slice(0, 5)
                        .map((row) => (
                            <li key={row.employeeId} className="flex items-start gap-3">
                                <span
                                    className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${
                                        row.counts.CRITICAL > 0
                                            ? 'bg-red-500'
                                            : 'bg-amber-500'
                                    }`}
                                />
                                <div className="min-w-0 flex-1">
                                    <Link
                                        href={`/employees/${row.employeeId}`}
                                        className="text-sm font-medium hover:underline"
                                    >
                                        {row.name}
                                    </Link>
                                    <p className="truncate text-xs text-muted-foreground">
                                        {row.topIssue?.label ?? 'Incomplete record'}
                                    </p>
                                </div>
                                <span className="shrink-0 text-xs text-muted-foreground">
                                    {row.score}%
                                </span>
                            </li>
                        ))}
                </ul>
            </CardContent>
        </Card>
    );
}
