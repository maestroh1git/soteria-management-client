'use client';

import Link from 'next/link';
import { Download } from 'lucide-react';
import type { ColumnDef } from '@tanstack/react-table';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { DataTable } from '@/components/common/data-table';
import { Money } from '@/components/common/money';
import { StatusBadge } from '@/components/common/status-badge';
import { useChildInvoices } from '@/lib/hooks/use-portal';
import { publicInvoicePdfUrl } from '@/lib/hooks/use-public';
import type { PortalInvoice } from '@/lib/api/portal';
import { formatDate } from '@/lib/utils/dates';

const columns: ColumnDef<PortalInvoice>[] = [
    {
        id: 'bill',
        header: 'Bill',
        meta: { cardTitle: true },
        cell: ({ row }) => (
            <div>
                <Link
                    href={`/invoice/${row.original.accessToken}`}
                    className="font-medium hover:underline underline-offset-2"
                >
                    {row.original.termName ?? 'Invoice'}
                </Link>
                {row.original.invoiceNumber && (
                    <span className="block text-xs text-muted-foreground">
                        Invoice {row.original.invoiceNumber}
                    </span>
                )}
            </div>
        ),
    },
    {
        id: 'due',
        header: 'Due',
        cell: ({ row }) => (
            <span className="text-muted-foreground">
                {row.original.dueDate ? formatDate(row.original.dueDate) : '—'}
            </span>
        ),
    },
    {
        id: 'total',
        header: 'Total',
        meta: { align: 'right' },
        cell: ({ row }) => <Money value={row.original.total} />,
    },
    {
        id: 'outstanding',
        header: 'Still to pay',
        meta: { align: 'right' },
        cell: ({ row }) =>
            Number(row.original.outstanding) > 0 ? (
                <span className="font-medium">
                    <Money value={row.original.outstanding} />
                </span>
            ) : (
                <StatusBadge kind="balance" status="SETTLED" />
            ),
    },
];

/**
 * A child's bills in the parent portal (ROADMAP-EXECUTION.md, 5.12): each
 * issued invoice, what is still owed on it, and its PDF. Each opens the same
 * page the school's own message links to, so there is one way to read a bill.
 */
export function ChildInvoices({ studentId }: { studentId: string }) {
    const { data: invoices = [], isLoading, isError } = useChildInvoices(studentId);

    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-lg">Bills</CardTitle>
                <CardDescription>Every bill the school has sent, newest first. Open one to see what it covers.</CardDescription>
            </CardHeader>
            <CardContent>
                <DataTable
                    columns={columns}
                    data={invoices}
                    loading={isLoading}
                    isError={isError}
                    errorSubject="the bills"
                    rowActions={(inv) => (
                        <a
                            href={publicInvoicePdfUrl(inv.accessToken)}
                            className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-sm hover:bg-muted"
                            aria-label={`Download ${inv.termName ?? 'the'} bill as a PDF`}
                        >
                            <Download className="h-4 w-4" aria-hidden />
                            PDF
                        </a>
                    )}
                    emptyTitle="No bills yet"
                    emptyDescription="Bills appear here once the school sends them."
                />
            </CardContent>
        </Card>
    );
}
