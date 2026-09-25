'use client';

import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Money } from '@/components/common/money';
import { useCan } from '@/lib/hooks/use-can';
import { useBudgetVariance } from '@/lib/hooks/use-finance';
import { cn } from '@/lib/utils';

/**
 * Spend against budget, today (C4.10, the bursar's home): the whole of it,
 * and the lines closest to or over their budget. Renders nothing for anyone
 * who may not read budgets, or where none are set.
 */
export function BudgetWidget() {
    const canRead = useCan()('budgets.read');
    const { data: lines = [] } = useBudgetVariance(undefined, canRead);
    if (!canRead || lines.length === 0) return null;

    const budgeted = lines.reduce((s, l) => s + Number(l.budgeted), 0);
    const actual = lines.reduce((s, l) => s + Number(l.actual), 0);
    const used = budgeted > 0 ? Math.round((actual / budgeted) * 100) : null;
    const tightest = [...lines]
        .filter((l) => l.usedPercent !== null)
        .sort((a, b) => (b.usedPercent ?? 0) - (a.usedPercent ?? 0))
        .slice(0, 4);

    return (
        <Card>
            <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                    <div>
                        <CardTitle className="text-base">Spend against budget</CardTitle>
                        <CardDescription>The budgets in force today</CardDescription>
                    </div>
                    <Link href="/budgets" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:underline">
                        Budgets <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                <p className="text-sm">
                    <Money value={actual} className="text-lg font-semibold" /> of <Money value={budgeted} />
                    {used !== null && <span className="ml-1 text-muted-foreground">({used}%)</span>}
                </p>
                <ul className="space-y-2">
                    {tightest.map((l) => (
                        <li key={l.budgetId} className="space-y-1">
                            <div className="flex justify-between gap-2 text-sm">
                                <span className="truncate">
                                    {l.accountName}
                                    {l.department ? ` · ${l.department}` : ''}
                                </span>
                                <span className={cn('tabular-nums', l.overBudget && 'font-semibold text-red-600')}>
                                    {l.usedPercent}%{l.overBudget ? ' over' : ''}
                                </span>
                            </div>
                            <div className="h-1.5 rounded-full bg-muted" aria-hidden="true">
                                <div
                                    className={cn('h-1.5 rounded-full', l.overBudget ? 'bg-red-500' : (l.usedPercent ?? 0) > 85 ? 'bg-amber-500' : 'bg-emerald-500')}
                                    style={{ width: `${Math.min(100, l.usedPercent ?? 0)}%` }}
                                />
                            </div>
                        </li>
                    ))}
                </ul>
            </CardContent>
        </Card>
    );
}
