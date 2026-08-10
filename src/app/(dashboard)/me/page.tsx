'use client';

import { Download, Loader2, AlertCircle } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CurrencyDisplay } from '@/components/common/currency-display';
import { LoadingSkeleton } from '@/components/common/loading-skeleton';
import {
    useMyEmployee,
    useMyPayslips,
    useMyYtd,
    useMyLoans,
    useDownloadMyPayslip,
} from '@/lib/hooks/use-self-service';
import type { ApiError } from '@/lib/types/api';

function errorMessage(error: unknown): string {
    const message = (error as ApiError)?.message;
    return Array.isArray(message) ? message.join(', ') : (message ?? 'Something went wrong');
}

export default function MyPayPage() {
    const employeeQuery = useMyEmployee();
    const { data: payslips = [], isLoading: payslipsLoading } = useMyPayslips();
    const { data: ytd } = useMyYtd();
    const { data: loans = [] } = useMyLoans();
    const download = useDownloadMyPayslip();

    if (employeeQuery.isLoading) return <LoadingSkeleton variant="table" />;

    // The expected failure: an account not linked to an employee record — a
    // tenant owner, typically. The API explains it; showing that explanation
    // beats an empty page that reads as data loss.
    if (employeeQuery.isError) {
        return (
            <Card className="max-w-2xl">
                <CardContent className="flex gap-3 py-8">
                    <AlertCircle className="h-5 w-5 flex-shrink-0 text-amber-600" />
                    <div>
                        <p className="font-medium">No personal payroll record</p>
                        <p className="mt-1 text-sm text-muted-foreground">
                            {errorMessage(employeeQuery.error)}
                        </p>
                    </div>
                </CardContent>
            </Card>
        );
    }

    const me = employeeQuery.data!;
    const activeLoans = loans.filter((l) => l.status === 'ACTIVE');

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">My Pay</h1>
                <p className="text-muted-foreground">
                    {me.firstName} {me.lastName} · {me.employeeNumber}
                    {me.grade ? ` · ${me.grade.code}` : ''}
                    {me.role ? ` · ${me.role}` : ''}
                </p>
            </div>

            {/* Year to date leads: it is the figure an employee most often needs
                and could never previously see. */}
            {ytd && ytd.periodsIncluded > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg">
                            Year to date ({ytd.year})
                        </CardTitle>
                        <p className="text-sm text-muted-foreground">
                            Across {ytd.periodsIncluded} pay period
                            {ytd.periodsIncluded === 1 ? '' : 's'}.
                        </p>
                    </CardHeader>
                    <CardContent>
                        <div className="grid gap-4 sm:grid-cols-3">
                            <Figure label="Gross pay" value={ytd.grossSalary} />
                            <Figure label="Deductions" value={ytd.totalDeductions} />
                            <Figure label="Net paid" value={ytd.netSalary} emphasis />
                        </div>

                        {Object.keys(ytd.deductionsByComponent).length > 0 && (
                            <div className="mt-6 border-t pt-4">
                                <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                                    Deductions this year
                                </p>
                                <div className="space-y-1">
                                    {Object.entries(ytd.deductionsByComponent).map(
                                        ([name, amount]) => (
                                            <div
                                                key={name}
                                                className="flex justify-between text-sm"
                                            >
                                                <span className="text-muted-foreground">
                                                    {name}
                                                </span>
                                                <CurrencyDisplay amount={amount} />
                                            </div>
                                        ),
                                    )}
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>
            )}

            {activeLoans.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg">Outstanding loans</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        {activeLoans.map((loan) => (
                            <div
                                key={loan.id}
                                className="flex items-center justify-between border-b pb-3 last:border-0 last:pb-0"
                            >
                                <div>
                                    <p className="text-sm font-medium">{loan.loanType}</p>
                                    <p className="text-xs text-muted-foreground">
                                        {loan.monthlyRepayment != null && (
                                            <>
                                                <CurrencyDisplay
                                                    amount={loan.monthlyRepayment}
                                                />{' '}
                                                deducted monthly
                                            </>
                                        )}
                                    </p>
                                </div>
                                <div className="text-right">
                                    <CurrencyDisplay amount={loan.outstandingBalance} />
                                    <p className="text-xs text-muted-foreground">
                                        outstanding
                                    </p>
                                </div>
                            </div>
                        ))}
                    </CardContent>
                </Card>
            )}

            <Card>
                <CardHeader>
                    <CardTitle className="text-lg">Payslips</CardTitle>
                </CardHeader>
                <CardContent>
                    {payslipsLoading ? (
                        <p className="py-6 text-center text-sm text-muted-foreground">
                            Loading…
                        </p>
                    ) : payslips.length === 0 ? (
                        <p className="py-6 text-center text-sm text-muted-foreground">
                            No payslips yet. They appear here once payroll has run.
                        </p>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b bg-muted/50">
                                        <th className="px-3 py-2 text-left font-medium">
                                            Period
                                        </th>
                                        <th className="px-3 py-2 text-left font-medium">
                                            Reference
                                        </th>
                                        <th className="px-3 py-2 text-right font-medium">
                                            Net pay
                                        </th>
                                        <th className="px-3 py-2 text-right font-medium">
                                            {' '}
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {payslips.map((payslip) => (
                                        <tr key={payslip.id} className="border-b">
                                            <td className="px-3 py-2">
                                                {payslip.payPeriod ?? '—'}
                                            </td>
                                            <td className="px-3 py-2 font-mono text-xs text-muted-foreground">
                                                {payslip.reference ?? '—'}
                                            </td>
                                            <td className="px-3 py-2 text-right">
                                                {payslip.netSalary != null ? (
                                                    <CurrencyDisplay
                                                        amount={payslip.netSalary}
                                                    />
                                                ) : (
                                                    '—'
                                                )}
                                            </td>
                                            <td className="px-3 py-2 text-right">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    disabled={download.isPending}
                                                    onClick={() =>
                                                        download.mutate({
                                                            id: payslip.id,
                                                            fileName: payslip.fileName,
                                                        })
                                                    }
                                                >
                                                    {download.isPending ? (
                                                        <Loader2 className="h-4 w-4 animate-spin" />
                                                    ) : (
                                                        <Download className="h-4 w-4" />
                                                    )}
                                                </Button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}

function Figure({
    label,
    value,
    emphasis,
}: {
    label: string;
    value: number;
    emphasis?: boolean;
}) {
    return (
        <div>
            <p className="text-xs uppercase tracking-wide text-muted-foreground">
                {label}
            </p>
            <p
                className={
                    emphasis ? 'text-2xl font-bold' : 'text-2xl font-semibold'
                }
            >
                <CurrencyDisplay amount={value} />
            </p>
        </div>
    );
}
