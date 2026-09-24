'use client';

import { useState } from 'react';
import type { ColumnDef } from '@tanstack/react-table';
import { Download, FileDown, FileText, Loader2, Mail, Send } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/common/confirm-dialog';
import { DataTable } from '@/components/common/data-table';
import { StatusBadge } from '@/components/common/status-badge';
import { EmployeeLink } from '@/components/common/entity-link';
import {
    useGenerateBulkPayslips,
    usePayslipsByPayPeriod,
    useSendBulkEmails,
    useSendPayslipEmail,
} from '@/lib/hooks/use-reports';
import { downloadPayPeriodPayslips, downloadPayslip } from '@/lib/api/payslips';
import { statusOptions } from '@/lib/status/registry';
import { getApiErrorMessage, isApiError } from '@/lib/utils/api-error';
import { formatDate } from '@/lib/utils/dates';
import type { Payslip } from '@/lib/types/api';

/**
 * The run's payslips (C4.6; formerly the Payslips page): generate them once
 * salaries are paid, send them, download one or all. Generating and sending
 * are Payroll's; a Viewer reads the list and opens any single payslip.
 */
export function PayslipsPanel({
    payPeriodId,
    payPeriodName,
    canManage,
}: {
    payPeriodId: string;
    payPeriodName: string;
    canManage: boolean;
}) {
    const { data: payslips = [], isLoading, isError } = usePayslipsByPayPeriod(payPeriodId);
    const generate = useGenerateBulkPayslips();
    const sendOne = useSendPayslipEmail();
    const sendAll = useSendBulkEmails();
    const [status, setStatus] = useState<string>();
    const [confirm, setConfirm] = useState<'generate' | 'send' | null>(null);
    const [downloading, setDownloading] = useState(false);

    const shown = payslips.filter((p) => !status || p.status === status);
    const count = (s: string) => payslips.filter((p) => p.status === s).length;

    const columns: ColumnDef<Payslip>[] = [
        {
            id: 'employee',
            header: 'Employee',
            meta: { cardTitle: true },
            cell: ({ row }) => <EmployeeLink id={row.original.employeeId} employee={row.original.employee} />,
        },
        {
            id: 'status',
            header: 'Status',
            cell: ({ row }) => <StatusBadge kind="payslip" status={row.original.status} />,
        },
        {
            id: 'generated',
            header: 'Generated',
            cell: ({ row }) => <span className="text-muted-foreground">{formatDate(row.original.generatedAt)}</span>,
        },
        {
            id: 'sent',
            header: 'Sent',
            cell: ({ row }) => <span className="text-muted-foreground">{formatDate(row.original.sentAt)}</span>,
        },
    ];

    return (
        <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm text-muted-foreground">
                    {payslips.length === 0
                        ? 'None generated yet.'
                        : `${payslips.length} generated · ${count('SENT') + count('VIEWED')} sent · ${count('VIEWED')} opened${
                              count('FAILED') ? ` · ${count('FAILED')} failed` : ''
                          }`}
                </p>
                {canManage && (
                    <div className="flex flex-wrap gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            disabled={downloading || payslips.length === 0}
                            onClick={async () => {
                                setDownloading(true);
                                try {
                                    await downloadPayPeriodPayslips(payPeriodId, payPeriodName);
                                } catch (e) {
                                    toast.error(getApiErrorMessage(e, 'The payslips could not be downloaded.'));
                                } finally {
                                    setDownloading(false);
                                }
                            }}
                        >
                            {downloading ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : (
                                <Download className="mr-2 h-4 w-4" />
                            )}
                            Download all
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            disabled={payslips.length === 0}
                            onClick={() => setConfirm('send')}
                        >
                            <Mail className="mr-2 h-4 w-4" /> Send all
                        </Button>
                        <Button size="sm" onClick={() => setConfirm('generate')}>
                            <FileText className="mr-2 h-4 w-4" /> Generate all
                        </Button>
                    </div>
                )}
            </div>

            <DataTable
                columns={columns}
                data={shown}
                loading={isLoading}
                isError={isError}
                errorSubject="the payslips"
                searchText={(p) =>
                    p.employee ? `${p.employee.firstName} ${p.employee.lastName} ${p.employee.employeeNumber}` : ''
                }
                searchPlaceholder="Name or staff number"
                filters={[{ id: 'status', label: 'statuses', value: status, options: statusOptions('payslip') }]}
                onFilterChange={(_, v) => setStatus(v)}
                rowActions={(p) => (
                    <div className="flex justify-end gap-1">
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            aria-label="Download payslip"
                            onClick={async () => {
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
                            <FileDown className="h-4 w-4" />
                        </Button>
                        {canManage && (
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                aria-label="Email payslip"
                                disabled={sendOne.isPending}
                                onClick={() => sendOne.mutate(p.id)}
                            >
                                <Send className="h-4 w-4" />
                            </Button>
                        )}
                    </div>
                )}
                emptyTitle={status ? 'No payslips match' : 'No payslips yet'}
                emptyDescription={
                    status
                        ? 'Try another status.'
                        : 'Payslips are made from paid salaries. Generate them once this run is paid.'
                }
            />

            <ConfirmDialog
                open={confirm === 'generate'}
                onOpenChange={(o) => !o && setConfirm(null)}
                title="Generate every payslip in this run?"
                description="A PDF payslip for each paid salary. Salaries not yet paid are skipped."
                confirmLabel="Generate"
                loading={generate.isPending}
                onConfirm={() => generate.mutate(payPeriodId, { onSuccess: () => setConfirm(null) })}
            />
            <ConfirmDialog
                open={confirm === 'send'}
                onOpenChange={(o) => !o && setConfirm(null)}
                title="Email every payslip in this run?"
                description="Each person with a generated payslip gets it by email."
                confirmLabel="Send all"
                loading={sendAll.isPending}
                onConfirm={() => sendAll.mutate(payPeriodId, { onSuccess: () => setConfirm(null) })}
            />
        </div>
    );
}
