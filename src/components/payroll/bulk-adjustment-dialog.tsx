'use client';

import { useState } from 'react';
import { Loader2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { useCreateAdjustmentsForMany } from '@/lib/hooks/use-payroll-adjustments';
import type { BulkAdjustmentResult, BulkPayrollAdjustmentDto } from '@/lib/api/payroll-adjustments';
import type { StaffTarget } from '@/lib/api/staff-target';
import { StaffTargetPicker, targetIsComplete } from './staff-target-picker';
import { BulkPreview } from './bulk-preview';

/**
 * The same one-off for many people in this period: a 13th month, an
 * end-of-year bonus, a levy. It is a preview first — who is paid what, who is
 * skipped and why — and only then raised, one pending adjustment each, for
 * the approver to sign off as usual (in one go, from the panel).
 */
export function BulkAdjustmentDialog({
    open,
    onOpenChange,
    payPeriodId,
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    payPeriodId: string;
}) {
    const run = useCreateAdjustmentsForMany();
    const [type, setType] = useState<'EARNING' | 'DEDUCTION'>('EARNING');
    const [label, setLabel] = useState('');
    const [amountMode, setAmountMode] = useState<'FIXED' | 'PERCENT_OF_BASIC'>('FIXED');
    const [amount, setAmount] = useState('');
    const [reason, setReason] = useState('');
    const [target, setTarget] = useState<StaffTarget>({ scope: 'ALL' });
    const [preview, setPreview] = useState<BulkAdjustmentResult | null>(null);

    // Any change to the form makes the preview stale: what is confirmed must be
    // what was shown.
    const edit =
        <T,>(set: (v: T) => void) =>
        (v: T) => {
            set(v);
            setPreview(null);
        };

    const ready = !!label.trim() && Number(amount) > 0 && targetIsComplete(target);
    const dto = (dryRun: boolean): BulkPayrollAdjustmentDto => ({
        payPeriodId,
        type,
        label: label.trim(),
        amountMode,
        amount: Number(amount),
        ...(reason.trim() ? { reason: reason.trim() } : {}),
        target,
        dryRun,
    });

    const reset = () => {
        setType('EARNING');
        setLabel('');
        setAmountMode('FIXED');
        setAmount('');
        setReason('');
        setTarget({ scope: 'ALL' });
        setPreview(null);
    };

    const close = (o: boolean) => {
        if (!o) reset();
        onOpenChange(o);
    };

    return (
        <Dialog open={open} onOpenChange={close}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>One-off for many people</DialogTitle>
                    <DialogDescription>
                        This pay period only. Each person gets their own adjustment, pending
                        approval.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                    <div className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-2">
                            <Label htmlFor="bulk-adjustment-type">Type *</Label>
                            <Select
                                value={type}
                                onValueChange={edit((v: string) => setType(v as typeof type))}
                            >
                                <SelectTrigger id="bulk-adjustment-type" className="w-full">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="EARNING">
                                        Earning — a bonus, a 13th month
                                    </SelectItem>
                                    <SelectItem value="DEDUCTION">Deduction — a levy</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="bulk-adjustment-label">Description *</Label>
                            <Input
                                id="bulk-adjustment-label"
                                value={label}
                                onChange={(e) => edit(setLabel)(e.target.value)}
                                placeholder="e.g. 13th month"
                            />
                        </div>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-2">
                            <Label htmlFor="bulk-adjustment-mode">Amount is *</Label>
                            <Select
                                value={amountMode}
                                onValueChange={edit((v: string) =>
                                    setAmountMode(v as typeof amountMode),
                                )}
                            >
                                <SelectTrigger id="bulk-adjustment-mode" className="w-full">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="FIXED">The same for everyone</SelectItem>
                                    <SelectItem value="PERCENT_OF_BASIC">
                                        A % of each person&rsquo;s basic
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="bulk-adjustment-amount">
                                {amountMode === 'FIXED' ? 'Amount *' : 'Percentage of basic *'}
                            </Label>
                            <Input
                                id="bulk-adjustment-amount"
                                type="number"
                                min={0}
                                step="0.01"
                                value={amount}
                                onChange={(e) => edit(setAmount)(e.target.value)}
                                placeholder={amountMode === 'FIXED' ? '10000' : '100'}
                            />
                            {amountMode === 'PERCENT_OF_BASIC' && (
                                <p className="text-xs text-muted-foreground">
                                    100 is one month&rsquo;s basic salary.
                                </p>
                            )}
                        </div>
                    </div>

                    <StaffTargetPicker
                        id="bulk-adjustment-target"
                        value={target}
                        onChange={edit(setTarget)}
                    />

                    <div className="space-y-2">
                        <Label htmlFor="bulk-adjustment-reason">Reason</Label>
                        <Input
                            id="bulk-adjustment-reason"
                            value={reason}
                            onChange={(e) => edit(setReason)(e.target.value)}
                            placeholder="e.g. Management approval"
                        />
                    </div>

                    {preview && (
                        <BulkPreview
                            reached={preview.created}
                            reachedLabel={
                                type === 'EARNING' ? 'will be paid' : 'will have it deducted'
                            }
                            skipped={preview.skipped}
                            total={preview.total}
                        />
                    )}
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => close(false)} type="button">
                        Cancel
                    </Button>
                    {!preview ? (
                        <Button
                            disabled={!ready || run.isPending}
                            onClick={() => run.mutate(dto(true), { onSuccess: setPreview })}
                        >
                            {run.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Preview
                        </Button>
                    ) : (
                        <Button
                            disabled={preview.created.length === 0 || run.isPending}
                            onClick={() =>
                                run.mutate(dto(false), { onSuccess: () => close(false) })
                            }
                        >
                            {run.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Raise {preview.created.length}{' '}
                            {preview.created.length === 1 ? 'adjustment' : 'adjustments'}
                        </Button>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
