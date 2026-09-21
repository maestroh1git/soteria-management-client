'use client';

import { useState } from 'react';
import { CalendarClock, Loader2, MapPin, Video } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    useAssessments,
    useCompleteAssessment,
    useRescheduleAssessment,
    useScheduleAssessment,
    useSettleAssessment,
} from '@/lib/hooks/use-admissions';
import type {
    AdmissionAssessment,
    AssessmentKind,
    AssessmentOutcome,
} from '@/lib/api/admissions';

const KIND_LABEL: Record<AssessmentKind, string> = {
    ENTRANCE_EXAM: 'Entrance exam',
    INTERVIEW: 'Interview',
};

const STATUS_STYLE: Record<string, string> = {
    SCHEDULED: 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300',
    COMPLETED:
        'bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300',
    NO_SHOW: 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300',
    CANCELLED: 'bg-muted text-muted-foreground',
};

const OUTCOME_LABEL: Record<AssessmentOutcome, string> = {
    RECOMMEND: 'Recommended',
    BORDERLINE: 'Borderline',
    DECLINE: 'Not recommended',
};

function when(value: string): string {
    return new Date(value).toLocaleString(undefined, {
        dateStyle: 'medium',
        timeStyle: 'short',
    });
}

/**
 * Every sitting this candidate has had, and what happened at it.
 *
 * Actions are rendered from `allowedTransitions`, which the server computes
 * from the rulebook it refuses with. This component knows no admissions rules
 * of its own — the pipeline's own controls already work this way, and a button
 * that is present but silently does nothing is worse than one that is absent.
 */
