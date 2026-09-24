'use client';

import { useState } from 'react';
import type { ColumnDef } from '@tanstack/react-table';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { DataTable } from '@/components/common/data-table';
import { LoadingSkeleton } from '@/components/common/loading-skeleton';
import { StatusBadge } from '@/components/common/status-badge';
import { useLeaveBalances, useLeaveRequests } from '@/lib/hooks/use-leave';
import { statusOptions } from '@/lib/status/registry';
import { formatSpan } from '@/lib/utils/dates';
import type { LeaveRequest } from '@/lib/types/api';

const days = (n: number | string) => {
    const v = Number(n);
    return `${v} day${v === 1 ? '' : 's'}`;
};

/** This year's leave by type, and every request this person has made. */
export function LeaveTab({ employeeId }: { employeeId: string }) {
    const year = new Date().getFullYear();
    const { data: balances = [], isLoading: balancesLoading } = useLeaveBalances(employeeId, year);
    const { data: requests = [], isLoading, isError } = useLeaveRequests({ employeeId });
    const [status, setStatus] = useState<string>();
    const shown = requests.filter((r) => !status || r.status === status);

    const columns: ColumnDef<LeaveRequest>[] = [
        {
            id: 'type',
            header: 'Leave',
            meta: { cardTitle: true },
            cell: ({ row }) => (
                <span>
                    <span className="font-medium">{row.original.leaveType?.name ?? 'Leave'}</span>
                    {row.original.reason && (
                        <span className="block text-xs text-muted-foreground">{row.original.reason}</span>
                    )}
                </span>
            ),
        },
        {
            id: 'dates',
            header: 'Dates',
            cell: ({ row }) => formatSpan(row.original.startDate, row.original.endDate),
        },
        {
            id: 'days',
            header: 'Days',
            meta: { align: 'right' },
            cell: ({ row }) => <span className="tabular-nums">{Number(row.original.days)}</span>,
        },
        {
            id: 'status',
            header: 'Status',
            cell: ({ row }) => <StatusBadge kind="leave" status={row.original.status} />,
        },
    ];

    return (
        <div className="space-y-4">
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg">{year} so far</CardTitle>
                    <CardDescription>Entitlement by type, against what has been taken and asked for.</CardDescription>
                </CardHeader>
                <CardContent>
                    {balancesLoading ? (
                        <LoadingSkeleton rows={2} />
                    ) : balances.length === 0 ? (
                        <p className="text-sm text-muted-foreground">No leave types are set up yet.</p>
                    ) : (
                        <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                            {balances.map((b) => (
                                <li key={b.leaveTypeId} className="rounded-lg border p-3">
                                    <p className="text-sm font-medium">{b.leaveTypeName}</p>
                                    <p className="mt-1 text-2xl font-semibold tabular-nums">
                                        {b.remainingDays === null ? 'No cap' : days(b.remainingDays)}
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                        {b.remainingDays === null ? '' : 'left · '}
                                        {days(b.takenDays)} taken
                                        {b.pendingDays > 0 ? ` · ${days(b.pendingDays)} awaiting approval` : ''}
                                    </p>
                                </li>
                            ))}
                        </ul>
                    )}
                </CardContent>
            </Card>
            <DataTable
                columns={columns}
                data={shown}
                loading={isLoading}
                isError={isError}
                errorSubject="the leave requests"
                searchText={(r) => `${r.leaveType?.name ?? ''} ${r.reason ?? ''}`}
                searchPlaceholder="Type or reason"
                filters={[{ id: 'status', label: 'statuses', value: status, options: statusOptions('leave') }]}
                onFilterChange={(_, v) => setStatus(v)}
                emptyTitle={status ? 'No requests match' : 'No leave requests'}
                emptyDescription={status ? 'Try another status.' : 'None have been made.'}
            />
        </div>
    );
}
