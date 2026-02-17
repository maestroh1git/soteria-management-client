'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
    Plus,
    ChevronRight,
    Banknote,
    Clock,
    CheckCircle2,
    XCircle,
    AlertTriangle,
    CreditCard,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    DialogDescription,
} from '@/components/ui/dialog';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LoadingSkeleton } from '@/components/common/loading-skeleton';
import { EmptyState } from '@/components/common/empty-state';
import { CurrencyDisplay } from '@/components/common/currency-display';
import { useLoans, useApplyForLoan, useApplyForAdvance } from '@/lib/hooks/use-loans';
import {
    createLoanSchema,
    createAdvanceSchema,
    type CreateLoanValues,
    type CreateAdvanceValues,
} from '@/lib/utils/validation';
import type { LoanFilters } from '@/lib/types/api';
import { LoanStatus, LoanType } from '@/lib/types/enums';

const STATUS_CONFIG: Record<LoanStatus, { label: string; variant: 'default' | 'secondary' | 'outline' | 'destructive' }> = {
    [LoanStatus.PENDING]: { label: 'Pending', variant: 'secondary' },
    [LoanStatus.APPROVED]: { label: 'Approved', variant: 'default' },
    [LoanStatus.REJECTED]: { label: 'Rejected', variant: 'destructive' },
    [LoanStatus.ACTIVE]: { label: 'Active', variant: 'default' },
    [LoanStatus.FULLY_PAID]: { label: 'Fully Paid', variant: 'outline' },
    [LoanStatus.DEFAULTED]: { label: 'Defaulted', variant: 'destructive' },
    [LoanStatus.CANCELLED]: { label: 'Cancelled', variant: 'outline' },
};

