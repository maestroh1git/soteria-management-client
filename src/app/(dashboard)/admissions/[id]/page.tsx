'use client';

import { use, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Loader2, AlertCircle, UserCheck, GraduationCap } from 'lucide-react';

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
import { Checkbox } from '@/components/ui/checkbox';
import { LoadingSkeleton } from '@/components/common/loading-skeleton';
import { EmptyState } from '@/components/common/empty-state';
import {
    useApplication,
    useTransitionApplication,
    useEnrolmentPreview,
    useEnrol,
} from '@/lib/hooks/use-admissions';
import { useClassArms } from '@/lib/hooks/use-academics';
import { useAuth } from '@/lib/hooks/use-auth';
import { formatDate } from '@/lib/utils/dates';
import type { ApplicationStatus } from '@/lib/api/admissions';

const label = (s: string) => s.replace(/_/g, ' ').toLowerCase();

/** How each move is worded to a registrar, and whether it needs more than a click. */
const ACTION: Record<
    string,
    { label: string; tone?: 'default' | 'destructive' | 'outline'; needs?: 'score' | 'offer' | 'date' | 'reason' }
> = {
    ASSESSMENT_SCHEDULED: { label: 'Schedule assessment', tone: 'outline', needs: 'date' },
    ASSESSED: { label: 'Record score', tone: 'outline', needs: 'score' },
    OFFERED: { label: 'Make an offer', needs: 'offer' },
    ACCEPTED: { label: 'Parent accepted' },
    OFFER_DECLINED: { label: 'Parent declined', tone: 'outline' },
    WAITLISTED: { label: 'Waitlist', tone: 'outline' },
    REJECTED: { label: 'Reject', tone: 'destructive', needs: 'reason' },
    WITHDRAWN: { label: 'Withdraw', tone: 'outline', needs: 'reason' },
    OFFER_EXPIRED: { label: 'Mark expired', tone: 'outline' },
    ENROLLED: { label: 'Enrol', needs: undefined },
};

