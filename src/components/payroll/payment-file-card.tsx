'use client';

import { useQuery, useMutation } from '@tanstack/react-query';
import { Download, Loader2, AlertTriangle, Banknote } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CurrencyDisplay } from '@/components/common/currency-display';
import {
    getPaymentFilePreview,
    downloadPaymentFile,
} from '@/lib/api/payroll';

/**
 * The last step of the payroll cycle: turn an approved run into a file the
 * bank can process.
 *
 * The preview is the point. Whoever pays needs to know *before* downloading
 * that four people have no bank account — discovering it by reading a CSV, or
 * worse from the employee who was not paid, is the failure this guards against.
 */
export function PaymentFileCard({
    payPeriodId,
    payPeriodName,
}: {
    payPeriodId: string;
    payPeriodName: string;
}) {
    const { data: preview, isLoading } = useQuery({
        queryKey: ['payment-file-preview', payPeriodId],
        queryFn: () => getPaymentFilePreview(payPeriodId),
        enabled: !!payPeriodId,
        retry: false,
    });

    const download = useMutation({
        mutationFn: () => downloadPaymentFile(payPeriodId, payPeriodName),
        onSuccess: () => toast.success('Payment file downloaded'),
        onError: (e: Error) => toast.error(e.message),
    });

    if (isLoading || !preview) return null;

    // Nothing approved yet — the card would only confuse before there is a run
    // to pay.
    if (preview.payableCount === 0 && preview.excludedCount === 0) return null;

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <div>
                    <CardTitle className="text-lg">Bank payment file</CardTitle>
                    <p className="text-sm text-muted-foreground">
                        Approved salaries, ready to upload to your bank.
                    </p>
                </div>
                <Button
                    onClick={() => download.mutate()}
                    disabled={download.isPending || preview.payableCount === 0}
                >
                    {download.isPending ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                        <Download className="mr-2 h-4 w-4" />
                    )}
                    Download CSV
                </Button>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="flex items-center gap-6">
                    <div>
                        <p className="text-xs uppercase tracking-wide text-muted-foreground">
                            To be paid
                        </p>
                        <p className="text-2xl font-bold">
                            <CurrencyDisplay amount={preview.totalAmount} />
                        </p>
                        <p className="text-xs text-muted-foreground">
                            {preview.payableCount} employee
                            {preview.payableCount === 1 ? '' : 's'}
                        </p>
                    </div>

                    {preview.excludedCount > 0 && (
                        <div className="border-l pl-6">
                            <p className="text-xs uppercase tracking-wide text-amber-600">
                                Not in the file
                            </p>
                            <p className="text-2xl font-bold text-amber-600">
                                <CurrencyDisplay amount={preview.excludedAmount} />
                            </p>
                            <p className="text-xs text-muted-foreground">
                                {preview.excludedCount} employee
                                {preview.excludedCount === 1 ? '' : 's'}
                            </p>
                        </div>
                    )}
                </div>

                {preview.excludedCount > 0 && (
                    <div className="rounded-md border border-amber-200 bg-amber-50 p-3 dark:border-amber-900 dark:bg-amber-950/30">
                        <div className="flex items-start gap-2">
                            <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0 text-amber-600" />
                            <div className="min-w-0 flex-1">
                                <p className="text-sm font-medium text-amber-900 dark:text-amber-200">
                                    These employees will not be paid by this file
                                </p>
                                <div className="mt-2 space-y-1">
                                    {preview.excluded.map((employee) => (
                                        <div
                                            key={employee.salaryId}
                                            className="flex flex-wrap items-baseline justify-between gap-2 text-sm"
                                        >
                                            <span>
                                                {employee.employeeName}{' '}
                                                <span className="text-muted-foreground">
                                                    ({employee.employeeNumber})
                                                </span>
                                                {' — '}
                                                <span className="text-muted-foreground">
                                                    {employee.reason}
                                                </span>
                                            </span>
                                            <CurrencyDisplay amount={employee.amount} />
                                        </div>
                                    ))}
                                </div>
                                <p className="mt-2 text-xs text-muted-foreground">
                                    Fix the bank details and reload, or pay these
                                    separately.
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                <p className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Banknote className="h-3 w-3" />
                    Downloading does not mark anyone as paid. Confirm the transfer
                    with your bank, then mark the salaries paid here.
                </p>
            </CardContent>
        </Card>
    );
}
