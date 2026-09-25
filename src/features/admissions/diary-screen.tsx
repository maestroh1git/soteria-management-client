'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ChevronLeft, ChevronRight, Clock, MapPin, UserRound } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { PageHeader } from '@/components/layout/page-header';
import { EmptyState } from '@/components/common/empty-state';
import { LoadingSkeleton } from '@/components/common/loading-skeleton';
import { StatusBadge } from '@/components/common/status-badge';
import { useAssessors, useDiary } from '@/lib/hooks/use-admissions';
import { useMyEmployeeId } from '@/lib/hooks/use-session';
import { SUPPORT_NEED_LABELS } from '@/lib/support-needs';
import { formatDayOfWeek, formatTime, shiftDate, todayIso } from '@/lib/utils/dates';
import type { DiaryEntry } from '@/lib/api/admissions';

const EVERYONE = '__everyone__';
const KIND_LABELS: Record<string, string> = {
    ENTRANCE_EXAM: 'Entrance exam',
    INTERVIEW: 'Interview',
    OBSERVATION: 'Observation',
};

/** Monday of the week holding `day`. */
function mondayOf(day: string): string {
    const d = new Date(`${day}T00:00:00Z`);
    return shiftDate(day, -((d.getUTCDay() + 6) % 7));
}

function ageOn(dateOfBirth: string, on: string): number {
    const b = new Date(dateOfBirth);
    const d = new Date(on);
    let age = d.getFullYear() - b.getFullYear();
    if (d.getMonth() < b.getMonth() || (d.getMonth() === b.getMonth() && d.getDate() < b.getDate())) age -= 1;
    return age;
}

/**
 * The admissions diary (ROADMAP-EXECUTION.md, 5.16): every sitting in a week,
 * day by day and slot by slot, with what the assessor needs before they walk
 * in: the child's age, the class applied for, their previous school and any
 * support needs, and the question set they will be asked. Results are
 * recorded on the application, one click away. Booking refuses a clash, so
 * nobody is in two rooms at once.
 */
