'use client';

import Link from 'next/link';
import { AlertTriangle, Loader2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { useDaySummary } from '@/lib/hooks/use-attendance';

/**
 * Today's attendance, and — louder — the registers nobody has taken.
 *
 * An attendance system's real failure is not a wrong mark, it is a register
 * that was never taken; a tile showing only what *was* marked hides that
 * perfectly. So the arms are named rather than counted: a percentage computed
 * from nine registers out of twelve is a confident, meaningless figure, and
 * naming the three missing ones is something a person can act on.
 */
export function AttendanceTile() {
    const { data, isLoading, isError } = useDaySummary();

    if (isLoading) {
        return (
            <Card>
                <CardContent className="flex justify-center py-8">
                    <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                </CardContent>
            </Card>
        );
    }

    // A school with no attendance set up yet should not see a broken tile.
    if (isError || !data || data.armsTotal === 0) return null;

    // A missing calendar and a genuine holiday are different facts, and saying
    // "not a teaching day" for the first one sends an administrator looking for
    // a holiday nobody entered.
    if (data.dayType === null) {
        return (
            <Card>
                <CardContent className="py-5">
                    <p className="text-sm font-medium text-muted-foreground">
                        Attendance today
                    </p>
                    <p className="mt-2 text-sm">
                        Today is not in the school calendar yet, so no register can
                        be taken.{' '}
                        <Link
                            href="/attendance/calendar"
                            className="font-medium underline"
                        >
                            Set up the calendar
                        </Link>
                        .
                    </p>
                </CardContent>
            </Card>
        );
    }

    if (!data.isTeachingDay) {
        return (
            <Card>
                <CardContent className="py-5">
                    <p className="text-sm font-medium text-muted-foreground">
                        Attendance today
                    </p>
                    <p className="mt-2 text-sm">
                        No register today — this is not a teaching day.
                    </p>
                </CardContent>
            </Card>
        );
    }

    const notTaken = data.armsNotTaken;

    return (
        <Card className="overflow-hidden">
            <CardContent className="py-5">
                <p className="text-sm font-medium text-muted-foreground">
                    Attendance today
                </p>
                <p className="mt-1 whitespace-nowrap text-3xl font-semibold tabular-nums">
                    {data.rate}%
                </p>
                <p className="mt-1 text-xs tabular-nums text-muted-foreground">
                    {data.inSchool} of {data.enrolled} pupils in school
                </p>
            </CardContent>

            {notTaken.length > 0 && (
                <div className="border-t border-amber-200 bg-amber-50 px-6 py-4 dark:border-amber-900/50 dark:bg-amber-950/30">
                    <p className="flex items-center gap-2 text-sm font-semibold text-amber-900 dark:text-amber-200">
                        <AlertTriangle className="h-4 w-4 flex-none" aria-hidden="true" />
                        <span className="tabular-nums">
                            {notTaken.length} of {data.armsTotal} registers not yet taken
                        </span>
                    </p>
                    <ul className="mt-2 flex list-none flex-wrap gap-1.5 p-0">
                        {notTaken.map((a) => (
                            <li key={a.classArmId}>
                                <Link
                                    href="/attendance"
                                    className="inline-block rounded-md border border-amber-400 bg-background px-2 py-1 text-xs font-semibold text-amber-800 hover:bg-amber-100 dark:text-amber-300 dark:hover:bg-amber-950"
                                >
                                    {a.className}
                                </Link>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </Card>
    );
}
