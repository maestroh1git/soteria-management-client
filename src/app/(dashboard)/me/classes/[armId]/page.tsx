'use client';

import { use, useState } from 'react';
import Link from 'next/link';
import {
    AlertTriangle,
    ArrowLeft,
    ArrowRight,
    Award as AwardIcon,
    CheckCircle2,
    DoorOpen,
    Loader2,
    Users,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { EmptyState } from '@/components/common/empty-state';
import { AwardDialog } from '@/components/attendance/award-dialog';
import { MedicalAlertsCard } from '@/components/attendance/medical-alerts-card';
import { useMyClass, useMyClasses } from '@/lib/hooks/use-attendance';
import { useCan } from '@/lib/hooks/use-can';
import { formatTime } from '@/lib/utils/dates';

/**
 * One class, from the form teacher's side: today's register, who needs a word,
 * who has gone home early, the medical facts that matter, and the roster with a
 * way to recognise a child.
 *
 * Under /me because it answers "your own things": the API lets the class's
 * form teacher in whatever their system roles (ROADMAP-EXECUTION.md, A9). Before
 * this, a teacher who held only the Employee role saw their class on My Classes
 * and every link from there refused them.
 */
export default function MyClassPage({
    params,
}: {
    params: Promise<{ armId: string }>;
}) {
    const { armId } = use(params);
    const { data, isLoading, isError } = useMyClass(armId);
    const { data: mine } = useMyClasses();
    const summary = mine?.classes.find((c) => c.classArmId === armId);
    // Their own pupils, or anyone the role allows (the office, Educators).
    const canRecognise = useCan()('awards.grant') || !!summary;
    const [recognising, setRecognising] = useState<{ id: string; name: string } | null>(
        null,
    );

    if (isLoading) {
        return (
            <div className="flex justify-center py-16">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
        );
    }
    if (!data) {
        return (
            <EmptyState
                isError={isError}
                subject="this class"
                title="This class isn’t yours to open"
                description="If you teach it, ask the school office to set you as its educator."
            />
        );
    }

    const registerHref = `/me/classes/${armId}/register`;

    return (
        <div className="space-y-6">
            <div className="flex items-start gap-3">
                <Button variant="ghost" size="icon" asChild aria-label="Back to my classes">
                    <Link href="/me/classes">
                        <ArrowLeft className="h-4 w-4" />
                    </Link>
                </Button>
                <div>
                    <h1 className="text-2xl font-semibold">{data.className}</h1>
                    <p className="mt-0.5 flex items-center gap-1.5 text-sm text-muted-foreground">
                        <Users className="h-3.5 w-3.5" />
                        <span className="tabular-nums">{data.pupils.length}</span> pupils
                        {summary?.termRate != null && (
                            <span className="tabular-nums">
                                {' '}
                                · {summary.termRate}% this term
                            </span>
                        )}
                    </p>
                </div>
            </div>

            {/* The register first: it is what the page is for. */}
            {summary && !summary.markable ? (
                <p className="rounded-lg bg-muted px-4 py-3 text-sm text-muted-foreground">
                    {summary.blockedReason}
                </p>
            ) : summary?.registerTaken ? (
                <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 dark:border-emerald-900/50 dark:bg-emerald-950/30">
                    <p className="flex items-center gap-2 text-sm font-medium text-emerald-900 dark:text-emerald-200">
                        <CheckCircle2 className="h-4 w-4 flex-none" />
                        <span className="tabular-nums">
                            Register taken — {summary.present} present, {summary.late} late,{' '}
                            {summary.absent} away
                        </span>
                    </p>
                    <Button asChild variant="outline" size="sm">
                        <Link href={registerHref}>Amend</Link>
                    </Button>
                </div>
            ) : (
                <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 dark:border-amber-900/50 dark:bg-amber-950/30">
                    <p className="text-sm font-semibold text-amber-900 dark:text-amber-200">
                        Register not taken yet
                    </p>
                    <Button asChild className="mt-3 h-11 w-full sm:w-auto">
                        <Link href={registerHref}>
                            Take the register
                            <ArrowRight className="ml-2 h-4 w-4" />
                        </Link>
                    </Button>
                </div>
            )}

            {summary && summary.needsAWord.length > 0 && (
                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="flex items-center gap-2 text-base">
                            <AlertTriangle className="h-4 w-4 text-red-600" />
                            Needs a word
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ul className="list-none divide-y rounded-lg border p-0">
                            {summary.needsAWord.map((p) => (
                                <li
                                    key={p.studentId}
                                    className="flex items-center justify-between gap-3 px-3 py-2.5"
                                >
                                    <div className="min-w-0">
                                        <p className="truncate text-sm font-medium">
                                            {p.lastName}, {p.firstName}
                                        </p>
                                        <p className="truncate text-xs text-muted-foreground tabular-nums">
                                            In school {p.inSchool} of {p.teachingDays} days
                                            {p.guardianPhone
                                                ? ` · ${p.guardianName} ${p.guardianPhone}`
                                                : ''}
                                        </p>
                                    </div>
                                    <span className="flex-none rounded-md bg-red-50 px-2 py-1 text-xs font-semibold tabular-nums text-red-700 dark:bg-red-950/50 dark:text-red-300">
                                        {p.attendanceRate}%
                                    </span>
                                </li>
                            ))}
                        </ul>
                    </CardContent>
                </Card>
            )}

            {data.signedOutToday.length > 0 && (
                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="flex items-center gap-2 text-base">
                            <DoorOpen className="h-4 w-4" />
                            Signed out today
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ul className="list-none divide-y rounded-lg border p-0">
                            {data.signedOutToday.map((d) => (
                                <li
                                    key={d.id}
                                    className="flex flex-wrap items-center justify-between gap-2 px-3 py-2.5 text-sm"
                                >
                                    <span className="font-medium">{d.pupilName}</span>
                                    <span className="text-muted-foreground tabular-nums">
                                        {formatTime(d.departedAt)}
                                        {d.collectedBy ? ` · ${d.collectedBy}` : ''}
                                        {d.returnedAt ? ` · back ${formatTime(d.returnedAt)}` : ''}
                                    </span>
                                </li>
                            ))}
                        </ul>
                    </CardContent>
                </Card>
            )}

            <MedicalAlertsCard alerts={data.medicalAlerts} />

            <Card>
                <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-base">
                        <Users className="h-4 w-4" />
                        The class
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    <ul className="list-none divide-y p-0">
                        {data.pupils.map((s) => (
                            <li
                                key={s.id}
                                className="flex items-center justify-between gap-3 px-6 py-2.5"
                            >
                                <div className="min-w-0">
                                    <p className="truncate text-sm font-medium">
                                        {s.lastName}, {s.firstName}
                                    </p>
                                    <p className="text-xs text-muted-foreground tabular-nums">
                                        {s.admissionNumber}
                                    </p>
                                </div>
                                {canRecognise && (
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        aria-label={`Recognise ${s.firstName} ${s.lastName}`}
                                        onClick={() =>
                                            setRecognising({
                                                id: s.id,
                                                name: `${s.lastName}, ${s.firstName}`,
                                            })
                                        }
                                    >
                                        <AwardIcon className="h-4 w-4" />
                                    </Button>
                                )}
                            </li>
                        ))}
                    </ul>
                </CardContent>
            </Card>

            <AwardDialog
                open={!!recognising}
                onOpenChange={(o) => !o && setRecognising(null)}
                studentId={recognising?.id ?? ''}
                pupilName={recognising?.name ?? ''}
                termId={mine?.termId}
            />
        </div>
    );
}
