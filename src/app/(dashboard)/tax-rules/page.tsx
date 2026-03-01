'use client';

import { useState } from 'react';
import { useForm, useFieldArray, type Resolver } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
    Plus,
    Pencil,
    Trash2,
    Loader2,
    ChevronDown,
    ChevronRight,
    CheckCircle2,
} from 'lucide-react';
import { format } from 'date-fns';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
    Dialog,
    DialogContent,
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
import { Checkbox } from '@/components/ui/checkbox';
import { LoadingSkeleton } from '@/components/common/loading-skeleton';
import { ConfirmDialog } from '@/components/common/confirm-dialog';
import { useTaxRules, useCreateTaxRule, useUpdateTaxRule, useDeleteTaxRule } from '@/lib/hooks/use-tax';
import type { TaxRule, TaxBracket } from '@/lib/types/api';
import { TaxRuleType } from '@/lib/types/enums';
import { formatCurrency } from '@/lib/utils/currency';

// ── Zod schema ────────────────────────────────────────────────────────────────

const bracketSchema = z.object({
    minAmount: z.coerce.number().min(0, 'Required'),
    maxAmount: z.coerce.number().optional(),
    rate: z.coerce.number().min(0).max(100, 'Rate must be 0–100'),
    fixedAmount: z.coerce.number().min(0).optional(),
});

const taxRuleSchema = z.object({
    name: z.string().min(1, 'Name is required'),
    type: z.nativeEnum(TaxRuleType),
    value: z.coerce.number().min(0).max(100).optional(),
    minSalary: z.coerce.number().min(0).optional(),
    maxSalary: z.coerce.number().min(0).optional(),
    effectiveFrom: z.string().min(1, 'Effective from is required'),
    effectiveTo: z.string().optional(),
    isDefault: z.boolean().optional(),
    brackets: z.array(bracketSchema).optional(),
});

type TaxRuleFormValues = z.infer<typeof taxRuleSchema>;

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmtDate(d: string) {
    try { return format(new Date(d), 'dd MMM yyyy'); }
    catch { return d; }
}

function typeBadge(type: string) {
    return type === TaxRuleType.PROGRESSIVE
        ? <Badge className="bg-purple-100 text-purple-700 hover:bg-purple-100">Progressive</Badge>
        : <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100">Flat Rate</Badge>;
}

// ── Bracket table (read-only) ─────────────────────────────────────────────────

