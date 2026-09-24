'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
    ArrowLeft,
    CheckCircle2,
    XCircle,
    Banknote,
    Calendar,
    DollarSign,
    Hash,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
import { useMyEmployeeId } from '@/lib/hooks/use-session';
import { useEntityHistory } from '@/lib/hooks/use-audit';
import { ActionBadge } from '@/app/(dashboard)/audit-logs/page';
import { useCan } from '@/lib/hooks/use-can';
import { LoanStatus, LoanType } from '@/lib/types/enums';
import { formatDate, formatDateTime } from '@/lib/utils/dates';
import { formatMoney } from '@/lib/utils/money';
import { StatusBadge } from '@/components/common/status-badge';
import { useTabParam } from '@/lib/hooks/use-tab-param';
import { EmployeeLink } from '@/components/common/entity-link';

const LOAN_TABS = ['details', 'repayments', 'history'] as const;

export default function LoanDetailPage() {
    const [tab, setTab] = useTabParam(LOAN_TABS);
    const params = useParams();
    const router = useRouter();
    const loanId = params.id as string;
    const can = useCan();

    const { data: loan, isLoading, isError } = useLoan(loanId);
    const {
        data: repayments,
        isLoading: repaymentsLoading,
        isError: repaymentsFailed,
    } = useLoanRepayments(loanId);
    const {
        data: history = [],
        isLoading: historyLoading,
        isError: historyFailed,
    } = useEntityHistory('Loan', loanId);

    const approveMutation = useApproveLoan();
    const myEmployeeId = useMyEmployeeId();
    const rejectMutation = useRejectLoan();
    const disburseMutation = useDisburseLoan();

    const [showApprove, setShowApprove] = useState(false);
    const [showReject, setShowReject] = useState(false);
    const [approveNotes, setApproveNotes] = useState('');
    const [rejectNotes, setRejectNotes] = useState('');



    const handleApprove = () => {
        approveMutation.mutate(
            { id: loanId, dto: { notes: approveNotes || undefined } },
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
    if (!loan)
        return (
            <EmptyState
                isError={isError}
                subject="this loan"
                title="Loan not found"
                description="The requested loan does not exist."
            />
        );

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
                        <EmployeeLink id={loan.employeeId} employee={loan.employee} />
                    </p>
                </div>
                <StatusBadge kind="loan" status={loan.status} className="px-3 py-1 text-sm" />
            </div>

            {/* Action buttons */}
            {loan.status === LoanStatus.PENDING && can('loans.decide') && loan.employeeId === myEmployeeId && (
                <p className="text-sm text-muted-foreground">
                    This is your own request, so another approver decides it.
                </p>
            )}
            {loan.status === LoanStatus.PENDING && can('loans.decide') && loan.employeeId !== myEmployeeId && (
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
            {loan.status === LoanStatus.APPROVED && can('loans.disburse') && (
                <Button onClick={handleDisburse} disabled={disburseMutation.isPending}>
                    <Banknote className="mr-2 h-4 w-4" />
                    {disburseMutation.isPending ? 'Disbursing…' : 'Disburse Loan'}
                </Button>
            )}

            <Tabs value={tab} onValueChange={setTab}>
                <TabsList>
                    <TabsTrigger value="details">Details</TabsTrigger>
                    <TabsTrigger value="repayments">Repayments</TabsTrigger>
                    <TabsTrigger value="history">History</TabsTrigger>
                </TabsList>

                <TabsContent value="details" className="space-y-4">
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
                            <span className="font-semibold">{formatMoney(Number(loan.amount))}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Total Repayable</span>
                            <span className="font-semibold">{formatMoney(Number(loan.totalRepayable))}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Outstanding</span>
                            <span className="font-semibold text-red-600">{formatMoney(Number(loan.outstandingBalance))}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Monthly Payment</span>
                            <span className="font-semibold">{formatMoney(Number(loan.monthlyRepayment))}</span>
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

                </TabsContent>

                {/* ── Repayments Tab ── */}
                <TabsContent value="repayments">
                {repaymentsLoading ? (
                    <LoadingSkeleton rows={4} />
                ) : !repayments?.length ? (
                    <EmptyState
                        isError={repaymentsFailed}
                        subject="the repayments"
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
                </TabsContent>

                {/* ── History Tab ── */}
                <TabsContent value="history">
                    <Card>
                        <CardContent className="pt-6">
                            {historyLoading ? (
                                <LoadingSkeleton rows={5} />
                            ) : history.length === 0 ? (
                                <EmptyState
                                    isError={historyFailed}
                                    subject="this loan’s history" title="No history" description="No audit events recorded for this loan yet." />
                            ) : (
                                <ol className="relative border-l border-border ml-3 space-y-6">
                                    {history.map((log) => (
                                        <li key={log.id} className="ml-6">
                                            <span className="absolute -left-2 flex h-4 w-4 items-center justify-center rounded-full bg-muted border border-border" />
                                            <div className="flex items-center gap-2 mb-1">
                                                <ActionBadge action={log.action} />
                                                <span className="text-xs text-muted-foreground">
                                                    {formatDateTime(log.createdAt)}
                                                </span>
                                                {log.userName && (
                                                    <span className="text-xs text-muted-foreground">· by {log.userName}</span>
                                                )}
                                            </div>
                                            {(log.oldValues || log.newValues) && (
                                                <div className="mt-1.5 rounded-md border bg-muted/40 px-3 py-2 text-xs space-y-1">
                                                    {Object.keys({ ...log.oldValues, ...log.newValues }).map((key) => {
                                                        const oldVal = log.oldValues?.[key];
                                                        const newVal = log.newValues?.[key];
                                                        if (oldVal === newVal) return null;
                                                        return (
                                                            <div key={key} className="flex items-center gap-2">
                                                                <span className="font-mono text-muted-foreground w-28 truncate">{key}</span>
                                                                {oldVal !== undefined && (
                                                                    <span className="line-through text-muted-foreground">{String(oldVal)}</span>
                                                                )}
                                                                {oldVal !== undefined && newVal !== undefined && <span className="text-muted-foreground">→</span>}
                                                                {newVal !== undefined && (
                                                                    <span className="font-medium">{String(newVal)}</span>
                                                                )}
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            )}
                                        </li>
                                    ))}
                                </ol>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>

            {/* ─── Approve Dialog ──────────────────────────────────── */}
            <Dialog open={showApprove} onOpenChange={setShowApprove}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Approve Loan</DialogTitle>
                        <DialogDescription>
                            Approve this {formatMoney(Number(loan.amount))} {loan.loanType === LoanType.SALARY_ADVANCE ? 'advance' : 'loan'}.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-3">
                        <div className="space-y-2">
                            <Label htmlFor="id-page-notes-optional">Notes (optional)</Label>
                            <Textarea id="id-page-notes-optional"
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
                            Reject this {formatMoney(Number(loan.amount))} {loan.loanType === LoanType.SALARY_ADVANCE ? 'advance' : 'loan'}.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-3">
                        <div className="space-y-2">
                            <Label htmlFor="id-page-reason-optional">Reason (optional)</Label>
                            <Textarea id="id-page-reason-optional"
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
