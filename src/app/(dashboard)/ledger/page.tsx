'use client';

import { useState } from 'react';
import { CheckCircle2, AlertTriangle, Scale, Loader2 } from 'lucide-react';

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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { EmptyState } from '@/components/common/empty-state';
import {
    useTrialBalance,
    useJournalEntries,
    useJournalEntry,
} from '@/lib/hooks/use-finance';
import { formatDate } from '@/lib/utils/dates';

/**
 * Amounts arrive as strings from Postgres `numeric` and are formatted, never
 * parsed. Turning one into a float to add a thousands separator is how a
 * ledger loses a kobo between the database and the person reading it.
 */
function money(value: string): string {
    const [whole, fraction = '00'] = value.split('.');
    const sign = whole.startsWith('-') ? '-' : '';
    const digits = whole.replace('-', '');
    return `${sign}${digits.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}.${fraction}`;
}

const SOURCE_LABEL: Record<string, string> = {
    PAYROLL: 'Payroll',
    EXPENSE: 'Expense',
    FEE_INVOICE: 'Fee invoice',
    FEE_PAYMENT: 'Fee payment',
    MANUAL: 'Manual',
};

export default function LedgerPage() {
    const [sourceType, setSourceType] = useState('all');
    const [openEntry, setOpenEntry] = useState<string | undefined>();

    const { data: trial, isLoading } = useTrialBalance();
    const { data: entries = [] } = useJournalEntries({ sourceType });
    const { data: entry } = useJournalEntry(openEntry);

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Ledger</h1>
                <p className="text-muted-foreground">
                    Every naira in and out, as the books record it.
                </p>
            </div>

            {/* The health of the books, first. If debits and credits disagree,
                everything else on this page is decoration. */}
            {trial && (
                <Card
                    className={
                        trial.balanced
                            ? 'border-green-200 dark:border-green-900/50'
                            : 'border-destructive'
                    }
                >
                    <CardHeader className="pb-3">
                        <CardTitle className="flex items-center gap-2 text-lg">
                            {trial.balanced ? (
                                <CheckCircle2 className="h-5 w-5 text-green-600" />
                            ) : (
                                <AlertTriangle className="h-5 w-5 text-destructive" />
                            )}
                            {trial.balanced ? 'The books balance' : 'The books do not balance'}
                        </CardTitle>
                        <CardDescription>
                            {trial.balanced
                                ? 'Debits equal credits, as of today.'
                                : `Out by ₦${money(trial.difference)}. Posting refuses an unbalanced entry, so something got in another way — a hand-written INSERT, a partial rollback, a restore.`}
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="grid gap-4 sm:grid-cols-3">
                        <Figure label="Total debits" value={money(trial.totalDebits)} />
                        <Figure label="Total credits" value={money(trial.totalCredits)} />
                        <Figure
                            label="Difference"
                            value={money(trial.difference)}
                            tone={trial.balanced ? undefined : 'text-destructive'}
                        />
                    </CardContent>
                </Card>
            )}

            <Tabs defaultValue="accounts">
                <TabsList>
                    <TabsTrigger value="accounts">Accounts</TabsTrigger>
                    <TabsTrigger value="entries">Journal</TabsTrigger>
                </TabsList>

                <TabsContent value="accounts">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-lg">
                                <Scale className="h-5 w-5" /> Trial balance
                            </CardTitle>
                            <CardDescription>
                                Accounts with something posted to them. Balances are signed
                                the way each account normally sits, so an asset and a
                                liability both read positive.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {isLoading ? (
                                <p className="flex items-center gap-2 text-sm text-muted-foreground">
                                    <Loader2 className="h-4 w-4 animate-spin" /> Loading…
                                </p>
                            ) : !trial?.rows.length ? (
                                <EmptyState
                                    title="Nothing posted yet"
                                    description="Approving a payroll run or paying an expense puts its cost in the books."
                                />
                            ) : (
                                <div className="overflow-x-auto rounded-md border">
                                    <table className="w-full text-sm">
                                        <thead className="bg-muted/50">
                                            <tr>
                                                <th className="px-3 py-2 text-left font-medium">Code</th>
                                                <th className="px-3 py-2 text-left font-medium">Account</th>
                                                <th className="px-3 py-2 text-left font-medium">Type</th>
                                                <th className="px-3 py-2 text-right font-medium">Debits</th>
                                                <th className="px-3 py-2 text-right font-medium">Credits</th>
                                                <th className="px-3 py-2 text-right font-medium">Balance</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {trial.rows.map((a) => (
                                                <tr key={a.id} className="border-t">
                                                    <td className="px-3 py-2 font-mono text-xs text-muted-foreground">
                                                        {a.code}
                                                    </td>
                                                    <td className="px-3 py-2">{a.name}</td>
                                                    <td className="px-3 py-2">
                                                        <Badge variant="outline">{a.type.toLowerCase()}</Badge>
                                                    </td>
                                                    <td className="px-3 py-2 text-right tabular-nums">
                                                        {money(a.debits)}
                                                    </td>
                                                    <td className="px-3 py-2 text-right tabular-nums">
                                                        {money(a.credits)}
                                                    </td>
                                                    <td className="px-3 py-2 text-right font-medium tabular-nums">
                                                        {money(a.balance)}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="entries" className="space-y-4">
                    <Select value={sourceType} onValueChange={setSourceType}>
                        <SelectTrigger className="w-56">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Everything</SelectItem>
                            {Object.entries(SOURCE_LABEL).map(([k, v]) => (
                                <SelectItem key={k} value={k}>
                                    {v}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    {entries.length === 0 ? (
                        <EmptyState title="No entries" description="Nothing has been posted." />
                    ) : (
                        <div className="overflow-x-auto rounded-md border">
                            <table className="w-full text-sm">
                                <thead className="bg-muted/50">
                                    <tr>
                                        <th className="px-3 py-2 text-left font-medium">Date</th>
                                        <th className="px-3 py-2 text-left font-medium">Source</th>
                                        <th className="px-3 py-2 text-left font-medium">Description</th>
                                        <th className="px-3 py-2 text-right font-medium">Amount</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {entries.map((e) => (
                                        <tr
                                            key={e.id}
                                            className="cursor-pointer border-t hover:bg-muted/40"
                                            onClick={() => setOpenEntry(e.id)}
                                        >
                                            <td className="px-3 py-2 text-muted-foreground">
                                                {formatDate(e.entry_date)}
                                            </td>
                                            <td className="px-3 py-2">
                                                <Badge variant="secondary">
                                                    {SOURCE_LABEL[e.source_type] ?? e.source_type}
                                                </Badge>
                                                {e.reverses_entry_id && (
                                                    <Badge variant="outline" className="ml-2">
                                                        reversal
                                                    </Badge>
                                                )}
                                            </td>
                                            <td className="px-3 py-2">{e.description}</td>
                                            <td className="px-3 py-2 text-right tabular-nums">
                                                {money(e.total)}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </TabsContent>
            </Tabs>

            {/* One entry, shown as the double entry it is. */}
            <Dialog open={!!openEntry} onOpenChange={(o) => !o && setOpenEntry(undefined)}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>{entry?.description ?? 'Entry'}</DialogTitle>
                        <DialogDescription>
                            {entry && `${formatDate(entry.entry_date)} · ${SOURCE_LABEL[entry.source_type] ?? entry.source_type}`}
                        </DialogDescription>
                    </DialogHeader>
                    {entry && (
                        <div className="overflow-x-auto rounded-md border">
                            <table className="w-full text-sm">
                                <thead className="bg-muted/50">
                                    <tr>
                                        <th className="px-3 py-2 text-left font-medium">Account</th>
                                        <th className="px-3 py-2 text-right font-medium">Debit</th>
                                        <th className="px-3 py-2 text-right font-medium">Credit</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {entry.lines.map((l) => (
                                        <tr key={l.id} className="border-t">
                                            <td className="px-3 py-2">
                                                <span className="font-mono text-xs text-muted-foreground">
                                                    {l.account_code}
                                                </span>{' '}
                                                {l.account_name}
                                                {l.memo && (
                                                    <span className="block text-xs text-muted-foreground">
                                                        {l.memo}
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-3 py-2 text-right tabular-nums">
                                                {Number(l.debit) ? money(l.debit) : ''}
                                            </td>
                                            <td className="px-3 py-2 text-right tabular-nums">
                                                {Number(l.credit) ? money(l.credit) : ''}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
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
            <p className={`text-xl font-semibold tabular-nums ${tone ?? ''}`}>
                ₦{value}
            </p>
        </div>
    );
}
