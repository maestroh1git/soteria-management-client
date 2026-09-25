'use client';

import { useState } from 'react';
import Link from 'next/link';
import type { ColumnDef } from '@tanstack/react-table';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { DataTable } from '@/components/common/data-table';
import { LoadingSkeleton } from '@/components/common/loading-skeleton';
import { EmptyState } from '@/components/common/empty-state';
import { Money } from '@/components/common/money';
import { StatusBadge } from '@/components/common/status-badge';
import { useCan } from '@/lib/hooks/use-can';
import { useCurrentSession } from '@/lib/hooks/use-academics';
import { useConcessions, useStatement, useStudentFeeSubscriptions } from '@/lib/hooks/use-fees';
import { formatDate } from '@/lib/utils/dates';
import type { Statement } from '@/lib/api/fees';
import { RaiseConcessionDialog } from '@/features/fees/concessions/raise-concession-dialog';

type Entry = Statement['entries'][number];

/**
 * One pupil's account: what is owed now, every charge and payment with the
 * running balance, the optional fees they take and any concessions. The same
 * figures the parent's statement shows.
 */
export function FeesTab({
    student,
}: {
    student: { id: string; firstName: string; lastName: string; admissionNumber: string };
}) {
    const can = useCan();
    const canRaise = can('fees.concessions.raise');
    const canSeeConcessions = can('fees.concessions.read');
    const { data: statement, isLoading, isError } = useStatement(student.id);
    const { data: subscriptions = [] } = useStudentFeeSubscriptions({ studentId: student.id });
    const { data: session } = useCurrentSession();
    const { data: concessions = [] } = useConcessions(
        canSeeConcessions ? { studentId: student.id } : undefined,
    );
    const [raising, setRaising] = useState(false);

    if (isLoading) return <LoadingSkeleton rows={4} />;
    if (isError || !statement)
        return <EmptyState isError={isError} subject="this pupil’s account" title="No account yet" />;

    const owed = Number(statement.balance);
    const credit = Number(statement.unallocatedCredit);
    const takes = subscriptions.filter((s) => s.active);
    const mine = canSeeConcessions ? concessions.filter((c) => c.studentId === student.id) : [];

    const columns: ColumnDef<Entry>[] = [
        { id: 'date', header: 'Date', cell: ({ row }) => formatDate(row.original.date) },
        {
            id: 'what',
            header: 'What',
            meta: { cardTitle: true },
            cell: ({ row }) => <span className="font-medium">{row.original.description}</span>,
        },
        {
            id: 'charge',
            header: 'Charged',
            meta: { align: 'right' },
            cell: ({ row }) => (row.original.charge ? <Money value={row.original.charge} /> : null),
        },
        {
            id: 'paid',
            header: 'Paid',
            meta: { align: 'right' },
            cell: ({ row }) => (row.original.payment ? <Money value={row.original.payment} /> : null),
        },
        {
            id: 'balance',
            header: 'Balance',
            meta: { align: 'right' },
            cell: ({ row }) => <Money value={row.original.balance} tone className="font-medium" />,
        },
    ];

    return (
        <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-3">
                <Card>
                    <CardContent className="pt-6">
                        <p className="text-xs text-muted-foreground">Owed now</p>
                        <p className="text-2xl font-bold">
                            <Money value={owed} tone />
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <p className="text-xs text-muted-foreground">Credit not yet applied</p>
                        <p className="text-2xl font-semibold">
                            <Money value={credit} />
                        </p>
                        <p className="mt-1 text-xs text-muted-foreground">
                            Paid, but not yet set against a bill: an early payment or an
                            overpayment. It is the family’s money until it is applied.
                        </p>
                        {credit > 0 && (
                            <Link href="/fees/payments" className="text-xs underline">
                                Apply it on Receipts
                            </Link>
                        )}
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <p className="text-xs text-muted-foreground">Optional fees</p>
                        {takes.length === 0 ? (
                            <p className="text-sm text-muted-foreground">None taken.</p>
                        ) : (
                            <ul className="text-sm">
                                {takes.map((s) => (
                                    <li key={s.id} className="flex justify-between gap-2">
                                        <span>{s.feeName}</span>
                                        {s.amount && <Money value={s.amount} className="text-muted-foreground" />}
                                    </li>
                                ))}
                            </ul>
                        )}
                    </CardContent>
                </Card>
            </div>

            {canSeeConcessions && (
                <Card>
                    <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-2 space-y-0">
                        <div>
                            <CardTitle className="text-lg">Concessions</CardTitle>
                            <CardDescription>Discounts on this pupil’s fees, each approved by someone other than who raised it.</CardDescription>
                        </div>
                        {canRaise && (
                            <Button size="sm" variant="outline" onClick={() => setRaising(true)}>
                                <Plus className="mr-2 h-4 w-4" /> Raise a concession
                            </Button>
                        )}
                    </CardHeader>
                    <CardContent>
                        {mine.length === 0 ? (
                            <p className="text-sm text-muted-foreground">None.</p>
                        ) : (
                            <ul className="divide-y">
                                {mine.map((c) => (
                                    <li key={c.id} className="flex flex-wrap items-center justify-between gap-2 py-2 text-sm">
                                        <span>
                                            {c.kind === 'PERCENTAGE' ? `${Number(c.value)}%` : <Money value={c.value} />} off{' '}
                                            {c.feeName ?? 'the whole bill'}, {c.termName ?? 'every term'}
                                            <span className="block text-xs text-muted-foreground">{c.reason}</span>
                                        </span>
                                        <StatusBadge kind="concession" status={c.status} />
                                    </li>
                                ))}
                            </ul>
                        )}
                    </CardContent>
                </Card>
            )}

            <DataTable
                columns={columns}
                data={statement.entries}
                searchText={(e) => e.description}
                searchPlaceholder="Charge or payment"
                emptyTitle="Nothing charged yet"
                emptyDescription="Invoices and payments appear here as they are made."
            />

            <RaiseConcessionDialog
                open={raising}
                onOpenChange={setRaising}
                sessionId={session?.id}
                student={{
                    id: student.id,
                    name: `${student.firstName} ${student.lastName}`,
                    admissionNumber: student.admissionNumber,
                }}
            />
        </div>
    );
}
