'use client';

import { useMemo, useState } from 'react';
import type { ColumnDef } from '@tanstack/react-table';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { DataTable } from '@/components/common/data-table';
import { LoadingSkeleton } from '@/components/common/loading-skeleton';
import { StatusBadge } from '@/components/common/status-badge';
import { ClassLink } from '@/components/common/entity-link';
import { cn } from '@/lib/utils';
import { useCurrentSession, useTerms } from '@/lib/hooks/use-academics';
import { useMarkHistory, useStudentSummary } from '@/lib/hooks/use-attendance';
import { ABSENCE_REASON_LABELS, type MarkHistoryItem } from '@/lib/api/attendance';
import { statusOf, statusOptions } from '@/lib/status/registry';
import { formatDate, todayIso } from '@/lib/utils/dates';

/** Each school day's mark as one square, coloured like its badge. */
const SQUARE: Record<string, string> = {
    PRESENT: 'bg-emerald-500',
    LATE: 'bg-amber-400',
    ABSENT: 'bg-red-500',
    EXCUSED: 'bg-slate-400',
};

/**
 * A pupil's attendance for one term (ROADMAP-EXECUTION.md, 5.4): the rate and
 * its streaks, a strip of every marked day, and each absence and late with
 * its reason. Only the current mark counts; corrections stay in the history.
 */
export function AttendanceTab({
    studentId,
    classArm,
}: {
    studentId: string;
    classArm?: { id: string; name: string; level?: { name: string } | null } | null;
}) {
    const { data: session } = useCurrentSession();
    const { data: terms = [] } = useTerms(session?.id);
    const [termPick, setTermPick] = useState<string>();
    const term = terms.find((t) => t.id === termPick) ?? terms.find((t) => t.isCurrent) ?? terms[0];

    const { data: summary, isLoading: summaryLoading } = useStudentSummary(studentId, term?.id);
    // Up to today: a term that is still running has no marks in its future.
    const to = term ? (term.endDate < todayIso() ? term.endDate : todayIso()) : undefined;
    const { data: history, isLoading, isError } = useMarkHistory(studentId, term?.startDate, to);
    const marks = useMemo(() => (history?.items ?? []).filter((m) => m.isCurrent), [history]);
    const strip = useMemo(() => [...marks].sort((a, b) => a.date.localeCompare(b.date)), [marks]);

    const [status, setStatus] = useState<string>();
    // The list is the exceptions; a run of "present" says nothing a rate does not.
    const exceptions = marks.filter((m) => m.status !== 'PRESENT');
    const shown = exceptions.filter((m) => !status || m.status === status);

    const columns: ColumnDef<MarkHistoryItem>[] = [
        {
            id: 'date',
            header: 'Day',
            meta: { cardTitle: true },
            cell: ({ row }) => <span className="font-medium">{formatDate(row.original.date)}</span>,
        },
        {
            id: 'status',
            header: 'Mark',
            cell: ({ row }) => (
                <span className="flex items-center gap-2">
                    <StatusBadge kind="attendance" status={row.original.status} />
                    {row.original.minutesLate ? (
                        <span className="text-xs text-muted-foreground">{row.original.minutesLate} min</span>
                    ) : null}
                </span>
            ),
        },
        {
            id: 'reason',
            header: 'Reason',
            cell: ({ row }) => {
                const m = row.original;
                const reason = m.reasonCode ? ABSENCE_REASON_LABELS[m.reasonCode] : null;
                return (
                    <span className="text-muted-foreground">
                        {[reason, m.reasonNote].filter(Boolean).join(' · ') || '—'}
                    </span>
                );
            },
        },
        {
            id: 'by',
            header: 'Marked by',
            cell: ({ row }) => (
                <span className="text-muted-foreground">
                    {row.original.recordedByName ?? '—'}
                    {row.original.correctionNote && (
                        <span className="block text-xs">Corrected: {row.original.correctionNote}</span>
                    )}
                </span>
            ),
        },
    ];

    return (
        <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm text-muted-foreground">
                    {classArm ? (
                        <>
                            In{' '}
                            <ClassLink
                                armId={classArm.id}
                                name={`${classArm.level?.name ?? ''} ${classArm.name}`.trim()}
                                className="text-foreground"
                            />
                        </>
                    ) : (
                        'Not placed in a class.'
                    )}
                </p>
                {terms.length > 0 && (
                    <Select value={term?.id} onValueChange={setTermPick}>
                        <SelectTrigger className="w-44" aria-label="Term">
                            <SelectValue placeholder="Term" />
                        </SelectTrigger>
                        <SelectContent>
                            {terms.map((t) => (
                                <SelectItem key={t.id} value={t.id}>
                                    {t.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                )}
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="text-lg">{term?.name ?? 'This term'}</CardTitle>
                    <CardDescription>
                        Share of teaching days in school, late counting as in. Absences with a reason
                        are excused.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {!term ? (
                        <p className="text-sm text-muted-foreground">No term is set up for this session.</p>
                    ) : summaryLoading ? (
                        <LoadingSkeleton rows={2} />
                    ) : summary ? (
                        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
                            <Figure label="In school" value={`${Math.round(summary.attendanceRate)}%`} strong />
                            <Figure label="Present" value={summary.present} />
                            <Figure label="Late" value={summary.late} />
                            <Figure label="Absent" value={summary.absent} />
                            <Figure label="Excused" value={summary.excused} />
                            <Figure
                                label="Days in a row"
                                value={summary.currentStreak}
                                hint={`best ${summary.longestStreak}`}
                            />
                        </div>
                    ) : null}

                    {strip.length > 0 && (
                        <div>
                            <p className="mb-1 text-xs text-muted-foreground">
                                Each marked day, {formatDate(strip[0].date)} to {formatDate(strip[strip.length - 1].date)}
                            </p>
                            <ol className="flex flex-wrap gap-1" aria-label="Marked days this term">
                                {strip.map((m) => (
                                    <li
                                        key={m.id}
                                        className={cn('h-4 w-4 rounded-sm', SQUARE[m.status] ?? 'bg-muted')}
                                        title={`${formatDate(m.date)}: ${statusOf('attendance', m.status).label}`}
                                    >
                                        <span className="sr-only">
                                            {formatDate(m.date)}: {statusOf('attendance', m.status).label}
                                        </span>
                                    </li>
                                ))}
                            </ol>
                        </div>
                    )}
                </CardContent>
            </Card>

            <DataTable
                columns={columns}
                data={shown}
                loading={isLoading}
                isError={isError}
                errorSubject="the attendance marks"
                searchText={(m) =>
                    `${m.reasonCode ? ABSENCE_REASON_LABELS[m.reasonCode] : ''} ${m.reasonNote ?? ''}`
                }
                searchPlaceholder="Reason"
                filters={[
                    {
                        id: 'status',
                        label: 'marks',
                        value: status,
                        options: statusOptions('attendance').filter((o) => o.value !== 'PRESENT'),
                    },
                ]}
                onFilterChange={(_, v) => setStatus(v)}
                emptyTitle={status ? 'None match' : 'No absences or lates'}
                emptyDescription={status ? 'Try another mark.' : 'Every marked day this term, in school on time.'}
            />
        </div>
    );
}

function Figure({
    label,
    value,
    hint,
    strong,
}: {
    label: string;
    value: string | number;
    hint?: string;
    strong?: boolean;
}) {
    return (
        <div className="rounded-lg border p-3">
            <p className="text-xs text-muted-foreground">{label}</p>
            <p className={cn('text-2xl tabular-nums', strong ? 'font-bold' : 'font-semibold')}>{value}</p>
            {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
        </div>
    );
}
