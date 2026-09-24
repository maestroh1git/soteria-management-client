'use client';

import { useState } from 'react';
import { Download, Loader2, AlertCircle, Plus } from 'lucide-react';

import { Button } from '@/components/ui/button';
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
import { LoanType } from '@/lib/types/enums';
import { StatusBadge } from '@/components/common/status-badge';
import { formatDate } from '@/lib/utils/dates';
import { RequestLoanDialog } from '@/features/me/request-loan-dialog';

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
    const [asking, setAsking] = useState(false);

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
                        {/* A heading, not a bold paragraph: this branch replaces
                            the whole page, so without it the page has no h1 at
                            all and nothing to navigate to by heading. */}
                        <h1 className="font-medium">No personal payroll record</h1>
                        <p className="mt-1 text-sm text-muted-foreground">
                            {errorMessage(employeeQuery.error)}
                        </p>
                    </div>
                </CardContent>
            </Card>
        );
    }

    const me = employeeQuery.data!;
    // Owed, or on its way to being owed.
    const currentLoans = loans.filter((l) => ['PENDING', 'APPROVED', 'ACTIVE'].includes(l.status));

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

            {/* Loans and advances: what is owed, what is waiting, and the
                way to ask (roadmap 5.6). */}
            <Card>
                <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-2 space-y-0">
                    <CardTitle className="text-lg">Loans and advances</CardTitle>
                    <Button size="sm" variant="outline" onClick={() => setAsking(true)}>
                        <Plus className="mr-2 h-4 w-4" /> Ask for a loan or advance
                    </Button>
                </CardHeader>
                <CardContent className="space-y-3">
                    {currentLoans.length === 0 ? (
                        <p className="text-sm text-muted-foreground">
                            Nothing owed and nothing waiting.
                        </p>
                    ) : (
                        currentLoans.map((loan) => (
                            <div
                                key={loan.id}
                                className="flex items-center justify-between gap-3 border-b pb-3 last:border-0 last:pb-0"
                            >
                                <div>
                                    <p className="flex flex-wrap items-center gap-2 text-sm font-medium">
                                        {loan.loanType === LoanType.SALARY_ADVANCE
                                            ? 'Salary advance'
                                            : `Loan over ${loan.termMonths} months`}
                                        <StatusBadge kind="loan" status={loan.status} />
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                        {loan.status === 'PENDING' ? (
                                            <>Asked {formatDate(loan.applicationDate)}</>
                                        ) : (
                                            loan.monthlyRepayment != null && (
                                                <>
                                                    <CurrencyDisplay amount={loan.monthlyRepayment} />{' '}
                                                    deducted monthly
                                                </>
                                            )
                                        )}
                                    </p>
                                </div>
                                <div className="text-right">
                                    <CurrencyDisplay
                                        amount={loan.status === 'PENDING' ? loan.amount : loan.outstandingBalance}
                                    />
                                    <p className="text-xs text-muted-foreground">
                                        {loan.status === 'PENDING' ? 'asked for' : 'outstanding'}
                                    </p>
                                </div>
                            </div>
                        ))
                    )}
                </CardContent>
            </Card>
            <RequestLoanDialog open={asking} onOpenChange={setAsking} />

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
