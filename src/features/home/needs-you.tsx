'use client';

import Link from 'next/link';
import {
    ArrowRight,
    Banknote,
    CalendarClock,
    ClipboardCheck,
    ClipboardList,
    Hourglass,
    Inbox,
    Landmark,
    Receipt,
    type LucideIcon,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Money } from '@/components/common/money';
import { useHome } from './hooks';
import type { HomeItem } from '@/lib/api/home';

const LOOK: Record<HomeItem['key'], { icon: LucideIcon; label: (n: number) => string }> = {
    approvals: { icon: Inbox, label: (n) => `${n} decision${n === 1 ? '' : 's'} waiting on you` },
    myRegisters: { icon: ClipboardCheck, label: (n) => `${n} of your registers not taken today` },
    registers: { icon: ClipboardCheck, label: (n) => `${n} register${n === 1 ? '' : 's'} not taken today` },
    applications: { icon: ClipboardList, label: (n) => `${n} application${n === 1 ? '' : 's'} to consider` },
    sittingsToday: { icon: CalendarClock, label: (n) => `${n} assessment${n === 1 ? '' : 's'} today` },
    payRuns: { icon: Banknote, label: (n) => `${n} pay run${n === 1 ? '' : 's'} due within a fortnight` },
    unreconciled: { icon: Landmark, label: (n) => `${n} bank line${n === 1 ? '' : 's'} to reconcile` },
    overdueInvoices: { icon: Receipt, label: (n) => `${n} invoice${n === 1 ? '' : 's'} overdue` },
    myRequests: { icon: Hourglass, label: (n) => `${n} of your requests awaiting a decision` },
};

/**
 * The top of everyone's home (ROADMAP-EXECUTION.md, C4.10): what is waiting
 * on this person, each a step to where it is done. The API returns only what
 * is theirs and only what is above zero; when nothing is, this says so in one
 * line rather than drawing empty tiles.
 *
 * `list` is the same items as rows in one card, for the owner's home, where
 * the chart beside it needs the width the tiles would take.
 */
export function NeedsYou({ variant = 'tiles' }: { variant?: 'tiles' | 'list' }) {
    const { data, isLoading } = useHome();
    if (isLoading || !data) return null;
    const items = data.items.filter((item) => LOOK[item.key]);

    if (variant === 'list') {
        return (
            <Card className="h-full gap-0 py-0">
                <h2 id="needs-you" className="px-5 pt-5 pb-3 text-base font-semibold">
                    Waiting on you
                </h2>
                {items.length === 0 ? (
                    <p className="px-5 pb-5 text-sm text-muted-foreground">Nothing is waiting on you.</p>
                ) : (
                    <ul aria-labelledby="needs-you" className="list-none divide-y border-t p-0">
                        {items.map((item) => {
                            const look = LOOK[item.key];
                            const Icon = look.icon;
                            return (
                                <li key={item.key}>
                                    <Link
                                        href={item.href}
                                        className="group flex items-center gap-3 px-5 py-3 text-sm hover:bg-accent"
                                    >
                                        <Icon className="h-4 w-4 shrink-0 text-amber-600" aria-hidden="true" />
                                        <span className="min-w-0 flex-1">
                                            {look.label(item.count)}
                                            {item.amount && (
                                                <span className="block text-xs text-muted-foreground">
                                                    <Money value={item.amount} /> owed
                                                </span>
                                            )}
                                        </span>
                                        <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground" aria-hidden="true" />
                                    </Link>
                                </li>
                            );
                        })}
                    </ul>
                )}
            </Card>
        );
    }

    if (items.length === 0) {
        return <p className="text-sm text-muted-foreground">Nothing is waiting on you.</p>;
    }
    return (
        <section aria-labelledby="needs-you" className="space-y-2">
            <h2 id="needs-you" className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                Waiting on you
            </h2>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {items.map((item) => {
                    const look = LOOK[item.key];
                    const Icon = look.icon;
                    return (
                        <Link key={item.key} href={item.href} className="group">
                            <Card className="h-full transition-colors group-hover:border-primary/50">
                                <CardContent className="flex items-center gap-3">
                                    <Icon className="h-5 w-5 shrink-0 text-amber-600" aria-hidden="true" />
                                    <span className="min-w-0 flex-1 text-sm font-medium">
                                        {look.label(item.count)}
                                        {item.amount && (
                                            <span className="block text-xs font-normal text-muted-foreground">
                                                <Money value={item.amount} /> owed
                                            </span>
                                        )}
                                    </span>
                                    <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground" aria-hidden="true" />
                                </CardContent>
                            </Card>
                        </Link>
                    );
                })}
            </div>
        </section>
    );
}
