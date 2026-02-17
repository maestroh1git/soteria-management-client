'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
    ArrowLeft,
    Play,
    CheckCircle2,
    DollarSign,
    Users,
    TrendingDown,
    TrendingUp,
    Eye,
    Check,
    CreditCard,
    X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    DialogDescription,
} from '@/components/ui/dialog';
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
} from '@/components/ui/sheet';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { LoadingSkeleton } from '@/components/common/loading-skeleton';
import { EmptyState } from '@/components/common/empty-state';
import { CurrencyDisplay } from '@/components/common/currency-display';
import {
    usePayPeriod,
    useSalaries,
    useSalary,
    useProcessPayroll,
    useApproveSalary,
    useMarkAsPaid,
    useBulkPayment,
} from '@/lib/hooks/use-payroll';
import { useAuthStore } from '@/stores/auth-store';
import { PayPeriodStatus, SalaryStatus, ComponentType } from '@/lib/types/enums';
import type { Salary, SalaryFilters, PayrollProcessResult } from '@/lib/types/api';

const SALARY_STATUS_CONFIG: Record<SalaryStatus, { label: string; variant: 'default' | 'secondary' | 'outline' | 'destructive' }> = {
    [SalaryStatus.DRAFT]: { label: 'Draft', variant: 'secondary' },
    [SalaryStatus.APPROVED]: { label: 'Approved', variant: 'default' },
    [SalaryStatus.PAID]: { label: 'Paid', variant: 'outline' },
    [SalaryStatus.CANCELLED]: { label: 'Cancelled', variant: 'destructive' },
};

