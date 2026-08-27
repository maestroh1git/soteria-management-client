'use client';

import { useMemo, useState } from 'react';
import { Plus, Pencil, PowerOff, Loader2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
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
import { EmptyState } from '@/components/common/empty-state';
import {
    useEmployeeSalaryComponents,
    useAddEmployeeSalaryComponent,
    useUpdateEmployeeSalaryComponent,
    useDeactivateEmployeeSalaryComponent,
} from '@/lib/hooks/use-employees';
import { useSalaryComponentsList } from '@/lib/hooks/use-onboarding';
import { CalculationType, ComponentStatus } from '@/lib/types/enums';
import type { EmployeeSalaryComponent, SalaryComponent } from '@/lib/types/api';
import { formatDate } from '@/lib/utils/dates';

interface Props {
    employeeId: string;
    /** Editing is gated on the caller's role; viewing already is. */
    canEdit: boolean;
}

const today = () => new Date().toISOString().slice(0, 10);

/** A percentage component is a rate; a fixed one is an amount. Render each as
 *  what it is — the config page does the same, and showing "₦8" for an 8%
 *  pension is how a payslip gets read wrong before it is even run. */
function isPercentage(calc?: CalculationType) {
    return !!calc && calc !== CalculationType.FIXED;
}

/**
 * The salary lines attached to one employee.
 *
 * Attaching the standard components at hire is only safe because every line is
 * editable afterwards — this is where that editing lives. Basic Salary in
 * particular starts at zero (the school sets each person's own figure), so
 * without this panel a new hire cannot be paid a correct amount at all.
 *
 * Values are never edited in place on a running line silently: a change carries
 * its own effective date, so a raise in March does not rewrite what February
 * was paid.
 */
export function SalaryComponentsPanel({ employeeId, canEdit }: Props) {
    const { data: assigned = [], isLoading } = useEmployeeSalaryComponents(
        employeeId,
        false,
        true,
    );
    const { data: catalogue = [] } = useSalaryComponentsList(canEdit);

    const add = useAddEmployeeSalaryComponent();
    const update = useUpdateEmployeeSalaryComponent();
    const deactivate = useDeactivateEmployeeSalaryComponent();

    const [addOpen, setAddOpen] = useState(false);
    const [editing, setEditing] = useState<EmployeeSalaryComponent | null>(null);
    const [confirmOff, setConfirmOff] = useState<EmployeeSalaryComponent | null>(
        null,
    );

    // Add form
    const [componentId, setComponentId] = useState('');
    const [value, setValue] = useState('');
    const [effectiveFrom, setEffectiveFrom] = useState(today());
    // Edit form
    const [editValue, setEditValue] = useState('');
    const [editFrom, setEditFrom] = useState('');

    // A component can only be attached once while active — offering a duplicate
    // just to have the server reject it is the control that does nothing.
    const available = useMemo(() => {
        const taken = new Set(assigned.map((a) => a.salaryComponentId));
        return catalogue.filter((c) => !taken.has(c.id));
    }, [assigned, catalogue]);

    const selected = catalogue.find((c) => c.id === componentId);

    const startAdd = () => {
        setComponentId('');
        setValue('');
        setEffectiveFrom(today());
        setAddOpen(true);
    };

    const onPickComponent = (id: string) => {
        setComponentId(id);
        const c = catalogue.find((x) => x.id === id);
        // Prefill the school's configured default; it is a starting point.
        setValue(c ? String(Number(c.value)) : '');
    };

    const startEdit = (sc: EmployeeSalaryComponent) => {
        setEditing(sc);
        setEditValue(String(Number(sc.value)));
        setEditFrom(sc.effectiveFrom?.slice(0, 10) ?? today());
    };

    const addValid =
        componentId && value.trim() !== '' && Number(value) >= 0 && effectiveFrom;
    const editValid =
        editValue.trim() !== '' && Number(editValue) >= 0 && editFrom;

    const submitAdd = async () => {
        if (!addValid) return;
        await add.mutateAsync({
            employeeId,
            salaryComponentId: componentId,
            value: Number(value),
            effectiveFrom,
        });
        setAddOpen(false);
    };

    const submitEdit = async () => {
        if (!editing || !editValid) return;
        await update.mutateAsync({
            id: editing.id,
            employeeId,
            dto: { value: Number(editValue), effectiveFrom: editFrom },
        });
        setEditing(null);
    };

    return (
        <Card>
            <CardHeader className="flex flex-row items-start justify-between">
                <div>
                    <CardTitle className="text-lg">Salary Components</CardTitle>
                    <CardDescription>
                        Earnings and deductions linked to this employee
                    </CardDescription>
                </div>
                {canEdit && available.length > 0 && (
                    <Button size="sm" onClick={startAdd}>
                        <Plus className="mr-2 h-4 w-4" />
                        Add component
                    </Button>
                )}
            </CardHeader>
            <CardContent>
                {isLoading ? (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Loader2 className="h-4 w-4 animate-spin" /> Loading…
                    </div>
                ) : assigned.length === 0 ? (
                    <EmptyState
                        title="No salary components"
                        description="No salary components have been assigned yet."
                    />
                ) : (
                    <div className="rounded-md border overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b bg-muted/50">
                                    <th className="px-4 py-3 text-left font-medium">Component</th>
                                    <th className="px-4 py-3 text-left font-medium">Type</th>
                                    <th className="px-4 py-3 text-right font-medium">Value</th>
                                    <th className="px-4 py-3 text-left font-medium">Effective From</th>
                                    <th className="px-4 py-3 text-left font-medium">Status</th>
                                    {canEdit && <th className="px-4 py-3" />}
                                </tr>
                            </thead>
                            <tbody>
                                {assigned.map((sc: EmployeeSalaryComponent) => {
                                    const pct = isPercentage(
                                        sc.salaryComponent?.calculationType,
                                    );
                                    const active = sc.status === ComponentStatus.ACTIVE;
                                    return (
                                        <tr key={sc.id} className="border-b">
                                            <td className="px-4 py-3 font-medium">
                                                {sc.salaryComponent?.name ?? '—'}
                                            </td>
                                            <td className="px-4 py-3">
                                                <Badge variant="outline">
                                                    {sc.salaryComponent?.type}
                                                </Badge>
                                            </td>
                                            <td className="px-4 py-3 text-right tabular-nums">
                                                {pct ? (
                                                    `${Number(sc.value)}%`
                                                ) : (
                                                    <CurrencyDisplay amount={sc.value} size="sm" />
                                                )}
                                            </td>
                                            <td className="px-4 py-3 text-muted-foreground">
                                                {formatDate(sc.effectiveFrom)}
                                            </td>
                                            <td className="px-4 py-3">
                                                <Badge variant={active ? 'default' : 'secondary'}>
                                                    {active ? 'Active' : 'Inactive'}
                                                </Badge>
                                            </td>
                                            {canEdit && (
                                                <td className="px-4 py-3">
                                                    {active && (
                                                        <div className="flex justify-end gap-1">
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                onClick={() => startEdit(sc)}
                                                                aria-label="Edit value"
                                                            >
                                                                <Pencil className="h-4 w-4" />
                                                            </Button>
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                onClick={() => setConfirmOff(sc)}
                                                                aria-label="Deactivate component"
                                                            >
                                                                <PowerOff className="h-4 w-4" />
                                                            </Button>
                                                        </div>
                                                    )}
                                                </td>
                                            )}
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </CardContent>

            {/* Add */}
            <Dialog open={addOpen} onOpenChange={setAddOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Add salary component</DialogTitle>
                        <DialogDescription>
                            Attach an earning or deduction and set its value for this
                            employee.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label>Component</Label>
                            <Select value={componentId} onValueChange={onPickComponent}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select a component" />
                                </SelectTrigger>
                                <SelectContent>
                                    {available.map((c: SalaryComponent) => (
                                        <SelectItem key={c.id} value={c.id}>
                                            {c.name} · {c.type}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label>
                                Value{' '}
                                {selected &&
                                    (isPercentage(selected.calculationType)
                                        ? '(% of base)'
                                        : '(₦)')}
                            </Label>
                            <Input
                                inputMode="decimal"
                                placeholder={selected ? '' : 'Select a component first'}
                                disabled={!selected}
                                value={value}
                                onChange={(e) =>
                                    setValue(e.target.value.replace(/[^\d.]/g, ''))
                                }
                            />
                        </div>

                        <div className="space-y-2">
                            <Label>Effective from</Label>
                            <Input
                                type="date"
                                value={effectiveFrom}
                                onChange={(e) => setEffectiveFrom(e.target.value)}
                            />
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setAddOpen(false)}>
                            Cancel
                        </Button>
                        <Button onClick={submitAdd} disabled={!addValid || add.isPending}>
                            {add.isPending && (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            )}
                            Add component
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Edit value */}
            <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>
                            Edit {editing?.salaryComponent?.name}
                        </DialogTitle>
                        <DialogDescription>
                            The new value applies from its effective date onward; earlier
                            payslips are not changed.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label>
                                Value{' '}
                                {editing &&
                                    (isPercentage(editing.salaryComponent?.calculationType)
                                        ? '(% of base)'
                                        : '(₦)')}
                            </Label>
                            <Input
                                inputMode="decimal"
                                value={editValue}
                                onChange={(e) =>
                                    setEditValue(e.target.value.replace(/[^\d.]/g, ''))
                                }
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Effective from</Label>
                            <Input
                                type="date"
                                value={editFrom}
                                onChange={(e) => setEditFrom(e.target.value)}
                            />
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setEditing(null)}>
                            Cancel
                        </Button>
                        <Button
                            onClick={submitEdit}
                            disabled={!editValid || update.isPending}
                        >
                            {update.isPending && (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            )}
                            Save change
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Deactivate confirmation */}
            <Dialog open={!!confirmOff} onOpenChange={(o) => !o && setConfirmOff(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Deactivate this component?</DialogTitle>
                        <DialogDescription>
                            {confirmOff?.salaryComponent?.name} will stop applying from
                            today. It stays on payslips already run.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setConfirmOff(null)}>
                            Cancel
                        </Button>
                        <Button
                            variant="destructive"
                            disabled={deactivate.isPending}
                            onClick={async () => {
                                if (!confirmOff) return;
                                await deactivate.mutateAsync({
                                    id: confirmOff.id,
                                    employeeId,
                                    effectiveDate: today(),
                                });
                                setConfirmOff(null);
                            }}
                        >
                            {deactivate.isPending && (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            )}
                            Deactivate
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </Card>
    );
}
