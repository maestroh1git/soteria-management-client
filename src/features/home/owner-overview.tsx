'use client';

import { useState } from 'react';
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Calculator, HandCoins, Receipt, UserCheck } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { StatCard } from '@/components/common/stat-card';
import { Money } from '@/components/common/money';
import { NeedsYou } from './needs-you';
import { useFeeSummary } from '@/lib/hooks/use-fees';
import { useDaySummary } from '@/lib/hooks/use-attendance';
import { useFeesVsPayroll } from '@/lib/hooks/use-reports';
import { formatCompactCurrency, formatCurrency } from '@/lib/utils/currency';
import { formatDayOfWeek } from '@/lib/utils/dates';
import { cn } from '@/lib/utils';

const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/**
 * The school owner's home: how the school is doing, on one screen.
 *
 * The dashboard began as payroll's, and for an owner it still led with
 * headcount and loans while the school's own money sat halfway down the page.
 * A proprietor's first question is how the school is doing, so this answers
 * it in four figures (money in, money owed, children in school, money out),
 * then what is waiting on them beside where the money went. The payroll detail
 * stays further down the page for whoever wants it.
 *
 * Shown only to someone who may read all four (see the dashboard page), so no
 * figure here is ever a refused request drawn as a zero.
 */
export function OwnerOverview({
    firstName,
    tenantName,
    payrollGross,
    payrollMonth,
}: {
    firstName: string;
    tenantName: string;
    /** Gross of the month the dashboard reports on, or undefined while loading. */
    payrollGross?: string;
    payrollMonth: string;
}) {
    const { data: fees } = useFeeSummary();
    const { data: day } = useDaySummary();
    const now = new Date();
    const hour = now.getHours();
    const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

    const attendance = !day
        ? { value: '—', subtitle: '' }
        : !day.isTeachingDay
            ? { value: '—', subtitle: 'Not a school day' }
            : {
                value: `${day.rate}%`,
                subtitle:
                    day.armsNotTaken.length > 0
                        ? `${day.armsNotTaken.length} register${day.armsNotTaken.length === 1 ? '' : 's'} not taken yet`
                        : `${day.inSchool} of ${day.enrolled} in school`,
            };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">
                    {greeting}, {firstName || 'there'}
                </h1>
                <p className="text-muted-foreground mt-1">
                    {tenantName} · {formatDayOfWeek(now)}
                </p>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
                <StatCard
                    title="Fees collected this term"
                    value={fees ? formatCompactCurrency(fees.collected) : '—'}
                    subtitle={
                        fees?.collectionRate != null
                            ? `${fees.collectionRate}% of ${formatCompactCurrency(fees.billed)} billed`
                            : fees?.term?.name
                    }
                    icon={HandCoins}
                />
                <StatCard
                    title="Outstanding"
                    value={fees ? formatCompactCurrency(fees.outstanding) : '—'}
                    subtitle={fees ? `${fees.studentsOwing} pupil${fees.studentsOwing === 1 ? '' : 's'} owing` : undefined}
                    icon={Receipt}
                />
                <StatCard
                    title="Attendance today"
                    value={attendance.value}
                    subtitle={attendance.subtitle || undefined}
                    icon={UserCheck}
                />
                <StatCard
                    title={`Payroll · ${payrollMonth}`}
                    value={payrollGross ? formatCompactCurrency(payrollGross) : '—'}
                    subtitle="Gross, approved"
                    icon={Calculator}
                />
            </div>

            <div className="grid gap-6 lg:grid-cols-5">
                <div className="lg:col-span-2">
                    <NeedsYou variant="list" />
                </div>
                <div className="lg:col-span-3">
                    <FeesVsPayrollCard />
                </div>
            </div>
        </div>
    );
}

/**
 * Money in against payroll cost, six months, from the ledger.
 *
 * Colours are the app's chart pair (emerald, blue), checked for colour-blind
 * separation in light and dark; the legend names both series, and the table
 * view gives the exact figures to anyone who cannot, or would rather not,
 * compare bar heights.
 */
