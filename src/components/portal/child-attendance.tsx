'use client';

import { Award, Loader2, Phone, UserRound } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { EmptyState } from '@/components/common/empty-state';
import { TermStrip } from '@/components/attendance/term-strip';
import { useChildAttendance } from '@/lib/hooks/use-portal';
import { ABSENCE_REASON_LABELS, type AbsenceReason } from '@/lib/api/attendance';
import { formatDayOfWeek } from '@/lib/utils/dates';

const STATUS_LABEL: Record<string, string> = {
    PRESENT: 'Present',
    LATE: 'Late',
    ABSENT: 'Absent',
    EXCUSED: 'Excused',
};

/**
 * A child's attendance, for their own parent.
 *
 * The tone differs from every other screen in the platform on purpose: a parent
 * may be finding out about an absence they did not know about, which is news
 * about their child rather than a data display. So: plain language before
 * percentages, letters on every square so colour is never the only signal, and
 * nothing comparative anywhere — no class average, no ranking, no band.
 *
 * There is also a way to respond. A red square a parent cannot reply to is a
 * support call routed through frustration, and until the portal has an inbound
 * message path the honest exit is the school's number.
 */
export function ChildAttendance({
    studentId,
    schoolPhone,
}: {
    studentId: string;
    schoolPhone?: string | null;
}) {
    const { data, isLoading, isError } = useChildAttendance(studentId);

    if (isLoading) {
        return (
            <Card>
                <CardContent className="flex justify-center py-12">
                    <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                </CardContent>
            </Card>
        );
    }

    /*
        Split deliberately. "The school has not started taking a register" is a
        statement about the school, and saying it to a parent because our own
        request failed is a lie told to the person least able to check it.
    */
    if (isError && !data) {
        return (
            <EmptyState
                isError
                subject="your child's attendance"
                title="No attendance to show yet"
            />
        );
    }

    if (!data) {
        return (
            <EmptyState
                title="No attendance to show yet"
                description="The school has not started taking a register for this term."
            />
        );
    }

    if (data.teachingDays === 0) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg">Attendance</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-muted-foreground">{data.sentence}</p>
                </CardContent>
            </Card>
        );
    }

    const notable = data.days.filter(
        (d) => d.status === 'ABSENT' || d.status === 'LATE' || d.status === 'EXCUSED',
    );

    return (
        <div className="space-y-4">
            <Card>
                <CardContent className="py-5">
                    <p className="text-balance text-xl font-semibold leading-snug">
                        {data.sentence}
                    </p>
                    {data.formTeacher && (
                        <p className="mt-2 flex items-center gap-1.5 text-sm text-muted-foreground">
                            <UserRound className="h-3.5 w-3.5 flex-none" aria-hidden="true" />
                            <span>
                                {data.className ? `${data.className} · ` : ''}
                                taken by <strong className="font-medium text-foreground">{data.formTeacher}</strong>
                            </span>
                        </p>
                    )}
                    <p className="mt-2 text-sm tabular-nums text-muted-foreground">
                        {data.attendanceRate}% attendance ·{' '}
                        {data.unauthorisedAbsences === 0
                            ? 'no unexplained absences'
                            : `${data.unauthorisedAbsences} unexplained ${
                                  data.unauthorisedAbsences === 1 ? 'absence' : 'absences'
                              }`}
                        {data.longestStreak > 1
                            ? ` · longest run in school: ${data.longestStreak} days`
                            : ''}
                    </p>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="text-base">
                        Every teaching day this term
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <TermStrip days={data.days} />
                </CardContent>
            </Card>

            {notable.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">Days to know about</CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        <ul className="list-none divide-y p-0">
                            {notable.map((d) => (
                                <li
                                    key={d.date}
                                    className="flex items-center justify-between gap-3 px-6 py-3"
                                >
                                    <div className="min-w-0">
                                        <p className="text-sm font-medium">
                                            {formatDayOfWeek(d.date)}
                                        </p>
                                        <p className="text-xs text-muted-foreground">
                                            {d.reasonCode
                                                ? (ABSENCE_REASON_LABELS[
                                                      d.reasonCode as AbsenceReason
                                                  ] ?? d.reasonCode)
                                                : 'No reason recorded'}
                                        </p>
                                    </div>
                                    <span className="flex-none rounded-md bg-muted px-2 py-1 text-xs font-semibold">
                                        {STATUS_LABEL[d.status ?? ''] ?? ''}
                                        {d.minutesLate ? ` · ${d.minutesLate} min` : ''}
                                    </span>
                                </li>
                            ))}
                        </ul>
                    </CardContent>
                </Card>
            )}

            {(data.badges.length > 0 || data.awards.length > 0) && (
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">Well done</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {data.awards.length > 0 && (
                            <ul className="list-none space-y-2 p-0">
                                {data.awards.map((a) => (
                                    <li
                                        key={a.id}
                                        className="flex items-start gap-3 rounded-lg border p-3"
                                    >
                                        <Award
                                            className="mt-0.5 h-4 w-4 flex-none text-amber-600 dark:text-amber-400"
                                            aria-hidden="true"
                                        />
                                        <div className="min-w-0">
                                            <p className="text-sm font-medium">{a.title}</p>
                                            <p className="text-xs text-muted-foreground">
                                                {a.description ??
                                                    a.category.charAt(0) +
                                                        a.category.slice(1).toLowerCase()}
                                            </p>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        )}
                        {data.badges.length > 0 && (
                            <ul className="flex list-none flex-wrap gap-2 p-0">
                                {data.badges.map((b) => (
                                    <li
                                        key={b.id}
                                        title={b.description}
                                        className="rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300"
                                    >
                                        {b.name}
                                    </li>
                                ))}
                            </ul>
                        )}
                    </CardContent>
                </Card>
            )}

            <p className="flex items-start gap-2 rounded-lg bg-accent px-4 py-3 text-sm text-accent-foreground">
                <Phone className="mt-0.5 h-4 w-4 flex-none" aria-hidden="true" />
                <span>
                    Something here look wrong? Call the school office
                    {schoolPhone ? (
                        <>
                            {' '}
                            on <span className="font-semibold">{schoolPhone}</span>
                        </>
                    ) : null}{' '}
                    and they will check the register with you.
                </span>
            </p>
        </div>
    );
}