export default function ApplicationDetailPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id } = use(params);
    const router = useRouter();
    const { hasRole } = useAuth();
    const canDecide = hasRole(['tenant_owner', 'ADMIN', 'admissions.registrar']);

    const { data: application, isLoading } = useApplication(id);
    const transition = useTransitionApplication(id);
    const { data: arms = [] } = useClassArms();

    const [pending, setPending] = useState<ApplicationStatus | null>(null);
    const [notes, setNotes] = useState('');
    const [score, setScore] = useState('');
    const [when, setWhen] = useState('');
    const [enrolOpen, setEnrolOpen] = useState(false);

    if (isLoading) return <LoadingSkeleton variant="detail" />;
    if (!application) return <EmptyState title="Application not found" />;

    const needs = pending ? ACTION[pending]?.needs : undefined;

    const submit = async () => {
        if (!pending) return;
        await transition.mutateAsync({
            status: pending,
            notes: notes.trim() || undefined,
            assessmentScore: needs === 'score' ? Number(score) : undefined,
            assessmentDate:
                needs === 'date' && when ? new Date(when).toISOString() : undefined,
            offerExpiresAt:
                needs === 'offer' && when ? new Date(when).toISOString() : undefined,
        });
        setPending(null);
        setNotes('');
        setScore('');
        setWhen('');
    };

    const ready =
        needs === 'score'
            ? score !== '' && Number(score) >= 0 && Number(score) <= 100
            : needs === 'offer' || needs === 'date'
              ? !!when
              : true;

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-3">
                <Button variant="ghost" size="icon" asChild>
                    <Link href="/admissions" aria-label="Back to admissions">
                        <ArrowLeft className="h-4 w-4" />
                    </Link>
                </Button>
                <div className="flex-1">
                    <h1 className="text-2xl font-semibold">
                        {application.firstName} {application.lastName}
                    </h1>
                    <p className="text-sm text-muted-foreground">
                        {application.applicationNumber}
                        {application.classLevel && ` · ${application.classLevel.name}`}
                    </p>
                </div>
                <Badge variant="secondary" className="text-sm">
                    {label(application.status)}
                </Badge>
            </div>

            {/* Actions come from the SERVER's allowedTransitions. This component
                knows no admissions rules, so it cannot drift from them. */}
            {canDecide && (
                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-base">What happens next</CardTitle>
                        <CardDescription>
                            Only the moves that are legal from here.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="flex flex-wrap gap-2">
                        {application.allowedTransitions.length === 0 && (
                            <p className="text-sm text-muted-foreground">
                                Nothing further — this application is closed.
                            </p>
                        )}
                        {application.allowedTransitions.map((s) => {
                            const action = ACTION[s] ?? { label: label(s) };
                            if (s === 'ENROLLED') {
                                return (
                                    <Button key={s} onClick={() => setEnrolOpen(true)}>
                                        <GraduationCap className="mr-2 h-4 w-4" />
                                        Enrol
                                    </Button>
                                );
                            }
                            return (
                                <Button
                                    key={s}
                                    variant={action.tone ?? 'default'}
                                    onClick={() => {
                                        setPending(s);
                                        setWhen('');
                                        setScore('');
                                        setNotes('');
                                    }}
                                >
                                    {action.label}
                                </Button>
                            );
                        })}
                    </CardContent>
                </Card>
            )}

            <div className="grid gap-4 md:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg">The child</CardTitle>
                    </CardHeader>
                    <CardContent className="grid gap-3 sm:grid-cols-2">
                        <Field label="Date of birth" value={formatDate(application.dateOfBirth)} />
                        <Field label="Gender" value={application.gender === 'FEMALE' ? 'Female' : 'Male'} />
                        <Field label="Applying to" value={application.classLevel?.name ?? '—'} />
                        <Field label="Session" value={application.session?.name ?? '—'} />
                        <Field label="Previous school" value={application.previousSchool ?? '—'} />
                        <Field label="Applied" value={formatDate(application.createdAt)} />
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg">The guardian</CardTitle>
                        <CardDescription>
                            As typed on the form — promoted into the registry at enrolment.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="grid gap-3 sm:grid-cols-2">
                        <Field
                            label="Name"
                            value={`${application.guardianFirstName} ${application.guardianLastName}`}
                        />
                        <Field label="Relationship" value={label(application.guardianRelationship)} />
                        <Field label="Phone" value={application.guardianPhone} />
                        <Field label="Email" value={application.guardianEmail ?? '—'} />
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="text-lg">Progress</CardTitle>
                </CardHeader>
                <CardContent className="grid gap-3 sm:grid-cols-3">
                    <Field
                        label="Assessment"
                        value={
                            application.assessmentScore != null
                                ? `${application.assessmentScore}${application.assessmentDate ? ` · ${formatDate(application.assessmentDate)}` : ''}`
                                : application.assessmentDate
                                  ? `Scheduled ${formatDate(application.assessmentDate)}`
                                  : 'Not assessed'
                        }
                    />
                    <Field
                        label="Offer expires"
                        value={
                            application.offerExpiresAt
                                ? formatDate(application.offerExpiresAt)
                                : '—'
                        }
                    />
                    <Field
                        label="Data held until"
                        value={
                            application.retentionExpiresAt
                                ? formatDate(application.retentionExpiresAt)
                                : 'No deletion date'
                        }
                    />
                    {application.decisionNotes && (
                        <div className="sm:col-span-3">
                            <p className="text-xs uppercase tracking-wide text-muted-foreground">
                                Notes
                            </p>
                            <p className="text-sm">{application.decisionNotes}</p>
                        </div>
                    )}
                    {application.studentId && (
                        <div className="sm:col-span-3">
                            <Link href={`/students/${application.studentId}`}>
                                <Button variant="outline" size="sm">
                                    <GraduationCap className="mr-2 h-4 w-4" />
                                    View the student this produced
                                </Button>
                            </Link>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* ── Transition dialog ── */}
            <Dialog open={!!pending} onOpenChange={(o) => !o && setPending(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>
                            {pending ? (ACTION[pending]?.label ?? label(pending)) : ''}
                        </DialogTitle>
                        <DialogDescription>
                            {application.firstName} {application.lastName} ·{' '}
                            {application.applicationNumber}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4">
                        {needs === 'score' && (
                            <div className="space-y-2">
                                <Label>Score out of 100</Label>
                                <Input
                                    type="number"
                                    min={0}
                                    max={100}
                                    value={score}
                                    onChange={(e) => setScore(e.target.value)}
                                />
                            </div>
                        )}
                        {needs === 'date' && (
                            <div className="space-y-2">
                                <Label>Assessment date</Label>
                                <Input
                                    type="datetime-local"
                                    value={when}
                                    onChange={(e) => setWhen(e.target.value)}
                                />
                            </div>
                        )}
                        {needs === 'offer' && (
                            <div className="space-y-2">
                                <Label>Offer expires</Label>
                                <Input
                                    type="datetime-local"
                                    value={when}
                                    onChange={(e) => setWhen(e.target.value)}
                                />
                                <p className="text-xs text-muted-foreground">
                                    Required. An offer with no deadline holds a place for ever
                                    and the waitlist never moves.
                                </p>
                            </div>
                        )}
                        <div className="space-y-2">
                            <Label>
                                Notes{needs === 'reason' ? '' : ' (optional)'}
                            </Label>
                            <Textarea
                                rows={2}
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                placeholder={
                                    needs === 'reason'
                                        ? 'Why. This is the question asked six months later.'
                                        : ''
                                }
                            />
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setPending(null)}>
                            Cancel
                        </Button>
                        <Button onClick={submit} disabled={!ready || transition.isPending}>
                            {transition.isPending && (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            )}
                            Confirm
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <EnrolDialog
                open={enrolOpen}
                onOpenChange={setEnrolOpen}
                applicationId={id}
                arms={arms}
                onDone={(studentId) => router.push(`/students/${studentId}`)}
            />
        </div>
    );
}