export default function LoansPage() {
    const router = useRouter();
    const [filters, setFilters] = useState<LoanFilters>({});
    const [showLoanForm, setShowLoanForm] = useState(false);
    const [showAdvanceForm, setShowAdvanceForm] = useState(false);

    const { data: loans, isLoading } = useLoans(filters);
    const applyLoanMutation = useApplyForLoan();
    const applyAdvanceMutation = useApplyForAdvance();

    const loanForm = useForm<CreateLoanValues>({
        resolver: zodResolver(createLoanSchema),
        defaultValues: { employeeId: '', amount: 0, interestRate: 0, termMonths: 12, reason: '' },
    });

    const advanceForm = useForm<CreateAdvanceValues>({
        resolver: zodResolver(createAdvanceSchema),
        defaultValues: { employeeId: '', amount: 0, reason: '' },
    });

    const onSubmitLoan = (values: CreateLoanValues) => {
        applyLoanMutation.mutate(values, {
            onSuccess: () => { setShowLoanForm(false); loanForm.reset(); },
        });
    };

    const onSubmitAdvance = (values: CreateAdvanceValues) => {
        applyAdvanceMutation.mutate(values, {
            onSuccess: () => { setShowAdvanceForm(false); advanceForm.reset(); },
        });
    };

    const formatDate = (d: string) =>
        new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

    const formatCurrency = (v: number) =>
        new Intl.NumberFormat('en-US', { style: 'currency', currency: 'NGN' }).format(v);

    // Summary stats
    const allLoans = loans ?? [];
    const activeLoans = allLoans.filter((l) => l.status === LoanStatus.ACTIVE);
    const pendingLoans = allLoans.filter((l) => l.status === LoanStatus.PENDING);
    const totalOutstanding = activeLoans.reduce((s, l) => s + Number(l.outstandingBalance), 0);
    const totalDisbursed = allLoans
        .filter((l) => [LoanStatus.ACTIVE, LoanStatus.FULLY_PAID].includes(l.status))
        .reduce((s, l) => s + Number(l.amount), 0);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Loans & Advances</h1>
                    <p className="text-muted-foreground">Manage employee loans and salary advances</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={() => setShowAdvanceForm(true)}>
                        <CreditCard className="mr-2 h-4 w-4" />
                        Salary Advance
                    </Button>
                    <Button onClick={() => setShowLoanForm(true)}>
                        <Plus className="mr-2 h-4 w-4" />
                        New Loan
                    </Button>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid gap-4 md:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Active Loans</CardTitle>
                        <Banknote className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent><p className="text-2xl font-bold">{activeLoans.length}</p></CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Pending</CardTitle>
                        <Clock className="h-4 w-4 text-amber-500" />
                    </CardHeader>
                    <CardContent><p className="text-2xl font-bold">{pendingLoans.length}</p></CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Total Disbursed</CardTitle>
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                    </CardHeader>
                    <CardContent><p className="text-2xl font-bold">{formatCurrency(totalDisbursed)}</p></CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Outstanding</CardTitle>
                        <AlertTriangle className="h-4 w-4 text-red-500" />
                    </CardHeader>
                    <CardContent><p className="text-2xl font-bold">{formatCurrency(totalOutstanding)}</p></CardContent>
                </Card>
            </div>

            {/* Filters */}
            <div className="flex gap-3">
                <Select
                    value={filters.status ?? 'all'}
                    onValueChange={(v) =>
                        setFilters((p) => ({ ...p, status: v === 'all' ? undefined : (v as LoanStatus) }))
                    }
                >
                    <SelectTrigger className="w-[160px]">
                        <SelectValue placeholder="All statuses" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All statuses</SelectItem>
                        {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
                            <SelectItem key={key} value={key}>{cfg.label}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>

                <Select
                    value={filters.loanType ?? 'all'}
                    onValueChange={(v) =>
                        setFilters((p) => ({ ...p, loanType: v === 'all' ? undefined : (v as LoanType) }))
                    }
                >
                    <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="All types" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All types</SelectItem>
                        <SelectItem value={LoanType.STANDARD_LOAN}>Standard Loan</SelectItem>
                        <SelectItem value={LoanType.SALARY_ADVANCE}>Salary Advance</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {/* Table */}
            {isLoading ? (
                <LoadingSkeleton rows={5} />
            ) : !allLoans.length ? (
                <EmptyState
                    title="No loans"
                    description="Create a loan or salary advance to get started."
                    actionLabel="New Loan"
                    onAction={() => setShowLoanForm(true)}
                />
            ) : (
                <div className="rounded-lg border bg-card">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b bg-muted/50">
                                <th className="px-4 py-3 text-left font-medium">Employee</th>
                                <th className="px-4 py-3 text-left font-medium">Type</th>
                                <th className="px-4 py-3 text-right font-medium">Amount</th>
                                <th className="px-4 py-3 text-right font-medium">Outstanding</th>
                                <th className="px-4 py-3 text-right font-medium">Monthly</th>
                                <th className="px-4 py-3 text-left font-medium">Status</th>
                                <th className="px-4 py-3 text-left font-medium">Applied</th>
                                <th className="px-4 py-3 text-right font-medium" />
                            </tr>
                        </thead>
                        <tbody>
                            {allLoans.map((loan) => {
                                const cfg = STATUS_CONFIG[loan.status];
                                return (
                                    <tr
                                        key={loan.id}
                                        className="cursor-pointer border-b transition-colors hover:bg-muted/50"
                                        onClick={() => router.push(`/loans/${loan.id}`)}
                                    >
                                        <td className="px-4 py-3 font-medium">
                                            {loan.employee
                                                ? `${loan.employee.firstName} ${loan.employee.lastName}`
                                                : loan.employeeId.substring(0, 8)}
                                        </td>
                                        <td className="px-4 py-3">
                                            <Badge variant="outline">
                                                {loan.loanType === LoanType.SALARY_ADVANCE ? 'Advance' : 'Loan'}
                                            </Badge>
                                        </td>
                                        <td className="px-4 py-3 text-right">
                                            <CurrencyDisplay amount={Number(loan.amount)} />
                                        </td>
                                        <td className="px-4 py-3 text-right">
                                            <CurrencyDisplay amount={Number(loan.outstandingBalance)} />
                                        </td>
                                        <td className="px-4 py-3 text-right">
                                            <CurrencyDisplay amount={Number(loan.monthlyRepayment)} />
                                        </td>
                                        <td className="px-4 py-3">
                                            <Badge variant={cfg.variant}>{cfg.label}</Badge>
                                        </td>
                                        <td className="px-4 py-3 text-muted-foreground">
                                            {formatDate(loan.applicationDate)}
                                        </td>
                                        <td className="px-4 py-3 text-right">
                                            <ChevronRight className="ml-auto h-4 w-4 text-muted-foreground" />
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}

            {/* ─── New Loan Dialog ─────────────────────────────────── */}
            <Dialog open={showLoanForm} onOpenChange={setShowLoanForm}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Apply for Loan</DialogTitle>
                        <DialogDescription>Submit a new loan application for an employee.</DialogDescription>
                    </DialogHeader>
                    <form onSubmit={loanForm.handleSubmit(onSubmitLoan)} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="loan-employeeId">Employee ID</Label>
                            <Input id="loan-employeeId" placeholder="Employee UUID" {...loanForm.register('employeeId')} />
                            {loanForm.formState.errors.employeeId && (
                                <p className="text-xs text-destructive">{loanForm.formState.errors.employeeId.message}</p>
                            )}
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="loan-amount">Amount</Label>
                                <Input id="loan-amount" type="number" step="0.01" {...loanForm.register('amount', { valueAsNumber: true })} />
                                {loanForm.formState.errors.amount && (
                                    <p className="text-xs text-destructive">{loanForm.formState.errors.amount.message}</p>
                                )}
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="loan-interestRate">Interest Rate (%)</Label>
                                <Input id="loan-interestRate" type="number" step="0.01" {...loanForm.register('interestRate', { valueAsNumber: true })} />
                                {loanForm.formState.errors.interestRate && (
                                    <p className="text-xs text-destructive">{loanForm.formState.errors.interestRate.message}</p>
                                )}
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="loan-termMonths">Term (months)</Label>
                            <Input id="loan-termMonths" type="number" {...loanForm.register('termMonths', { valueAsNumber: true })} />
                            {loanForm.formState.errors.termMonths && (
                                <p className="text-xs text-destructive">{loanForm.formState.errors.termMonths.message}</p>
                            )}
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="loan-reason">Reason (optional)</Label>
                            <Textarea id="loan-reason" {...loanForm.register('reason')} placeholder="Reason for loan…" />
                        </div>
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setShowLoanForm(false)}>Cancel</Button>
                            <Button type="submit" disabled={applyLoanMutation.isPending}>
                                {applyLoanMutation.isPending ? 'Submitting…' : 'Submit Application'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* ─── Salary Advance Dialog ───────────────────────────── */}
            <Dialog open={showAdvanceForm} onOpenChange={setShowAdvanceForm}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Request Salary Advance</DialogTitle>
                        <DialogDescription>Submit a salary advance request.</DialogDescription>
                    </DialogHeader>
                    <form onSubmit={advanceForm.handleSubmit(onSubmitAdvance)} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="adv-employeeId">Employee ID</Label>
                            <Input id="adv-employeeId" placeholder="Employee UUID" {...advanceForm.register('employeeId')} />
                            {advanceForm.formState.errors.employeeId && (
                                <p className="text-xs text-destructive">{advanceForm.formState.errors.employeeId.message}</p>
                            )}
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="adv-amount">Amount</Label>
                            <Input id="adv-amount" type="number" step="0.01" {...advanceForm.register('amount', { valueAsNumber: true })} />
                            {advanceForm.formState.errors.amount && (
                                <p className="text-xs text-destructive">{advanceForm.formState.errors.amount.message}</p>
                            )}
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="adv-reason">Reason (optional)</Label>
                            <Textarea id="adv-reason" {...advanceForm.register('reason')} placeholder="Reason for advance…" />
                        </div>
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setShowAdvanceForm(false)}>Cancel</Button>
                            <Button type="submit" disabled={applyAdvanceMutation.isPending}>
                                {applyAdvanceMutation.isPending ? 'Submitting…' : 'Submit Request'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}