export function DiaryScreen() {
    const myEmployeeId = useMyEmployeeId();
    const [monday, setMonday] = useState(mondayOf(todayIso()));
    const [who, setWho] = useState<string>(EVERYONE);
    const sunday = shiftDate(monday, 6);
    const { data: assessors = [] } = useAssessors();
    const { data: entries = [], isLoading, isError } = useDiary({
        from: monday,
        to: sunday,
        assessorId: who === EVERYONE ? undefined : who,
    });

    const days = Array.from({ length: 7 }, (_, i) => shiftDate(monday, i));
    const byDay = new Map<string, DiaryEntry[]>();
    for (const e of entries) {
        const day = e.scheduledFor.slice(0, 10);
        byDay.set(day, [...(byDay.get(day) ?? []), e]);
    }
    const shown = days.filter((d) => byDay.has(d) || (d >= monday && d <= shiftDate(monday, 4)));

    return (
        <div className="space-y-6">
            <PageHeader
                title="Assessment diary"
                description="Every exam and interview booked, slot by slot, with what to know about each child."
            />

            <div className="flex flex-wrap items-center gap-2">
                <Button variant="outline" size="icon" className="h-9 w-9" aria-label="Previous week" onClick={() => setMonday(shiftDate(monday, -7))}>
                    <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="sm" onClick={() => setMonday(mondayOf(todayIso()))}>
                    This week
                </Button>
                <Button variant="outline" size="icon" className="h-9 w-9" aria-label="Next week" onClick={() => setMonday(shiftDate(monday, 7))}>
                    <ChevronRight className="h-4 w-4" />
                </Button>
                <span className="text-sm text-muted-foreground">
                    {formatDayOfWeek(monday)} to {formatDayOfWeek(sunday)}
                </span>
                <div className="ml-auto flex items-center gap-2">
                    {myEmployeeId && (
                        <Button
                            size="sm"
                            variant={who === myEmployeeId ? 'default' : 'outline'}
                            onClick={() => setWho(who === myEmployeeId ? EVERYONE : myEmployeeId)}
                        >
                            Mine
                        </Button>
                    )}
                    <Select value={who} onValueChange={setWho}>
                        <SelectTrigger className="w-56" aria-label="Assessor">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value={EVERYONE}>Every assessor</SelectItem>
                            {assessors.map((a) => (
                                <SelectItem key={a.id} value={a.id}>
                                    {a.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {isLoading ? (
                <LoadingSkeleton rows={6} />
            ) : isError || entries.length === 0 ? (
                <EmptyState
                    isError={isError}
                    subject="the diary"
                    title="Nothing booked this week"
                    description="Book an exam or interview from an application; it appears here."
                />
            ) : (
                <div className="space-y-4">
                    {shown.map((day) => (
                        <Card key={day}>
                            <CardHeader className="pb-3">
                                <CardTitle className="text-base">
                                    {formatDayOfWeek(day)}
                                    {day === todayIso() && (
                                        <span className="ml-2 text-sm font-normal text-muted-foreground">today</span>
                                    )}
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                {(byDay.get(day) ?? []).length === 0 ? (
                                    <p className="text-sm text-muted-foreground">Nothing booked.</p>
                                ) : (
                                    <ol className="space-y-3">
                                        {(byDay.get(day) ?? []).map((e) => (
                                            <Sitting key={e.id} entry={e} />
                                        ))}
                                    </ol>
                                )}
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}

function Sitting({ entry: e }: { entry: DiaryEntry }) {
    const end = new Date(new Date(e.scheduledFor).getTime() + e.durationMinutes * 60_000);
    return (
        <li className="grid gap-3 rounded-lg border p-3 sm:grid-cols-[8rem_1fr_auto]">
            <div className="text-sm">
                <p className="flex items-center gap-1.5 font-semibold tabular-nums">
                    <Clock className="h-3.5 w-3.5" aria-hidden="true" />
                    {formatTime(e.scheduledFor)}–{formatTime(end)}
                </p>
                <p className="text-muted-foreground">{KIND_LABELS[e.kind] ?? e.kind}</p>
            </div>
            <div className="min-w-0 space-y-1 text-sm">
                <p>
                    <Link href={`/admissions/${e.applicationId}`} className="font-medium hover:underline">
                        {e.lastName}, {e.firstName}
                    </Link>{' '}
                    <span className="text-muted-foreground">
                        · {e.applicationNumber} · age {ageOn(e.dateOfBirth, e.scheduledFor)} ·{' '}
                        {e.gender === 'FEMALE' ? 'girl' : 'boy'}
                        {e.classLevel ? ` · for ${e.classLevel}` : ''}
                        {e.previousSchool ? ` · from ${e.previousSchool}` : ''}
                    </span>
                </p>
                {e.supportNeeds.length > 0 && (
                    <p className="text-amber-800 dark:text-amber-300">
                        Support: {e.supportNeeds.map((n) => SUPPORT_NEED_LABELS[n] ?? n).join(', ')}
                        {e.supportNotes ? `: ${e.supportNotes}` : ''}
                    </p>
                )}
                <p className="flex flex-wrap gap-x-4 gap-y-1 text-muted-foreground">
                    <span className="flex items-center gap-1">
                        <UserRound className="h-3.5 w-3.5" aria-hidden="true" />
                        {e.assessor ?? 'No assessor yet'}
                    </span>
                    {e.location && (
                        <span className="flex items-center gap-1">
                            <MapPin className="h-3.5 w-3.5" aria-hidden="true" />
                            {e.location}
                        </span>
                    )}
                    {e.kind === 'INTERVIEW' && <span>Questions: {e.questionSet ?? 'notes only, no set'}</span>}
                </p>
            </div>
            <div className="flex items-start gap-2 sm:flex-col sm:items-end">
                <StatusBadge kind="assessment" status={e.status} />
                {e.status === 'SCHEDULED' && (
                    <Button asChild size="sm" variant="outline">
                        <Link href={`/admissions/${e.applicationId}#assessments`}>Record the result</Link>
                    </Button>
                )}
            </div>
        </li>
    );
}