function BracketTable({ brackets }: { brackets: TaxBracket[] }) {
    return (
        <div className="mt-3 rounded-md border overflow-hidden">
            <table className="w-full text-xs">
                <thead className="bg-slate-50">
                    <tr>
                        <th className="text-left px-3 py-2 font-medium text-slate-500">Min Amount</th>
                        <th className="text-left px-3 py-2 font-medium text-slate-500">Max Amount</th>
                        <th className="text-left px-3 py-2 font-medium text-slate-500">Rate (%)</th>
                        <th className="text-left px-3 py-2 font-medium text-slate-500">Fixed</th>
                    </tr>
                </thead>
                <tbody>
                    {brackets.map((b, i) => (
                        <tr key={b.id ?? i} className="border-t">
                            <td className="px-3 py-2">{formatCurrency(b.minAmount)}</td>
                            <td className="px-3 py-2">{b.maxAmount != null ? formatCurrency(b.maxAmount) : '—'}</td>
                            <td className="px-3 py-2">{b.rate}%</td>
                            <td className="px-3 py-2">{b.fixedAmount ? formatCurrency(b.fixedAmount) : '—'}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

// ── Tax rule card ─────────────────────────────────────────────────────────────

function TaxRuleCard({
    rule,
    onEdit,
    onDelete,
}: {
    rule: TaxRule;
    onEdit: (r: TaxRule) => void;
    onDelete: (r: TaxRule) => void;
}) {
    const [expanded, setExpanded] = useState(false);
    const hasProgressive = rule.type === TaxRuleType.PROGRESSIVE && rule.brackets && rule.brackets.length > 0;

    return (
        <div className="border rounded-lg p-4 bg-white">
            <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-sm">{rule.name}</span>
                        {typeBadge(rule.type)}
                        {rule.isDefault && (
                            <Badge variant="outline" className="gap-1 text-emerald-600 border-emerald-300">
                                <CheckCircle2 className="h-3 w-3" />
                                Default
                            </Badge>
                        )}
                    </div>
                    <div className="mt-1 flex flex-wrap gap-4 text-xs text-slate-500">
                        {rule.type === TaxRuleType.FLAT_RATE && rule.value != null && (
                            <span>Rate: <span className="font-medium text-slate-700">{rule.value}%</span></span>
                        )}
                        <span>
                            From: <span className="font-medium text-slate-700">{fmtDate(rule.effectiveFrom)}</span>
                        </span>
                        {rule.effectiveTo && (
                            <span>
                                To: <span className="font-medium text-slate-700">{fmtDate(rule.effectiveTo)}</span>
                            </span>
                        )}
                        {!rule.effectiveTo && (
                            <span className="text-emerald-600 font-medium">Active (no end date)</span>
                        )}
                    </div>
                </div>

                <div className="flex items-center gap-1 flex-shrink-0">
                    {hasProgressive && (
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 px-2 text-xs gap-1"
                            onClick={() => setExpanded((v) => !v)}
                        >
                            {expanded ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
                            {rule.brackets!.length} brackets
                        </Button>
                    )}
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onEdit(rule)}>
                        <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => onDelete(rule)}>
                        <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                </div>
            </div>

            {expanded && hasProgressive && (
                <BracketTable brackets={rule.brackets!} />
            )}
        </div>
    );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function TaxRulesPage() {
    const { data: rules = [], isLoading } = useTaxRules();
    const createMutation = useCreateTaxRule();
    const updateMutation = useUpdateTaxRule();
    const deleteMutation = useDeleteTaxRule();

    const [dialogOpen, setDialogOpen] = useState(false);
    const [editTarget, setEditTarget] = useState<TaxRule | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<TaxRule | null>(null);

    const form = useForm<TaxRuleFormValues>({
        resolver: zodResolver(taxRuleSchema) as Resolver<TaxRuleFormValues>,
        defaultValues: {
            name: '',
            type: TaxRuleType.FLAT_RATE,
            effectiveFrom: '',
            isDefault: false,
            brackets: [],
        },
    });

    const { fields, append, remove } = useFieldArray({
        control: form.control,
        name: 'brackets',
    });

    const watchedType = form.watch('type');

    function openCreate() {
        setEditTarget(null);
        form.reset({
            name: '',
            type: TaxRuleType.FLAT_RATE,
            effectiveFrom: '',
            isDefault: false,
            brackets: [],
        });
        setDialogOpen(true);
    }

    function openEdit(rule: TaxRule) {
        setEditTarget(rule);
        form.reset({
            name: rule.name,
            type: rule.type as TaxRuleType,
            value: rule.value ?? undefined,
            effectiveFrom: rule.effectiveFrom ? rule.effectiveFrom.slice(0, 10) : '',
            effectiveTo: rule.effectiveTo ? rule.effectiveTo.slice(0, 10) : undefined,
            isDefault: rule.isDefault,
            brackets: rule.brackets?.map((b) => ({
                minAmount: b.minAmount,
                maxAmount: b.maxAmount ?? undefined,
                rate: b.rate,
                fixedAmount: b.fixedAmount ?? undefined,
            })) ?? [],
        });
        setDialogOpen(true);
    }

    async function onSubmit(values: TaxRuleFormValues) {
        const dto = {
            ...values,
            brackets: values.type === TaxRuleType.PROGRESSIVE ? (values.brackets ?? []) : undefined,
            value: values.type === TaxRuleType.FLAT_RATE ? values.value : undefined,
        };

        if (editTarget) {
            await updateMutation.mutateAsync({ id: editTarget.id, dto });
        } else {
            await createMutation.mutateAsync(dto);
        }
        setDialogOpen(false);
    }

    const isPending = createMutation.isPending || updateMutation.isPending;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Tax Rules</h1>
                    <p className="text-sm text-muted-foreground">
                        Configure flat-rate and progressive tax rules applied during payroll.
                    </p>
                </div>
                <Button onClick={openCreate} className="gap-2">
                    <Plus className="h-4 w-4" />
                    New Tax Rule
                </Button>
            </div>

            {/* List */}
            {isLoading ? (
                <LoadingSkeleton rows={4} />
            ) : rules.length === 0 ? (
                <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-16 text-center">
                    <p className="text-sm font-medium text-slate-600">No tax rules configured</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                        Add a flat-rate or progressive tax rule to apply during payroll runs.
                    </p>
                    <Button variant="outline" size="sm" className="mt-4 gap-2" onClick={openCreate}>
                        <Plus className="h-4 w-4" />
                        Add Tax Rule
                    </Button>
                </div>
            ) : (
                <div className="space-y-3">
                    {rules.map((rule) => (
                        <TaxRuleCard
                            key={rule.id}
                            rule={rule}
                            onEdit={openEdit}
                            onDelete={setDeleteTarget}
                        />
                    ))}
                </div>
            )}

            {/* Create / Edit Dialog */}
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>{editTarget ? 'Edit Tax Rule' : 'New Tax Rule'}</DialogTitle>
                    </DialogHeader>

                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                            {/* Name */}
                            <FormField
                                control={form.control}
                                name="name"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Name</FormLabel>
                                        <FormControl>
                                            <Input placeholder="e.g. PAYE 2025" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            {/* Type */}
                            <FormField
                                control={form.control}
                                name="type"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Type</FormLabel>
                                        <Select value={field.value} onValueChange={field.onChange}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <SelectItem value={TaxRuleType.FLAT_RATE}>Flat Rate</SelectItem>
                                                <SelectItem value={TaxRuleType.PROGRESSIVE}>Progressive (Brackets)</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            {/* Flat rate fields */}
                            {watchedType === TaxRuleType.FLAT_RATE && (
                                <FormField
                                    control={form.control}
                                    name="value"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Rate (%)</FormLabel>
                                            <FormControl>
                                                <Input type="number" step="0.01" min="0" max="100" placeholder="e.g. 15" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            )}

                            {/* Dates */}
                            <div className="grid grid-cols-2 gap-3">
                                <FormField
                                    control={form.control}
                                    name="effectiveFrom"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Effective From</FormLabel>
                                            <FormControl>
                                                <Input type="date" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="effectiveTo"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Effective To <span className="text-muted-foreground font-normal">(optional)</span></FormLabel>
                                            <FormControl>
                                                <Input type="date" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            {/* Default toggle */}
                            <FormField
                                control={form.control}
                                name="isDefault"
                                render={({ field }) => (
                                    <FormItem className="flex items-center gap-3 rounded-lg border px-4 py-3">
                                        <FormControl>
                                            <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                                        </FormControl>
                                        <div>
                                            <FormLabel className="text-sm font-medium cursor-pointer">Set as default</FormLabel>
                                            <p className="text-xs text-muted-foreground">Apply this rule automatically to all employees unless overridden.</p>
                                        </div>
                                    </FormItem>
                                )}
                            />

                            {/* Progressive brackets */}
                            {watchedType === TaxRuleType.PROGRESSIVE && (
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between">
                                        <FormLabel>Tax Brackets</FormLabel>
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            className="gap-1 h-7 text-xs"
                                            onClick={() => append({ minAmount: 0, rate: 0, fixedAmount: 0 })}
                                        >
                                            <Plus className="h-3 w-3" />
                                            Add Bracket
                                        </Button>
                                    </div>

                                    {fields.length === 0 && (
                                        <p className="text-xs text-muted-foreground text-center py-3 border rounded-md">
                                            No brackets yet — click "Add Bracket" to define the progressive tiers.
                                        </p>
                                    )}

                                    {fields.map((field, index) => (
                                        <div key={field.id} className="grid grid-cols-[1fr_1fr_1fr_1fr_auto] gap-2 items-end rounded-md border p-3">
                                            <FormField
                                                control={form.control}
                                                name={`brackets.${index}.minAmount`}
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel className="text-xs">Min Amount</FormLabel>
                                                        <FormControl>
                                                            <Input type="number" min="0" step="1" {...field} />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                            <FormField
                                                control={form.control}
                                                name={`brackets.${index}.maxAmount`}
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel className="text-xs">Max Amount</FormLabel>
                                                        <FormControl>
                                                            <Input type="number" min="0" step="1" placeholder="∞" {...field} />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                            <FormField
                                                control={form.control}
                                                name={`brackets.${index}.rate`}
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel className="text-xs">Rate (%)</FormLabel>
                                                        <FormControl>
                                                            <Input type="number" min="0" max="100" step="0.01" {...field} />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                            <FormField
                                                control={form.control}
                                                name={`brackets.${index}.fixedAmount`}
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel className="text-xs">Fixed Amount</FormLabel>
                                                        <FormControl>
                                                            <Input type="number" min="0" step="1" placeholder="0" {...field} />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 text-destructive hover:text-destructive mb-0.5"
                                                onClick={() => remove(index)}
                                            >
                                                <Trash2 className="h-3.5 w-3.5" />
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                            )}

                            <DialogFooter>
                                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                                    Cancel
                                </Button>
                                <Button type="submit" disabled={isPending}>
                                    {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    {editTarget ? 'Save Changes' : 'Create Rule'}
                                </Button>
                            </DialogFooter>
                        </form>
                    </Form>
                </DialogContent>
            </Dialog>

            {/* Delete confirm */}
            <ConfirmDialog
                open={!!deleteTarget}
                onOpenChange={(open) => !open && setDeleteTarget(null)}
                title={`Delete "${deleteTarget?.name}"?`}
                description="This tax rule will be permanently removed. Existing payroll calculations that used it will not be affected."
                confirmLabel="Delete"
                variant="destructive"
                onConfirm={async () => {
                    if (deleteTarget) {
                        await deleteMutation.mutateAsync(deleteTarget.id);
                        setDeleteTarget(null);
                    }
                }}
                loading={deleteMutation.isPending}
            />
        </div>
    );
}
