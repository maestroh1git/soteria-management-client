'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Plus, Pencil, Trash2, Loader2 } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog';
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/form';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { LoadingSkeleton } from '@/components/common/loading-skeleton';
import { ConfirmDialog } from '@/components/common/confirm-dialog';
import {
    getSalaryComponents,
    createSalaryComponent,
    updateSalaryComponent,
    deleteSalaryComponent,
    type CreateSalaryComponentDto,
} from '@/lib/api/salary-components';
import {
    createSalaryComponentSchema,
    type CreateSalaryComponentValues,
} from '@/lib/utils/validation';
import { ComponentType, CalculationType } from '@/lib/types/enums';
import type { SalaryComponent } from '@/lib/types/api';

export default function SalaryComponentsPage() {
    const qc = useQueryClient();
    const { data: components = [], isLoading } = useQuery({
        queryKey: ['salary-components'],
        queryFn: () => getSalaryComponents(),
    });

    const [dialogOpen, setDialogOpen] = useState(false);
    const [editTarget, setEditTarget] = useState<SalaryComponent | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<SalaryComponent | null>(null);

    const createMutation = useMutation({
        mutationFn: (dto: CreateSalaryComponentDto) => createSalaryComponent(dto),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['salary-components'] });
            toast.success('Salary component created');
            setDialogOpen(false);
        },
        onError: (e: Error) => toast.error(e.message),
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, dto }: { id: string; dto: Partial<CreateSalaryComponentDto> }) =>
            updateSalaryComponent(id, dto),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['salary-components'] });
            toast.success('Salary component updated');
            setEditTarget(null);
            setDialogOpen(false);
        },
        onError: (e: Error) => toast.error(e.message),
    });

    const delMutation = useMutation({
        mutationFn: (id: string) => deleteSalaryComponent(id),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['salary-components'] });
            toast.success('Salary component deleted');
            setDeleteTarget(null);
        },
        onError: (e: Error) => toast.error(e.message),
    });

    function openCreate() {
        setEditTarget(null);
        setDialogOpen(true);
    }
    function openEdit(comp: SalaryComponent) {
        setEditTarget(comp);
        setDialogOpen(true);
    }

    if (isLoading) return <LoadingSkeleton variant="table" />;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Salary Components</h1>
                    <p className="text-muted-foreground">
                        Define earnings, deductions, and calculation rules
                    </p>
                </div>
                <Button
                    onClick={openCreate}
                    className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                >
                    <Plus className="mr-2 h-4 w-4" /> Add Component
                </Button>
            </div>

            <div className="rounded-md border bg-white dark:bg-slate-950">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="border-b bg-muted/50">
                            <th className="px-4 py-3 text-left font-medium">Name</th>
                            <th className="px-4 py-3 text-left font-medium">Type</th>
                            <th className="px-4 py-3 text-left font-medium">Calculation</th>
                            <th className="px-4 py-3 text-left font-medium">Value</th>
                            <th className="px-4 py-3 text-left font-medium">Flags</th>
                            <th className="px-4 py-3 text-right font-medium">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {components.map((comp) => (
                            <tr key={comp.id} className="border-b">
                                <td className="px-4 py-3 font-medium">
                                    {comp.name}
                                    {comp.isBase && (
                                        <Badge variant="outline" className="ml-2 text-xs">
                                            Base
                                        </Badge>
                                    )}
                                </td>
                                <td className="px-4 py-3">
                                    <Badge
                                        variant={comp.type === ComponentType.EARNING ? 'default' : 'secondary'}
                                    >
                                        {comp.type}
                                    </Badge>
                                </td>
                                <td className="px-4 py-3 text-muted-foreground">
                                    {comp.calculationType.replace(/_/g, ' ')}
                                </td>
                                <td className="px-4 py-3">
                                    {comp.calculationType === CalculationType.FIXED
                                        ? `₦${Number(comp.value).toLocaleString()}`
                                        : `${comp.value}%`}
                                </td>
                                <td className="px-4 py-3">
                                    <div className="flex items-center gap-2">
                                        {comp.taxable && (
                                            <Badge variant="outline" className="text-xs">
                                                Taxable
                                            </Badge>
                                        )}
                                        {comp.showOnPayslip && (
                                            <Badge variant="outline" className="text-xs">
                                                Payslip
                                            </Badge>
                                        )}
                                    </div>
                                </td>
                                <td className="px-4 py-3">
                                    <div className="flex items-center justify-end gap-1">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8"
                                            onClick={() => openEdit(comp)}
                                        >
                                            <Pencil className="h-4 w-4" />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8 text-red-600"
                                            onClick={() => setDeleteTarget(comp)}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                        {components.length === 0 && (
                            <tr>
                                <td colSpan={6} className="text-center py-12 text-muted-foreground">
                                    No salary components yet. Add one to get started.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Create / Edit Dialog */}
            <SalaryComponentFormDialog
                open={dialogOpen}
                onOpenChange={setDialogOpen}
                component={editTarget}
                isLoading={createMutation.isPending || updateMutation.isPending}
                onSubmit={(values) => {
                    const dto: CreateSalaryComponentDto = {
                        name: values.name,
                        type: values.type,
                        isBase: values.isBase,
                        calculationType: values.calculationType,
                        value: values.value,
                        formula: values.formula || undefined,
                        taxable: values.taxable,
                        showOnPayslip: values.showOnPayslip,
                        roleId: values.roleId || undefined,
                        countryId: values.countryId || undefined,
                    };
                    if (editTarget) {
                        updateMutation.mutate({ id: editTarget.id, dto });
                    } else {
                        createMutation.mutate(dto);
                    }
                }}
            />

            <ConfirmDialog
                open={!!deleteTarget}
                onOpenChange={(open) => !open && setDeleteTarget(null)}
                title="Delete Salary Component"
                description={`Delete "${deleteTarget?.name}"? This cannot be undone.`}
                confirmLabel="Delete"
                variant="destructive"
                loading={delMutation.isPending}
                onConfirm={async () => {
                    if (deleteTarget) await delMutation.mutateAsync(deleteTarget.id);
                }}
            />
        </div>
    );
}

function SalaryComponentFormDialog({
    open,
    onOpenChange,
    component,
    isLoading,
    onSubmit,
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    component: SalaryComponent | null;
    isLoading: boolean;
    onSubmit: (values: CreateSalaryComponentValues) => void;
}) {
    const form = useForm<CreateSalaryComponentValues>({
        resolver: zodResolver(createSalaryComponentSchema),
        values: component
            ? {
                name: component.name,
                type: component.type as ComponentType,
                isBase: component.isBase,
                calculationType: component.calculationType as CalculationType,
                value: Number(component.value),
                formula: component.formula ?? '',
                taxable: component.taxable,
                showOnPayslip: component.showOnPayslip,
                roleId: component.roleId ?? '',
                countryId: component.countryId ?? '',
            }
            : {
                name: '',
                type: ComponentType.EARNING,
                isBase: false,
                calculationType: CalculationType.FIXED,
                value: 0,
                formula: '',
                taxable: false,
                showOnPayslip: true,
                roleId: '',
                countryId: '',
            },
    });

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle>
                        {component ? 'Edit Salary Component' : 'New Salary Component'}
                    </DialogTitle>
                    <DialogDescription>
                        {component
                            ? 'Update the salary component details'
                            : 'Define a new earning or deduction component'}
                    </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Name *</FormLabel>
                                    <FormControl>
                                        <Input placeholder="e.g. Housing Allowance" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="type"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Type *</FormLabel>
                                        <Select onValueChange={field.onChange} value={field.value}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <SelectItem value={ComponentType.EARNING}>
                                                    Earning
                                                </SelectItem>
                                                <SelectItem value={ComponentType.DEDUCTION}>
                                                    Deduction
                                                </SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="calculationType"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Calculation *</FormLabel>
                                        <Select onValueChange={field.onChange} value={field.value}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                {Object.values(CalculationType).map((ct) => (
                                                    <SelectItem key={ct} value={ct}>
                                                        {ct.replace(/_/g, ' ')}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="value"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Value *</FormLabel>
                                        <FormControl>
                                            <Input
                                                type="number"
                                                step="0.01"
                                                placeholder="0.00"
                                                {...field}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="formula"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Formula</FormLabel>
                                        <FormControl>
                                            <Input
                                                placeholder="e.g. baseSalary * 0.1"
                                                {...field}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <div className="flex items-center gap-6">
                            <FormField
                                control={form.control}
                                name="isBase"
                                render={({ field }) => (
                                    <FormItem className="flex items-center space-x-2 space-y-0">
                                        <FormControl>
                                            <Checkbox
                                                checked={field.value}
                                                onCheckedChange={field.onChange}
                                            />
                                        </FormControl>
                                        <FormLabel className="font-normal">Base salary</FormLabel>
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="taxable"
                                render={({ field }) => (
                                    <FormItem className="flex items-center space-x-2 space-y-0">
                                        <FormControl>
                                            <Checkbox
                                                checked={field.value}
                                                onCheckedChange={field.onChange}
                                            />
                                        </FormControl>
                                        <FormLabel className="font-normal">Taxable</FormLabel>
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="showOnPayslip"
                                render={({ field }) => (
                                    <FormItem className="flex items-center space-x-2 space-y-0">
                                        <FormControl>
                                            <Checkbox
                                                checked={field.value}
                                                onCheckedChange={field.onChange}
                                            />
                                        </FormControl>
                                        <FormLabel className="font-normal">Show on payslip</FormLabel>
                                    </FormItem>
                                )}
                            />
                        </div>

                        <DialogFooter>
                            <Button
                                type="submit"
                                disabled={isLoading}
                                className="bg-gradient-to-r from-blue-600 to-indigo-600"
                            >
                                {isLoading ? (
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                ) : null}
                                {component ? 'Update' : 'Create'}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
