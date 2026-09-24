'use client';

import { useState } from 'react';
import type { ColumnDef } from '@tanstack/react-table';
import { AlertTriangle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/common/data-table';
import { EmployeeLink } from '@/components/common/entity-link';
import { Money } from '@/components/common/money';
import { useVariance } from '@/lib/hooks/use-payroll';
import type { EmployeeVariance } from '@/lib/api/payroll';

/**
 * Each person's take-home against the run before, the movers flagged: the
 * check an approver makes before approving (C4.6).
 */
export function VariancePanel({ payPeriodId }: { payPeriodId: string }) {
    const { data, isLoading, isError } = useVariance(payPeriodId);
    const [flaggedOnly, setFlaggedOnly] = useState(true);
    const entries = data?.entries ?? [];
    const shown = flaggedOnly ? entries.filter((e) => e.flagged) : entries;

    const columns: ColumnDef<EmployeeVariance>[] = [
        {
            id: 'employee',
            header: 'Employee',
            meta: { cardTitle: true },
            cell: ({ row }) => (
                <span>
                    <EmployeeLink id={row.original.employeeId} name={row.original.employeeName} />
                    <span className="block text-xs text-muted-foreground">{row.original.employeeNumber}</span>
                </span>
            ),
        },
        {
            id: 'previous',
            header: data?.comparedTo?.name ?? 'Before',
            meta: { align: 'right' },
            cell: ({ row }) =>
                row.original.previousNet === null ? (
                    <span className="text-muted-foreground">—</span>
                ) : (
                    <Money value={row.original.previousNet} />
                ),
        },
        {
            id: 'current',
            header: 'This run',
            meta: { align: 'right' },
            cell: ({ row }) => <Money value={row.original.currentNet} className="font-medium" />,
        },
        {
            id: 'delta',
            header: 'Change',
            meta: { align: 'right' },
            cell: ({ row }) =>
                row.original.delta === null ? (
                    <span className="text-muted-foreground">New</span>
                ) : (
                    <span className="flex flex-col items-end">
                        <Money value={row.original.delta} signed tone />
                        {row.original.percentChange !== null && (
                            <span className="text-xs text-muted-foreground tabular-nums">
                                {row.original.percentChange > 0 ? '+' : ''}
                                {row.original.percentChange.toFixed(1)}%
                            </span>
                        )}
                    </span>
                ),
        },
        {
            id: 'why',
            header: 'Why flagged',
            cell: ({ row }) =>
                row.original.flagged ? (
                    <Badge variant="outline" className="gap-1 border-amber-300 text-amber-800 dark:text-amber-300">
                        <AlertTriangle className="h-3 w-3" /> {row.original.reason}
                    </Badge>
                ) : null,
        },
    ];

    return (
        <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm text-muted-foreground">
                    {data?.comparedTo
                        ? `Take-home against ${data.comparedTo.name}. Anyone who moved more than ${data.thresholdPercent}% is flagged: ${data.flaggedCount}.`
                        : data
                          ? 'The first run: nothing to compare against.'
                          : ''}
                </p>
                <div className="flex gap-1">
                    <Button
                        size="sm"
                        variant={flaggedOnly ? 'default' : 'outline'}
                        onClick={() => setFlaggedOnly(true)}
                    >
                        Flagged ({data?.flaggedCount ?? 0})
                    </Button>
                    <Button
                        size="sm"
                        variant={flaggedOnly ? 'outline' : 'default'}
                        onClick={() => setFlaggedOnly(false)}
                    >
                        Everyone ({entries.length})
                    </Button>
                </div>
            </div>
            <DataTable
                columns={columns}
                data={shown}
                loading={isLoading}
                isError={isError}
                errorSubject="the variance"
                searchText={(e) => `${e.employeeName} ${e.employeeNumber}`}
                searchPlaceholder="Name or staff number"
                emptyTitle={flaggedOnly ? 'Nobody flagged' : 'No salaries in this run'}
                emptyDescription={
                    flaggedOnly
                        ? 'Every take-home is within the threshold of the run before.'
                        : 'Process the run to see its figures.'
                }
            />
        </div>
    );
}
