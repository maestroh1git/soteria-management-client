'use client';

import Link from 'next/link';
import {
    AlertTriangle,
    ArrowRight,
    Award as AwardIcon,
    CalendarDays,
    CheckCircle2,
    DoorOpen,
    Loader2,
    Users,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/common/empty-state';
import { PageHeader } from '@/components/layout/page-header';
import { useMyClasses } from '@/lib/hooks/use-attendance';
import { formatDayOfWeek } from '@/lib/utils/dates';
import { StudentLink } from '@/components/common/entity-link';

/**
 * Where a form teacher lives.
 *
 * Before this, a teacher signing in landed on a payroll dashboard — cost per
 * department, approved runs, tax rules, none of it theirs. Attendance is not a
 * screen they navigate to; it is what this page is for, and the register is its
 * first job rather than an item in a menu.
 */
export default function MyClassesPage() {
    const { data, isLoading, isError } = useMyClasses();

    if (isLoading) {
        return (
            <div className="flex justify-center py-16">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
        );
    }

    const classes = data?.classes ?? [];

    if (classes.length === 0) {
        return (
            <EmptyState
                isError={isError}
                subject="your classes"
                title="You are not the educator for a class"
                description="If that looks wrong, ask the school office to set you as the educator on your class."
            />
        );
    }

    const when = data?.date
        ? formatDayOfWeek(data.date)
        : '';

    return (
        <div className="space-y-6">
            <PageHeader title="My classes" description={`Today, ${when}`} />

            {classes.map((c) => (
                <Card key={c.classArmId}>
                    <CardContent className="space-y-5 py-5">
                        <div className="flex flex-wrap items-start justify-between gap-3">
                            <div>
                                <h2 className="text-lg font-semibold">
                                    <Link
                                        href={`/me/classes/${c.classArmId}`}
                                        className="hover:underline"
                                    >
                                        {c.className}
                                    </Link>
                                </h2>
                                <p className="mt-0.5 flex items-center gap-1.5 text-sm text-muted-foreground">
                                    <Users className="h-3.5 w-3.5" />
                                    <span className="tabular-nums">{c.enrolled}</span> pupils
                                </p>
                            </div>
                            {c.termRate !== null && (
                                <div className="text-right">
                                    <p className="text-xs text-muted-foreground">
                                        This term so far
                                    </p>
                                    <p className="text-2xl font-semibold tabular-nums">
                                        {c.termRate}%
                                    </p>
                                </div>
                            )}
                        </div>

                        {!c.markable ? (
                            <p className="rounded-lg bg-muted px-4 py-3 text-sm text-muted-foreground">
                                {c.blockedReason}
                            </p>
                        ) : c.registerTaken ? (
                            <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 dark:border-emerald-900/50 dark:bg-emerald-950/30">
                                <p className="flex items-center gap-2 text-sm font-medium text-emerald-900 dark:text-emerald-200">
                                    <CheckCircle2 className="h-4 w-4 flex-none" />
                                    <span className="tabular-nums">
                                        Register taken — {c.present} present, {c.late} late,{' '}
                                        {c.absent} absent, {c.excused} excused
                                    </span>
                                </p>
                                <Button asChild variant="outline" size="sm">
                                    <Link href={`/me/classes/${c.classArmId}/register`}>Amend</Link>
                                </Button>
                            </div>
                        ) : (
                            <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 dark:border-amber-900/50 dark:bg-amber-950/30">
                                <p className="text-sm font-semibold text-amber-900 dark:text-amber-200">
                                    Register not taken yet
                                </p>
                                <Button asChild className="mt-3 h-11 w-full sm:w-auto">
                                    <Link href={`/me/classes/${c.classArmId}/register`}>
                                        Take the register for {c.className}
                                        <ArrowRight className="ml-2 h-4 w-4" />
                                    </Link>
                                </Button>
                            </div>
                        )}

                        {/* Today at a glance: who has gone home, and the way to
                            recognise a child, one tap from the class. */}
                        <div className="flex flex-wrap items-center gap-2 text-sm">
                            <span className="flex items-center gap-1.5 text-muted-foreground">
                                <DoorOpen className="h-3.5 w-3.5" aria-hidden="true" />
                                {c.signedOutToday === 0
                                    ? 'Nobody signed out today'
                                    : `${c.signedOutToday} signed out today`}
                            </span>
                            <span className="ml-auto flex flex-wrap gap-2">
                                <Button asChild variant="outline" size="sm">
                                    <Link href={`/me/classes/${c.classArmId}#the-class`}>
                                        <AwardIcon className="mr-2 h-4 w-4" /> Recognise a pupil
                                    </Link>
                                </Button>
                                <Button asChild variant="outline" size="sm">
                                    <Link href={`/me/classes/${c.classArmId}`}>
                                        <CalendarDays className="mr-2 h-4 w-4" /> The week
                                    </Link>
                                </Button>
                            </span>
                        </div>

                        {c.needsAWord.length > 0 && (
                            <div>
                                <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                                    Needs a word
                                </h3>
                                <ul className="list-none divide-y rounded-lg border p-0">
                                    {c.needsAWord.map((p) => (
                                        <li
                                            key={p.studentId}
                                            className="flex items-center justify-between gap-3 px-3 py-2.5"
                                        >
                                            <div className="min-w-0">
                                                <p className="truncate text-sm font-medium">
                                                    <StudentLink id={p.studentId} name={`${p.lastName}, ${p.firstName}`} />
                                                </p>
                                                <p className="truncate text-xs text-muted-foreground tabular-nums">
                                                    In school {p.inSchool} of {p.teachingDays} days
                                                    {p.guardianPhone
                                                        ? ` · ${p.guardianName} ${p.guardianPhone}`
                                                        : ''}
                                                </p>
                                            </div>
                                            <span className="flex flex-none items-center gap-1 rounded-md bg-red-50 px-2 py-1 text-xs font-semibold tabular-nums text-red-700 dark:bg-red-950/50 dark:text-red-300">
                                                <AlertTriangle
                                                    className="h-3 w-3"
                                                    aria-hidden="true"
                                                />
                                                {p.attendanceRate}%
                                            </span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </CardContent>
                </Card>
            ))}
        </div>
    );
}
