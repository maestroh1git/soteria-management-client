'use client';

import { useState } from 'react';
import { Plus, Loader2, Info, Wallet } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
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
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import { EmptyState } from '@/components/common/empty-state';
import { ExpenseReceipts } from '@/components/finance/expense-receipts';
import { useAuth } from '@/lib/hooks/use-auth';
import {
    useExpenses,
    useAccounts,
    useCreateExpense,
    useExpenseAction,
    usePayExpense,
} from '@/lib/hooks/use-finance';
import { formatDate } from '@/lib/utils/dates';
import type { Expense, ExpenseStatus } from '@/lib/api/finance';

const money = (v: string) => {
    const [whole, fraction = '00'] = v.split('.');
    return `${whole.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}.${fraction}`;
};

const STATUS_STYLE: Record<string, string> = {
    DRAFT: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
    SUBMITTED: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
    APPROVED: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300',
    PAID: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
    REJECTED: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
    CANCELLED: 'bg-muted text-muted-foreground',
};

const ACTION_LABEL: Record<string, string> = {
    SUBMITTED: 'Send for approval',
    APPROVED: 'Approve',
    REJECTED: 'Reject',
    CANCELLED: 'Cancel',
    DRAFT: 'Reopen',
    PAID: 'Record payment',
};

const ACTION_ENDPOINT: Record<string, 'submit' | 'approve' | 'reject' | 'cancel' | 'reopen'> = {
    SUBMITTED: 'submit',
    APPROVED: 'approve',
    REJECTED: 'reject',
    CANCELLED: 'cancel',
    DRAFT: 'reopen',
};

export default function ExpensesPage() {
    const { user, hasRole } = useAuth();
    const canRaise = hasRole(['tenant_owner', 'ADMIN', 'FINANCE_ADMIN']);

    const [status, setStatus] = useState('all');
    const [raising, setRaising] = useState(false);
    const [paying, setPaying] = useState<Expense | null>(null);

    const { data: expenses = [], isLoading } = useExpenses(status);
    const { data: accounts = [] } = useAccounts();

    const expenseAccounts = accounts.filter((a) => a.type === 'EXPENSE');
    const assetAccounts = accounts.filter((a) => a.type === 'ASSET');

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Expenses</h1>
                    <p className="text-muted-foreground">
                        Money out, other than payroll.
                    </p>
                </div>
                {canRaise && (
                    <Button onClick={() => setRaising(true)}>
                        <Plus className="mr-2 h-4 w-4" /> Raise an expense
                    </Button>
                )}
            </div>

            <Select value={status} onValueChange={setStatus}>
                <SelectTrigger className="w-52">
                    <SelectValue />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    {['DRAFT', 'SUBMITTED', 'APPROVED', 'PAID', 'REJECTED', 'CANCELLED'].map(
                        (s) => (
                            <SelectItem key={s} value={s}>
                                {s.toLowerCase()}
                            </SelectItem>
                        ),
                    )}
                </SelectContent>
            </Select>

            {isLoading ? (
                <p className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" /> Loading…
                </p>
            ) : expenses.length === 0 ? (
                <EmptyState
                    title="No expenses"
                    description="Raise one when the school spends money on something other than salaries."
                />
            ) : (
                <div className="space-y-3">
                    {expenses.map((e) => (
                        <ExpenseRow
                            key={e.id}
                            expense={e}
                            currentUserId={user?.id}
                            onPay={() => setPaying(e)}
                        />
                    ))}
                </div>
            )}

            <RaiseDialog
                open={raising}
                onOpenChange={setRaising}
                accounts={expenseAccounts}
            />
            {paying && (
                <PayDialog
                    expense={paying}
                    accounts={assetAccounts}
                    onClose={() => setPaying(null)}
                />
            )}
        </div>
    );
}

