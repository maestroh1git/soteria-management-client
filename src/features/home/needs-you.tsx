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
 */
export function NeedsYou() {
    const { data, isLoading } = useHome();
    if (isLoading || !data) return null;
    if (data.items.length === 0) {
        return <p className="text-sm text-muted-foreground">Nothing is waiting on you.</p>;
    }
    return (
        <section aria-labelledby="needs-you" className="space-y-2">
            <h2 id="needs-you" className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                Waiting on you
            </h2>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {data.items.map((item) => {
                    const look = LOOK[item.key];
                    if (!look) return null;
                    const Icon = look.icon;
                    return (
                        <Link key={item.key} href={item.href} className="group">
                            <Card className="h-full transition-colors group-hover:border-primary/50">
                                <CardContent className="flex items-center gap-3 py-4">
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
