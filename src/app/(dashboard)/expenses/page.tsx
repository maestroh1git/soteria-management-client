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
import { useCan } from '@/lib/hooks/use-can';
import {
    useExpenses,
    useAccounts,
    useCreateExpense,
    useExpenseAction,
    usePayExpense,
} from '@/lib/hooks/use-finance';
import { formatDate } from '@/lib/utils/dates';
import type { Expense, ExpenseStatus } from '@/lib/api/finance';
import { Money } from '@/components/common/money';
import { StatusBadge } from '@/components/common/status-badge';

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
    const { user } = useAuth();
    const can = useCan();
    // Raising is the finance office's; which moves each expense offers is the
    // server's answer for this caller.
    const canRaise = can('expenses.raise');

    const [status, setStatus] = useState('all');
    const [raising, setRaising] = useState(false);
    const [paying, setPaying] = useState<Expense | null>(null);

    const { data: expenses = [], isLoading, isError } = useExpenses(status);
    // Accounts only feed the raise and pay forms.
    const { data: accounts = [] } = useAccounts(undefined, canRaise);

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
                    isError={isError}
                    subject="the expenses"
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
                            canRaise={canRaise}
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
    canRaise,
    onPay,
}: {
    expense: Expense;
    currentUserId?: string;
    canRaise: boolean;
    onPay: () => void;
}) {
    const act = useExpenseAction(expense.id);
    // The moves this person may make: the server filters the state machine by
    // the caller (ROADMAP-EXECUTION.md, S2.4), so this renders what it sends.
    const moves = expense.allowedTransitions;

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
                        <StatusBadge kind="expense" status={expense.status} />
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
                            canRaise &&
                            (expense.status === 'DRAFT' || expense.status === 'SUBMITTED')
                        }
                    />
                </div>

                <div className="flex items-center gap-4">
                    <p className="text-lg font-semibold tabular-nums">
                        <Money value={expense.amount} />
                    </p>
                    <div className="flex flex-wrap gap-2">
                        {moves.map((to: ExpenseStatus) => {
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
                        <Label htmlFor="expenses-page-what-is-it-for">What is it for</Label>
                        <Input id="expenses-page-what-is-it-for"
                            placeholder="Diesel for the generator, July"
                            value={form.description}
                            onChange={(e) => set('description', e.target.value)}
                        />
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-2">
                            <Label htmlFor="expenses-page-amount">Amount (₦)</Label>
                            <Input id="expenses-page-amount"
                                type="number"
                                min="0"
                                step="0.01"
                                value={form.amount}
                                onChange={(e) => set('amount', e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="expenses-page-date">Date</Label>
                            <Input id="expenses-page-date"
                                type="date"
                                value={form.expenseDate}
                                onChange={(e) => set('expenseDate', e.target.value)}
                            />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="expenses-page-charge-to">Charge to</Label>
                        <Select
                            value={form.accountId}
                            onValueChange={(v) => set('accountId', v)}
                        >
                            <SelectTrigger id="expenses-page-charge-to">
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
                        <Label htmlFor="expenses-page-paid-to-optional">Paid to (optional)</Label>
                        <Input id="expenses-page-paid-to-optional"
                            value={form.vendor}
                            onChange={(e) => set('vendor', e.target.value)}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="expenses-page-notes-optional">Notes (optional)</Label>
                        <Textarea id="expenses-page-notes-optional"
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
                        <Money value={expense.amount} /> — {expense.description}. This posts to the
                        ledger at the same moment; there is no way to record one without
                        the other.
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="expenses-page-paid-from">Paid from</Label>
                        <Select
                            value={form.paymentAccountId}
                            onValueChange={(v) => setForm({ ...form, paymentAccountId: v })}
                        >
                            <SelectTrigger id="expenses-page-paid-from">
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
                            <Label htmlFor="expenses-page-how">How</Label>
                            <Select
                                value={form.paymentMethod}
                                onValueChange={(v) =>
                                    setForm({ ...form, paymentMethod: v as any })
                                }
                            >
                                <SelectTrigger id="expenses-page-how">
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
                            <Label htmlFor="expenses-page-when">When</Label>
                            <Input id="expenses-page-when"
                                type="date"
                                value={form.paidOn}
                                onChange={(e) => setForm({ ...form, paidOn: e.target.value })}
                            />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="expenses-page-reference-optional">Reference (optional)</Label>
                        <Input id="expenses-page-reference-optional"
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
