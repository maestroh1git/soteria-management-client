'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Trash2 } from 'lucide-react';
import type { ColumnDef } from '@tanstack/react-table';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/layout/page-header';
import { DataTable } from '@/components/common/data-table';
import { ConfirmDialog } from '@/components/common/confirm-dialog';
import { StatusBadge } from '@/components/common/status-badge';
import { usePurgeRetention, useRetentionDue } from '@/lib/hooks/use-admissions';
import type { AdmissionApplication } from '@/lib/api/admissions';
import { formatDate } from '@/lib/utils/dates';
import { listName } from '@/lib/utils/names';

const columns: ColumnDef<AdmissionApplication>[] = [
    {
        id: 'number',
        header: 'No.',
        cell: ({ row }) => <span className="text-muted-foreground">{row.original.applicationNumber}</span>,
    },
    {
        id: 'child',
        header: 'Child',
        meta: { cardTitle: true },
        cell: ({ row }) => (
            <Link href={`/admissions/${row.original.id}`} className="font-medium hover:underline underline-offset-2">
                {listName(row.original)}
            </Link>
        ),
    },
    {
        id: 'status',
        header: 'Outcome',
        cell: ({ row }) => <StatusBadge kind="application" status={row.original.status} />,
    },
    {
        id: 'applied',
        header: 'Applied',
        cell: ({ row }) => <span className="text-muted-foreground">{formatDate(row.original.createdAt)}</span>,
    },
    {
        id: 'keepUntil',
        header: 'Kept until',
        cell: ({ row }) => formatDate(row.original.retentionExpiresAt),
    },
];

/**
 * Unsuccessful applications past the date the school keeps them to
 * (ROADMAP-EXECUTION.md, 5.10). Nothing is deleted on a timer: the office sees
 * exactly what would go, and deletes it when somebody decides to.
 */
export function RetentionScreen() {
    const { data: due = [], isLoading, isError } = useRetentionDue();
    const purge = usePurgeRetention();
    const [confirm, setConfirm] = useState(false);
    const n = due.length;

    return (
        <div className="space-y-6">
            <PageHeader
                crumbs={[{ label: 'Past their retention date' }]}
                title="Applications to delete"
                description="Unsuccessful applications the school no longer has a reason to keep. They are only deleted when you say so."
                actions={
                    <Button variant="destructive" disabled={n === 0 || purge.isPending} onClick={() => setConfirm(true)}>
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete {n === 0 ? '' : `${n} `}
                        {n === 1 ? 'application' : 'applications'}
                    </Button>
                }
            />

            <DataTable
                columns={columns}
                data={due}
                loading={isLoading}
                isError={isError}
                errorSubject="the applications due for deletion"
                rowHref={(a) => `/admissions/${a.id}`}
                emptyTitle="Nothing is due for deletion"
                emptyDescription="Unsuccessful applications appear here once they pass the date the school keeps them to."
            />

            <ConfirmDialog
                open={confirm}
                onOpenChange={setConfirm}
                title={`Delete ${n} ${n === 1 ? 'application' : 'applications'} for good?`}
                description="The children's details, the guardians' details and the decision are erased and cannot be recovered. Anything that became a pupil is never deleted."
                confirmLabel="Delete for good"
                variant="destructive"
                loading={purge.isPending}
                onConfirm={async () => {
                    await purge.mutateAsync();
                    setConfirm(false);
                }}
            />
        </div>
    );
}
