'use client';

import { use } from 'react';
import Link from 'next/link';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChildAttendance } from '@/components/portal/child-attendance';
import { EmptyState } from '@/components/common/empty-state';
import { useChildStatement } from '@/lib/hooks/use-portal';

const money = (v: string | number) =>
    Number(v).toLocaleString('en-NG', { minimumFractionDigits: 2 });

export default function ChildStatementPage({
    params,
}: {
    params: Promise<{ studentId: string }>;
}) {
    const { studentId } = use(params);
    const { data, isLoading, isError } = useChildStatement(studentId);

    if (isLoading) {
        return (
            <div className="flex justify-center py-16">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
        );
    }

    // A parent who edits the id in the address bar lands here. The server says
    // "no such child on your account" for somebody else's child and for one
    // that does not exist, and so does this.
    if (isError || !data) {
        return (
            <div className="space-y-4">
                <BackLink />
                <EmptyState
                    title="We couldn't find that child on your account"
                    description="Go back and pick one of your children. If you think this is wrong, contact the school office."
                />
            </div>
        );
    }

    const owed = Number(data.balance);
    const credit = Number(data.unallocatedCredit);

    return (
        <div className="space-y-6">
            <BackLink />

            <div>
                <h1 className="text-2xl font-semibold">{data.student.name}</h1>
                <p className="mt-1 text-sm text-muted-foreground">
                    {data.student.admissionNumber} · every charge and payment on
                    this child&apos;s account.
                </p>
            </div>

            {/* Attendance first: it is the thing a parent checks daily, and the
                reason they open the portal at all rather than only when a bill
                is due. */}
            <ChildAttendance studentId={data.student.id} />

            <div className="grid gap-3 sm:grid-cols-2">
                <Card>
                    <CardContent className="py-4">
                        <p className="text-xs uppercase tracking-wide text-muted-foreground">
                            Owed now
                        </p>
                        <p
                            className={`mt-1 text-2xl font-semibold tabular-nums ${
                                owed > 0 ? '' : 'text-green-600 dark:text-green-400'
                            }`}
                        >
                            ₦{money(data.balance)}
                        </p>
                        {owed <= 0 && (
                            <p className="mt-1 text-xs text-muted-foreground">
                                Nothing outstanding. Thank you.
                            </p>
                        )}
                    </CardContent>
                </Card>
                {credit > 0 && (
                    <Card>
                        <CardContent className="py-4">
                            <p className="text-xs uppercase tracking-wide text-muted-foreground">
                                Credit on account
                            </p>
                            <p className="mt-1 text-2xl font-semibold tabular-nums">
                                ₦{money(data.unallocatedCredit)}
                            </p>
                            <p className="mt-1 text-xs text-muted-foreground">
                                Paid but not yet applied to a bill. It will be used
                                on the next one.
                            </p>
                        </CardContent>
                    </Card>
                )}
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="text-lg">Account history</CardTitle>
                </CardHeader>
                <CardContent>
                    {data.entries.length === 0 ? (
                        <p className="py-6 text-center text-sm text-muted-foreground">
                            Nothing has been billed yet.
                        </p>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b text-left text-muted-foreground">
                                        <th className="py-2 pr-3 font-medium">Date</th>
                                        <th className="py-2 pr-3 font-medium">
                                            Description
                                        </th>
                                        <th className="py-2 pr-3 text-right font-medium">
                                            Charge
                                        </th>
                                        <th className="py-2 pr-3 text-right font-medium">
                                            Paid
                                        </th>
                                        <th className="py-2 text-right font-medium">
                                            Balance
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {data.entries.map((e, i) => (
                                        <tr key={i} className="border-b last:border-0">
                                            <td className="py-2 pr-3 whitespace-nowrap text-muted-foreground">
                                                {e.date}
                                            </td>
                                            <td className="py-2 pr-3">
                                                {e.description}
                                            </td>
                                            <td className="py-2 pr-3 text-right tabular-nums">
                                                {e.charge ? `₦${money(e.charge)}` : '—'}
                                            </td>
                                            <td className="py-2 pr-3 text-right tabular-nums text-green-700 dark:text-green-400">
                                                {e.payment
                                                    ? `₦${money(e.payment)}`
                                                    : '—'}
                                            </td>
                                            <td className="py-2 text-right font-medium tabular-nums">
                                                ₦{money(e.balance)}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}

function BackLink() {
    return (
        <Link
            href="/portal"
            className="-my-1 inline-flex min-h-[24px] items-center gap-1 py-1 text-sm text-muted-foreground hover:text-foreground"
        >
            <ArrowLeft className="mr-1 h-4 w-4" />
            Your children
        </Link>
    );
}
