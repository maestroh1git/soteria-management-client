'use client';

import { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, CalendarOff, Check, Loader2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { EmptyState } from '@/components/common/empty-state';
import { AttendanceStatusControl } from '@/components/attendance/status-control';
import { useRegister, useSubmitRegister } from '@/lib/hooks/use-attendance';
import {
    ABSENCE_REASON_LABELS,
    type AbsenceReason,
    type AttendanceStatus,
    type SubmitMark,
} from '@/lib/api/attendance';
import { cn } from '@/lib/utils';

interface Draft {
    status: AttendanceStatus;
    reasonCode?: AbsenceReason;
    minutesLate?: number;
}

const REASONS = Object.keys(ABSENCE_REASON_LABELS) as AbsenceReason[];

/** A crash or a back-swipe must not cost a marked register. */
const draftKey = (armId: string, date: string) => `attendance-draft:${armId}:${date}`;

export function RegisterScreen({
    classArmId,
    date,
    onDateChange,
}: {
    classArmId: string;
    date: string;
    onDateChange?: (date: string) => void;
}) {
    const { data, isLoading, isError } = useRegister(classArmId, date);
    const submit = useSubmitRegister();
    const [drafts, setDrafts] = useState<Record<string, Draft>>({});
    const [correctionNote, setCorrectionNote] = useState('');
    const [submitted, setSubmitted] = useState(false);
    const [seededFor, setSeededFor] = useState<string | null>(null);

    /**
     * Everyone starts present; the teacher marks the exceptions.
     *
     * A screen that asks a teacher to affirm forty children is one that gets
     * filled in at 2pm from memory. On a normal day this makes the whole
     * interaction a single tap.
     *
     * Seeded during render rather than in an effect — it is state derived from
     * what the server returned, and doing it in an effect renders the register
     * empty for a frame and then again with the pupils in it.
     *
     * Both the read below and the write further down key on what the payload
     * DESCRIBES (`data.classArmId`, `data.date`) rather than on what was asked
     * for. Keyed on the `date` prop, the write fired the instant the picker
     * moved — while `drafts` still held the previous day's marks — and stamped
     * them under the new day's key, which the read then restored onto a register
     * that had never been taken.
     */
    const seedKey = data
        ? `${data.classArmId}:${data.date}:${data.pupils.length}`
        : null;
    if (data && seedKey && seedKey !== seededFor) {
        let restored: Record<string, Draft> | null = null;
        try {
            const raw = window.localStorage.getItem(
                draftKey(data.classArmId, data.date),
            );
            if (raw) restored = JSON.parse(raw);
        } catch {
            // A private window, or blocked site data. The register still works.
        }
        const seeded: Record<string, Draft> = {};
        for (const p of data.pupils) {
            seeded[p.studentId] = p.status
                ? {
                      status: p.status,
                      reasonCode: p.reasonCode ?? undefined,
                      minutesLate: p.minutesLate ?? undefined,
                  }
                : { status: 'PRESENT' };
        }
        // A draft only helps a register that never reached the server. Once the
        // school has marks for that day the server is the record, and restoring
        // a leftover draft over it silently reverts whatever someone else saved.
        const usable = data.alreadyMarked ? null : restored;

        // Drafts for other days can only be stale, and a stale draft that
        // outlives its register is exactly how the wrong marks come back.
        try {
            const keep = draftKey(data.classArmId, data.date);
            for (const k of Object.keys(window.localStorage)) {
                if (k.startsWith('attendance-draft:') && k !== keep) {
                    window.localStorage.removeItem(k);
                }
            }
        } catch {
            // Storage unavailable; nothing to prune.
        }

        setSeededFor(seedKey);
        setDrafts({ ...seeded, ...(usable ?? {}) });
        setSubmitted(false);
    }

    useEffect(() => {
        if (!data || submitted) return;
        if (!Object.keys(drafts).length) return;
        try {
            window.localStorage.setItem(
                draftKey(data.classArmId, data.date),
                JSON.stringify(drafts),
            );
        } catch {
            // Nothing to do; the in-memory state is still authoritative.
        }
    }, [drafts, data, submitted]);

    const tally = useMemo(() => {
        const t = { PRESENT: 0, LATE: 0, ABSENT: 0, EXCUSED: 0 };
        for (const d of Object.values(drafts)) t[d.status] += 1;
        return t;
    }, [drafts]);

    const incomplete = useMemo(
        () =>
            Object.entries(drafts).filter(
                ([, d]) =>
                    (d.status === 'ABSENT' || d.status === 'EXCUSED') && !d.reasonCode,
            ).length,
        [drafts],
    );

    // `data.date !== date` means the picker has moved and this payload is the
    // previous day's. Showing it under the new date's heading is how a teacher
    // ends up marking the wrong register.
    if (isLoading || (data && data.date !== date)) {
        return (
            <div className="flex justify-center py-16">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
        );
    }

    if (isError || !data) {
        return (
            <EmptyState
                title="We couldn't load this register"
                description="Please try again in a moment."
            />
        );
    }

    if (!data.markable) {
        return (
            <Card>
                <CardContent className="flex flex-col items-center gap-4 py-10 text-center">
                    <CalendarOff className="h-8 w-8 text-muted-foreground" />
                    <div>
                        <h2 className="text-base font-semibold">
                            No register for {data.className} today
                        </h2>
                        <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
                            {data.blockedReason}
                        </p>
                    </div>
                    {onDateChange && (
                        <div className="flex flex-col items-center gap-2">
                            <Label htmlFor="register-date">Choose another date</Label>
                            <Input
                                id="register-date"
                                type="date"
                                value={date}
                                max={new Date().toISOString().slice(0, 10)}
                                onChange={(e) => onDateChange(e.target.value)}
                                className="w-48"
                            />
                        </div>
                    )}
                </CardContent>
            </Card>
        );
    }

    if (data.pupils.length === 0) {
        return (
            <EmptyState
                title={`No pupils in ${data.className}`}
                description="Add pupils to this class before taking a register."
            />
        );
    }

    const setDraft = (studentId: string, patch: Partial<Draft>) =>
        setDrafts((prev) => ({
            ...prev,
            [studentId]: { ...prev[studentId], ...patch },
        }));

    const onSubmit = () => {
        const marks: SubmitMark[] = Object.entries(drafts).map(([studentId, d]) => ({
            studentId,
            status: d.status,
            reasonCode: d.reasonCode,
            minutesLate: d.status === 'LATE' ? d.minutesLate : undefined,
        }));
        submit.mutate(
            {
                classArmId,
                date,
                marks,
                correctionNote: correctionNote.trim() || undefined,
            },
            {
                onSuccess: () => {
                    setSubmitted(true);
                    try {
                        window.localStorage.removeItem(
                            draftKey(data.classArmId, data.date),
                        );
                    } catch {
                        // Nothing to clean up if storage is unavailable.
                    }
                },
            },
        );
    };

    const isToday = date === new Date().toISOString().slice(0, 10);

    /*
     * Changing a register after its own day needs a written reason, and the
     * server enforces it. Say so here rather than letting a 400 be the first the
     * user hears of the rule — the standing agreement in this repo, and the
     * whole reason the note field is on screen at all.
     *
     * Only for a register that already exists: taking one that was never taken
     * is a backfill, not a correction, and needs no explanation.
     */
    const needsCorrectionNote =
        !isToday && data.alreadyMarked && !correctionNote.trim();

    return (
        <div className="space-y-4 pb-28">
            <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                    <h1 className="text-xl font-semibold">{data.className}</h1>
                    <p className="mt-1 text-sm text-muted-foreground">
                        {new Date(`${date}T00:00:00`).toLocaleDateString('en-NG', {
                            weekday: 'long',
                            day: 'numeric',
                            month: 'long',
                        })}
                        {' · '}
                        {data.termName}
                    </p>
                </div>
                <span className="rounded-full bg-accent px-3 py-1 text-xs font-semibold tabular-nums">
                    {data.pupils.length} pupils
                </span>
            </div>

            <div
                aria-live="polite"
                className="flex flex-wrap gap-x-5 gap-y-1 rounded-lg bg-muted px-4 py-2.5 text-sm tabular-nums"
            >
                <span>{tally.PRESENT} present</span>
                <span>{tally.LATE} late</span>
                <span>{tally.ABSENT} away</span>
                <span>{tally.EXCUSED} excused</span>
            </div>

            {data.alreadyMarked && !submitted && (
                <p className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-200">
                    This register has already been taken. Changes you make will be
                    saved as corrections, and the original marks are kept.
                </p>
            )}

            {!isToday && (
                <div className="space-y-2">
                    <Label htmlFor="correction-note">
                        Why is this register being changed after its own day?
                        {data.alreadyMarked ? (
                            <span className="ml-1 text-muted-foreground">
                                (required)
                            </span>
                        ) : null}
                    </Label>
                    <Input
                        id="correction-note"
                        value={correctionNote}
                        onChange={(e) => setCorrectionNote(e.target.value)}
                        placeholder="The school office will be asked about this"
                        aria-required={data.alreadyMarked}
                    />
                </div>
            )}

            <ul className="list-none divide-y rounded-lg border p-0">
                {data.pupils.map((p) => {
                    const draft = drafts[p.studentId] ?? { status: 'PRESENT' as const };
                    const needsReason =
                        draft.status === 'ABSENT' || draft.status === 'EXCUSED';
                    return (
                        <li key={p.studentId} className="px-3 py-2.5">
                            {/* Stacked on a phone. Side by side, a four-way
                                control leaves the name about 90px, and
                                "Nwachuk…" is not a pupil a teacher can tell
                                apart from another Nwachukwu. */}
                            <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:gap-3">
                                <div className="flex min-w-0 flex-1 items-center gap-3">
                                    <span
                                        aria-hidden="true"
                                        className="grid h-9 w-9 flex-none place-items-center rounded-lg border bg-muted text-xs font-semibold text-muted-foreground"
                                    >
                                        {p.lastName.slice(0, 2).toUpperCase()}
                                    </span>
                                    <div className="min-w-0 flex-1">
                                        <p className="truncate text-sm font-medium">
                                            {p.lastName}, {p.firstName}
                                        </p>
                                        <p className="truncate text-xs tabular-nums text-muted-foreground">
                                            {p.admissionNumber}
                                        </p>
                                    </div>
                                </div>
                                <AttendanceStatusControl
                                    pupilName={`${p.lastName}, ${p.firstName}`}
                                    name={`status-${p.studentId}`}
                                    value={draft.status}
                                    onChange={(status) =>
                                        setDraft(p.studentId, {
                                            status,
                                            reasonCode:
                                                status === 'ABSENT' || status === 'EXCUSED'
                                                    ? draft.reasonCode
                                                    : undefined,
                                            minutesLate:
                                                status === 'LATE' ? draft.minutesLate : undefined,
                                        })
                                    }
                                />
                            </div>

                            {needsReason && (
                                <fieldset className="mt-3 pl-12">
                                    <legend className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                                        Why is {p.firstName} away?
                                    </legend>
                                    <div className="flex flex-wrap gap-1.5">
                                        {REASONS.map((r) => {
                                            const id = `reason-${p.studentId}-${r}`;
                                            const on = draft.reasonCode === r;
                                            return (
                                                <span key={r}>
                                                    <input
                                                        type="radio"
                                                        id={id}
                                                        name={`reason-${p.studentId}`}
                                                        className="peer sr-only"
                                                        checked={on}
                                                        onChange={() =>
                                                            setDraft(p.studentId, { reasonCode: r })
                                                        }
                                                    />
                                                    <label
                                                        htmlFor={id}
                                                        className={cn(
                                                            'inline-block cursor-pointer rounded-md border px-2.5 py-1.5 text-xs',
                                                            'peer-focus-visible:ring-2 peer-focus-visible:ring-ring',
                                                            on
                                                                ? 'border-red-500 bg-red-50 font-semibold text-red-700 dark:bg-red-950/50 dark:text-red-300'
                                                                : 'text-muted-foreground hover:bg-accent',
                                                        )}
                                                    >
                                                        {ABSENCE_REASON_LABELS[r]}
                                                    </label>
                                                </span>
                                            );
                                        })}
                                    </div>
                                </fieldset>
                            )}

                            {draft.status === 'LATE' && (
                                <div className="mt-3 flex items-center gap-2 pl-12">
                                    <Label
                                        htmlFor={`late-${p.studentId}`}
                                        className="text-xs text-muted-foreground"
                                    >
                                        Minutes late
                                    </Label>
                                    <Input
                                        id={`late-${p.studentId}`}
                                        type="number"
                                        min={1}
                                        max={600}
                                        value={draft.minutesLate ?? ''}
                                        onChange={(e) =>
                                            setDraft(p.studentId, {
                                                minutesLate: e.target.value
                                                    ? Number(e.target.value)
                                                    : undefined,
                                            })
                                        }
                                        className="h-8 w-20"
                                    />
                                </div>
                            )}
                        </li>
                    );
                })}
            </ul>

            <div className="fixed inset-x-0 bottom-0 border-t bg-background/95 p-3 backdrop-blur md:left-64">
                <div className="mx-auto max-w-4xl">
                    {needsCorrectionNote && (
                        <p className="mb-2 flex items-center gap-2 text-xs text-amber-700 dark:text-amber-400">
                            <AlertTriangle className="h-3.5 w-3.5 flex-none" />
                            Changing a register after its own day needs a note
                            saying why.
                        </p>
                    )}
                    {incomplete > 0 && (
                        <p className="mb-2 flex items-center gap-2 text-xs text-amber-700 dark:text-amber-400">
                            <AlertTriangle className="h-3.5 w-3.5 flex-none" />
                            {incomplete} {incomplete === 1 ? 'pupil needs' : 'pupils need'} a
                            reason before this register can be saved.
                        </p>
                    )}
                    <Button
                        className="h-12 w-full text-base"
                        onClick={onSubmit}
                        disabled={
                            submit.isPending || incomplete > 0 || needsCorrectionNote
                        }
                    >
                        {submit.isPending ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                        ) : submitted ? (
                            <Check className="h-4 w-4" />
                        ) : null}
                        <span className="ml-2">
                            {submitted ? 'Register saved' : 'Submit register'}
                            <span className="ml-2 text-xs font-normal opacity-80 tabular-nums">
                                {tally.PRESENT} present · {tally.LATE} late ·{' '}
                                {tally.ABSENT} away
                            </span>
                        </span>
                    </Button>
                </div>
            </div>
        </div>
    );
}
