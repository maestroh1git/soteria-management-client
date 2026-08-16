'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
    ArrowLeft,
    CheckCircle2,
    Loader2,
    Sparkles,
    AlertTriangle,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
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
import { useAccounts } from '@/lib/hooks/use-finance';
import {
    useAutoMatch,
    useCompleteStatement,
    useMatchLines,
    usePostStatementLine,
    useReconciliationReport,
} from '@/lib/hooks/use-banking';

const money = (v: string) => {
    const [whole, fraction = '00'] = (v ?? '0').split('.');
    const sign = whole.startsWith('-') ? '-' : '';
    return `${sign}${whole.replace('-', '').replace(/\B(?=(\d{3})+(?!\d))/g, ',')}.${fraction}`;
};

const kobo = (v: string) => Math.round(Number(v || 0) * 100);

/**
 * Reconciling one statement.
 *
 * Two columns, side by side, because that is the shape of the task: what the
 * bank says on the left, what the books say on the right, and the job is to
 * pair them off. Tick lines on both sides and the running total tells you
 * whether the selection can be a match before you try.
 *
 * The asymmetry between the columns is the important part and the screen says
 * it plainly: a line the books have not recorded is an ERROR and has to be
 * posted; a posting the bank has not seen is just timing.
 */
export default function ReconcilePage() {
    const params = useParams<{ id: string }>();
    const { data: report, isLoading } = useReconciliationReport(params.id);
    const { data: accounts } = useAccounts();
    const match = useMatchLines(params.id);
    const auto = useAutoMatch(params.id);
    const complete = useCompleteStatement(params.id);
    const postLine = usePostStatementLine(params.id);

    const [selectedBank, setSelectedBank] = useState<string[]>([]);
    const [selectedBook, setSelectedBook] = useState<string[]>([]);
    const [postTarget, setPostTarget] = useState<string | null>(null);
    const [postAccountId, setPostAccountId] = useState('');

    if (isLoading || !report) {
        return (
            <div className="flex justify-center py-16">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
        );
    }

    const closed = report.statement.status === 'COMPLETED';

    const bankKobo = report.unrecorded
        .filter((l) => selectedBank.includes(l.id))
        .reduce((s, l) => s + kobo(l.moneyIn) - kobo(l.moneyOut), 0);
    const bookKobo = report.inTransit
        .filter((l) => selectedBook.includes(l.journalLineId))
        .reduce((s, l) => s + kobo(l.debit) - kobo(l.credit), 0);

    const canMatch =
        selectedBank.length > 0 &&
        selectedBook.length > 0 &&
        bankKobo === bookKobo;

    const toggle = (list: string[], set: (v: string[]) => void, id: string) =>
        set(list.includes(id) ? list.filter((x) => x !== id) : [...list, id]);

    return (
        <div className="space-y-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="space-y-1">
                    <Link
                        href="/banking"
                        className="inline-flex items-center text-sm text-muted-foreground hover:underline"
                    >
                        <ArrowLeft className="mr-1 h-3.5 w-3.5" />
                        Statements
                    </Link>
                    <h1 className="text-2xl font-semibold tracking-tight">
                        {report.statement.accountName}
                    </h1>
                    <p className="text-sm text-muted-foreground">
                        {report.statement.periodStart} → {report.statement.periodEnd}
                    </p>
                </div>

                <div className="flex items-center gap-2">
                    {closed ? (
                        <Badge className="bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-200">
                            Signed off
                        </Badge>
                    ) : (
                        <>
                            <Button
                                variant="outline"
                                onClick={() => auto.mutate()}
                                disabled={auto.isPending}
                            >
                                {auto.isPending ? (
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                ) : (
                                    <Sparkles className="mr-2 h-4 w-4" />
                                )}
                                Match the obvious ones
                            </Button>
                            <Button
                                onClick={() => complete.mutate()}
                                disabled={!report.reconciled || complete.isPending}
                            >
                                {complete.isPending && (
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                )}
                                Sign off
                            </Button>
                        </>
                    )}
                </div>
            </div>

            {/* The verdict, in words. */}
            <Card
                className={
                    report.reconciled
                        ? 'border-green-300 bg-green-50 dark:bg-green-950/30'
                        : report.balances
                          ? 'border-amber-300 bg-amber-50 dark:bg-amber-950/30'
                          : 'border-red-300 bg-red-50 dark:bg-red-950/30'
                }
            >
                <CardContent className="flex items-start gap-3 pt-6">
                    {report.reconciled ? (
                        <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-green-600" />
                    ) : (
                        <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
                    )}
                    <p className="text-sm">{report.note}</p>
                </CardContent>
            </Card>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {[
                    ['Books say', report.bookBalance],
                    ['Bank says', report.statementBalance],
                    ['Adjusted book', report.adjustedBook],
                    ['Adjusted bank', report.adjustedBank],
                ].map(([label, value]) => (
                    <Card key={label as string}>
                        <CardContent className="pt-6">
                            <p className="text-xs text-muted-foreground">{label}</p>
                            <p className="text-lg font-bold tabular-nums">
                                ₦{money(value as string)}
                            </p>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {!closed && (selectedBank.length > 0 || selectedBook.length > 0) && (
                <Card className="border-primary">
                    <CardContent className="flex flex-wrap items-center justify-between gap-3 pt-6">
                        <div className="text-sm">
                            <span className="font-medium tabular-nums">
                                ₦{money((bankKobo / 100).toFixed(2))}
                            </span>{' '}
                            selected on the bank side,{' '}
                            <span className="font-medium tabular-nums">
                                ₦{money((bookKobo / 100).toFixed(2))}
                            </span>{' '}
                            in the books.
                            {!canMatch && bankKobo !== bookKobo && (
                                <span className="ml-2 text-muted-foreground">
                                    They have to agree to be the same movement.
                                </span>
                            )}
                        </div>
                        <div className="flex gap-2">
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                    setSelectedBank([]);
                                    setSelectedBook([]);
                                }}
                            >
                                Clear
                            </Button>
                            <Button
                                size="sm"
                                disabled={!canMatch || match.isPending}
                                onClick={async () => {
                                    await match.mutateAsync({
                                        statementLineIds: selectedBank,
                                        journalLineIds: selectedBook,
                                    });
                                    setSelectedBank([]);
                                    setSelectedBook([]);
                                }}
                            >
                                {match.isPending && (
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                )}
                                Match these
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            )}

            <div className="grid gap-4 lg:grid-cols-2">
                {/* ── The bank's side ──────────────────────────────────── */}
                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-base">
                            Not in the books ({report.unrecorded.length})
                        </CardTitle>
                        <CardDescription>
                            The bank saw this money move and the books have no record of
                            it. These are errors, not timing — post them.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="p-0">
                        {!report.unrecorded.length ? (
                            <p className="px-6 pb-6 text-sm text-muted-foreground">
                                Nothing. The books know about everything on the statement.
                            </p>
                        ) : (
                            <table className="w-full text-sm">
                                <tbody className="divide-y">
                                    {report.unrecorded.map((line) => (
                                        <tr key={line.id}>
                                            <td className="w-8 py-3 pl-6">
                                                <Checkbox
                                                    disabled={closed}
                                                    checked={selectedBank.includes(line.id)}
                                                    onCheckedChange={() =>
                                                        toggle(selectedBank, setSelectedBank, line.id)
                                                    }
                                                />
                                            </td>
                                            <td className="py-3">
                                                <div>{line.description}</div>
                                                <div className="text-xs text-muted-foreground">
                                                    {line.valueDate}
                                                    {line.reference ? ` · ${line.reference}` : ''}
                                                </div>
                                            </td>
                                            <td className="py-3 text-right tabular-nums">
                                                {Number(line.moneyIn) > 0
                                                    ? `+₦${money(line.moneyIn)}`
                                                    : `−₦${money(line.moneyOut)}`}
                                            </td>
                                            <td className="py-3 pr-6 text-right">
                                                {!closed && (
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => setPostTarget(line.id)}
                                                    >
                                                        Post
                                                    </Button>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </CardContent>
                </Card>

                {/* ── The books' side ──────────────────────────────────── */}
                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-base">
                            Not on the statement ({report.inTransit.length})
                        </CardTitle>
                        <CardDescription>
                            The books know about this and the bank has not seen it yet — a
                            cheque not presented, a lodgement not cleared. Legitimate.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="p-0">
                        {!report.inTransit.length ? (
                            <p className="px-6 pb-6 text-sm text-muted-foreground">
                                Nothing outstanding.
                            </p>
                        ) : (
                            <table className="w-full text-sm">
                                <tbody className="divide-y">
                                    {report.inTransit.map((line) => (
                                        <tr key={line.journalLineId}>
                                            <td className="w-8 py-3 pl-6">
                                                <Checkbox
                                                    disabled={closed}
                                                    checked={selectedBook.includes(line.journalLineId)}
                                                    onCheckedChange={() =>
                                                        toggle(
                                                            selectedBook,
                                                            setSelectedBook,
                                                            line.journalLineId,
                                                        )
                                                    }
                                                />
                                            </td>
                                            <td className="py-3">
                                                <div>{line.description}</div>
                                                <div className="text-xs text-muted-foreground">
                                                    {line.entryDate} · {line.sourceType.toLowerCase()}
                                                </div>
                                            </td>
                                            <td className="py-3 pr-6 text-right tabular-nums">
                                                {Number(line.debit) > 0
                                                    ? `+₦${money(line.debit)}`
                                                    : `−₦${money(line.credit)}`}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </CardContent>
                </Card>
            </div>

            <Dialog
                open={!!postTarget}
                onOpenChange={(v) => !v && setPostTarget(null)}
            >
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Put this in the books</DialogTitle>
                        <DialogDescription>
                            What was it? The direction comes from the statement — money that
                            left the bank is a cost, money that arrived is income.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-1.5">
                        <Label>Account</Label>
                        <Select value={postAccountId} onValueChange={setPostAccountId}>
                            <SelectTrigger>
                                <SelectValue placeholder="Bank charges, interest, …" />
                            </SelectTrigger>
                            <SelectContent>
                                {(accounts ?? [])
                                    .filter(
                                        (a) => a.type === 'EXPENSE' || a.type === 'REVENUE',
                                    )
                                    .map((a) => (
                                        <SelectItem key={a.id} value={a.id}>
                                            {a.name}
                                        </SelectItem>
                                    ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setPostTarget(null)}>
                            Cancel
                        </Button>
                        <Button
                            disabled={!postAccountId || postLine.isPending}
                            onClick={async () => {
                                await postLine.mutateAsync({
                                    lineId: postTarget!,
                                    accountId: postAccountId,
                                });
                                setPostTarget(null);
                                setPostAccountId('');
                            }}
                        >
                            {postLine.isPending && (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            )}
                            Post and match
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
