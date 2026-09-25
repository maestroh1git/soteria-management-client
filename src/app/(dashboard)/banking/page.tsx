'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Upload } from 'lucide-react';
import type { ColumnDef } from '@tanstack/react-table';

import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/layout/page-header';
import { DataTable } from '@/components/common/data-table';
import { StatusBadge } from '@/components/common/status-badge';
import { Money } from '@/components/common/money';
import { ImportStatementDialog } from '@/components/banking/import-statement-dialog';
import { useStatements } from '@/lib/hooks/use-banking';
import type { StatementSummary } from '@/lib/api/banking';
import { statusOptions } from '@/lib/status/registry';
import { formatDateRange } from '@/lib/utils/dates';

const columns: ColumnDef<StatementSummary>[] = [
    {
        id: 'period',
        header: 'Period',
        meta: { cardTitle: true },
        cell: ({ row }) => (
            <div>
                <Link
                    href={`/banking/${row.original.id}`}
                    className="font-medium hover:underline underline-offset-2"
                >
                    {formatDateRange(row.original.periodStart, row.original.periodEnd)}
                </Link>
                {row.original.reference && (
                    <div className="text-xs text-muted-foreground">{row.original.reference}</div>
                )}
            </div>
        ),
    },
    {
        id: 'account',
        header: 'Account',
        cell: ({ row }) => <span className="text-muted-foreground">{row.original.accountName}</span>,
    },
    {
        id: 'opening',
        header: 'Opening',
        meta: { align: 'right' },
        cell: ({ row }) => <Money value={row.original.openingBalance} />,
    },
    {
        id: 'closing',
        header: 'Closing',
        meta: { align: 'right' },
        cell: ({ row }) => (
            <span className="font-medium">
                <Money value={row.original.closingBalance} />
            </span>
        ),
    },
    {
        id: 'matched',
        header: 'Matched',
        meta: { align: 'right' },
        cell: ({ row }) => {
            const s = row.original;
            return (
                <span className={s.unmatchedCount > 0 ? 'tabular-nums' : 'tabular-nums text-muted-foreground'}>
                    {s.lineCount - s.unmatchedCount} of {s.lineCount}
                </span>
            );
        },
    },
    {
        id: 'status',
        header: 'Status',
        cell: ({ row }) => <StatusBadge kind="statement" status={row.original.status} />,
    },
];

/**
 * Bank statements, and how far through reconciling each one is.
 */
export default function BankingPage() {
    const { data: statements = [], isLoading, isError } = useStatements();
    const [importOpen, setImportOpen] = useState(false);
    const [status, setStatus] = useState<string>();
    const [account, setAccount] = useState<string>();

    const accounts = [...new Set(statements.map((s) => s.accountName))]
        .sort()
        .map((a) => ({ value: a, label: a }));
    const shown = statements.filter(
        (s) => (!status || s.status === status) && (!account || s.accountName === account),
    );
    const filtered = !!(status || account);

    return (
        <div className="space-y-6">
            <PageHeader
                title="Bank reconciliation"
                description="Check the books against what the bank actually did."
                actions={
                    <Button onClick={() => setImportOpen(true)}>
                        <Upload className="mr-2 h-4 w-4" />
                        Import a statement
                    </Button>
                }
            />

            <DataTable
                columns={columns}
                data={shown}
                loading={isLoading}
                isError={isError}
                errorSubject="the statements"
                rowHref={(s) => `/banking/${s.id}`}
                searchText={(s) => `${s.accountName} ${s.reference ?? ''} ${s.periodStart} ${s.periodEnd}`}
                searchPlaceholder="Search by account or reference…"
                filters={[
                    { id: 'status', label: 'statuses', value: status, options: statusOptions('statement') },
                    ...(accounts.length > 1
                        ? [{ id: 'account', label: 'accounts', value: account, options: accounts }]
                        : []),
                ]}
                onFilterChange={(id, value) => (id === 'status' ? setStatus(value) : setAccount(value))}
                emptyTitle={filtered ? 'No statements match' : 'No statements yet'}
                emptyDescription={
                    filtered
                        ? 'Try another status or account.'
                        : 'Paste a month of bank lines and the system will tell you where the books and the bank disagree.'
                }
                emptyAction={filtered ? undefined : { label: 'Import a statement', onClick: () => setImportOpen(true) }}
            />

            <ImportStatementDialog open={importOpen} onOpenChange={setImportOpen} />
        </div>
    );
}
