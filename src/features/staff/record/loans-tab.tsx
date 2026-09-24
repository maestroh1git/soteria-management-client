'use client';

import { useState } from 'react';
import Link from 'next/link';
import type { ColumnDef } from '@tanstack/react-table';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/common/data-table';
import { Money } from '@/components/common/money';
import { StatusBadge } from '@/components/common/status-badge';
import { useEmployeeLoans } from '@/lib/hooks/use-loans';
import { statusOptions } from '@/lib/status/registry';
import { formatDate } from '@/lib/utils/dates';
import { LoanType } from '@/lib/types/enums';
import type { Loan } from '@/lib/types/api';

/** This person's loans and advances: what is owed and what is waiting. */
export function LoansTab({ employeeId, canCreate }: { employeeId: string; canCreate: boolean }) {
    const { data: loans = [], isLoading, isError } = useEmployeeLoans(employeeId);
    const [status, setStatus] = useState<string>();
    const shown = loans.filter((l) => !status || l.status === status);
    const owed = loans
        .filter((l) => l.status === 'ACTIVE')
        .reduce((sum, l) => sum + Number(l.outstandingBalance), 0);

    const columns: ColumnDef<Loan>[] = [
        {
            id: 'loan',
            header: 'Loan',
            meta: { cardTitle: true },
            cell: ({ row }) => {
                const l = row.original;
                return (
                    <span>
                        <Link href={`/loans/${l.id}`} className="font-medium hover:underline">
                            {l.loanType === LoanType.SALARY_ADVANCE
                                ? 'Salary advance'
                                : `Loan over ${l.termMonths} months`}
                        </Link>
                        <span className="block text-xs text-muted-foreground">
                            Asked {formatDate(l.applicationDate)}
                            {l.reason ? ` · ${l.reason}` : ''}
                        </span>
                    </span>
                );
            },
        },
        {
            id: 'amount',
            header: 'Amount',
            meta: { align: 'right' },
            cell: ({ row }) => <Money value={row.original.amount} />,
        },
        {
            id: 'monthly',
            header: 'Each month',
            meta: { align: 'right' },
            cell: ({ row }) => <Money value={row.original.monthlyRepayment} />,
        },
        {
            id: 'outstanding',
            header: 'Still owed',
            meta: { align: 'right' },
            cell: ({ row }) => <Money value={row.original.outstandingBalance} className="font-medium" />,
        },
        {
            id: 'status',
            header: 'Status',
            cell: ({ row }) => <StatusBadge kind="loan" status={row.original.status} />,
        },
    ];

    return (
        <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm text-muted-foreground">
                    {owed > 0 ? (
                        <>
                            Still owed on active loans: <Money value={owed} className="font-medium text-foreground" />
                        </>
                    ) : (
                        'Nothing owed on active loans.'
                    )}
                </p>
                {canCreate && (
                    <Button asChild size="sm">
                        <Link href={`/loans?new=${employeeId}`}>
                            <Plus className="mr-2 h-4 w-4" /> New loan or advance
                        </Link>
                    </Button>
                )}
            </div>
            <DataTable
                columns={columns}
                data={shown}
                loading={isLoading}
                isError={isError}
                errorSubject="the loans"
                filters={[{ id: 'status', label: 'statuses', value: status, options: statusOptions('loan') }]}
                onFilterChange={(_, v) => setStatus(v)}
                rowHref={(l) => `/loans/${l.id}`}
                emptyTitle={status ? 'No loans match' : 'No loans or advances'}
                emptyDescription={status ? 'Try another status.' : 'None have been asked for.'}
            />
        </div>
    );
}
