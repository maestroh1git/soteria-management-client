'use client';

import { useEffect, useMemo, useState } from 'react';
import { Loader2, Plus, Info } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
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
import { useAccounts } from '@/lib/hooks/use-finance';
import {
    useOutstanding,
    usePayments,
    useRecordPayment,
    useVoidPayment,
} from '@/lib/hooks/use-fees';

const money = (v: string) => {
    const [whole, fraction = '00'] = (v ?? '0').split('.');
    const sign = whole.startsWith('-') ? '-' : '';
    return `${sign}${whole.replace('-', '').replace(/\B(?=(\d{3})+(?!\d))/g, ',')}.${fraction}`;
};

/** Kobo, so the running total of an allocation never drifts. */
const kobo = (v: string | number) => Math.round(Number(v || 0) * 100);

const METHODS = [
    { value: 'BANK_TRANSFER', label: 'Bank transfer' },
    { value: 'CASH', label: 'Cash' },
    { value: 'POS', label: 'POS' },
    { value: 'CHEQUE', label: 'Cheque' },
];

/**
 * Money arriving.
 *
 * The dialog is built around what actually happens at a school gate: a parent
 * hands over an amount that has nothing to do with any one invoice, and
 * somebody decides what it settles. So the amount comes first, the outstanding
 * bills are listed with a running "still to allocate", and anything left over
 * is shown as the parent's credit rather than being quietly forced onto a bill.
 */