function Field({ label, value }: { label: string; value: string }) {
    return (
        <div>
            <p className="text-xs uppercase tracking-wide text-muted-foreground">
                {label}
            </p>
            <p className="text-sm">{value}</p>
        </div>
    );
}

/**
 * Enrolment: preview, then confirm.
 *
 * The server refuses when guardians share the applicant's phone number and
 * none was chosen. Showing that 409 as a toast would be poor — the registrar
 * would have no way to answer it. So the candidates are fetched first and the
 * choice is made here, the same shape as the student import and the guardian
 * dialog.
 */
function EnrolDialog({
    open,
    onOpenChange,
    applicationId,
    arms,
    onDone,
}: {
    open: boolean;
    onOpenChange: (v: boolean) => void;
    applicationId: string;
    arms: Array<{ id: string; name: string; capacity: number | null; level?: { name: string } }>;
    onDone: (studentId: string) => void;
}) {
    const [armId, setArmId] = useState('');
    const [guardianId, setGuardianId] = useState<string | null>(null);
    const [over, setOver] = useState(false);
    const { data: preview } = useEnrolmentPreview(applicationId, armId || undefined);
    const enrol = useEnrol(applicationId);

    const full =
        preview?.capacity != null && preview.enrolled >= preview.capacity;
    const mustChoose =
        (preview?.possibleGuardians.length ?? 0) > 0 && guardianId === null;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-lg">
                <DialogHeader>
                    <DialogTitle>Enrol {preview?.childName ?? 'this child'}</DialogTitle>
                    <DialogDescription>
                        This creates the student, the guardian link and closes the
                        application — together, or not at all.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                    <div className="space-y-2">
                        <Label>Class</Label>
                        <Select value={armId} onValueChange={setArmId}>
                            <SelectTrigger>
                                <SelectValue placeholder="Which class will they sit in?" />
                            </SelectTrigger>
                            <SelectContent>
                                {arms.map((a) => (
                                    <SelectItem key={a.id} value={a.id}>
                                        {`${a.level?.name ?? ''} ${a.name}`.trim()}
                                        {a.capacity != null ? ` · ${a.capacity} seats` : ''}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        {preview?.capacity != null && (
                            <p className="text-xs text-muted-foreground">
                                {preview.enrolled} of {preview.capacity} seats taken
                            </p>
                        )}
                    </div>

                    {full && (
                        <div className="flex items-start gap-2 rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-200">
                            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                            <div className="space-y-2">
                                <p>That class is full. A seat here is real, unlike an offer.</p>
                                <div className="flex items-center gap-2">
                                    <Checkbox
                                        id="over"
                                        checked={over}
                                        onCheckedChange={(v) => setOver(!!v)}
                                    />
                                    <Label htmlFor="over" className="cursor-pointer">
                                        Seat them anyway
                                    </Label>
                                </div>
                            </div>
                        </div>
                    )}

                    {(preview?.possibleGuardians.length ?? 0) > 0 && (
                        <div className="space-y-2">
                            <Label>Who is {preview?.guardianName}?</Label>
                            <p className="text-xs text-muted-foreground">
                                Somebody already on file has this number — usually a
                                sibling&apos;s parent. Linking the same person is what makes
                                the children siblings.
                            </p>
                            {preview!.possibleGuardians.map((g) => (
                                <button
                                    key={g.id}
                                    type="button"
                                    onClick={() => setGuardianId(g.id)}
                                    className={`flex w-full items-center justify-between rounded-lg border p-3 text-left hover:bg-muted/50 ${
                                        guardianId === g.id ? 'border-primary bg-muted/40' : ''
                                    }`}
                                >
                                    <div>
                                        <p className="font-medium">{g.name}</p>
                                        <p className="text-sm text-muted-foreground">
                                            {g.phone} · {g.children} child
                                            {g.children === 1 ? '' : 'ren'} on the roll
                                        </p>
                                    </div>
                                    {guardianId === g.id && (
                                        <UserCheck className="h-4 w-4 text-primary" />
                                    )}
                                </button>
                            ))}
                            <Button
                                variant="outline"
                                className="w-full"
                                onClick={() => setGuardianId('')}
                            >
                                None of these — a different person
                            </Button>
                            {guardianId === '' && (
                                <p className="text-xs text-muted-foreground">
                                    A new guardian will be created from the application.
                                </p>
                            )}
                        </div>
                    )}
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                        Cancel
                    </Button>
                    <Button
                        disabled={
                            !armId ||
                            (full && !over) ||
                            mustChoose ||
                            enrol.isPending
                        }
                        onClick={async () => {
                            const result = await enrol.mutateAsync({
                                classArmId: armId,
                                guardianId: guardianId || undefined,
                                allowOverCapacity: over || undefined,
                            });
                            onOpenChange(false);
                            onDone(result.studentId);
                        }}
                    >
                        {enrol.isPending && (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        )}
                        Enrol
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
