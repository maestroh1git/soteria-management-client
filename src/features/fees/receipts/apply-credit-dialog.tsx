'use client';

import { useMemo, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { EmptyState } from '@/components/common/empty-state';
import { Money } from '@/components/common/money';
import { useAllocatePayment, useOutstanding } from '@/lib/hooks/use-fees';
import { fromMinorUnits, toMinorUnits } from '@/lib/utils/money';
import type { Receipt } from '@/lib/api/fees';

/**
 * Apply a receipt's unused credit to the pupil's unpaid invoices
 * (ROADMAP-EXECUTION.md, 5.3). Suggests oldest first; every amount can be
 * changed. The API refuses more than the credit or more than an invoice owes.
 */
export function ApplyCreditDialog({
    receipt,
    onClose,
}: {
    receipt: Receipt | null;
    onClose: () => void;
}) {
    // Keyed by receipt, so amounts typed for one never carry to the next.
    return <ApplyCreditBody key={receipt?.id ?? 'none'} receipt={receipt} onClose={onClose} />;
}

function ApplyCreditBody({
    receipt,
    onClose,
}: {
    receipt: Receipt | null;
    onClose: () => void;
}) {
    const { data: invoices = [], isLoading } = useOutstanding(
        receipt ? { studentId: receipt.studentId } : undefined,
    );
    const allocate = useAllocatePayment();
    const credit = toMinorUnits(receipt?.unallocated);
    const owing = useMemo(
        () => invoices.filter((i) => toMinorUnits(i.outstanding) > 0),
        [invoices],
    );

    // Oldest first, until the credit runs out; anything typed replaces it.
    const suggested = useMemo(() => {
        let left = credit;
        const next: Record<string, string> = {};
        for (const i of owing) {
            const take = Math.min(left, toMinorUnits(i.outstanding));
            next[i.invoiceId] = take > 0 ? fromMinorUnits(take) : '';
            left -= take;
        }
        return next;
    }, [owing, credit]);
    const [edits, setEdits] = useState<Record<string, string>>({});
    const amounts: Record<string, string> = { ...suggested, ...edits };

    const total = Object.values(amounts).reduce((t, v) => t + toMinorUnits(v), 0);
    const over = total > credit;
    const tooMuch = owing.find((i) => toMinorUnits(amounts[i.invoiceId]) > toMinorUnits(i.outstanding));

    return (
        <Dialog open={!!receipt} onOpenChange={(o) => !o && onClose()}>
            <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle>Apply credit from {receipt?.receiptNumber}</DialogTitle>
                    <DialogDescription>
                        {receipt?.studentName} has <Money value={receipt?.unallocated} /> not yet set against
                        a bill. Choose how much goes to each unpaid invoice.
                    </DialogDescription>
                </DialogHeader>

                {isLoading ? (
                    <p className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Loader2 className="h-4 w-4 animate-spin" /> Finding unpaid invoices…
                    </p>
                ) : owing.length === 0 ? (
                    <EmptyState
                        title="Nothing to apply it to"
                        description="This pupil owes nothing on an issued invoice. The credit stays on their account for the next bill."
                    />
                ) : (
                    <ul className="divide-y rounded-md border">
                        {owing.map((i) => (
                            <li key={i.invoiceId} className="flex items-center justify-between gap-3 p-3 text-sm">
                                <span>
                                    <span className="font-medium">{i.invoiceNumber ?? 'Invoice'}</span> ·{' '}
                                    {i.termName}
                                    <span className="block text-xs text-muted-foreground">
                                        Owes <Money value={i.outstanding} />
                                    </span>
                                </span>
                                <Input
                                    aria-label={`Amount to ${i.invoiceNumber ?? 'this invoice'}`}
                                    inputMode="decimal"
                                    className="h-8 w-32 text-right tabular-nums"
                                    value={amounts[i.invoiceId] ?? ''}
                                    onChange={(e) =>
                                        setEdits((a) => ({ ...a, [i.invoiceId]: e.target.value }))
                                    }
                                />
                            </li>
                        ))}
                    </ul>
                )}

                {owing.length > 0 && (
                    <p className={`text-sm ${over || tooMuch ? 'text-destructive' : 'text-muted-foreground'}`} role="status">
                        {over ? (
                            <>That is more than the credit of <Money value={receipt?.unallocated} />.</>
                        ) : tooMuch ? (
                            <>More than {tooMuch.invoiceNumber ?? 'an invoice'} owes.</>
                        ) : (
                            <>
                                Applying <Money value={fromMinorUnits(total)} /> of{' '}
                                <Money value={receipt?.unallocated} />.
                            </>
                        )}
                    </p>
                )}

                <DialogFooter className="gap-2">
                    <Button variant="outline" onClick={onClose} disabled={allocate.isPending}>
                        Cancel
                    </Button>
                    {owing.length > 0 && (
                        <Button
                            disabled={allocate.isPending || over || !!tooMuch || total === 0}
                            onClick={() => {
                                if (!receipt) return;
                                allocate.mutate(
                                    {
                                        id: receipt.id,
                                        allocations: owing
                                            .filter((i) => toMinorUnits(amounts[i.invoiceId]) > 0)
                                            .map((i) => ({
                                                invoiceId: i.invoiceId,
                                                amount: toMinorUnits(amounts[i.invoiceId]) / 100,
                                            })),
                                    },
                                    { onSuccess: onClose },
                                );
                            }}
                        >
                            {allocate.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Apply credit
                        </Button>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
