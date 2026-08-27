'use client';

import Link from 'next/link';
import { Wallet, CalendarDays, UserCircle, ArrowRight, Download, Loader2 } from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CurrencyDisplay } from '@/components/common/currency-display';
import { BirthdaysWidget } from '@/components/dashboard/birthdays-widget';
import {
    useMyEmployee,
    useMyYtd,
    useMyPayslips,
    useDownloadMyPayslip,
} from '@/lib/hooks/use-self-service';

/**
 * What a plain member of staff sees when they land. Not the admin dashboard —
 * no tenant KPIs, no onboarding checklist, none of which is theirs to act on.
 * Their own pay is the thing they came to see, so it leads; then a way to their
 * payslips and leave, and the one shared thing, whose birthday is coming up.
 */
export function EmployeeDashboard() {
    const { data: me } = useMyEmployee();
    const { data: ytd } = useMyYtd();
    const { data: payslips = [] } = useMyPayslips();
    const download = useDownloadMyPayslip();

    const firstName = me?.firstName ?? 'there';
    const recent = payslips.slice(0, 3);
    const latest = recent[0];

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">
                    Welcome back, {firstName}
                </h1>
                <p className="text-muted-foreground">
                    {me
                        ? `${me.employeeNumber}${me.role ? ` · ${me.role}` : ''}${me.department ? ` · ${me.department}` : ''}`
                        : 'Your pay, payslips and leave'}
                </p>
            </div>

            {/* Year to date — the figure they came for */}
            {ytd && ytd.periodsIncluded > 0 ? (
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0">
                        <div>
                            <CardTitle className="text-lg">
                                Your pay this year ({ytd.year})
                            </CardTitle>
                            <p className="text-sm text-muted-foreground">
                                Across {ytd.periodsIncluded} pay period
                                {ytd.periodsIncluded === 1 ? '' : 's'}.
                            </p>
                        </div>
                        <Link
                            href="/me"
                            className="hidden shrink-0 items-center gap-1 text-sm font-medium text-blue-600 hover:underline sm:flex dark:text-blue-400"
                        >
                            View all <ArrowRight className="h-4 w-4" />
                        </Link>
                    </CardHeader>
                    <CardContent>
                        <div className="grid gap-4 sm:grid-cols-3">
                            <Figure label="Gross pay" value={ytd.grossSalary} />
                            <Figure label="Deductions" value={ytd.totalDeductions} />
                            <Figure label="Net paid" value={ytd.netSalary} emphasis />
                        </div>
                        {latest && (
                            <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t pt-4">
                                <div className="text-sm">
                                    <span className="text-muted-foreground">
                                        Latest payslip
                                    </span>{' '}
                                    <span className="font-medium">
                                        {latest.payPeriod ?? '—'}
                                    </span>
                                    {latest.netSalary != null && (
                                        <span className="text-muted-foreground">
                                            {' · '}
                                            <CurrencyDisplay amount={latest.netSalary} size="sm" />{' '}
                                            net
                                        </span>
                                    )}
                                </div>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    disabled={download.isPending}
                                    onClick={() =>
                                        download.mutate({
                                            id: latest.id,
                                            fileName: latest.fileName,
                                        })
                                    }
                                >
                                    {download.isPending ? (
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    ) : (
                                        <Download className="mr-2 h-4 w-4" />
                                    )}
                                    Download
                                </Button>
                            </div>
                        )}
                    </CardContent>
                </Card>
            ) : (
                <Card>
                    <CardContent className="py-8 text-center">
                        <p className="text-sm text-muted-foreground">
                            No pay recorded yet. Your payslips will show here once payroll
                            has run for a period you worked.
                        </p>
                    </CardContent>
                </Card>
            )}

            <div className="grid gap-6 lg:grid-cols-2">
                {/* Quick links */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg">Quick links</CardTitle>
                    </CardHeader>
                    <CardContent className="grid gap-2">
                        <QuickLink
                            href="/me"
                            icon={<Wallet className="h-4 w-4" />}
                            title="My Pay"
                            hint="Payslips and year-to-date totals"
                        />
                        <QuickLink
                            href="/me/leave"
                            icon={<CalendarDays className="h-4 w-4" />}
                            title="My Leave"
                            hint="Request time off and track balances"
                        />
                        <QuickLink
                            href="/me/profile"
                            icon={<UserCircle className="h-4 w-4" />}
                            title="My Profile"
                            hint="Your personal and employment details"
                        />
                    </CardContent>
                </Card>

                {/* Birthdays — the one shared thing */}
                <BirthdaysWidget />
            </div>
        </div>
    );
}

function Figure({
    label,
    value,
    emphasis,
}: {
    label: string;
    value: number;
    emphasis?: boolean;
}) {
    return (
        <div>
            <p className="text-xs uppercase tracking-wide text-muted-foreground">
                {label}
            </p>
            <p className={emphasis ? 'text-2xl font-bold' : 'text-2xl font-semibold'}>
                <CurrencyDisplay amount={value} />
            </p>
        </div>
    );
}

function QuickLink({
    href,
    icon,
    title,
    hint,
}: {
    href: string;
    icon: React.ReactNode;
    title: string;
    hint: string;
}) {
    return (
        <Link
            href={href}
            className="group flex items-center gap-3 rounded-lg border p-3 transition-colors hover:border-blue-300 hover:bg-blue-50/50 dark:hover:border-blue-800 dark:hover:bg-blue-950/30"
        >
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground group-hover:bg-blue-100 group-hover:text-blue-700 dark:group-hover:bg-blue-900 dark:group-hover:text-blue-300">
                {icon}
            </span>
            <span className="min-w-0 flex-1">
                <span className="block text-sm font-medium">{title}</span>
                <span className="block truncate text-xs text-muted-foreground">
                    {hint}
                </span>
            </span>
            <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
        </Link>
    );
}
