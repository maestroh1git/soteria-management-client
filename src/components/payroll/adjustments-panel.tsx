'use client';

import { useState } from 'react';
import { Plus, Check, X, Trash2, Loader2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { CurrencyDisplay } from '@/components/common/currency-display';
import {
    useAdjustments,
    useCreateAdjustment,
    useApproveAdjustment,
    useRejectAdjustment,
    useDeleteAdjustment,
} from '@/lib/hooks/use-payroll-adjustments';
import { useQuery } from '@tanstack/react-query';
import { useEmployees } from '@/lib/hooks/use-employees';
import { getSalaryComponents } from '@/lib/api/salary-components';
import type {
    AdjustmentStatus,
    AdjustmentType,
    PayrollAdjustment,
} from '@/lib/types/api';

const STATUS_VARIANT: Record<AdjustmentStatus, 'default' | 'secondary' | 'destructive'> = {
    APPROVED: 'default',
    PENDING: 'secondary',
    REJECTED: 'destructive',
};

const TYPE_LABEL: Record<AdjustmentType, string> = {
    EARNING: 'One-off earning',
    DEDUCTION: 'One-off deduction',
    WAIVER: 'Waiver',
};

export function AdjustmentsPanel({
    payPeriodId,
    canApprove,
    readOnly,
}: {
    payPeriodId: string;
    canApprove: boolean;
    /** Closed periods have already produced advices; nothing may change. */
    readOnly?: boolean;
}) {
    const { data: adjustments = [], isLoading } = useAdjustments(payPeriodId);
    const [dialogOpen, setDialogOpen] = useState(false);

    const approveMutation = useApproveAdjustment();
    const rejectMutation = useRejectAdjustment();
    const deleteMutation = useDeleteAdjustment();

    const pendingCount = adjustments.filter((a) => a.status === 'PENDING').length;

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <div>
                    <CardTitle className="text-lg">Adjustments</CardTitle>
                    <p className="text-sm text-muted-foreground">
                        One-off earnings, deductions and waivers for this period only.
                        Only approved adjustments are applied when payroll runs.
                    </p>
                </div>
                {!readOnly && (
                    <Button size="sm" onClick={() => setDialogOpen(true)}>
                        <Plus className="mr-2 h-4 w-4" /> Add
                    </Button>
                )}
            </CardHeader>
            <CardContent>
                {pendingCount > 0 && (
                    <p className="mb-3 text-sm text-amber-600 dark:text-amber-500">
                        {pendingCount} pending approval — {pendingCount === 1 ? 'it' : 'they'}{' '}
                        will not affect payroll until approved.
                    </p>
                )}

                {isLoading ? (
                    <p className="py-6 text-center text-sm text-muted-foreground">Loading…</p>
                ) : adjustments.length === 0 ? (
                    <p className="py-6 text-center text-sm text-muted-foreground">
                        No adjustments for this period.
                    </p>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b bg-muted/50">
                                    <th className="px-3 py-2 text-left font-medium">Employee</th>
                                    <th className="px-3 py-2 text-left font-medium">Type</th>
                                    <th className="px-3 py-2 text-left font-medium">Description</th>
                                    <th className="px-3 py-2 text-right font-medium">Amount</th>
                                    <th className="px-3 py-2 text-left font-medium">Status</th>
                                    <th className="px-3 py-2 text-right font-medium">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {adjustments.map((adj) => (
                                    <AdjustmentRow
                                        key={adj.id}
                                        adjustment={adj}
                                        canApprove={canApprove && !readOnly}
                                        onApprove={() => approveMutation.mutate(adj.id)}
                                        onReject={() => rejectMutation.mutate(adj.id)}
                                        onDelete={() => deleteMutation.mutate(adj.id)}
                                        busy={
                                            approveMutation.isPending ||
                                            rejectMutation.isPending ||
                                            deleteMutation.isPending
                                        }
                                    />
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </CardContent>

            <AdjustmentFormDialog
                open={dialogOpen}
                onOpenChange={setDialogOpen}
                payPeriodId={payPeriodId}
            />
        </Card>
    );
}

function AdjustmentRow({
    adjustment,
    canApprove,
    onApprove,
    onReject,
    onDelete,
    busy,
}: {
    adjustment: PayrollAdjustment;
    canApprove: boolean;
    onApprove: () => void;
    onReject: () => void;
    onDelete: () => void;
    busy: boolean;
}) {
    const employeeName = adjustment.employee
        ? `${adjustment.employee.firstName} ${adjustment.employee.lastName}`
        : '—';

    return (
        <tr className="border-b">
            <td className="px-3 py-2">{employeeName}</td>
            <td className="px-3 py-2 text-muted-foreground">
                {TYPE_LABEL[adjustment.type]}
            </td>
            <td className="px-3 py-2">
                {adjustment.label}
                {adjustment.reason && (
                    <span className="block text-xs text-muted-foreground">
                        {adjustment.reason}
                    </span>
                )}
            </td>
            <td className="px-3 py-2 text-right">
                {adjustment.amount === null ? (
                    // A waiver removes a standing amount rather than adding one.
                    <span className="text-muted-foreground">—</span>
                ) : (
                    <CurrencyDisplay amount={Number(adjustment.amount)} />
                )}
            </td>
            <td className="px-3 py-2">
                <Badge variant={STATUS_VARIANT[adjustment.status]}>
                    {adjustment.status}
                </Badge>
            </td>
            <td className="px-3 py-2">
                <div className="flex items-center justify-end gap-1">
                    {adjustment.status === 'PENDING' && canApprove && (
                        <>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-green-600"
                                title="Approve"
                                disabled={busy}
                                onClick={onApprove}
                            >
                                <Check className="h-4 w-4" />
                            </Button>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-amber-600"
                                title="Reject"
                                disabled={busy}
                                onClick={onReject}
                            >
                                <X className="h-4 w-4" />
                            </Button>
                        </>
                    )}
                    {adjustment.status === 'PENDING' && (
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-red-600"
                            title="Delete"
                            disabled={busy}
                            onClick={onDelete}
                        >
                            <Trash2 className="h-4 w-4" />
                        </Button>
                    )}
                </div>
            </td>
        </tr>
    );
}

function AdjustmentFormDialog({
    open,
    onOpenChange,
    payPeriodId,
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    payPeriodId: string;
}) {
    const { data: employees = [] } = useEmployees({ status: 'ACTIVE' });
    const { data: components = [] } = useQuery({
        queryKey: ['salary-components'],
        queryFn: () => getSalaryComponents(),
    });
    const createMutation = useCreateAdjustment();

    const [employeeId, setEmployeeId] = useState('');
    const [type, setType] = useState<AdjustmentType>('EARNING');
    const [componentId, setComponentId] = useState('');
    const [label, setLabel] = useState('');
    const [amount, setAmount] = useState('');
    const [reason, setReason] = useState('');

    const isWaiver = type === 'WAIVER';
    // A waiver names a component instead of an amount; the others need a figure.
    const canSubmit =
        !!employeeId &&
        !!label.trim() &&
        (isWaiver ? !!componentId : Number(amount) > 0);

    function reset() {
        setEmployeeId('');
        setType('EARNING');
        setComponentId('');
        setLabel('');
        setAmount('');
        setReason('');
    }

    function submit() {
        createMutation.mutate(
            {
                employeeId,
                payPeriodId,
                type,
                label: label.trim(),
                ...(isWaiver
                    ? { componentId }
                    : { amount: Number(amount) }),
                ...(reason.trim() ? { reason: reason.trim() } : {}),
            },
            {
                onSuccess: () => {
                    reset();
                    onOpenChange(false);
                },
            },
        );
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>New Adjustment</DialogTitle>
                    <DialogDescription>
                        Applies to this pay period only. It takes effect once approved.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                    <div className="space-y-2">
                        <Label>Employee *</Label>
                        <Select value={employeeId} onValueChange={setEmployeeId}>
                            <SelectTrigger>
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
                    </div>

                    <div className="space-y-2">
                        <Label>Type *</Label>
                        <Select
                            value={type}
                            onValueChange={(v) => {
                                setType(v as AdjustmentType);
                                setComponentId('');
                                setAmount('');
                            }}
                        >
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="EARNING">
                                    One-off earning — honorarium, special duty
                                </SelectItem>
                                <SelectItem value="DEDUCTION">One-off deduction</SelectItem>
                                <SelectItem value="WAIVER">
                                    Waiver — skip a standing deduction this period
                                </SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {isWaiver && (
                        <div className="space-y-2">
                            <Label>Component to waive *</Label>
                            <Select value={componentId} onValueChange={setComponentId}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select a component" />
                                </SelectTrigger>
                                <SelectContent>
                                    {components
                                        .filter((c) => c.type === 'DEDUCTION')
                                        .map((c) => (
                                            <SelectItem key={c.id} value={c.id}>
                                                {c.name}
                                            </SelectItem>
                                        ))}
                                </SelectContent>
                            </Select>
                        </div>
                    )}

                    <div className="space-y-2">
                        <Label>Description *</Label>
                        <Input
                            value={label}
                            onChange={(e) => setLabel(e.target.value)}
                            placeholder="e.g. Special Duty Assignment, Award Ceremony"
                        />
                        <p className="text-xs text-muted-foreground">
                            Printed verbatim on the payroll advice.
                        </p>
                    </div>

                    {!isWaiver && (
                        <div className="space-y-2">
                            <Label>Amount *</Label>
                            <Input
                                type="number"
                                min={0}
                                step="0.01"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                placeholder="10000"
                            />
                        </div>
                    )}

                    <div className="space-y-2">
                        <Label>Reason</Label>
                        <Input
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            placeholder="e.g. Management approval"
                        />
                        <p className="text-xs text-muted-foreground">
                            Appears in the advice note, e.g. &ldquo;waived … in accordance
                            with Management approval&rdquo;.
                        </p>
                    </div>
                </div>

                <DialogFooter>
                    <Button
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                        type="button"
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={submit}
                        disabled={!canSubmit || createMutation.isPending}
                    >
                        {createMutation.isPending ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : null}
                        Raise adjustment
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