export default function PaymentsPage() {
    const [recordOpen, setRecordOpen] = useState(false);
    const { data: payments, isLoading } = usePayments();
    const voidPayment = useVoidPayment();
    const [voidTarget, setVoidTarget] = useState<string | null>(null);
    const [voidReason, setVoidReason] = useState('');

    return (
        <div className="space-y-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-semibold tracking-tight">Receipts</h1>
                    <p className="text-sm text-muted-foreground">
                        Money received, and what it settled.
                    </p>
                </div>
                <Button onClick={() => setRecordOpen(true)}>
                    <Plus className="mr-2 h-4 w-4" />
                    Record a payment
                </Button>
            </div>

            {isLoading ? (
                <div className="flex justify-center py-12">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
            ) : !payments?.length ? (
                <EmptyState
                    title="No receipts yet"
                    description="Record a payment when money arrives — cash at the gate, or a transfer off the statement."
                />
            ) : (
                <Card>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="border-b bg-muted/40">
                                <tr>
                                    <th className="px-4 py-3 text-left font-medium">Receipt</th>
                                    <th className="px-4 py-3 text-left font-medium">Child</th>
                                    <th className="px-4 py-3 text-left font-medium">Paid on</th>
                                    <th className="px-4 py-3 text-left font-medium">Method</th>
                                    <th className="px-4 py-3 text-right font-medium">Amount</th>
                                    <th className="px-4 py-3 text-right font-medium">Unapplied</th>
                                    <th className="px-4 py-3" />
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {payments.map((p) => (
                                    <tr
                                        key={p.id}
                                        className={p.status === 'VOIDED' ? 'opacity-50' : ''}
                                    >
                                        <td className="px-4 py-3">
                                            <div className="font-medium">{p.receiptNumber}</div>
                                            {p.reference && (
                                                <div className="text-xs text-muted-foreground">
                                                    {p.reference}
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-4 py-3">
                                            <div>{p.studentName}</div>
                                            <div className="text-xs text-muted-foreground">
                                                {p.admissionNumber}
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 text-muted-foreground">
                                            {p.paidOn}
                                        </td>
                                        <td className="px-4 py-3 text-muted-foreground">
                                            {p.method.replace('_', ' ').toLowerCase()}
                                        </td>
                                        <td className="px-4 py-3 text-right font-semibold tabular-nums">
                                            ₦{money(p.amount)}
                                        </td>
                                        <td className="px-4 py-3 text-right tabular-nums">
                                            {Number(p.unallocated) > 0 ? (
                                                <span className="text-amber-600">
                                                    ₦{money(p.unallocated)}
                                                </span>
                                            ) : (
                                                <span className="text-muted-foreground">—</span>
                                            )}
                                        </td>
                                        <td className="px-4 py-3 text-right">
                                            {p.status === 'VOIDED' ? (
                                                <Badge variant="outline">Voided</Badge>
                                            ) : (
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => {
                                                        setVoidTarget(p.id);
                                                        setVoidReason('');
                                                    }}
                                                >
                                                    Void
                                                </Button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </Card>
            )}

            <RecordPaymentDialog open={recordOpen} onOpenChange={setRecordOpen} />

            <Dialog
                open={!!voidTarget}
                onOpenChange={(v) => !v && setVoidTarget(null)}
            >
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Void this receipt?</DialogTitle>
                        <DialogDescription>
                            The posting is reversed and whatever it settled becomes
                            outstanding again. The receipt itself stays, so the record of
                            what was believed at the time survives.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-1.5">
                        <Label htmlFor="void-reason">Reason</Label>
                        <Textarea
                            id="void-reason"
                            value={voidReason}
                            placeholder="Cheque returned unpaid"
                            onChange={(e) => setVoidReason(e.target.value)}
                        />
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setVoidTarget(null)}>
                            Keep it
                        </Button>
                        <Button
                            variant="destructive"
                            disabled={voidReason.trim().length < 3 || voidPayment.isPending}
                            onClick={async () => {
                                await voidPayment.mutateAsync({
                                    id: voidTarget!,
                                    reason: voidReason.trim(),
                                });
                                setVoidTarget(null);
                            }}
                        >
                            {voidPayment.isPending && (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            )}
                            Void receipt
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}

function RecordPaymentDialog({
    open,
    onOpenChange,
}: {
    open: boolean;
    onOpenChange: (v: boolean) => void;
}) {
    const { data: accounts } = useAccounts();
    const { data: outstanding } = useOutstanding();
    const record = useRecordPayment();

    const [studentId, setStudentId] = useState('');
    const [amount, setAmount] = useState('');
    const [method, setMethod] = useState('BANK_TRANSFER');
    const [paidOn, setPaidOn] = useState(new Date().toISOString().slice(0, 10));
    const [depositAccountId, setDepositAccountId] = useState('');
    const [reference, setReference] = useState('');
    const [payerName, setPayerName] = useState('');
    const [allocations, setAllocations] = useState<Record<string, string>>({});

    const assetAccounts = (accounts ?? []).filter((a) => a.type === 'ASSET');

    // Everybody with something owing, so one transfer can settle siblings.
    const children = useMemo(() => {
        const seen = new Map<string, { id: string; name: string; number: string }>();
        for (const row of outstanding ?? []) {
            if (!seen.has(row.studentId)) {
                seen.set(row.studentId, {
                    id: row.studentId,
                    name: row.studentName,
                    number: row.admissionNumber,
                });
            }
        }
        return [...seen.values()];
    }, [outstanding]);

    useEffect(() => {
        if (!depositAccountId && assetAccounts.length) {
            setDepositAccountId(
                (assetAccounts.find((a) => a.code === 'BANK') ?? assetAccounts[0]).id,
            );
        }
    }, [assetAccounts, depositAccountId]);

    const allocatedKobo = Object.values(allocations).reduce(
        (sum, v) => sum + kobo(v),
        0,
    );
    const amountKobo = kobo(amount);
    const remainingKobo = amountKobo - allocatedKobo;

    const reset = () => {
        setStudentId('');
        setAmount('');
        setReference('');
        setPayerName('');
        setAllocations({});
    };

    const submit = async () => {
        const lines = Object.entries(allocations)
            .filter(([, v]) => kobo(v) > 0)
            .map(([invoiceId, v]) => ({ invoiceId, amount: Number(v) }));

        await record.mutateAsync({
            studentId,
            amount: Number(amount),
            method,
            paidOn,
            depositAccountId,
            reference: reference.trim() || undefined,
            payerName: payerName.trim() || undefined,
            allocations: lines.length ? lines : undefined,
        });
        reset();
        onOpenChange(false);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <DialogTitle>Record a payment</DialogTitle>
                    <DialogDescription>
                        Anything not applied to a bill is kept as the family&rsquo;s
                        credit.
                    </DialogDescription>
                </DialogHeader>

                <div className="max-h-[55vh] space-y-4 overflow-y-auto pr-1">
                    <div className="grid gap-3 sm:grid-cols-2">
                        <div className="space-y-1.5">
                            <Label>Who it is for</Label>
                            <Select value={studentId} onValueChange={setStudentId}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Child" />
                                </SelectTrigger>
                                <SelectContent>
                                    {children.map((c) => (
                                        <SelectItem key={c.id} value={c.id}>
                                            {c.name} ({c.number})
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-1.5">
                            <Label htmlFor="amount">Amount</Label>
                            <Input
                                id="amount"
                                inputMode="decimal"
                                value={amount}
                                placeholder="200000"
                                onChange={(e) => setAmount(e.target.value)}
                            />
                        </div>

                        <div className="space-y-1.5">
                            <Label>Method</Label>
                            <Select value={method} onValueChange={setMethod}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {METHODS.map((m) => (
                                        <SelectItem key={m.value} value={m.value}>
                                            {m.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-1.5">
                            <Label htmlFor="paid-on">Paid on</Label>
                            <Input
                                id="paid-on"
                                type="date"
                                value={paidOn}
                                onChange={(e) => setPaidOn(e.target.value)}
                            />
                        </div>

                        <div className="space-y-1.5">
                            <Label>Into</Label>
                            <Select
                                value={depositAccountId}
                                onValueChange={setDepositAccountId}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Account" />
                                </SelectTrigger>
                                <SelectContent>
                                    {assetAccounts.map((a) => (
                                        <SelectItem key={a.id} value={a.id}>
                                            {a.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-1.5">
                            <Label htmlFor="reference">Bank reference</Label>
                            <Input
                                id="reference"
                                value={reference}
                                placeholder="TRF/2026/09/8871"
                                onChange={(e) => setReference(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <Label htmlFor="payer">Who paid</Label>
                        <Input
                            id="payer"
                            value={payerName}
                            placeholder="Often not the registered guardian"
                            onChange={(e) => setPayerName(e.target.value)}
                        />
                    </div>

                    {amountKobo > 0 && (outstanding?.length ?? 0) > 0 && (
                        <div className="space-y-2 rounded-lg border p-3">
                            <div className="flex items-center justify-between">
                                <Label>What it settles</Label>
                                <span
                                    className={
                                        remainingKobo < 0
                                            ? 'text-sm font-medium text-red-600'
                                            : 'text-sm text-muted-foreground'
                                    }
                                >
                                    {remainingKobo < 0
                                        ? `₦${money((-remainingKobo / 100).toFixed(2))} over the payment`
                                        : `₦${money((remainingKobo / 100).toFixed(2))} left to apply`}
                                </span>
                            </div>

                            <div className="space-y-1.5">
                                {(outstanding ?? []).map((row) => (
                                    <div
                                        key={row.invoiceId}
                                        className="flex items-center gap-2 text-sm"
                                    >
                                        <div className="flex-1">
                                            <div>
                                                {row.studentName}{' '}
                                                <span className="text-muted-foreground">
                                                    — {row.termName}
                                                </span>
                                            </div>
                                            <div className="text-xs text-muted-foreground">
                                                ₦{money(row.outstanding)} outstanding
                                            </div>
                                        </div>
                                        <Input
                                            className="h-8 w-32 text-right tabular-nums"
                                            inputMode="decimal"
                                            placeholder="—"
                                            value={allocations[row.invoiceId] ?? ''}
                                            onChange={(e) =>
                                                setAllocations((prev) => ({
                                                    ...prev,
                                                    [row.invoiceId]: e.target.value,
                                                }))
                                            }
                                        />
                                    </div>
                                ))}
                            </div>

                            <p className="flex items-start gap-2 text-xs text-muted-foreground">
                                <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                                Leave these empty to settle the child&rsquo;s own bills
                                oldest first. Anything unapplied stays as their credit.
                            </p>
                        </div>
                    )}
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                        Cancel
                    </Button>
                    <Button
                        onClick={submit}
                        disabled={
                            !studentId ||
                            amountKobo <= 0 ||
                            !depositAccountId ||
                            remainingKobo < 0 ||
                            record.isPending
                        }
                    >
                        {record.isPending && (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        )}
                        Record payment
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
