'use client';

import { use } from 'react';
import { Download, Loader2 } from 'lucide-react';
import type { ColumnDef } from '@tanstack/react-table';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChildAttendance } from '@/components/portal/child-attendance';
import { ChildInvoices } from '@/features/portal/child-invoices';
import { EmptyState } from '@/components/common/empty-state';
import { DataTable } from '@/components/common/data-table';
import { Breadcrumbs, PageHeader } from '@/components/layout/page-header';
import { useChildStatement, useDownloadChildAttendance } from '@/lib/hooks/use-portal';
import type { StatementEntry } from '@/lib/api/portal';
import { isApiError } from '@/lib/utils/api-error';
import { formatDate } from '@/lib/utils/dates';
import { Money } from '@/components/common/money';

const HOME = [{ label: 'Your children', href: '/portal' }];

const statementColumns: ColumnDef<StatementEntry>[] = [
    {
        id: 'date',
        header: 'Date',
        cell: ({ row }) => (
            <span className="whitespace-nowrap text-muted-foreground">
                {formatDate(row.original.date)}
            </span>
        ),
    },
    {
        id: 'description',
        header: 'Description',
        meta: { cardTitle: true },
        cell: ({ row }) => row.original.description,
    },
    {
        id: 'charge',
        header: 'Charge',
        meta: { align: 'right' },
        cell: ({ row }) =>
            row.original.charge ? <Money value={row.original.charge} /> : '—',
    },
    {
        id: 'payment',
        header: 'Paid',
        meta: { align: 'right' },
        cell: ({ row }) =>
            row.original.payment ? (
                <span className="text-green-700 dark:text-green-400">
                    <Money value={row.original.payment} />
                </span>
            ) : (
                '—'
            ),
    },
    {
        id: 'balance',
        header: 'Balance',
        meta: { align: 'right' },
        cell: ({ row }) => (
            <span className="font-medium">
                <Money value={row.original.balance} />
            </span>
        ),
    },
];

export default function ChildStatementPage({
    params,
}: {
    params: Promise<{ studentId: string }>;
}) {
    const { studentId } = use(params);
    const { data, isLoading, error } = useChildStatement(studentId);
    const download = useDownloadChildAttendance();

    if (isLoading) {
        return (
            <div className="flex justify-center py-16">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
        );
    }

    // A parent who edits the id in the address bar lands here. The server says
    // "no such child on your account" for somebody else's child and for one
    // that does not exist, and so does this — but only when the server actually
    // declined. Telling a parent their child is not on their account because our
    // request timed out reads as "the school has removed my child", to the
    // person least able to check.
    //
    // 403 and 404 are the server declining. A 401 is an expired session, and a
    // 5xx or a dropped connection is our problem; the interceptor reports a
    // request that never landed as 500, so this lands on the honest side by
    // default.
    const refused =
        isApiError(error) && (error.statusCode === 403 || error.statusCode === 404);
    if (!data && !refused) {
        return (
            <div className="space-y-4">
                <Breadcrumbs trail={HOME} />
                <EmptyState
                    isError
                    subject="your child's statement"
                    title="We couldn't load that child"
                />
            </div>
        );
    }

    // Reached only when the server refused. Stale data from a failed refetch
    // falls through to the statement below, which is better than either message.
    if (!data) {
        return (
            <div className="space-y-4">
                <Breadcrumbs trail={HOME} />
                <EmptyState
                    title="We couldn't find that child on your account"
                    description="Go back and pick one of your children. If you think this is wrong, contact the school office."
                />
            </div>
        );
    }

    const owed = Number(data.balance);
    const credit = Number(data.unallocatedCredit);

    return (
        <div className="space-y-6">
            <PageHeader
                crumbs={[...HOME, { label: data.student.name }]}
                title={data.student.name}
                description={`${data.student.admissionNumber} · attendance, and every charge and payment on this child's account.`}
                actions={
                    <Button
                        variant="outline"
                        disabled={download.isPending}
                        onClick={() =>
                            download.mutate({
                                studentId: data.student.id,
                                name: data.student.name,
                            })
                        }
                    >
                        {download.isPending ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                            <Download className="mr-2 h-4 w-4" />
                        )}
                        Download attendance
                    </Button>
                }
            />

            {/* Attendance first: it is the thing a parent checks daily, and the
                reason they open the portal at all rather than only when a bill
                is due. */}
            <ChildAttendance studentId={data.student.id} />

            <div className="grid gap-3 sm:grid-cols-2">
                <Card>
                    <CardContent className="py-4">
                        <p className="text-xs uppercase tracking-wide text-muted-foreground">
                            Owed now
                        </p>
                        <p
                            className={`mt-1 text-2xl font-semibold tabular-nums ${
                                owed > 0 ? '' : 'text-green-600 dark:text-green-400'
                            }`}
                        >
                            <Money value={data.balance} />
                        </p>
                        {owed <= 0 && (
                            <p className="mt-1 text-xs text-muted-foreground">
                                Nothing outstanding. Thank you.
                            </p>
                        )}
                    </CardContent>
                </Card>
                {credit > 0 && (
                    <Card>
                        <CardContent className="py-4">
                            <p className="text-xs uppercase tracking-wide text-muted-foreground">
                                Credit on account
                            </p>
                            <p className="mt-1 text-2xl font-semibold tabular-nums">
                                <Money value={data.unallocatedCredit} />
                            </p>
                            <p className="mt-1 text-xs text-muted-foreground">
                                Paid but not yet applied to a bill. It will be used
                                on the next one.
                            </p>
                        </CardContent>
                    </Card>
                )}
            </div>

            <ChildInvoices studentId={data.student.id} />

            <Card>
                <CardHeader>
                    <CardTitle className="text-lg">Account history</CardTitle>
                </CardHeader>
                <CardContent>
                    <DataTable
                        columns={statementColumns}
                        data={data.entries}
                        emptyTitle="Nothing has been billed yet"
                    />
                </CardContent>
            </Card>
        </div>
    );
}
