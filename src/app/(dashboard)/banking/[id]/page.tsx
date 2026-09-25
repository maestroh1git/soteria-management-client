'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
    CheckCircle2,
    Loader2,
    Sparkles,
    AlertTriangle,
    Undo2,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { EmptyState } from '@/components/common/empty-state';
import { ConfirmDialog } from '@/components/common/confirm-dialog';
import { FormDialog } from '@/components/common/form-dialog';
import { StatusBadge } from '@/components/common/status-badge';
import { Breadcrumbs, PageHeader } from '@/components/layout/page-header';
import { formatDate, formatDateRange } from '@/lib/utils/dates';
import type { StatementLine } from '@/lib/api/banking';
import { useAccounts } from '@/lib/hooks/use-finance';
import {
    useAutoMatch,
    useCompleteStatement,
    useMatchLines,
    usePostStatementLine,
    useReconciliationReport,
    useStatement,
    useUnmatch,
} from '@/lib/hooks/use-banking';
import { Money } from '@/components/common/money';
import { toMinorUnits } from '@/lib/utils/money';

const postSchema = z.object({
    accountId: z.string().min(1, 'Choose what it was.'),
    description: z.string().max(200).optional(),
});
type PostValues = z.infer<typeof postSchema>;

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
    const { data: report, isLoading, isError } = useReconciliationReport(params.id);
    const { data: accounts } = useAccounts();
    const match = useMatchLines(params.id);
    const auto = useAutoMatch(params.id);
    const complete = useCompleteStatement(params.id);
    const postLine = usePostStatementLine(params.id);
    const unmatch = useUnmatch(params.id);
    // The report lists what is still to explain; the statement's own lines say
    // what has been matched, so a wrong match can be seen and undone.
    const { data: detail } = useStatement(params.id);

    const [selectedBank, setSelectedBank] = useState<string[]>([]);
    const [selectedBook, setSelectedBook] = useState<string[]>([]);
    const [postTarget, setPostTarget] = useState<string | null>(null);
    const [confirmSignOff, setConfirmSignOff] = useState(false);
    const postForm = useForm<PostValues>({ resolver: zodResolver(postSchema) });
    useEffect(() => {
        if (postTarget) postForm.reset({ accountId: '', description: '' });
    }, [postTarget, postForm]);

    if (isLoading) {
        return (
            <div className="flex justify-center py-16">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
        );
    }

    // A failed or empty load used to fall through to the spinner above and sit
    // there for ever, so a stale or mistyped statement link looked like the page
    // was still working.
    if (isError || !report) {
        return (
            <div className="space-y-4">
                <Breadcrumbs trail={[{ label: 'Bank reconciliation', href: '/banking' }]} />
                <EmptyState
                    title="We couldn't open that statement"
                    description="It may have been deleted, or the link may be wrong. Pick one from the list instead."
                />
            </div>
        );
    }

    const closed = report.statement.status === 'COMPLETED';
    const period = formatDateRange(report.statement.periodStart, report.statement.periodEnd);

    const groups = new Map<string, StatementLine[]>();
    for (const line of detail?.lines ?? []) {
        if (!line.matchGroupId) continue;
        groups.set(line.matchGroupId, [...(groups.get(line.matchGroupId) ?? []), line]);
    }
    const matched = [...groups.entries()];

    const bankKobo = report.unrecorded
        .filter((l) => selectedBank.includes(l.id))
        .reduce((s, l) => s + toMinorUnits(l.moneyIn) - toMinorUnits(l.moneyOut), 0);
    const bookKobo = report.inTransit
        .filter((l) => selectedBook.includes(l.journalLineId))
        .reduce((s, l) => s + toMinorUnits(l.debit) - toMinorUnits(l.credit), 0);

    const canMatch =
        selectedBank.length > 0 &&
        selectedBook.length > 0 &&
        bankKobo === bookKobo;

    const toggle = (list: string[], set: (v: string[]) => void, id: string) =>
        set(list.includes(id) ? list.filter((x) => x !== id) : [...list, id]);

    return (
        <div className="space-y-6">
            <PageHeader
                crumbs={[{ label: period }]}
                title={report.statement.accountName}
                description={period}
                badge={<StatusBadge kind="statement" status={report.statement.status} />}
                actions={
                    !closed && (
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
                                onClick={() => setConfirmSignOff(true)}
                                disabled={!report.reconciled || complete.isPending}
                                title={
                                    report.reconciled
                                        ? undefined
                                        : 'Every line has to be explained before the period can be signed off'
                                }
                            >
                                Sign off
                            </Button>
                        </>
                    )
                }
            />

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
                                <Money value={value as string} />
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
                                <Money value={(bankKobo / 100).toFixed(2)} />
                            </span>{' '}
                            selected on the bank side,{' '}
                            <span className="font-medium tabular-nums">
                                <Money value={(bookKobo / 100).toFixed(2)} />
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
                                                    {formatDate(line.valueDate)}
                                                    {line.reference ? ` · ${line.reference}` : ''}
                                                </div>
                                            </td>
                                            <td className="whitespace-nowrap py-3 text-right tabular-nums">
                                                {Number(line.moneyIn) > 0
                                                    ? <Money value={line.moneyIn} signed />
                                                    : <Money value={line.moneyOut} deduction />}
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
                                                    {formatDate(line.entryDate)} · {line.sourceType.toLowerCase()}
                                                </div>
                                            </td>
                                            <td className="whitespace-nowrap py-3 pr-6 text-right tabular-nums">
                                                {Number(line.debit) > 0
                                                    ? <Money value={line.debit} signed />
                                                    : <Money value={line.credit} deduction />}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader className="pb-3">
                    <CardTitle className="text-base">Matched ({matched.length})</CardTitle>
                    <CardDescription>
                        Statement lines already tied to the books, by you or by &ldquo;Match the
                        obvious ones&rdquo;. A match is only an assertion: undo one that is wrong and
                        its lines go back to the lists above.
                    </CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                    {!matched.length ? (
                        <p className="px-6 pb-6 text-sm text-muted-foreground">Nothing matched yet.</p>
                    ) : (
                        <ul className="list-none divide-y p-0">
                            {matched.map(([groupId, lines]) => (
                                <li key={groupId} className="flex items-start justify-between gap-4 px-6 py-3 text-sm">
                                    <div className="min-w-0 space-y-1">
                                        {lines.map((line) => (
                                            <div key={line.id} className="flex flex-wrap items-baseline gap-x-3">
                                                <span>{line.description}</span>
                                                <span className="text-xs text-muted-foreground">
                                                    {formatDate(line.valueDate)}
                                                    {line.reference ? ` · ${line.reference}` : ''}
                                                </span>
                                                <span className="whitespace-nowrap tabular-nums">
                                                    {Number(line.moneyIn) > 0 ? (
                                                        <Money value={line.moneyIn} signed />
                                                    ) : (
                                                        <Money value={line.moneyOut} deduction />
                                                    )}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                    {!closed && (
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            disabled={unmatch.isPending}
                                            onClick={() => unmatch.mutate(groupId)}
                                        >
                                            <Undo2 className="mr-1.5 h-4 w-4" />
                                            Undo match
                                        </Button>
                                    )}
                                </li>
                            ))}
                        </ul>
                    )}
                </CardContent>
            </Card>

            <FormDialog
                open={!!postTarget}
                onOpenChange={(v) => !v && setPostTarget(null)}
                form={postForm}
                title="Put this in the books"
                description="What was it? The direction comes from the statement: money that left the bank is a cost, money that arrived is income."
                submitLabel="Post and match"
                onSubmit={(v) =>
                    postLine.mutateAsync({
                        lineId: postTarget!,
                        accountId: v.accountId,
                        description: v.description?.trim() || undefined,
                    })
                }
            >
                <FormField
                    control={postForm.control}
                    name="accountId"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Account</FormLabel>
                            <Select value={field.value} onValueChange={field.onChange}>
                                <FormControl>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Bank charges, interest, …" />
                                    </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    {(accounts ?? [])
                                        .filter((a) => a.type === 'EXPENSE' || a.type === 'REVENUE')
                                        .map((a) => (
                                            <SelectItem key={a.id} value={a.id}>
                                                {a.name}
                                            </SelectItem>
                                        ))}
                                </SelectContent>
                            </Select>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={postForm.control}
                    name="description"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Description</FormLabel>
                            <FormControl>
                                <Input placeholder="Taken from the statement if left empty" {...field} value={field.value ?? ''} />
                            </FormControl>
                            <FormDescription>What the journal entry will say.</FormDescription>
                            <FormMessage />
                        </FormItem>
                    )}
                />
            </FormDialog>

            <ConfirmDialog
                open={confirmSignOff}
                onOpenChange={setConfirmSignOff}
                title="Sign off this period?"
                description={`You are confirming that the books for ${report.statement.accountName}, ${period}, were checked against the bank. A signed-off statement can no longer be changed.`}
                confirmLabel="Sign off"
                loading={complete.isPending}
                onConfirm={async () => {
                    await complete.mutateAsync();
                    setConfirmSignOff(false);
                }}
            />
        </div>
    );
}