export default function PayrollWorkspacePage() {
    const params = useParams();
    const router = useRouter();
    const payPeriodId = params.payPeriodId as string;
    const user = useAuthStore((s) => s.user);

    // Filters & pagination
    const [statusFilter, setStatusFilter] = useState<SalaryStatus | undefined>();
    const [page, setPage] = useState(1);

    const filters: SalaryFilters = { payPeriodId, status: statusFilter, page, limit: 20 };

    // Queries
    const { data: period, isLoading: periodLoading } = usePayPeriod(payPeriodId);
    const { data: salariesResponse, isLoading: salariesLoading } = useSalaries(filters);

    // Mutations
    const processMutation = useProcessPayroll();
    const approveMutation = useApproveSalary();
    const payMutation = useMarkAsPaid();
    const bulkPayMutation = useBulkPayment();

    // Dialogs
    const [showProcess, setShowProcess] = useState(false);
    const [dryRun, setDryRun] = useState(false);
    const [processResult, setProcessResult] = useState<PayrollProcessResult | null>(null);

    const [showApprove, setShowApprove] = useState(false);
    const [approveTarget, setApproveTarget] = useState<Salary | null>(null);
    const [approveNotes, setApproveNotes] = useState('');

    const [showPay, setShowPay] = useState(false);
    const [payTarget, setPayTarget] = useState<Salary | null>(null);
    const [payRef, setPayRef] = useState('');
    const [payNotes, setPayNotes] = useState('');

    const [viewSalaryId, setViewSalaryId] = useState<string | null>(null);
    const { data: viewSalary } = useSalary(viewSalaryId ?? '');

    // Selected for bulk
    const [selected, setSelected] = useState<Set<string>>(new Set());

    const salaries = salariesResponse?.items ?? [];
    const totalPages = salariesResponse?.totalPages ?? 1;

    const formatDate = (d: string) =>
        new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

    const formatCurrency = (v: number) =>
        new Intl.NumberFormat('en-US', { style: 'currency', currency: 'NGN' }).format(v);

    // Summary stats
    const totalGross = salaries.reduce((s, sal) => s + Number(sal.grossSalary), 0);
    const totalDeductions = salaries.reduce((s, sal) => s + Number(sal.totalDeductions), 0);
    const totalNet = salaries.reduce((s, sal) => s + Number(sal.netSalary), 0);

    const handleProcess = () => {
        processMutation.mutate(
            { payPeriodId, dryRun },
            {
                onSuccess: (result) => {
                    setProcessResult(result);
                    if (!dryRun) setShowProcess(false);
                },
            },
        );
    };

    const handleApprove = () => {
        if (!approveTarget || !user) return;
        approveMutation.mutate(
            { id: approveTarget.id, dto: { approverId: user.id, notes: approveNotes || undefined } },
            { onSuccess: () => { setShowApprove(false); setApproveTarget(null); setApproveNotes(''); } },
        );
    };

    const handlePay = () => {
        if (!payTarget) return;
        payMutation.mutate(
            { id: payTarget.id, dto: { paymentReference: payRef, notes: payNotes || undefined } },
            { onSuccess: () => { setShowPay(false); setPayTarget(null); setPayRef(''); setPayNotes(''); } },
        );
    };

    const handleBulkPay = () => {
        const payments = Array.from(selected).map((salaryId) => ({
            salaryId,
            paymentReference: `BULK-${Date.now()}`,
        }));
        bulkPayMutation.mutate({ payments }, { onSuccess: () => setSelected(new Set()) });
    };

    const toggleSelect = (id: string) => {
        setSelected((prev) => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    const toggleAll = () => {
        const approved = salaries.filter((s) => s.status === SalaryStatus.APPROVED);
        if (selected.size === approved.length) setSelected(new Set());
        else setSelected(new Set(approved.map((s) => s.id)));
    };

    if (periodLoading) return <LoadingSkeleton rows={6} />;
    if (!period) return <EmptyState title="Pay period not found" description="The requested pay period does not exist." />;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" onClick={() => router.push('/payroll')}>
                    <ArrowLeft className="h-4 w-4" />
                </Button>
                <div className="flex-1">
                    <h1 className="text-2xl font-bold tracking-tight">{period.name}</h1>
                    <p className="text-sm text-muted-foreground">
                        {formatDate(period.startDate)} – {formatDate(period.endDate)} · Payment: {formatDate(period.paymentDate)}
                    </p>
                </div>
                <Badge
                    variant={
                        period.status === PayPeriodStatus.OPEN ? 'default'
                            : period.status === PayPeriodStatus.PROCESSING ? 'secondary'
                                : 'outline'
                    }
                >
                    {period.status}
                </Badge>
                {period.status === PayPeriodStatus.OPEN && (
                    <Button onClick={() => { setShowProcess(true); setProcessResult(null); setDryRun(false); }}>
                        <Play className="mr-2 h-4 w-4" />
                        Process Payroll
                    </Button>
                )}
            </div>

            {/* Summary Cards */}
            <div className="grid gap-4 md:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Employees</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <p className="text-2xl font-bold">{salaries.length}</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Total Gross</CardTitle>
                        <TrendingUp className="h-4 w-4 text-green-500" />
                    </CardHeader>
                    <CardContent>
                        <p className="text-2xl font-bold">{formatCurrency(totalGross)}</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Total Deductions</CardTitle>
                        <TrendingDown className="h-4 w-4 text-red-500" />
                    </CardHeader>
                    <CardContent>
                        <p className="text-2xl font-bold">{formatCurrency(totalDeductions)}</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Total Net</CardTitle>
                        <DollarSign className="h-4 w-4 text-primary" />
                    </CardHeader>
                    <CardContent>
                        <p className="text-2xl font-bold">{formatCurrency(totalNet)}</p>
                    </CardContent>
                </Card>
            </div>

            {/* Filter & Bulk Actions */}
            <div className="flex items-center gap-3">
                <Select
                    value={statusFilter ?? 'all'}
                    onValueChange={(v) => {
                        setStatusFilter(v === 'all' ? undefined : (v as SalaryStatus));
                        setPage(1);
                    }}
                >
                    <SelectTrigger className="w-[160px]">
                        <SelectValue placeholder="All statuses" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All statuses</SelectItem>
                        {Object.entries(SALARY_STATUS_CONFIG).map(([key, cfg]) => (
                            <SelectItem key={key} value={key}>{cfg.label}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>

                {selected.size > 0 && (
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={handleBulkPay}
                        disabled={bulkPayMutation.isPending}
                    >
                        <CreditCard className="mr-2 h-4 w-4" />
                        Mark {selected.size} as Paid
                    </Button>
                )}
            </div>

            {/* Salaries Table */}
            {salariesLoading ? (
                <LoadingSkeleton rows={5} />
            ) : !salaries.length ? (
                <EmptyState
                    title="No salaries"
                    description={
                        period.status === PayPeriodStatus.OPEN
                            ? 'Process payroll to generate salary records.'
                            : 'No salary records found for this pay period.'
                    }
                />
            ) : (
                <>
                    <div className="rounded-lg border bg-card">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b bg-muted/50">
                                    <th className="w-10 px-4 py-3">
                                        <Checkbox
                                            checked={
                                                salaries.filter((s) => s.status === SalaryStatus.APPROVED).length > 0 &&
                                                selected.size === salaries.filter((s) => s.status === SalaryStatus.APPROVED).length
                                            }
                                            onCheckedChange={toggleAll}
                                        />
                                    </th>
                                    <th className="px-4 py-3 text-left font-medium">Employee</th>
                                    <th className="px-4 py-3 text-right font-medium">Gross</th>
                                    <th className="px-4 py-3 text-right font-medium">Deductions</th>
                                    <th className="px-4 py-3 text-right font-medium">Net</th>
                                    <th className="px-4 py-3 text-left font-medium">Status</th>
                                    <th className="px-4 py-3 text-right font-medium">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {salaries.map((sal) => {
                                    const cfg = SALARY_STATUS_CONFIG[sal.status];
                                    return (
                                        <tr key={sal.id} className="border-b transition-colors hover:bg-muted/50">
                                            <td className="px-4 py-3">
                                                {sal.status === SalaryStatus.APPROVED && (
                                                    <Checkbox
                                                        checked={selected.has(sal.id)}
                                                        onCheckedChange={() => toggleSelect(sal.id)}
                                                    />
                                                )}
                                            </td>
                                            <td className="px-4 py-3 font-medium">
                                                {sal.employee
                                                    ? `${sal.employee.firstName} ${sal.employee.lastName}`
                                                    : sal.employeeId.substring(0, 8)}
                                            </td>
                                            <td className="px-4 py-3 text-right">
                                                <CurrencyDisplay amount={Number(sal.grossSalary)} />
                                            </td>
                                            <td className="px-4 py-3 text-right text-red-600">
                                                <CurrencyDisplay amount={Number(sal.totalDeductions)} />
                                            </td>
                                            <td className="px-4 py-3 text-right font-semibold">
                                                <CurrencyDisplay amount={Number(sal.netSalary)} />
                                            </td>
                                            <td className="px-4 py-3">
                                                <Badge variant={cfg.variant}>{cfg.label}</Badge>
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="flex justify-end gap-1">
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        title="View details"
                                                        onClick={() => setViewSalaryId(sal.id)}
                                                    >
                                                        <Eye className="h-4 w-4" />
                                                    </Button>
                                                    {sal.status === SalaryStatus.DRAFT && (
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            title="Approve"
                                                            onClick={() => {
                                                                setApproveTarget(sal);
                                                                setShowApprove(true);
                                                            }}
                                                        >
                                                            <Check className="h-4 w-4 text-green-600" />
                                                        </Button>
                                                    )}
                                                    {sal.status === SalaryStatus.APPROVED && (
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            title="Mark as paid"
                                                            onClick={() => {
                                                                setPayTarget(sal);
                                                                setShowPay(true);
                                                            }}
                                                        >
                                                            <CreditCard className="h-4 w-4 text-blue-600" />
                                                        </Button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="flex items-center justify-center gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                disabled={page <= 1}
                                onClick={() => setPage((p) => p - 1)}
                            >
                                Previous
                            </Button>
                            <span className="text-sm text-muted-foreground">
                                Page {page} of {totalPages}
                            </span>
                            <Button
                                variant="outline"
                                size="sm"
                                disabled={page >= totalPages}
                                onClick={() => setPage((p) => p + 1)}
                            >
                                Next
                            </Button>
                        </div>
                    )}
                </>
            )}

            {/* ─── Process Payroll Dialog ───────────────────────────── */}
            <Dialog open={showProcess} onOpenChange={setShowProcess}>
                <DialogContent className="sm:max-w-lg">
                    <DialogHeader>
                        <DialogTitle>Process Payroll</DialogTitle>
                        <DialogDescription>
                            Calculate salaries for all active employees in {period.name}.
                        </DialogDescription>
                    </DialogHeader>

                    {processResult ? (
                        <div className="space-y-3">
                            <div className="grid grid-cols-2 gap-3 text-sm">
                                <div className="rounded-lg border p-3">
                                    <p className="text-muted-foreground">Processed</p>
                                    <p className="text-lg font-semibold">{processResult.processedCount}</p>
                                </div>
                                <div className="rounded-lg border p-3">
                                    <p className="text-muted-foreground">Skipped</p>
                                    <p className="text-lg font-semibold">{processResult.skippedCount}</p>
                                </div>
                                <div className="rounded-lg border p-3">
                                    <p className="text-muted-foreground">Total Gross</p>
                                    <p className="text-lg font-semibold">{formatCurrency(processResult.totalGrossSalary)}</p>
                                </div>
                                <div className="rounded-lg border p-3">
                                    <p className="text-muted-foreground">Total Net</p>
                                    <p className="text-lg font-semibold">{formatCurrency(processResult.totalNetSalary)}</p>
                                </div>
                            </div>
                            {processResult.errors.length > 0 && (
                                <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-3">
                                    <p className="mb-1 text-sm font-medium text-destructive">Errors ({processResult.errors.length})</p>
                                    <ul className="space-y-1 text-xs text-destructive">
                                        {processResult.errors.slice(0, 5).map((err, i) => (
                                            <li key={i}>{err.employeeId.substring(0, 8)}… — {err.message}</li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                            {dryRun && (
                                <p className="text-xs text-muted-foreground">This was a dry run — no changes were saved.</p>
                            )}
                            <DialogFooter>
                                <Button variant="outline" onClick={() => setShowProcess(false)}>Close</Button>
                                {dryRun && (
                                    <Button onClick={() => { setDryRun(false); handleProcess(); }}>
                                        Run for Real
                                    </Button>
                                )}
                            </DialogFooter>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <div className="flex items-center gap-2">
                                <Checkbox
                                    id="dryRun"
                                    checked={dryRun}
                                    onCheckedChange={(c) => setDryRun(c === true)}
                                />
                                <Label htmlFor="dryRun" className="text-sm">
                                    Dry run (preview results without saving)
                                </Label>
                            </div>
                            <DialogFooter>
                                <Button variant="outline" onClick={() => setShowProcess(false)}>Cancel</Button>
                                <Button onClick={handleProcess} disabled={processMutation.isPending}>
                                    {processMutation.isPending ? 'Processing…' : dryRun ? 'Preview' : 'Process'}
                                </Button>
                            </DialogFooter>
                        </div>
                    )}
                </DialogContent>
            </Dialog>

            {/* ─── Approve Dialog ──────────────────────────────────── */}
            <Dialog open={showApprove} onOpenChange={(o) => { setShowApprove(o); if (!o) setApproveTarget(null); }}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Approve Salary</DialogTitle>
                        <DialogDescription>
                            Approve salary for{' '}
                            {approveTarget?.employee
                                ? `${approveTarget.employee.firstName} ${approveTarget.employee.lastName}`
                                : 'this employee'}
                            . Net: {formatCurrency(Number(approveTarget?.netSalary ?? 0))}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-3">
                        <div className="space-y-2">
                            <Label>Notes (optional)</Label>
                            <Textarea
                                value={approveNotes}
                                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setApproveNotes(e.target.value)}
                                placeholder="Optional notes about this approval…"
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

            {/* ─── Payment Dialog ──────────────────────────────────── */}
            <Dialog open={showPay} onOpenChange={(o) => { setShowPay(o); if (!o) setPayTarget(null); }}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Mark as Paid</DialogTitle>
                        <DialogDescription>
                            Record payment for{' '}
                            {payTarget?.employee
                                ? `${payTarget.employee.firstName} ${payTarget.employee.lastName}`
                                : 'this employee'}
                            . Net: {formatCurrency(Number(payTarget?.netSalary ?? 0))}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-3">
                        <div className="space-y-2">
                            <Label htmlFor="payRef">Payment Reference *</Label>
                            <Input
                                id="payRef"
                                value={payRef}
                                onChange={(e) => setPayRef(e.target.value)}
                                placeholder="e.g. TX123456789"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Notes (optional)</Label>
                            <Textarea
                                value={payNotes}
                                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setPayNotes(e.target.value)}
                                placeholder="Optional payment notes…"
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowPay(false)}>Cancel</Button>
                        <Button onClick={handlePay} disabled={payMutation.isPending || !payRef.trim()}>
                            {payMutation.isPending ? 'Processing…' : 'Confirm Payment'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* ─── Salary Detail Sheet ─────────────────────────────── */}
            <Sheet open={!!viewSalaryId} onOpenChange={(o) => { if (!o) setViewSalaryId(null); }}>
                <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
                    <SheetHeader>
                        <SheetTitle>
                            Salary Details
                            {viewSalary?.employee && (
                                <span className="block text-sm font-normal text-muted-foreground">
                                    {viewSalary.employee.firstName} {viewSalary.employee.lastName}
                                </span>
                            )}
                        </SheetTitle>
                    </SheetHeader>

                    {viewSalary ? (
                        <div className="mt-6 space-y-6">
                            {/* Summary */}
                            <div className="grid grid-cols-3 gap-3">
                                <div className="rounded-lg border p-3 text-center">
                                    <p className="text-xs text-muted-foreground">Gross</p>
                                    <p className="text-lg font-semibold text-green-600">
                                        {formatCurrency(Number(viewSalary.grossSalary))}
                                    </p>
                                </div>
                                <div className="rounded-lg border p-3 text-center">
                                    <p className="text-xs text-muted-foreground">Deductions</p>
                                    <p className="text-lg font-semibold text-red-600">
                                        {formatCurrency(Number(viewSalary.totalDeductions))}
                                    </p>
                                </div>
                                <div className="rounded-lg border p-3 text-center">
                                    <p className="text-xs text-muted-foreground">Net</p>
                                    <p className="text-lg font-semibold">
                                        {formatCurrency(Number(viewSalary.netSalary))}
                                    </p>
                                </div>
                            </div>

                            {/* Details by type */}
                            {viewSalary.details && viewSalary.details.length > 0 && (
                                <>
                                    {/* Earnings */}
                                    {viewSalary.details.filter((d) => d.componentType === ComponentType.EARNING).length > 0 && (
                                        <div>
                                            <h4 className="mb-2 text-sm font-semibold text-green-700">Earnings</h4>
                                            <div className="space-y-1">
                                                {viewSalary.details
                                                    .filter((d) => d.componentType === ComponentType.EARNING)
                                                    .map((d) => (
                                                        <div key={d.id} className="flex items-center justify-between rounded px-2 py-1 text-sm hover:bg-muted/50">
                                                            <span>{d.componentName}</span>
                                                            <span className="font-medium">{formatCurrency(Number(d.amount))}</span>
                                                        </div>
                                                    ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Deductions */}
                                    {viewSalary.details.filter((d) => d.componentType === ComponentType.DEDUCTION).length > 0 && (
                                        <div>
                                            <h4 className="mb-2 text-sm font-semibold text-red-700">Deductions</h4>
                                            <div className="space-y-1">
                                                {viewSalary.details
                                                    .filter((d) => d.componentType === ComponentType.DEDUCTION)
                                                    .map((d) => (
                                                        <div key={d.id} className="flex items-center justify-between rounded px-2 py-1 text-sm hover:bg-muted/50">
                                                            <span>{d.componentName}</span>
                                                            <span className="font-medium text-red-600">-{formatCurrency(Number(d.amount))}</span>
                                                        </div>
                                                    ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Tax */}
                                    {viewSalary.details.filter((d) => d.componentType === ComponentType.TAX).length > 0 && (
                                        <div>
                                            <h4 className="mb-2 text-sm font-semibold text-amber-700">Tax</h4>
                                            <div className="space-y-1">
                                                {viewSalary.details
                                                    .filter((d) => d.componentType === ComponentType.TAX)
                                                    .map((d) => (
                                                        <div key={d.id} className="flex items-center justify-between rounded px-2 py-1 text-sm hover:bg-muted/50">
                                                            <span>{d.componentName}</span>
                                                            <span className="font-medium text-amber-600">-{formatCurrency(Number(d.amount))}</span>
                                                        </div>
                                                    ))}
                                            </div>
                                        </div>
                                    )}
                                </>
                            )}

                            {/* Meta */}
                            <div className="space-y-2 border-t pt-4 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Status</span>
                                    <Badge variant={SALARY_STATUS_CONFIG[viewSalary.status].variant}>
                                        {SALARY_STATUS_CONFIG[viewSalary.status].label}
                                    </Badge>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Calculated</span>
                                    <span>{formatDate(viewSalary.calculatedAt)}</span>
                                </div>
                                {viewSalary.approvedAt && (
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Approved</span>
                                        <span>{formatDate(viewSalary.approvedAt)}</span>
                                    </div>
                                )}
                                {viewSalary.paymentReference && (
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Payment Ref</span>
                                        <span className="font-mono text-xs">{viewSalary.paymentReference}</span>
                                    </div>
                                )}
                                {viewSalary.notes && (
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Notes</span>
                                        <span className="max-w-[200px] text-right">{viewSalary.notes}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    ) : (
                        <LoadingSkeleton rows={4} />
                    )}
                </SheetContent>
            </Sheet>
        </div>
    );
}
