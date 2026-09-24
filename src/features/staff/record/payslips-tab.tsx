'use client';

import { useState } from 'react';
import type { ColumnDef } from '@tanstack/react-table';
import { Download } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/common/data-table';
import { Money } from '@/components/common/money';
import { StatusBadge } from '@/components/common/status-badge';
import { usePayslipsByEmployee } from '@/lib/hooks/use-reports';
import { downloadPayslip } from '@/lib/api/payslips';
import { getApiErrorMessage, isApiError } from '@/lib/utils/api-error';
import { formatDate } from '@/lib/utils/dates';
import { statusOptions } from '@/lib/status/registry';
import type { Payslip } from '@/lib/types/api';

/** Every payslip this person has had, newest first. */
export function PayslipsTab({ employeeId }: { employeeId: string }) {
    const { data: payslips = [], isLoading, isError } = usePayslipsByEmployee(employeeId);
    const [status, setStatus] = useState<string>();
    const shown = payslips.filter((p) => !status || p.status === status);

    const columns: ColumnDef<Payslip>[] = [
        {
            id: 'period',
            header: 'Pay run',
            meta: { cardTitle: true },
            cell: ({ row }) => {
                const period = row.original.salary?.payPeriod;
                return (
                    <span>
                        <span className="font-medium">{period?.name ?? '—'}</span>
                        {period && (
                            <span className="block text-xs text-muted-foreground">
                                Paid {formatDate(period.paymentDate)}
                            </span>
                        )}
                    </span>
                );
            },
        },
        {
            id: 'gross',
            header: 'Gross',
            meta: { align: 'right' },
            cell: ({ row }) => <Money value={row.original.salary?.grossSalary} />,
        },
        {
            id: 'net',
            header: 'Take-home',
            meta: { align: 'right' },
            cell: ({ row }) => <Money value={row.original.salary?.netSalary} className="font-medium" />,
        },
        {
            id: 'status',
            header: 'Status',
            cell: ({ row }) => <StatusBadge kind="payslip" status={row.original.status} />,
        },
    ];

    return (
        <DataTable
            columns={columns}
            data={shown}
            loading={isLoading}
            isError={isError}
            errorSubject="the payslips"
            searchText={(p) => p.salary?.payPeriod?.name ?? ''}
            searchPlaceholder="Search pay runs…"
            filters={[{ id: 'status', label: 'statuses', value: status, options: statusOptions('payslip') }]}
            onFilterChange={(_, v) => setStatus(v)}
            rowHref={(p) => (p.salary ? `/payroll/${p.salary.payPeriodId}` : '')}
            rowActions={(p) => (
                <Button
                    variant="ghost"
                    size="sm"
                    aria-label={`Download the payslip for ${p.salary?.payPeriod?.name ?? 'this pay run'}`}
                    onClick={async (e) => {
                        e.stopPropagation();
                        try {
                            await downloadPayslip(p.accessToken, p.fileName ?? undefined);
                        } catch (err) {
                            toast.error(
                                isApiError(err) && err.statusCode === 410
                                    ? 'This download link has expired. Re-send the payslip to make a fresh one.'
                                    : getApiErrorMessage(err, 'The payslip could not be downloaded.'),
                            );
                        }
                    }}
                >
                    <Download className="h-4 w-4" />
                </Button>
            )}
            emptyTitle="No payslips yet"
            emptyDescription="Payslips appear here once a pay run including this person has been approved and its payslips generated."
        />
    );
}
