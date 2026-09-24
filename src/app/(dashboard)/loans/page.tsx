'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
    Plus,
    ChevronRight,
    Banknote,
    Clock,
    CheckCircle2,
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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useEmployees } from '@/lib/hooks/use-employees';
import { useCan } from '@/lib/hooks/use-can';
import { useLoans, useApplyForLoan, useApplyForAdvance } from '@/lib/hooks/use-loans';
import {
    createLoanSchema,
    createAdvanceSchema,
    type CreateLoanValues,
    type CreateAdvanceValues,
} from '@/lib/utils/validation';
import type { Loan, LoanFilters } from '@/lib/types/api';
import { LoanStatus, LoanType } from '@/lib/types/enums';
import { formatDate } from '@/lib/utils/dates';
import { formatMoney } from '@/lib/utils/money';
import { StatusBadge } from '@/components/common/status-badge';
import { statusOptions } from '@/lib/status/registry';
import { EmployeeLink } from '@/components/common/entity-link';
import { Money } from '@/components/common/money';
import { DataTable } from '@/components/common/data-table';
import type { ColumnDef } from '@tanstack/react-table';
import Link from 'next/link';
import { PageHeader } from '@/components/layout/page-header';

export default function LoansPage() {
    const [filters, setFilters] = useState<LoanFilters>({});
    const [showLoanForm, setShowLoanForm] = useState(false);
    const [showAdvanceForm, setShowAdvanceForm] = useState(false);

    const { data: loans, isLoading, isError } = useLoans(filters);
    const applyLoanMutation = useApplyForLoan();
    const applyAdvanceMutation = useApplyForAdvance();

    // Staff are chosen by name here, as everywhere else in the app.
    // Raising a loan is Payroll's job; deciding it is an Approver's. The
    // staff list only feeds the "new loan" forms, so only they load it.
    const canCreate = useCan()('loans.create');
    const { data: employees = [] } = useEmployees({ status: 'ACTIVE' }, canCreate);

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



    // Summary stats
    const allLoans = loans ?? [];
    const activeLoans = allLoans.filter((l) => l.status === LoanStatus.ACTIVE);
    const pendingLoans = allLoans.filter((l) => l.status === LoanStatus.PENDING);
    const totalOutstanding = activeLoans.reduce((s, l) => s + Number(l.outstandingBalance), 0);
    const totalDisbursed = allLoans
        .filter((l) => [LoanStatus.ACTIVE, LoanStatus.FULLY_PAID].includes(l.status))
        .reduce((s, l) => s + Number(l.amount), 0);

    const hasFilters = !!(filters.status || filters.loanType);

    const columns: ColumnDef<Loan>[] = [
        {
            id: 'employee',
            header: 'Employee',
            meta: { cardTitle: true },
            cell: ({ row }) => (
                <EmployeeLink id={row.original.employeeId} employee={row.original.employee} />
            ),
        },
        {
            id: 'type',
            header: 'Type',
            cell: ({ row }) => (
                <Badge variant="outline">
                    {row.original.loanType === LoanType.SALARY_ADVANCE ? 'Advance' : 'Loan'}
                </Badge>
            ),
        },
        {
            id: 'amount',
            header: 'Amount',
            meta: { align: 'right' },
            cell: ({ row }) => <Money value={row.original.amount} />,
        },
        {
            id: 'outstanding',
            header: 'Outstanding',
            meta: { align: 'right' },
            cell: ({ row }) => <Money value={row.original.outstandingBalance} />,
        },
        {
            id: 'monthly',
            header: 'Monthly',
            meta: { align: 'right' },
            cell: ({ row }) => <Money value={row.original.monthlyRepayment} />,
        },
        {
            id: 'status',
            header: 'Status',
            cell: ({ row }) => <StatusBadge kind="loan" status={row.original.status} />,
        },
        {
            id: 'applied',
            header: 'Applied',
            cell: ({ row }) => (
                <span className="text-muted-foreground">
                    {formatDate(row.original.applicationDate)}
                </span>
            ),
        },
    ];

    return (
        <div className="space-y-6">
            <PageHeader
                title="Loans & advances"
                description="Manage employee loans and salary advances"
                actions={
                    canCreate && (
                        <>
                            <Button variant="outline" onClick={() => setShowAdvanceForm(true)}>
                                <CreditCard className="mr-2 h-4 w-4" />
                                Salary advance
                            </Button>
                            <Button onClick={() => setShowLoanForm(true)}>
                                <Plus className="mr-2 h-4 w-4" />
                                New loan
                            </Button>
                        </>
                    )
                }
            />

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
                    <CardContent><p className="text-2xl font-bold">{formatMoney(totalDisbursed)}</p></CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Outstanding</CardTitle>
                        <AlertTriangle className="h-4 w-4 text-red-500" />
                    </CardHeader>
                    <CardContent><p className="text-2xl font-bold">{formatMoney(totalOutstanding)}</p></CardContent>
                </Card>
            </div>

            <DataTable
                columns={columns}
                data={allLoans}
                loading={isLoading}
                isError={isError}
                errorSubject="the loans"
                searchText={(loan) =>
                    `${loan.employee?.firstName ?? ''} ${loan.employee?.lastName ?? ''} ${loan.employee?.employeeNumber ?? ''}`
                }
                searchPlaceholder="Search by employee…"
                rowHref={(loan) => `/loans/${loan.id}`}
                rowActions={(loan) => (
                    <Link
                        href={`/loans/${loan.id}`}
                        aria-label="Open loan"
                        className="inline-flex text-muted-foreground hover:text-foreground"
                    >
                        <ChevronRight className="h-4 w-4" />
                    </Link>
                )}
                filters={[
                    {
                        id: 'status',
                        label: 'statuses',
                        value: filters.status,
                        options: statusOptions('loan'),
                    },
                    {
                        id: 'loanType',
                        label: 'types',
                        value: filters.loanType,
                        options: [
                            { value: LoanType.STANDARD_LOAN, label: 'Standard loan' },
                            { value: LoanType.SALARY_ADVANCE, label: 'Salary advance' },
                        ],
                    },
                ]}
                onFilterChange={(id, value) =>
                    setFilters((p) => ({ ...p, [id]: value }))
                }
                emptyTitle={hasFilters ? 'No loans match' : 'No loans'}
                emptyDescription={
                    hasFilters
                        ? 'Try another status or type.'
                        : canCreate
                          ? 'Create a loan or salary advance to get started.'
                          : 'No loans or salary advances have been raised yet.'
                }
                emptyAction={
                    canCreate && !hasFilters
                        ? { label: 'New loan', onClick: () => setShowLoanForm(true) }
                        : undefined
                }
            />

            {/* ─── New Loan Dialog ─────────────────────────────────── */}
            <Dialog open={showLoanForm} onOpenChange={setShowLoanForm}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Apply for Loan</DialogTitle>
                        <DialogDescription>Submit a new loan application for an employee.</DialogDescription>
                    </DialogHeader>
                    <form onSubmit={loanForm.handleSubmit(onSubmitLoan)} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="loan-employeeId">Employee</Label>
                            {/* A UUID box here asked the bursar for a value the
                                interface never shows. Same picker as everywhere
                                else staff are chosen. */}
                            <Select
                                value={loanForm.watch('employeeId')}
                                onValueChange={(v) =>
                                    loanForm.setValue('employeeId', v, { shouldValidate: true })
                                }
                            >
                                <SelectTrigger id="loan-employeeId">
                                    <SelectValue placeholder="Select an employee" />
                                </SelectTrigger>
                                <SelectContent>
                                    {employees.map((e) => (
                                        <SelectItem key={e.id} value={e.id}>
                                            {e.firstName} {e.lastName} ({e.employeeNumber})
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
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
                            <Label htmlFor="adv-employeeId">Employee</Label>
                            <Select
                                value={advanceForm.watch('employeeId')}
                                onValueChange={(v) =>
                                    advanceForm.setValue('employeeId', v, { shouldValidate: true })
                                }
                            >
                                <SelectTrigger id="adv-employeeId">
                                    <SelectValue placeholder="Select an employee" />
                                </SelectTrigger>
                                <SelectContent>
                                    {employees.map((e) => (
                                        <SelectItem key={e.id} value={e.id}>
                                            {e.firstName} {e.lastName} ({e.employeeNumber})
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
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