function FeesVsPayrollCard() {
    const { data, isLoading, isError } = useFeesVsPayroll(6);
    const [view, setView] = useState<'chart' | 'table'>('chart');

    // Charts plot numbers, so amounts are converted here and only here.
    const rows = (data?.months ?? []).map((m) => ({
        label: `${MONTH_LABELS[m.month - 1]}`,
        long: `${MONTH_LABELS[m.month - 1]} ${m.year}`,
        feesIn: Number(m.feesIn),
        payrollCost: Number(m.payrollCost),
        raw: m,
    }));
    const empty = rows.every((r) => r.feesIn === 0 && r.payrollCost === 0);

    return (
        <Card className="h-full">
            <CardHeader className="flex flex-row items-start justify-between gap-4">
                <div>
                    <CardTitle className="text-base">Fees in vs payroll cost</CardTitle>
                    <CardDescription>Last six months, as the ledger records them</CardDescription>
                </div>
                <div className="flex rounded-md bg-muted p-0.5 text-xs" role="group" aria-label="Show as">
                    {(['chart', 'table'] as const).map((v) => (
                        <button
                            key={v}
                            type="button"
                            aria-pressed={view === v}
                            onClick={() => setView(v)}
                            className={cn(
                                'rounded px-2.5 py-1 font-medium capitalize text-muted-foreground',
                                view === v && 'bg-background text-foreground shadow-sm',
                            )}
                        >
                            {v}
                        </button>
                    ))}
                </div>
            </CardHeader>
            <CardContent>
                {isLoading ? (
                    <div className="h-[240px] animate-pulse rounded bg-muted" />
                ) : isError ? (
                    <p className="flex h-[240px] items-center justify-center text-sm text-muted-foreground">
                        We couldn&apos;t load fees and payroll from the ledger
                    </p>
                ) : empty ? (
                    <p className="flex h-[240px] items-center justify-center text-center text-sm text-muted-foreground">
                        Nothing has been received or paid through the books in the last six months yet.
                    </p>
                ) : view === 'chart' ? (
                    <ResponsiveContainer width="100%" height={240}>
                        <BarChart data={rows} barGap={2} margin={{ left: 4, right: 4 }}>
                            <CartesianGrid vertical={false} strokeDasharray="3 3" className="stroke-muted" />
                            <XAxis dataKey="label" className="text-xs" tickLine={false} axisLine={false} />
                            <YAxis
                                className="text-xs"
                                width={56}
                                tickLine={false}
                                axisLine={false}
                                tickFormatter={(v: number) => formatCompactCurrency(v)}
                            />
                            <Tooltip
                                cursor={{ className: 'fill-muted' }}
                                labelFormatter={(_, payload) => payload?.[0]?.payload?.long ?? ''}
                                formatter={(value) => formatCurrency(value as number)}
                                contentStyle={{ borderRadius: '8px', fontSize: '12px' }}
                            />
                            <Legend formatter={(value) => <span className="text-foreground">{value}</span>} />
                            <Bar dataKey="feesIn" name="Fees in" fill="#059669" radius={[4, 4, 0, 0]} maxBarSize={28} />
                            <Bar
                                dataKey="payrollCost"
                                name="Payroll cost"
                                fill="#2563eb"
                                className="dark:fill-blue-500"
                                radius={[4, 4, 0, 0]}
                                maxBarSize={28}
                            />
                        </BarChart>
                    </ResponsiveContainer>
                ) : (
                    <table data-stack className="w-full text-sm">
                        <thead>
                            <tr className="border-b text-left text-muted-foreground">
                                <th className="py-2 font-medium">Month</th>
                                <th className="py-2 text-right font-medium">Fees in</th>
                                <th className="py-2 text-right font-medium">Payroll cost</th>
                            </tr>
                        </thead>
                        <tbody>
                            {rows.map((r) => (
                                <tr key={r.long} className="border-b last:border-0">
                                    <td className="py-2">{r.long}</td>
                                    <td className="py-2 text-right tabular-nums"><Money value={r.raw.feesIn} /></td>
                                    <td className="py-2 text-right tabular-nums"><Money value={r.raw.payrollCost} /></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </CardContent>
        </Card>
    );
}
