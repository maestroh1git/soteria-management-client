'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
    ArrowLeft,
    CheckCircle2,
    XCircle,
    Banknote,
    Calendar,
    User,
    Clock,
    DollarSign,
    Percent,
    Hash,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    DialogDescription,
} from '@/components/ui/dialog';
import { LoadingSkeleton } from '@/components/common/loading-skeleton';
import { EmptyState } from '@/components/common/empty-state';
import { CurrencyDisplay } from '@/components/common/currency-display';
import {
    useLoan,
    useLoanRepayments,
    useApproveLoan,
    useRejectLoan,
    useDisburseLoan,
} from '@/lib/hooks/use-loans';
import { useAuthStore } from '@/stores/auth-store';
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

export default function LoanDetailPage() {
    const params = useParams();
    const router = useRouter();
    const loanId = params.id as string;
    const user = useAuthStore((s) => s.user);

    const { data: loan, isLoading } = useLoan(loanId);
    const { data: repayments, isLoading: repaymentsLoading } = useLoanRepayments(loanId);

    const approveMutation = useApproveLoan();
    const rejectMutation = useRejectLoan();
    const disburseMutation = useDisburseLoan();

    const [showApprove, setShowApprove] = useState(false);
    const [showReject, setShowReject] = useState(false);
    const [approveNotes, setApproveNotes] = useState('');
    const [rejectNotes, setRejectNotes] = useState('');

    const formatDate = (d: string | null) =>
        d ? new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—';

    const formatCurrency = (v: number) =>
        new Intl.NumberFormat('en-US', { style: 'currency', currency: 'NGN' }).format(v);

    const handleApprove = () => {
        if (!user) return;
        approveMutation.mutate(
            { id: loanId, dto: { approverId: user.id, notes: approveNotes || undefined } },
            { onSuccess: () => { setShowApprove(false); setApproveNotes(''); } },
        );
    };

    const handleReject = () => {
        rejectMutation.mutate(
            { id: loanId, notes: rejectNotes || undefined },
            { onSuccess: () => { setShowReject(false); setRejectNotes(''); } },
        );
    };

    const handleDisburse = () => {
        disburseMutation.mutate(loanId);
    };

    if (isLoading) return <LoadingSkeleton rows={6} />;
    if (!loan) return <EmptyState title="Loan not found" description="The requested loan does not exist." />;

    const progress = loan.amount > 0
        ? ((Number(loan.amount) - Number(loan.outstandingBalance)) / Number(loan.amount)) * 100
        : 0;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" onClick={() => router.push('/loans')}>
                    <ArrowLeft className="h-4 w-4" />
                </Button>
                <div className="flex-1">
                    <h1 className="text-2xl font-bold tracking-tight">
                        {loan.loanType === LoanType.SALARY_ADVANCE ? 'Salary Advance' : 'Loan'} Details
                    </h1>
                    <p className="text-sm text-muted-foreground">
                        {loan.employee
                            ? `${loan.employee.firstName} ${loan.employee.lastName}`
                            : loan.employeeId.substring(0, 8)}
                    </p>
                </div>
                <Badge variant={STATUS_CONFIG[loan.status].variant} className="text-sm px-3 py-1">
                    {STATUS_CONFIG[loan.status].label}
                </Badge>
            </div>

            {/* Action buttons */}
            {loan.status === LoanStatus.PENDING && (
                <div className="flex gap-2">
                    <Button onClick={() => setShowApprove(true)}>
                        <CheckCircle2 className="mr-2 h-4 w-4" />
                        Approve
                    </Button>
                    <Button variant="destructive" onClick={() => setShowReject(true)}>
                        <XCircle className="mr-2 h-4 w-4" />
                        Reject
                    </Button>
                </div>
            )}
            {loan.status === LoanStatus.APPROVED && (
                <Button onClick={handleDisburse} disabled={disburseMutation.isPending}>
                    <Banknote className="mr-2 h-4 w-4" />
                    {disburseMutation.isPending ? 'Disbursing…' : 'Disburse Loan'}
                </Button>
            )}

            {/* Details Grid */}
            <div className="grid gap-4 md:grid-cols-3">
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                            <DollarSign className="h-4 w-4" /> Financial Summary
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Loan Amount</span>
                            <span className="font-semibold">{formatCurrency(Number(loan.amount))}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Total Repayable</span>
                            <span className="font-semibold">{formatCurrency(Number(loan.totalRepayable))}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Outstanding</span>
                            <span className="font-semibold text-red-600">{formatCurrency(Number(loan.outstandingBalance))}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Monthly Payment</span>
                            <span className="font-semibold">{formatCurrency(Number(loan.monthlyRepayment))}</span>
                        </div>
                        {/* Progress bar */}
                        {loan.status === LoanStatus.ACTIVE && (
                            <div className="pt-2">
                                <div className="mb-1 flex justify-between text-xs text-muted-foreground">
                                    <span>Repayment Progress</span>
                                    <span>{progress.toFixed(0)}%</span>
                                </div>
                                <div className="h-2 overflow-hidden rounded-full bg-muted">
                                    <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${progress}%` }} />
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                            <Hash className="h-4 w-4" /> Loan Terms
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Type</span>
                            <Badge variant="outline">
                                {loan.loanType === LoanType.SALARY_ADVANCE ? 'Advance' : 'Loan'}
                            </Badge>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Interest Rate</span>
                            <span className="font-semibold">{Number(loan.interestRate)}%</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Term</span>
                            <span className="font-semibold">{loan.termMonths} months</span>
                        </div>
                        {loan.reason && (
                            <div className="pt-2 border-t">
                                <p className="text-xs text-muted-foreground mb-1">Reason</p>
                                <p className="text-sm">{loan.reason}</p>
                            </div>
                        )}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                            <Calendar className="h-4 w-4" /> Timeline
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Applied</span>
                            <span>{formatDate(loan.applicationDate)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Approved</span>
                            <span>{formatDate(loan.approvalDate)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Disbursed</span>
                            <span>{formatDate(loan.disbursementDate)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">First Repayment</span>
                            <span>{formatDate(loan.firstRepaymentDate)}</span>
                        </div>
                        {loan.notes && (
                            <div className="pt-2 border-t">
                                <p className="text-xs text-muted-foreground mb-1">Notes</p>
                                <p className="text-sm">{loan.notes}</p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Repayment Schedule */}
            <div>
                <h2 className="mb-4 text-lg font-semibold">Repayment History</h2>
                {repaymentsLoading ? (
                    <LoadingSkeleton rows={4} />
                ) : !repayments?.length ? (
                    <EmptyState
                        title="No repayments"
                        description="Repayment records will appear here once the loan is active."
                    />
                ) : (
                    <div className="rounded-lg border bg-card">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b bg-muted/50">
                                    <th className="px-4 py-3 text-left font-medium">#</th>
                                    <th className="px-4 py-3 text-left font-medium">Due Date</th>
                                    <th className="px-4 py-3 text-right font-medium">Amount</th>
                                    <th className="px-4 py-3 text-right font-medium">Principal</th>
                                    <th className="px-4 py-3 text-right font-medium">Interest</th>
                                    <th className="px-4 py-3 text-right font-medium">Balance After</th>
                                    <th className="px-4 py-3 text-left font-medium">Status</th>
                                    <th className="px-4 py-3 text-left font-medium">Paid</th>
                                </tr>
                            </thead>
                            <tbody>
                                {repayments.map((rep, idx) => (
                                    <tr key={rep.id} className="border-b transition-colors hover:bg-muted/50">
                                        <td className="px-4 py-3 text-muted-foreground">{idx + 1}</td>
                                        <td className="px-4 py-3">{formatDate(rep.dueDate)}</td>
                                        <td className="px-4 py-3 text-right font-medium">
                                            <CurrencyDisplay amount={Number(rep.amount)} />
                                        </td>
                                        <td className="px-4 py-3 text-right text-muted-foreground">
                                            <CurrencyDisplay amount={Number(rep.principalPortion)} />
                                        </td>
                                        <td className="px-4 py-3 text-right text-muted-foreground">
                                            <CurrencyDisplay amount={Number(rep.interestPortion)} />
                                        </td>
                                        <td className="px-4 py-3 text-right">
                                            <CurrencyDisplay amount={Number(rep.balanceAfter)} />
                                        </td>
                                        <td className="px-4 py-3">
                                            <Badge variant={rep.status === 'PAID' ? 'outline' : rep.status === 'MISSED' ? 'destructive' : 'secondary'}>
                                                {rep.status}
                                            </Badge>
                                        </td>
                                        <td className="px-4 py-3 text-muted-foreground">
                                            {formatDate(rep.paidDate)}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* ─── Approve Dialog ──────────────────────────────────── */}
            <Dialog open={showApprove} onOpenChange={setShowApprove}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Approve Loan</DialogTitle>
                        <DialogDescription>
                            Approve this {formatCurrency(Number(loan.amount))} {loan.loanType === LoanType.SALARY_ADVANCE ? 'advance' : 'loan'}.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-3">
                        <div className="space-y-2">
                            <Label>Notes (optional)</Label>
                            <Textarea
                                value={approveNotes}
                                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setApproveNotes(e.target.value)}
                                placeholder="Optional approval notes…"
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowApprove(false)}>Cancel</Button>
                        <Button onClick={handleApprove} disabled={approveMutation.isPending}>
                            {approveMutation.isPending ? 'Approving…' : 'Approve'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* ─── Reject Dialog ───────────────────────────────────── */}
            <Dialog open={showReject} onOpenChange={setShowReject}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Reject Loan</DialogTitle>
                        <DialogDescription>
                            Reject this {formatCurrency(Number(loan.amount))} {loan.loanType === LoanType.SALARY_ADVANCE ? 'advance' : 'loan'}.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-3">
                        <div className="space-y-2">
                            <Label>Reason (optional)</Label>
                            <Textarea
                                value={rejectNotes}
                                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setRejectNotes(e.target.value)}
                                placeholder="Reason for rejection…"
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowReject(false)}>Cancel</Button>
                        <Button variant="destructive" onClick={handleReject} disabled={rejectMutation.isPending}>
                            {rejectMutation.isPending ? 'Rejecting…' : 'Reject'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
