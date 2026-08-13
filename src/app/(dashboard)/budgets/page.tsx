'use client';

import { useState } from 'react';
import { Plus, Loader2, AlertTriangle, Trash2 } from 'lucide-react';

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
import { EmptyState } from '@/components/common/empty-state';
import { useAuth } from '@/lib/hooks/use-auth';
import {
    useBudgetVariance,
    useAccounts,
    useCreateBudget,
    useDeleteBudget,
} from '@/lib/hooks/use-finance';
import { useDepartmentsList } from '@/lib/hooks/use-onboarding';

const money = (v: string) => {
    const [whole, fraction = '00'] = v.split('.');
    const sign = whole.startsWith('-') ? '-' : '';
    return `${sign}${whole.replace('-', '').replace(/\B(?=(\d{3})+(?!\d))/g, ',')}.${fraction}`;
};

/**
 * What was intended, against what the ledger says happened.
 *
 * Actuals are the ledger's, so payroll counts here as well as expenses —
 * a budget that quietly excluded the largest thing a school spends money on
 * would be worse than not offering one.
 */
export default function BudgetsPage() {
    const { hasRole } = useAuth();
    const canManage = hasRole(['tenant_owner', 'ADMIN', 'FINANCE_ADMIN']);

    const [creating, setCreating] = useState(false);
    const { data: variance = [], isLoading } = useBudgetVariance();
    const { data: accounts = [] } = useAccounts();
    const { data: departments = [] } = useDepartmentsList();
    const remove = useDeleteBudget();

    const over = variance.filter((v) => v.overBudget);

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Budgets</h1>
                    <p className="text-muted-foreground">
                        Intended spend, against what the books say actually went out.
                    </p>
                </div>
                {canManage && (
                    <Button onClick={() => setCreating(true)}>
                        <Plus className="mr-2 h-4 w-4" /> Set a budget
                    </Button>
                )}
            </div>

            {over.length > 0 && (
                <Card className="border-destructive/50 bg-destructive/5">
                    <CardHeader className="pb-3">
                        <CardTitle className="flex items-center gap-2 text-base text-destructive">
                            <AlertTriangle className="h-4 w-4" />
                            {over.length} over budget
                        </CardTitle>
                        <CardDescription>
                            {over
                                .map(
                                    (v) =>
                                        `${v.accountName}${v.department ? ` (${v.department})` : ''}`,
                                )
                                .join(', ')}
                        </CardDescription>
                    </CardHeader>
                </Card>
            )}

            {isLoading ? (
                <p className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" /> Loading…
                </p>
            ) : variance.length === 0 ? (
                <EmptyState
                    title="No budgets set"
                    description="A budget is an amount for one category over a period — a session, a term, a year. Spending is counted from the ledger."
                />
            ) : (
                <div className="space-y-3">
                    {variance.map((v) => {
                        // Clamped for the BAR only; the figures below are never clamped,
                        // because how far over is the question being asked.
                        const pct = Math.min(v.usedPercent ?? 0, 100);
                        return (
                            <Card key={v.budgetId}>
                                <CardContent className="space-y-3 pt-6">
                                    <div className="flex flex-wrap items-start justify-between gap-2">
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <p className="font-medium">{v.accountName}</p>
                                                {v.department && (
                                                    <Badge variant="outline">{v.department}</Badge>
                                                )}
                                                {v.overBudget && (
                                                    <Badge variant="destructive">over</Badge>
                                                )}
                                            </div>
                                            <p className="text-sm text-muted-foreground">
                                                {v.periodStart} → {v.periodEnd}
                                            </p>
                                        </div>
                                        {canManage && (
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => remove.mutate(v.budgetId)}
                                                aria-label="Remove budget"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        )}
                                    </div>

                                    <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                                        <div
                                            className={`h-full rounded-full ${
                                                v.overBudget
                                                    ? 'bg-destructive'
                                                    : pct > 80
                                                      ? 'bg-amber-500'
                                                      : 'bg-green-600'
                                            }`}
                                            style={{ width: `${pct}%` }}
                                        />
                                    </div>

                                    <div className="grid gap-4 sm:grid-cols-4">
                                        <Figure label="Budget" value={money(v.budgeted)} />
                                        <Figure label="Spent" value={money(v.actual)} />
                                        <Figure
                                            label={v.overBudget ? 'Over by' : 'Left'}
                                            value={money(
                                                v.overBudget
                                                    ? v.remaining.replace('-', '')
                                                    : v.remaining,
                                            )}
                                            tone={v.overBudget ? 'text-destructive' : undefined}
                                        />
                                        <div>
                                            <p className="text-xs uppercase tracking-wide text-muted-foreground">
                                                Used
                                            </p>
                                            <p className="text-lg font-semibold tabular-nums">
                                                {v.usedPercent === null ? '—' : `${v.usedPercent}%`}
                                            </p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>
            )}

            <SetBudgetDialog
                open={creating}
                onOpenChange={setCreating}
                accounts={accounts.filter((a) => a.type === 'EXPENSE')}
                departments={departments}
            />
        </div>
    );
}

function Figure({
    label,
    value,
    tone,
}: {
    label: string;
    value: string;
    tone?: string;
}) {
    return (
        <div>
            <p className="text-xs uppercase tracking-wide text-muted-foreground">
                {label}
            </p>
            <p className={`text-lg font-semibold tabular-nums ${tone ?? ''}`}>
                ₦{value}
            </p>
        </div>
    );
}

function SetBudgetDialog({
    open,
    onOpenChange,
    accounts,
    departments,
}: {
    open: boolean;
    onOpenChange: (v: boolean) => void;
    accounts: Array<{ id: string; name: string }>;
    departments: Array<{ id: string; name: string }>;
}) {
    const create = useCreateBudget();
    const [form, setForm] = useState({
        accountId: '',
        departmentId: '',
        periodStart: '',
        periodEnd: '',
        amount: '',
    });
    const set = (k: string, v: string) => setForm({ ...form, [k]: v });

    const datesWrong =
        !!form.periodStart && !!form.periodEnd && form.periodEnd < form.periodStart;
    const ready =
        form.accountId &&
        form.periodStart &&
        form.periodEnd &&
        Number(form.amount) >= 0 &&
        form.amount !== '' &&
        !datesWrong;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Set a budget</DialogTitle>
                    <DialogDescription>
                        Dates rather than a term, so this works whether or not the
                        organisation runs an academic calendar. Align them to your session
                        if you have one.
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                    <div className="space-y-2">
                        <Label>Category</Label>
                        <Select
                            value={form.accountId}
                            onValueChange={(v) => set('accountId', v)}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Which expense account" />
                            </SelectTrigger>
                            <SelectContent>
                                {accounts.map((a) => (
                                    <SelectItem key={a.id} value={a.id}>
                                        {a.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label>Department (optional)</Label>
                        <Select
                            value={form.departmentId}
                            onValueChange={(v) => set('departmentId', v)}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="The whole organisation" />
                            </SelectTrigger>
                            <SelectContent>
                                {departments.map((d) => (
                                    <SelectItem key={d.id} value={d.id}>
                                        {d.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <p className="text-xs text-muted-foreground">
                            Leave blank for a budget covering everything on this category.
                        </p>
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-2">
                            <Label>From</Label>
                            <Input
                                type="date"
                                value={form.periodStart}
                                onChange={(e) => set('periodStart', e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>To</Label>
                            <Input
                                type="date"
                                value={form.periodEnd}
                                onChange={(e) => set('periodEnd', e.target.value)}
                            />
                            {datesWrong && (
                                <p className="text-sm text-destructive">
                                    The end must not be before the start.
                                </p>
                            )}
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label>Amount (₦)</Label>
                        <Input
                            type="number"
                            min="0"
                            step="0.01"
                            value={form.amount}
                            onChange={(e) => set('amount', e.target.value)}
                        />
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                        Cancel
                    </Button>
                    <Button
                        disabled={!ready || create.isPending}
                        onClick={async () => {
                            await create.mutateAsync({
                                accountId: form.accountId,
                                departmentId: form.departmentId || undefined,
                                periodStart: form.periodStart,
                                periodEnd: form.periodEnd,
                                amount: Number(form.amount),
                            });
                            setForm({
                                accountId: '',
                                departmentId: '',
                                periodStart: '',
                                periodEnd: '',
                                amount: '',
                            });
                            onOpenChange(false);
                        }}
                    >
                        {create.isPending && (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        )}
                        Set budget
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
