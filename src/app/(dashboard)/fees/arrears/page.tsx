'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Loader2, Phone } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { EmptyState } from '@/components/common/empty-state';
import { useSessions } from '@/lib/hooks/use-academics';
import { useIncomeStatement } from '@/lib/hooks/use-finance';
import { useCollectionByTerm, useDebtors } from '@/lib/hooks/use-fees';

const money = (v: string) => {
    const [whole, fraction = '00'] = (v ?? '0').split('.');
    const sign = whole.startsWith('-') ? '-' : '';
    return `${sign}${whole.replace('-', '').replace(/\B(?=(\d{3})+(?!\d))/g, ',')}.${fraction}`;
};

/** Blank rather than a zero, so the eye lands on the buckets that matter. */
const cell = (v: string) =>
    Number(v) === 0 ? <span className="text-muted-foreground">—</span> : `₦${money(v)}`;

/**
 * Who owes what, how the term is collecting, and what the school actually
 * netted.
 *
 * Three questions, three tabs, one screen — because they are asked in the same
 * sitting and by the same person, and splitting them across the app would mean
 * nobody ever compares them.
 */
export default function ArrearsPage() {
    const { data: debtors, isLoading } = useDebtors();
    const { data: sessions } = useSessions();
    const [sessionId, setSessionId] = useState<string>();
    const { data: byTerm } = useCollectionByTerm(sessionId);

    // The session so far. A calendar year would split a Nigerian session in
    // half and make the net position meaningless.
    const current = sessions?.find((s) => s.isCurrent);
    const { data: income } = useIncomeStatement(
        current?.startDate,
        current?.endDate,
    );

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-semibold tracking-tight">
                    Arrears and collection
                </h1>
                <p className="text-sm text-muted-foreground">
                    What is owed, how the term is going, and what it all nets to.
                </p>
            </div>

            <Tabs defaultValue="debtors">
                <TabsList>
                    <TabsTrigger value="debtors">Who owes</TabsTrigger>
                    <TabsTrigger value="terms">By term</TabsTrigger>
                    <TabsTrigger value="net">Net position</TabsTrigger>
                </TabsList>

                {/* ── Who owes ─────────────────────────────────────────── */}
                <TabsContent value="debtors" className="space-y-4 pt-4">
                    {isLoading ? (
                        <div className="flex justify-center py-12">
                            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                        </div>
                    ) : !debtors?.rows.length ? (
                        <EmptyState
                            title="Nobody is behind"
                            description="Every issued invoice is settled."
                        />
                    ) : (
                        <>
                            <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-5">
                                {[
                                    ['Not yet due', debtors.totals.current],
                                    ['1–30 days', debtors.totals.days30],
                                    ['31–60 days', debtors.totals.days60],
                                    ['61–90 days', debtors.totals.days90],
                                    ['Over 90 days', debtors.totals.days90Plus],
                                ].map(([label, value], i) => (
                                    <Card key={label as string}>
                                        <CardContent className="pt-6">
                                            <p className="text-xs text-muted-foreground">
                                                {label}
                                            </p>
                                            <p
                                                className={`text-xl font-bold tabular-nums ${
                                                    i === 4 && Number(value) > 0
                                                        ? 'text-red-600'
                                                        : ''
                                                }`}
                                            >
                                                ₦{money(value as string)}
                                            </p>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>

                            <Card>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm">
                                        <thead className="border-b bg-muted/40">
                                            <tr>
                                                <th className="px-4 py-3 text-left font-medium">
                                                    Child
                                                </th>
                                                <th className="px-4 py-3 text-left font-medium">
                                                    Who to ring
                                                </th>
                                                <th className="px-3 py-3 text-right font-medium">
                                                    Not due
                                                </th>
                                                <th className="px-3 py-3 text-right font-medium">
                                                    1–30
                                                </th>
                                                <th className="px-3 py-3 text-right font-medium">
                                                    31–60
                                                </th>
                                                <th className="px-3 py-3 text-right font-medium">
                                                    61–90
                                                </th>
                                                <th className="px-3 py-3 text-right font-medium">
                                                    90+
                                                </th>
                                                <th className="px-4 py-3 text-right font-medium">
                                                    Owed
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y">
                                            {debtors.rows.map((row) => (
                                                <tr key={row.studentId} className="hover:bg-muted/30">
                                                    <td className="px-4 py-3">
                                                        <Link
                                                            href={`/students/${row.studentId}`}
                                                            className="font-medium hover:underline"
                                                        >
                                                            {row.studentName}
                                                        </Link>
                                                        <div className="text-xs text-muted-foreground">
                                                            {row.admissionNumber} · {row.classLevel}
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        {row.guardianPhone ? (
                                                            <a
                                                                href={`tel:${row.guardianPhone}`}
                                                                className="inline-flex items-center gap-1.5 hover:underline"
                                                            >
                                                                <Phone className="h-3.5 w-3.5" />
                                                                <span>
                                                                    {row.guardianName}
                                                                    <span className="block text-xs text-muted-foreground">
                                                                        {row.guardianPhone}
                                                                    </span>
                                                                </span>
                                                            </a>
                                                        ) : (
                                                            <span className="text-xs text-muted-foreground">
                                                                No guardian on file
                                                            </span>
                                                        )}
                                                    </td>
                                                    <td className="px-3 py-3 text-right tabular-nums">
                                                        {cell(row.current)}
                                                    </td>
                                                    <td className="px-3 py-3 text-right tabular-nums">
                                                        {cell(row.days30)}
                                                    </td>
                                                    <td className="px-3 py-3 text-right tabular-nums">
                                                        {cell(row.days60)}
                                                    </td>
                                                    <td className="px-3 py-3 text-right tabular-nums">
                                                        {cell(row.days90)}
                                                    </td>
                                                    <td className="px-3 py-3 text-right font-medium tabular-nums text-red-600">
                                                        {cell(row.days90Plus)}
                                                    </td>
                                                    <td className="px-4 py-3 text-right font-semibold tabular-nums">
                                                        ₦{money(row.total)}
                                                        {Number(row.credit) > 0 && (
                                                            // Shown, never netted into the buckets: a
                                                            // family in credit on this term and behind
                                                            // on the last one needs both facts.
                                                            <div className="text-xs font-normal text-green-700 dark:text-green-400">
                                                                ₦{money(row.credit)} in credit
                                                            </div>
                                                        )}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                        <tfoot className="border-t-2 bg-muted/20 font-semibold">
                                            <tr>
                                                <td className="px-4 py-3" colSpan={2}>
                                                    {debtors.rows.length} famil
                                                    {debtors.rows.length === 1 ? 'y' : 'ies'}
                                                </td>
                                                <td className="px-3 py-3 text-right tabular-nums">
                                                    {cell(debtors.totals.current)}
                                                </td>
                                                <td className="px-3 py-3 text-right tabular-nums">
                                                    {cell(debtors.totals.days30)}
                                                </td>
                                                <td className="px-3 py-3 text-right tabular-nums">
                                                    {cell(debtors.totals.days60)}
                                                </td>
                                                <td className="px-3 py-3 text-right tabular-nums">
                                                    {cell(debtors.totals.days90)}
                                                </td>
                                                <td className="px-3 py-3 text-right tabular-nums text-red-600">
                                                    {cell(debtors.totals.days90Plus)}
                                                </td>
                                                <td className="px-4 py-3 text-right tabular-nums">
                                                    ₦{money(debtors.totals.total)}
                                                </td>
                                            </tr>
                                        </tfoot>
                                    </table>
                                </div>
                            </Card>
                        </>
                    )}
                </TabsContent>

                {/* ── By term ──────────────────────────────────────────── */}
                <TabsContent value="terms" className="space-y-4 pt-4">
                    {!byTerm?.length ? (
                        <EmptyState
                            title="Nothing billed yet"
                            description="Bill a term and this fills in."
                        />
                    ) : (
                        <Card>
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead className="border-b bg-muted/40">
                                        <tr>
                                            <th className="px-4 py-3 text-left font-medium">Term</th>
                                            <th className="px-4 py-3 text-right font-medium">
                                                Billed
                                            </th>
                                            <th className="px-4 py-3 text-right font-medium">
                                                Collected
                                            </th>
                                            <th className="px-4 py-3 text-right font-medium">
                                                Outstanding
                                            </th>
                                            <th className="px-4 py-3 text-right font-medium">
                                                Collected
                                            </th>
                                            <th className="px-4 py-3 text-right font-medium">
                                                Owing
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y">
                                        {byTerm.map((t) => (
                                            <tr key={t.termId}>
                                                <td className="px-4 py-3">
                                                    <div className="font-medium">{t.termName}</div>
                                                    <div className="text-xs text-muted-foreground">
                                                        {t.sessionName}
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3 text-right tabular-nums">
                                                    ₦{money(t.billed)}
                                                </td>
                                                <td className="px-4 py-3 text-right tabular-nums">
                                                    ₦{money(t.collected)}
                                                </td>
                                                <td className="px-4 py-3 text-right font-medium tabular-nums">
                                                    ₦{money(t.outstanding)}
                                                </td>
                                                <td className="px-4 py-3 text-right">
                                                    {t.collectionRate === null ? (
                                                        <span className="text-muted-foreground">—</span>
                                                    ) : (
                                                        <Badge
                                                            variant="secondary"
                                                            className={
                                                                t.collectionRate >= 90
                                                                    ? 'bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-200'
                                                                    : t.collectionRate >= 60
                                                                      ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-200'
                                                                      : 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-200'
                                                            }
                                                        >
                                                            {t.collectionRate}%
                                                        </Badge>
                                                    )}
                                                </td>
                                                <td className="px-4 py-3 text-right tabular-nums text-muted-foreground">
                                                    {t.studentsOwing}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </Card>
                    )}
                </TabsContent>

                {/* ── Net position ─────────────────────────────────────── */}
                <TabsContent value="net" className="space-y-4 pt-4">
                    {!income ? (
                        <EmptyState
                            title="Nothing posted yet"
                            description="Once fees are issued and costs are paid, this shows what the school netted."
                        />
                    ) : (
                        <>
                            <div className="grid gap-3 sm:grid-cols-3">
                                <Card>
                                    <CardContent className="pt-6">
                                        <p className="text-xs text-muted-foreground">Earned</p>
                                        <p className="text-2xl font-bold tabular-nums text-green-700 dark:text-green-400">
                                            ₦{money(income.totalRevenue)}
                                        </p>
                                    </CardContent>
                                </Card>
                                <Card>
                                    <CardContent className="pt-6">
                                        <p className="text-xs text-muted-foreground">Spent</p>
                                        <p className="text-2xl font-bold tabular-nums">
                                            ₦{money(income.totalExpenses)}
                                        </p>
                                    </CardContent>
                                </Card>
                                <Card>
                                    <CardContent className="pt-6">
                                        <p className="text-xs text-muted-foreground">
                                            Net this session
                                        </p>
                                        <p
                                            className={`text-2xl font-bold tabular-nums ${
                                                Number(income.net) < 0 ? 'text-red-600' : ''
                                            }`}
                                        >
                                            ₦{money(income.net)}
                                        </p>
                                    </CardContent>
                                </Card>
                            </div>

                            <div className="grid gap-4 lg:grid-cols-2">
                                <Card>
                                    <div className="border-b px-4 py-3 font-medium">Earned</div>
                                    <table className="w-full text-sm">
                                        <tbody className="divide-y">
                                            {income.revenue.map((r) => (
                                                <tr key={r.code}>
                                                    <td className="px-4 py-2.5">{r.name}</td>
                                                    <td className="px-4 py-2.5 text-right tabular-nums">
                                                        ₦{money(r.amount)}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </Card>

                                <Card>
                                    <div className="border-b px-4 py-3 font-medium">Spent</div>
                                    <table className="w-full text-sm">
                                        <tbody className="divide-y">
                                            {income.expenses.map((r) => (
                                                <tr key={r.code}>
                                                    <td className="px-4 py-2.5">{r.name}</td>
                                                    <td className="px-4 py-2.5 text-right tabular-nums">
                                                        ₦{money(r.amount)}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </Card>
                            </div>

                            <p className="text-xs text-muted-foreground">
                                Both sides read the ledger, so this is the same money the
                                trial balance sees. Fees count when they are billed, not
                                when they are paid — money received in advance is not income
                                until it is earned.
                            </p>
                        </>
                    )}
                </TabsContent>
            </Tabs>
        </div>
    );
}