export function AssessmentsPanel({
    applicationId,
    canEdit,
}: {
    applicationId: string;
    canEdit: boolean;
}) {
    const { data: assessments, isLoading } = useAssessments(applicationId);
    const schedule = useScheduleAssessment(applicationId);
    const reschedule = useRescheduleAssessment(applicationId);
    const complete = useCompleteAssessment(applicationId);
    const settle = useSettleAssessment(applicationId);

    const [booking, setBooking] = useState(false);
    const [kind, setKind] = useState<AssessmentKind>('ENTRANCE_EXAM');
    const [mode, setMode] = useState<'IN_PERSON' | 'ONLINE'>('IN_PERSON');
    const [scheduledFor, setScheduledFor] = useState('');
    const [location, setLocation] = useState('');

    const [recording, setRecording] = useState<AdmissionAssessment | null>(null);
    const [score, setScore] = useState('');
    const [outcome, setOutcome] = useState<AssessmentOutcome | ''>('');
    const [notes, setNotes] = useState('');

    const [moving, setMoving] = useState<AdmissionAssessment | null>(null);
    const [movedTo, setMovedTo] = useState('');

    // An exam already booked cannot be booked again, and the server says so.
    // Saying it here as well means the registrar does not meet the refusal.
    const openKinds = new Set(
        (assessments ?? [])
            .filter((a) => a.status === 'SCHEDULED')
            .map((a) => a.kind),
    );

    const submitBooking = async () => {
        await schedule.mutateAsync({
            kind,
            mode,
            scheduledFor: new Date(scheduledFor).toISOString(),
            location: location || undefined,
        });
        setBooking(false);
        setScheduledFor('');
        setLocation('');
    };

    const submitResult = async () => {
        if (!recording) return;
        await complete.mutateAsync({
            id: recording.id,
            score: score === '' ? undefined : Number(score),
            outcome: outcome === '' ? undefined : outcome,
            notes: notes || undefined,
        });
        setRecording(null);
        setScore('');
        setOutcome('');
        setNotes('');
    };

    return (
        <Card>
            <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0">
                <div>
                    <CardTitle className="text-lg">Assessments</CardTitle>
                    <CardDescription>
                        Entrance exams and interviews, and how each one went
                    </CardDescription>
                </div>
                {canEdit && (
                    <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setBooking(true)}
                        disabled={openKinds.size >= 2}
                        title={
                            openKinds.size >= 2
                                ? 'Both an exam and an interview are already booked'
                                : undefined
                        }
                    >
                        <CalendarClock className="mr-2 h-4 w-4" />
                        Book
                    </Button>
                )}
            </CardHeader>
            <CardContent className="space-y-3">
                {isLoading && (
                    <p className="text-sm text-muted-foreground">Loading…</p>
                )}

                {!isLoading && (assessments ?? []).length === 0 && (
                    <p className="text-sm text-muted-foreground">
                        Nothing booked yet. A candidate cannot be marked assessed
                        until an exam or an interview has been recorded.
                    </p>
                )}

                {(assessments ?? []).map((a) => (
                    <div
                        key={a.id}
                        className="rounded-lg border p-3 text-sm"
                    >
                        <div className="flex flex-wrap items-center gap-2">
                            <span className="font-medium">
                                {KIND_LABEL[a.kind]}
                            </span>
                            <Badge
                                variant="secondary"
                                className={STATUS_STYLE[a.status] ?? ''}
                            >
                                {a.status.replace(/_/g, ' ').toLowerCase()}
                            </Badge>
                            {a.mode === 'ONLINE' && (
                                <Badge variant="outline" className="gap-1">
                                    <Video className="h-3 w-3" />
                                    online
                                </Badge>
                            )}
                            {a.score != null && (
                                <span className="ml-auto tabular-nums font-semibold">
                                    {a.score}
                                    <span className="text-muted-foreground">
                                        {' '}
                                        / 100
                                    </span>
                                </span>
                            )}
                        </div>

                        <p className="mt-1 text-muted-foreground">
                            {when(a.scheduledFor)}
                            {a.location && (
                                <span className="ml-2 inline-flex items-center gap-1">
                                    <MapPin className="h-3 w-3" />
                                    {a.location}
                                </span>
                            )}
                        </p>

                        {a.outcome && (
                            <p className="mt-1">{OUTCOME_LABEL[a.outcome]}</p>
                        )}
                        {a.notes && (
                            <p className="mt-1 text-muted-foreground">
                                {a.notes}
                            </p>
                        )}

                        {canEdit && a.allowedTransitions.length > 0 && (
                            <div className="mt-3 flex flex-wrap gap-2">
                                {a.allowedTransitions.includes('COMPLETED') && (
                                    <Button
                                        size="sm"
                                        onClick={() => setRecording(a)}
                                    >
                                        Record result
                                    </Button>
                                )}
                                {a.allowedTransitions.includes('SCHEDULED') && (
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => {
                                            setMoving(a);
                                            setMovedTo('');
                                        }}
                                    >
                                        {a.status === 'NO_SHOW'
                                            ? 'Rebook'
                                            : 'Move'}
                                    </Button>
                                )}
                                {a.allowedTransitions.includes('NO_SHOW') && (
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() =>
                                            settle.mutate({
                                                id: a.id,
                                                what: 'no-show',
                                            })
                                        }
                                    >
                                        No-show
                                    </Button>
                                )}
                                {a.allowedTransitions.includes('CANCELLED') && (
                                    <Button
                                        size="sm"
                                        variant="ghost"
                                        onClick={() =>
                                            settle.mutate({
                                                id: a.id,
                                                what: 'cancel',
                                            })
                                        }
                                    >
                                        Cancel
                                    </Button>
                                )}
                            </div>
                        )}
                    </div>
                ))}
            </CardContent>

            <Dialog open={booking} onOpenChange={setBooking}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Book an assessment</DialogTitle>
                        <DialogDescription>
                            One of each kind may be open at a time.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label>Kind</Label>
                            <Select
                                value={kind}
                                onValueChange={(v) =>
                                    setKind(v as AssessmentKind)
                                }
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem
                                        value="ENTRANCE_EXAM"
                                        disabled={openKinds.has(
                                            'ENTRANCE_EXAM',
                                        )}
                                    >
                                        Entrance exam
                                        {openKinds.has('ENTRANCE_EXAM') &&
                                            ' — already booked'}
                                    </SelectItem>
                                    <SelectItem
                                        value="INTERVIEW"
                                        disabled={openKinds.has('INTERVIEW')}
                                    >
                                        Interview
                                        {openKinds.has('INTERVIEW') &&
                                            ' — already booked'}
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>Held</Label>
                            <Select
                                value={mode}
                                onValueChange={(v) =>
                                    setMode(v as 'IN_PERSON' | 'ONLINE')
                                }
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="IN_PERSON">
                                        In person
                                    </SelectItem>
                                    <SelectItem value="ONLINE">
                                        Online
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="scheduledFor">When</Label>
                            <Input
                                id="scheduledFor"
                                type="datetime-local"
                                value={scheduledFor}
                                onChange={(e) =>
                                    setScheduledFor(e.target.value)
                                }
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="location">
                                {mode === 'ONLINE' ? 'Joining link' : 'Where'}
                            </Label>
                            <Input
                                id="location"
                                value={location}
                                onChange={(e) => setLocation(e.target.value)}
                                placeholder={
                                    mode === 'ONLINE'
                                        ? 'https://…'
                                        : 'Hall B'
                                }
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setBooking(false)}
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={submitBooking}
                            disabled={!scheduledFor || schedule.isPending}
                        >
                            {schedule.isPending && (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            )}
                            Book
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog
                open={!!recording}
                onOpenChange={(open) => !open && setRecording(null)}
            >
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>
                            Record {recording && KIND_LABEL[recording.kind]}
                        </DialogTitle>
                        <DialogDescription>
                            This cannot be edited afterwards. A correction means
                            booking another sitting.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                        {recording?.kind === 'ENTRANCE_EXAM' && (
                            <div className="space-y-2">
                                <Label htmlFor="score">Score out of 100</Label>
                                <Input
                                    id="score"
                                    type="number"
                                    min={0}
                                    max={100}
                                    value={score}
                                    onChange={(e) => setScore(e.target.value)}
                                />
                            </div>
                        )}
                        <div className="space-y-2">
                            <Label>Recommendation</Label>
                            <Select
                                value={outcome}
                                onValueChange={(v) =>
                                    setOutcome(v as AssessmentOutcome)
                                }
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Optional" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="RECOMMEND">
                                        Recommended
                                    </SelectItem>
                                    <SelectItem value="BORDERLINE">
                                        Borderline
                                    </SelectItem>
                                    <SelectItem value="DECLINE">
                                        Not recommended
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="notes">Notes</Label>
                            <Textarea
                                id="notes"
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                placeholder="What the assessor saw"
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setRecording(null)}
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={submitResult}
                            disabled={
                                complete.isPending ||
                                (recording?.kind === 'ENTRANCE_EXAM' &&
                                    score === '')
                            }
                            title={
                                recording?.kind === 'ENTRANCE_EXAM' &&
                                score === ''
                                    ? 'An exam that has been sat has a mark'
                                    : undefined
                            }
                        >
                            {complete.isPending && (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            )}
                            Record
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog
                open={!!moving}
                onOpenChange={(open) => !open && setMoving(null)}
            >
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Move this sitting</DialogTitle>
                        <DialogDescription>
                            The same sitting on a different date, not a new one.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-2">
                        <Label htmlFor="movedTo">When</Label>
                        <Input
                            id="movedTo"
                            type="datetime-local"
                            value={movedTo}
                            onChange={(e) => setMovedTo(e.target.value)}
                        />
                    </div>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setMoving(null)}
                        >
                            Cancel
                        </Button>
                        <Button
                            disabled={!movedTo || reschedule.isPending}
                            onClick={async () => {
                                if (!moving) return;
                                await reschedule.mutateAsync({
                                    id: moving.id,
                                    scheduledFor: new Date(
                                        movedTo,
                                    ).toISOString(),
                                });
                                setMoving(null);
                            }}
                        >
                            {reschedule.isPending && (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            )}
                            Move
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </Card>
    );
}