function ExpenseRow({
    expense,
    currentUserId,
    onPay,
}: {
    expense: Expense;
    currentUserId?: string;
    onPay: () => void;
}) {
    const act = useExpenseAction(expense.id);

    /**
     * The one rule worth showing rather than enforcing only on the server.
     *
     * Approval is refused when the approver raised it. Letting somebody press
     * Approve and meet a 403 would make the refusal the first they hear of the
     * rule; disabling it with the reason attached teaches it once.
     */
    const isOwn = !!currentUserId && expense.requestedBy === currentUserId;

    return (
        <Card>
            <CardContent className="flex flex-wrap items-center justify-between gap-4 pt-6">
                <div className="min-w-0">
                    <div className="flex items-center gap-2">
                        <span className="font-mono text-xs text-muted-foreground">
                            {expense.expenseNumber}
                        </span>
                        <span
                            className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_STYLE[expense.status]}`}
                        >
                            {expense.status.toLowerCase()}
                        </span>
                    </div>
                    <p className="mt-1 font-medium">{expense.description}</p>
                    <p className="text-sm text-muted-foreground">
                        {expense.account?.name ?? '—'}
                        {expense.department?.name && ` · ${expense.department.name}`}
                        {expense.vendor && ` · ${expense.vendor}`}
                        {' · '}
                        {formatDate(expense.expenseDate)}
                    </p>
                    <ExpenseReceipts
                        expenseId={expense.id}
                        count={expense.receiptCount ?? 0}
                        editable={
                            expense.status === 'DRAFT' || expense.status === 'SUBMITTED'
                        }
                    />
                </div>

                <div className="flex items-center gap-4">
                    <p className="text-lg font-semibold tabular-nums">
                        ₦{money(expense.amount)}
                    </p>
                    <div className="flex flex-wrap gap-2">
                        {expense.allowedTransitions.map((to: ExpenseStatus) => {
                            if (to === 'PAID') {
                                return (
                                    <Button key={to} size="sm" onClick={onPay}>
                                        <Wallet className="mr-2 h-4 w-4" />
                                        Record payment
                                    </Button>
                                );
                            }
                            const selfApproval = to === 'APPROVED' && isOwn;
                            // Nothing goes for approval without evidence. The
                            // rule lives on the server; this stops a refusal
                            // being the first anybody hears of it.
                            const noReceipt =
                                to === 'SUBMITTED' && (expense.receiptCount ?? 0) === 0;
                            const blocked = selfApproval || noReceipt;
                            const button = (
                                <Button
                                    key={to}
                                    size="sm"
                                    variant={to === 'REJECTED' ? 'destructive' : 'outline'}
                                    disabled={blocked || act.isPending}
                                    onClick={() =>
                                        act.mutate({ action: ACTION_ENDPOINT[to] })
                                    }
                                >
                                    {ACTION_LABEL[to] ?? to.toLowerCase()}
                                </Button>
                            );
                            if (!blocked) return button;
                            return (
                                <TooltipProvider key={to}>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <span tabIndex={0}>{button}</span>
                                        </TooltipTrigger>
                                        <TooltipContent className="max-w-xs">
                                            {noReceipt
                                                ? 'Attach the receipt first. Every expense needs one before it goes for approval.'
                                                : 'You raised this one. Somebody else has to approve it — raising and approving your own payment is the whole thing this separation prevents.'}
                                        </TooltipContent>
                                    </Tooltip>
                                </TooltipProvider>
                            );
                        })}
                        {expense.allowedTransitions.length === 0 && (
                            <span className="flex items-center gap-1 text-sm text-muted-foreground">
                                <Info className="h-3 w-3" />
                                {expense.status === 'PAID' ? 'In the books' : 'Closed'}
                            </span>
                        )}
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

function RaiseDialog({
    open,
    onOpenChange,
    accounts,
}: {
    open: boolean;
    onOpenChange: (v: boolean) => void;
    accounts: Array<{ id: string; code: string; name: string }>;
}) {
    const create = useCreateExpense();
    const [form, setForm] = useState({
        description: '',
        amount: '',
        expenseDate: new Date().toISOString().slice(0, 10),
        accountId: '',
        vendor: '',
        notes: '',
    });
    const set = (k: string, v: string) => setForm({ ...form, [k]: v });

    const ready =
        form.description.trim() && Number(form.amount) > 0 && form.accountId;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Raise an expense</DialogTitle>
                    <DialogDescription>
                        It starts as a draft. Somebody else approves it, and it reaches the
                        books when it is paid.
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                    <div className="space-y-2">
                        <Label>What is it for</Label>
                        <Input
                            placeholder="Diesel for the generator, July"
                            value={form.description}
                            onChange={(e) => set('description', e.target.value)}
                        />
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
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
                        <div className="space-y-2">
                            <Label>Date</Label>
                            <Input
                                type="date"
                                value={form.expenseDate}
                                onChange={(e) => set('expenseDate', e.target.value)}
                            />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label>Charge to</Label>
                        <Select
                            value={form.accountId}
                            onValueChange={(v) => set('accountId', v)}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Which category" />
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
                        <Label>Paid to (optional)</Label>
                        <Input
                            value={form.vendor}
                            onChange={(e) => set('vendor', e.target.value)}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label>Notes (optional)</Label>
                        <Textarea
                            rows={2}
                            value={form.notes}
                            onChange={(e) => set('notes', e.target.value)}
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
                                description: form.description.trim(),
                                amount: Number(form.amount),
                                expenseDate: form.expenseDate,
                                accountId: form.accountId,
                                vendor: form.vendor.trim() || undefined,
                                notes: form.notes.trim() || undefined,
                            });
                            onOpenChange(false);
                        }}
                    >
                        {create.isPending && (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        )}
                        Raise
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

function PayDialog({
    expense,
    accounts,
    onClose,
}: {
    expense: Expense;
    accounts: Array<{ id: string; code: string; name: string }>;
    onClose: () => void;
}) {
    const pay = usePayExpense(expense.id);
    const [form, setForm] = useState({
        paymentAccountId: '',
        paymentMethod: 'BANK_TRANSFER' as 'BANK_TRANSFER' | 'CASH' | 'CHEQUE',
        paymentReference: '',
        paidOn: new Date().toISOString().slice(0, 10),
    });

    return (
        <Dialog open onOpenChange={(o) => !o && onClose()}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Record payment</DialogTitle>
                    <DialogDescription>
                        ₦{money(expense.amount)} — {expense.description}. This posts to the
                        ledger at the same moment; there is no way to record one without
                        the other.
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                    <div className="space-y-2">
                        <Label>Paid from</Label>
                        <Select
                            value={form.paymentAccountId}
                            onValueChange={(v) => setForm({ ...form, paymentAccountId: v })}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Which account did the money leave" />
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
                    <div className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-2">
                            <Label>How</Label>
                            <Select
                                value={form.paymentMethod}
                                onValueChange={(v) =>
                                    setForm({ ...form, paymentMethod: v as any })
                                }
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="BANK_TRANSFER">Bank transfer</SelectItem>
                                    <SelectItem value="CASH">Cash</SelectItem>
                                    <SelectItem value="CHEQUE">Cheque</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>When</Label>
                            <Input
                                type="date"
                                value={form.paidOn}
                                onChange={(e) => setForm({ ...form, paidOn: e.target.value })}
                            />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label>Reference (optional)</Label>
                        <Input
                            placeholder="Transfer reference, cheque number"
                            value={form.paymentReference}
                            onChange={(e) =>
                                setForm({ ...form, paymentReference: e.target.value })
                            }
                        />
                        <p className="text-xs text-muted-foreground">
                            Worth filling in — it is what makes a bank statement match this
                            later.
                        </p>
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={onClose}>
                        Cancel
                    </Button>
                    <Button
                        disabled={!form.paymentAccountId || pay.isPending}
                        onClick={async () => {
                            await pay.mutateAsync({
                                paymentAccountId: form.paymentAccountId,
                                paymentMethod: form.paymentMethod,
                                paymentReference: form.paymentReference.trim() || undefined,
                                paidOn: form.paidOn,
                            });
                            onClose();
                        }}
                    >
                        {pay.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Pay and post
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
