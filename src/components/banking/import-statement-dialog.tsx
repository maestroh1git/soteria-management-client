'use client';

import { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, Loader2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
import { useAccounts } from '@/lib/hooks/use-finance';
import { useCreateStatement } from '@/lib/hooks/use-banking';

const money = (v: number) =>
    (v / 100).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');

const kobo = (v: string) => Math.round(Number(v || 0) * 100);

interface ParsedLine {
    lineNumber: number;
    valueDate: string;
    description: string;
    reference?: string;
    moneyIn?: number;
    moneyOut?: number;
}

/**
 * Turn pasted bank lines into something importable.
 *
 * Paste rather than file upload, deliberately: every Nigerian bank exports a
 * different CSV, and a parser that guesses at columns fails silently on the
 * one bank nobody tested. Pasting four named columns is a minute's work and is
 * obvious when it is wrong.
 *
 * Tab or comma separated, so copying straight out of a spreadsheet works.
 */
function parse(text: string): { lines: ParsedLine[]; errors: string[] } {
    const lines: ParsedLine[] = [];
    const errors: string[] = [];

    text
        .split('\n')
        .map((l) => l.trim())
        .filter(Boolean)
        .forEach((row, i) => {
            const parts = row.split(/\t|,(?=(?:[^"]*"[^"]*")*[^"]*$)/).map((p) =>
                p.trim().replace(/^"|"$/g, ''),
            );
            if (parts.length < 3) {
                errors.push(`Line ${i + 1}: expected date, description, in, out`);
                return;
            }

            const [date, description, inRaw, outRaw, reference] = parts;
            if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
                errors.push(`Line ${i + 1}: "${date}" is not a date like 2026-09-14`);
                return;
            }

            const moneyIn = Number((inRaw || '0').replace(/[₦,\s]/g, '')) || 0;
            const moneyOut = Number((outRaw || '0').replace(/[₦,\s]/g, '')) || 0;

            if (moneyIn > 0 && moneyOut > 0) {
                errors.push(`Line ${i + 1}: money in AND out on the same row`);
                return;
            }
            if (moneyIn === 0 && moneyOut === 0) {
                errors.push(`Line ${i + 1}: no amount`);
                return;
            }

            lines.push({
                lineNumber: lines.length + 1,
                valueDate: date,
                description: description || '(no description)',
                reference: reference || undefined,
                moneyIn: moneyIn || undefined,
                moneyOut: moneyOut || undefined,
            });
        });

    return { lines, errors };
}

export function ImportStatementDialog({
    open,
    onOpenChange,
}: {
    open: boolean;
    onOpenChange: (v: boolean) => void;
}) {
    const { data: accounts } = useAccounts();
    const create = useCreateStatement();

    const [accountId, setAccountId] = useState('');
    const [periodStart, setPeriodStart] = useState('');
    const [periodEnd, setPeriodEnd] = useState('');
    const [openingBalance, setOpeningBalance] = useState('');
    const [closingBalance, setClosingBalance] = useState('');
    const [reference, setReference] = useState('');
    const [raw, setRaw] = useState('');

    const assetAccounts = (accounts ?? []).filter((a) => a.type === 'ASSET');

    useEffect(() => {
        if (!accountId && assetAccounts.length) {
            setAccountId(
                (assetAccounts.find((a) => a.code === 'BANK') ?? assetAccounts[0]).id,
            );
        }
    }, [assetAccounts, accountId]);

    const { lines, errors } = useMemo(() => parse(raw), [raw]);

    // The bank's own arithmetic, checked here so the mistake is caught while
    // the numbers are still on screen rather than as a server error.
    const runningKobo = lines.reduce(
        (sum, l) => sum + kobo(String(l.moneyIn ?? 0)) - kobo(String(l.moneyOut ?? 0)),
        kobo(openingBalance),
    );
    const expectedKobo = kobo(closingBalance);
    const foots = lines.length > 0 && runningKobo === expectedKobo;

    const submit = async () => {
        await create.mutateAsync({
            accountId,
            periodStart,
            periodEnd,
            openingBalance: Number(openingBalance),
            closingBalance: Number(closingBalance),
            reference: reference.trim() || undefined,
            lines,
        });
        setRaw('');
        setReference('');
        onOpenChange(false);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-3xl">
                <DialogHeader>
                    <DialogTitle>Import a bank statement</DialogTitle>
                    <DialogDescription>
                        One line per movement:{' '}
                        <code className="text-xs">date, description, in, out, reference</code>
                        . Tabs or commas — paste straight from a spreadsheet.
                    </DialogDescription>
                </DialogHeader>

                <div className="max-h-[55vh] space-y-4 overflow-y-auto pr-1">
                    <div className="grid gap-3 sm:grid-cols-2">
                        <div className="space-y-1.5">
                            <Label>Account</Label>
                            <Select value={accountId} onValueChange={setAccountId}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Which account" />
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
                            <Label htmlFor="ref">Statement reference</Label>
                            <Input
                                id="ref"
                                value={reference}
                                placeholder="SEP-2026"
                                onChange={(e) => setReference(e.target.value)}
                            />
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="from">Period from</Label>
                            <Input
                                id="from"
                                type="date"
                                value={periodStart}
                                onChange={(e) => setPeriodStart(e.target.value)}
                            />
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="to">Period to</Label>
                            <Input
                                id="to"
                                type="date"
                                value={periodEnd}
                                onChange={(e) => setPeriodEnd(e.target.value)}
                            />
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="opening">Opening balance</Label>
                            <Input
                                id="opening"
                                inputMode="decimal"
                                value={openingBalance}
                                onChange={(e) => setOpeningBalance(e.target.value)}
                            />
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="closing">Closing balance</Label>
                            <Input
                                id="closing"
                                inputMode="decimal"
                                value={closingBalance}
                                onChange={(e) => setClosingBalance(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <Label htmlFor="lines">Statement lines</Label>
                        <Textarea
                            id="lines"
                            rows={8}
                            className="font-mono text-xs"
                            placeholder={'2026-09-10\tTRF TO FUEL CO\t\t80000\tTRF/0091\n2026-09-30\tACCOUNT MAINTENANCE FEE\t\t1500'}
                            value={raw}
                            onChange={(e) => setRaw(e.target.value)}
                        />
                    </div>

                    {errors.length > 0 && (
                        <div className="space-y-1 rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm dark:bg-amber-950/30">
                            {errors.slice(0, 6).map((e, i) => (
                                <p key={i}>{e}</p>
                            ))}
                            {errors.length > 6 && (
                                <p className="text-xs text-muted-foreground">
                                    …and {errors.length - 6} more
                                </p>
                            )}
                        </div>
                    )}

                    {lines.length > 0 && (
                        <div
                            className={`flex items-start gap-2 rounded-lg border p-3 text-sm ${
                                foots
                                    ? 'border-green-300 bg-green-50 dark:bg-green-950/30'
                                    : 'border-red-300 bg-red-50 dark:bg-red-950/30'
                            }`}
                        >
                            {!foots && <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />}
                            <div>
                                <p className="font-medium">
                                    {lines.length} line{lines.length === 1 ? '' : 's'} —{' '}
                                    {foots
                                        ? 'the statement adds up'
                                        : 'this statement does not add up'}
                                </p>
                                {!foots && (
                                    <p className="text-xs">
                                        Opening plus the movements gives ₦{money(runningKobo)}, but
                                        the closing balance says ₦{money(expectedKobo)}. A row is
                                        probably missing or in the wrong column.
                                    </p>
                                )}
                            </div>
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
                            !accountId ||
                            !periodStart ||
                            !periodEnd ||
                            !foots ||
                            errors.length > 0 ||
                            create.isPending
                        }
                    >
                        {create.isPending && (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        )}
                        Import {lines.length} line{lines.length === 1 ? '' : 's'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
