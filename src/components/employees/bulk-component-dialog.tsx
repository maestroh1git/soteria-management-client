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
import { StaffTargetPicker, targetIsComplete } from '@/components/payroll/staff-target-picker';
import { BulkPreview } from '@/components/payroll/bulk-preview';
import { useAddSalaryComponentToMany } from '@/lib/hooks/use-employees';
import type { BulkComponentResult, BulkEmployeeSalaryComponentDto } from '@/lib/api/employees';
import type { StaffTarget } from '@/lib/api/staff-target';
import type { SalaryComponent } from '@/lib/types/api';
import { CalculationType } from '@/lib/types/enums';
import { todayIso } from '@/lib/utils/dates';

/**
 * One of the school's components, onto the staff who should have it, in one
 * go. New hires get "All staff" components by themselves; this is for everyone
 * already on the payroll, and for the narrower groups the system cannot judge.
 * People who already have it keep their own value and are listed as skipped.
 */
export function BulkComponentDialog({
    component,
    onClose,
}: {
    /** The component to add; the dialog is open while this is set. */
    component: SalaryComponent | null;
    onClose: () => void;
}) {
    return (
        <Dialog open={!!component} onOpenChange={(o) => !o && onClose()}>
            <DialogContent>
                {/* Keyed, so each component starts a fresh form from its own
                    figures rather than resetting state in an effect. */}
                {component && (
                    <BulkComponentForm key={component.id} component={component} onClose={onClose} />
                )}
            </DialogContent>
        </Dialog>
    );
}

function BulkComponentForm({
    component,
    onClose,
}: {
    component: SalaryComponent;
    onClose: () => void;
}) {
    const run = useAddSalaryComponentToMany();
    // Start from the component: its own value, and everyone when it is meant
    // for all staff.
    const [target, setTarget] = useState<StaffTarget>(() =>
        !component.applicability || component.applicability === 'ALL_STAFF'
            ? { scope: 'ALL' }
            : { scope: 'DEPARTMENTS', ids: [] },
    );
    const [value, setValue] = useState(() => String(Number(component.value)));
    const [from, setFrom] = useState(todayIso);
    const [to, setTo] = useState('');
    const [preview, setPreview] = useState<BulkComponentResult | null>(null);

    const edit =
        <T,>(set: (v: T) => void) =>
        (v: T) => {
            set(v);
            setPreview(null);
        };

    const percent = component.calculationType !== CalculationType.FIXED;
    const ready =
        targetIsComplete(target) &&
        value.trim() !== '' &&
        Number(value) >= 0 &&
        !!from &&
        (!to || to >= from);

    const dto = (dryRun: boolean): BulkEmployeeSalaryComponentDto => ({
        salaryComponentId: component.id,
        target,
        value: Number(value),
        effectiveFrom: from,
        ...(to ? { effectiveTo: to } : {}),
        dryRun,
    });

    return (
        <>
            <DialogHeader>
                <DialogTitle>Add {component.name} to staff</DialogTitle>
                <DialogDescription>
                    It is added to everyone you choose who does not have it yet, and paid every pay
                    run from the start date.
                </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
                <StaffTargetPicker
                    id="bulk-component-target"
                    value={target}
                    onChange={edit(setTarget)}
                />

                <div className="space-y-2">
                    <Label htmlFor="bulk-component-value">
                        {percent ? 'Percentage for each person *' : 'Amount for each person *'}
                    </Label>
                    <Input
                        id="bulk-component-value"
                        type="number"
                        min={0}
                        step="0.01"
                        value={value}
                        onChange={(e) => edit(setValue)(e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground">
                        Anyone can be given a different figure afterwards, on their Pay setup.
                    </p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                        <Label htmlFor="bulk-component-from">From *</Label>
                        <Input
                            id="bulk-component-from"
                            type="date"
                            value={from}
                            onChange={(e) => edit(setFrom)(e.target.value)}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="bulk-component-to">Until (optional)</Label>
                        <Input
                            id="bulk-component-to"
                            type="date"
                            min={from}
                            value={to}
                            onChange={(e) => edit(setTo)(e.target.value)}
                        />
                    </div>
                </div>

                {preview && (
                    <BulkPreview
                        reached={preview.added}
                        reachedLabel="will get it"
                        skipped={preview.skipped}
                    />
                )}
            </div>

            <DialogFooter>
                <Button variant="outline" onClick={onClose} type="button">
                    {preview && preview.added.length === 0 ? 'Close' : 'Not now'}
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
                        disabled={preview.added.length === 0 || run.isPending}
                        onClick={() => run.mutate(dto(false), { onSuccess: onClose })}
                    >
                        {run.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Add to {preview.added.length}{' '}
                        {preview.added.length === 1 ? 'person' : 'people'}
                    </Button>
                )}
            </DialogFooter>
        </>
    );
}
