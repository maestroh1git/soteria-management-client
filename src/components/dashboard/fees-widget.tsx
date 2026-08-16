'use client';

import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { useAuth } from '@/lib/hooks/use-auth';
import { useSessions } from '@/lib/hooks/use-academics';
import { useIncomeStatement } from '@/lib/hooks/use-finance';
import { useFeeSummary } from '@/lib/hooks/use-fees';

const money = (v: string) => {
    const [whole, fraction = '00'] = (v ?? '0').split('.');
    const sign = whole.startsWith('-') ? '-' : '';
    return `${sign}${whole.replace('-', '').replace(/\B(?=(\d{3})+(?!\d))/g, ',')}.${fraction}`;
};

/**
 * Fees in against costs out — the Phase 4 milestone, on the dashboard.
 *
 * Both numbers come from the ledger, which is the point: this is the first
 * screen in the system where the two sides of the money meet, and it can only
 * be trusted because neither side is a module reporting its own tally.
 *
 * Renders nothing for a tenant that has never billed anything, and nothing at
 * all outside a school. A dashboard tile that shows four zeros teaches people
 * to ignore that corner of the screen.
 */
export function FeesWidget() {
    const { tenantOrgType } = useAuth();
    const { data: summary } = useFeeSummary();
    const { data: sessions } = useSessions();

    const current = sessions?.find((s) => s.isCurrent);
    const { data: income } = useIncomeStatement(
        current?.startDate,
        current?.endDate,
    );

    if (tenantOrgType !== 'SCHOOL') return null;
    if (!summary?.term || Number(summary.billed) === 0) return null;

    const net = income ? Number(income.net) : null;

    return (
        <Card>
            <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                    <div>
                        <CardTitle className="text-base">Fees</CardTitle>
                        <CardDescription>{summary.term.name}</CardDescription>
                    </div>
                    <Link
                        href="/fees/arrears"
                        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:underline"
                    >
                        Arrears
                        <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                    <div>
                        <p className="text-xs text-muted-foreground">Billed</p>
                        <p className="text-lg font-semibold tabular-nums">
                            ₦{money(summary.billed)}
                        </p>
                    </div>
                    <div>
                        <p className="text-xs text-muted-foreground">Collected</p>
                        <p className="text-lg font-semibold tabular-nums text-green-700 dark:text-green-400">
                            ₦{money(summary.collected)}
                            {summary.collectionRate !== null && (
                                <span className="ml-1 text-xs font-normal text-muted-foreground">
                                    {summary.collectionRate}%
                                </span>
                            )}
                        </p>
                    </div>
                    <div>
                        <p className="text-xs text-muted-foreground">Outstanding</p>
                        <p className="text-lg font-semibold tabular-nums">
                            ₦{money(summary.outstanding)}
                            {summary.studentsOwing > 0 && (
                                <span className="ml-1 text-xs font-normal text-muted-foreground">
                                    {summary.studentsOwing} owing
                                </span>
                            )}
                        </p>
                    </div>
                    <div>
                        <p className="text-xs text-muted-foreground">
                            Net this session
                        </p>
                        <p
                            className={`text-lg font-semibold tabular-nums ${
                                net !== null && net < 0 ? 'text-red-600' : ''
                            }`}
                        >
                            {income ? `₦${money(income.net)}` : '—'}
                        </p>
                    </div>
                </div>

                {Number(summary.unallocatedCredit) > 0 && (
                    <p className="text-xs text-muted-foreground">
                        ₦{money(summary.unallocatedCredit)} received and not yet applied
                        to a bill.
                    </p>
                )}
            </CardContent>
        </Card>
    );
}
