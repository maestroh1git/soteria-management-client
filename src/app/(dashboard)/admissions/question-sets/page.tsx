'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
    ArrowLeft,
    ChevronDown,
    ChevronRight,
    GripVertical,
    Loader2,
    Plus,
    Trash2,
    X,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
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
    useCreateInterviewTemplate,
    useInterviewTemplates,
    useRetireInterviewTemplate,
    useTemplateInterviews,
} from '@/lib/hooks/use-admissions';
import { useAuth } from '@/lib/hooks/use-auth';
import type { InterviewTemplate, QuestionKind } from '@/lib/api/admissions';

const KIND_LABEL: Record<QuestionKind, string> = {
    TEXT: 'Written answer',
    RATING_1_5: 'Score, one to five',
    YES_NO: 'Yes or no',
};

/** A question being drafted, before it has an id. */
interface Draft {
    prompt: string;
    kind: QuestionKind;
    required: boolean;
}

const BLANK: Draft = { prompt: '', kind: 'TEXT', required: false };

/** "No interviews were", "1 interview was", "4 interviews were". */
function interviewsRun(count: number): string {
    if (count === 0) return 'No interviews were';
    return count === 1 ? '1 interview was' : `${count} interviews were`;
}

/** "1 interview is", "4 interviews are" — for the ones still to come. */
function stillBooked(count: number): string {
    return count === 1 ? '1 interview is' : `${count} interviews are`;
}

/**
 * What a registrar needs to know before standing a set down.
 *
 * Retiring does not cancel a booked sitting, and does not change what it
 * asks: the questions survive, and a sitting is answered against the set it
 * was booked against. Those families will still be asked questions the school
 * has just stopped asking — true and defensible, but only if somebody is told
 * before they press the button rather than after.
 */
function StillBookedWarning({ count }: { count: number }) {
    if (count === 0) return null;
    return (
        <p className="mt-3 rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-200">
            {stillBooked(count)} already booked against it. Those will still
            ask its questions — retiring a set does not change what a family
            was told they would be asked.
        </p>
    );
}

const SITTING_STYLE: Record<string, string> = {
    SCHEDULED: 'text-blue-600 dark:text-blue-400',
    COMPLETED: 'text-green-700 dark:text-green-400',
    NO_SHOW: 'text-amber-700 dark:text-amber-400',
    CANCELLED: 'text-muted-foreground',
};

/**
 * The candidates behind the count.
 *
 * "12 interviews were run against this" is a number with nothing behind it,
 * and it is the number a registrar is looking at when they decide whether to
 * retire the set. Loaded only when expanded — most sets are never opened.
 */
function InterviewsOnSet({ templateId }: { templateId: string }) {
    const { data: interviews, isLoading } = useTemplateInterviews(templateId);

    if (isLoading) {
        return (
            <p className="text-sm text-muted-foreground">Loading…</p>
        );
    }
    if (!interviews?.length) {
        return (
            <p className="text-sm text-muted-foreground">
                Nobody has been interviewed on it.
            </p>
        );
    }

    return (
        <ul className="space-y-1">
            {interviews.map((interview) => (
                <li key={interview.assessmentId}>
                    <Link
                        href={`/admissions/${interview.applicationId}`}
                        className="flex flex-wrap items-baseline gap-x-2 rounded px-2 py-1.5 text-sm hover:bg-muted"
                    >
                        <span className="tabular-nums text-muted-foreground">
                            {interview.applicationNumber}
                        </span>
                        <span className="font-medium">
                            {interview.candidate}
                        </span>
                        {interview.classLevel && (
                            <span className="text-muted-foreground">
                                {interview.classLevel}
                            </span>
                        )}
                        <span
                            className={`ml-auto ${
                                SITTING_STYLE[interview.status] ?? ''
                            }`}
                        >
                            {interview.status.replace(/_/g, ' ').toLowerCase()}
                        </span>
                    </Link>
                </li>
            ))}
        </ul>
    );
}

/** "12 interviews were run against it" — pressed, it says which twelve. */
function InterviewsDisclosure({
    template,
    open,
    onToggle,
}: {
    template: InterviewTemplate;
    open: boolean;
    onToggle: () => void;
}) {
    const total = template.interviewsRun + template.interviewsBooked;
    if (total === 0) return null;

    return (
        <div className="mt-4 border-t pt-3">
            <button
                type="button"
                onClick={onToggle}
                className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
                aria-expanded={open}
            >
                {open ? (
                    <ChevronDown className="h-4 w-4" />
                ) : (
                    <ChevronRight className="h-4 w-4" />
                )}
                {template.interviewsRun > 0
                    ? `${interviewsRun(template.interviewsRun)} run against it`
                    : `${stillBooked(template.interviewsBooked)} booked against it`}
                {template.interviewsRun > 0 &&
                    template.interviewsBooked > 0 &&
                    `, ${template.interviewsBooked} still booked`}
            </button>
            {open && (
                <div className="mt-2">
                    <InterviewsOnSet templateId={template.id} />
                </div>
            )}
        </div>
    );
}

function QuestionList({ template }: { template: InterviewTemplate }) {
    const questions = [...(template.questions ?? [])].sort(
        (a, b) => a.sortOrder - b.sortOrder,
    );

    if (questions.length === 0) {
        return (
            <p className="text-sm text-muted-foreground">No questions on it.</p>
        );
    }

    return (
        <ol className="space-y-2">
            {questions.map((question, index) => (
                <li
                    key={question.id}
                    className="flex items-start gap-3 rounded-md border p-3 text-sm"
                >
                    <span className="mt-0.5 tabular-nums text-muted-foreground">
                        {index + 1}.
                    </span>
                    <div className="min-w-0 flex-1">
                        <p>{question.prompt}</p>
                        <p className="mt-1 text-xs text-muted-foreground">
                            {KIND_LABEL[question.kind]}
                            {question.required && ' · must be answered'}
                        </p>
                    </div>
                </li>
            ))}
        </ol>
    );
}

/**
 * The questions a panel puts to every candidate.
 *
 * A set is published, never edited. An interview that has been recorded keeps
 * its own copy of the wording it was asked in, so changing a question here
 * cannot rewrite what a child was actually asked last week — and the way to
 * change what the school asks is to publish a new set, which stands the
 * current one down.
 */
export default function QuestionSetsPage() {
    const { hasRole } = useAuth();
    // Deciding what the school asks is a registrar's call, not an officer's,
    // and the API draws the same line.
    const canSetQuestions = hasRole([
        'tenant_owner',
        'ADMIN',
        'admissions.registrar',
    ]);

    const { data: templates = [], isLoading } = useInterviewTemplates();
    const create = useCreateInterviewTemplate();
    const retire = useRetireInterviewTemplate();

    const [publishing, setPublishing] = useState(false);
    const [name, setName] = useState('');
    const [drafts, setDrafts] = useState<Draft[]>([{ ...BLANK }]);
    const [retiring, setRetiring] = useState<InterviewTemplate | null>(null);
    /** Which set's candidates are open. One at a time; this is a sidebar read. */
    const [showing, setShowing] = useState<string | null>(null);

    const active = templates.find((t) => t.active);
    const retired = templates.filter((t) => !t.active);

    const asked = drafts.filter((d) => d.prompt.trim());
    const update = (index: number, patch: Partial<Draft>) =>
        setDrafts((prev) =>
            prev.map((d, i) => (i === index ? { ...d, ...patch } : d)),
        );

    const closePublishing = () => {
        setPublishing(false);
        setName('');
        setDrafts([{ ...BLANK }]);
    };

    const submit = async () => {
        await create.mutateAsync({
            name: name.trim(),
            questions: asked.map((d) => ({
                prompt: d.prompt.trim(),
                kind: d.kind,
                required: d.required,
            })),
        });
        closePublishing();
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                    <Link
                        href="/admissions"
                        className="mb-1 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        Admissions
                    </Link>
                    <h1 className="text-2xl font-semibold">Question sets</h1>
                    <p className="text-muted-foreground">
                        What the panel asks every candidate at interview.
                    </p>
                </div>
                {canSetQuestions && (
                    <Button onClick={() => setPublishing(true)}>
                        <Plus className="mr-2 h-4 w-4" />
                        Publish a new set
                    </Button>
                )}
            </div>

            {isLoading && (
                <p className="text-sm text-muted-foreground">Loading…</p>
            )}

            {!isLoading && !active && (
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg">
                            Nothing is being asked
                        </CardTitle>
                        <CardDescription>
                            {canSetQuestions
                                ? 'Interviews can still be booked and recorded — they will just carry ' +
                                  'notes and a recommendation rather than answers to a set of questions.'
                                : 'A registrar decides what the school asks. Interviews booked now will ' +
                                  'carry notes and a recommendation rather than answers.'}
                        </CardDescription>
                    </CardHeader>
                </Card>
            )}

            {active && (
                <Card>
                    <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0">
                        <div>
                            <div className="flex flex-wrap items-center gap-2">
                                <CardTitle className="text-lg">
                                    {active.name}
                                </CardTitle>
                                <Badge className="bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300">
                                    in force
                                </Badge>
                            </div>
                            <CardDescription>
                                Every interview booked from now is run against
                                these.
                            </CardDescription>
                        </div>
                        {canSetQuestions && (
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setRetiring(active)}
                            >
                                Retire
                            </Button>
                        )}
                    </CardHeader>
                    <CardContent>
                        <QuestionList template={active} />
                        <InterviewsDisclosure
                            template={active}
                            open={showing === active.id}
                            onToggle={() =>
                                setShowing(
                                    showing === active.id ? null : active.id,
                                )
                            }
                        />
                    </CardContent>
                </Card>
            )}

            {retired.length > 0 && (
                <div className="space-y-3">
                    <div>
                        <h2 className="font-medium">Previously asked</h2>
                        <p className="text-sm text-muted-foreground">
                            Kept, not deleted. An interview run against one of
                            these still reads the way it was asked.
                        </p>
                    </div>
                    {retired.map((template) => (
                        <Card key={template.id} className="opacity-80">
                            <CardHeader>
                                <CardTitle className="text-base">
                                    {template.name}
                                </CardTitle>
                                {template.interviewsRun === 0 && (
                                    <CardDescription>
                                        No interviews were run against it.
                                    </CardDescription>
                                )}
                            </CardHeader>
                            <CardContent>
                                <QuestionList template={template} />
                                <InterviewsDisclosure
                                    template={template}
                                    open={showing === template.id}
                                    onToggle={() =>
                                        setShowing(
                                            showing === template.id
                                                ? null
                                                : template.id,
                                        )
                                    }
                                />
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}

            {/* ── Publishing ── */}
            <Dialog
                open={publishing}
                onOpenChange={(open) => !open && closePublishing()}
            >
                <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>Publish a question set</DialogTitle>
                        <DialogDescription>
                            {active
                                ? `This will stand "${active.name}" down. Interviews already run ` +
                                  'against it keep the questions they were asked.'
                                : 'A set cannot be edited once published — to change what the school ' +
                                  'asks, publish another.'}
                        </DialogDescription>
                        {/* Publishing retires the incumbent, so it carries the
                            same consequence as pressing Retire — and it is the
                            path a school will actually take. */}
                        {active && (
                            <StillBookedWarning
                                count={active.interviewsBooked}
                            />
                        )}
                    </DialogHeader>

                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="set-name">Name</Label>
                            <Input
                                id="set-name"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="2026/2027 intake panel"
                                maxLength={120}
                            />
                        </div>

                        <div className="space-y-3">
                            <Label>Questions</Label>
                            {drafts.map((draft, index) => (
                                <div
                                    key={index}
                                    className="flex items-start gap-2 rounded-md border p-3"
                                >
                                    <GripVertical className="mt-2.5 h-4 w-4 shrink-0 text-muted-foreground" />
                                    <div className="min-w-0 flex-1 space-y-2">
                                        <Input
                                            value={draft.prompt}
                                            onChange={(e) =>
                                                update(index, {
                                                    prompt: e.target.value,
                                                })
                                            }
                                            placeholder="What the panel asks"
                                            maxLength={500}
                                        />
                                        <div className="flex flex-wrap items-center gap-3">
                                            <Select
                                                value={draft.kind}
                                                onValueChange={(v) =>
                                                    update(index, {
                                                        kind: v as QuestionKind,
                                                    })
                                                }
                                            >
                                                <SelectTrigger className="w-[190px]">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {(
                                                        Object.keys(
                                                            KIND_LABEL,
                                                        ) as QuestionKind[]
                                                    ).map((kind) => (
                                                        <SelectItem
                                                            key={kind}
                                                            value={kind}
                                                        >
                                                            {KIND_LABEL[kind]}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            <label className="flex items-center gap-2 text-sm">
                                                <Checkbox
                                                    checked={draft.required}
                                                    onCheckedChange={(c) =>
                                                        update(index, {
                                                            required: c === true,
                                                        })
                                                    }
                                                />
                                                Must be answered
                                            </label>
                                        </div>
                                    </div>
                                    {drafts.length > 1 && (
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() =>
                                                setDrafts((prev) =>
                                                    prev.filter(
                                                        (_, i) => i !== index,
                                                    ),
                                                )
                                            }
                                            aria-label="Remove this question"
                                        >
                                            <X className="h-4 w-4" />
                                        </Button>
                                    )}
                                </div>
                            ))}
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() =>
                                    setDrafts((prev) => [...prev, { ...BLANK }])
                                }
                            >
                                <Plus className="mr-2 h-4 w-4" />
                                Add a question
                            </Button>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={closePublishing}>
                            Cancel
                        </Button>
                        <Button
                            onClick={submit}
                            disabled={
                                create.isPending ||
                                !name.trim() ||
                                asked.length === 0
                            }
                            title={
                                !name.trim()
                                    ? 'Give the set a name'
                                    : asked.length === 0
                                      ? 'A set with no questions asks nothing'
                                      : undefined
                            }
                        >
                            {create.isPending && (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            )}
                            Publish
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* ── Retiring ── */}
            <Dialog
                open={!!retiring}
                onOpenChange={(open) => !open && setRetiring(null)}
            >
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>
                            Stop asking these questions?
                        </DialogTitle>
                        <DialogDescription>
                            {retiring?.interviewsRun
                                ? `"${retiring.name}" is kept. ${interviewsRun(
                                      retiring.interviewsRun,
                                  )} run against it, and they still read the way they were asked. ` +
                                  'Interviews booked after this will carry notes and a recommendation ' +
                                  'only, until another set is published.'
                                : 'Interviews booked after this will carry notes and a recommendation ' +
                                  'only, until another set is published.'}
                        </DialogDescription>
                        <StillBookedWarning
                            count={retiring?.interviewsBooked ?? 0}
                        />
                    </DialogHeader>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setRetiring(null)}
                        >
                            Keep asking them
                        </Button>
                        <Button
                            variant="destructive"
                            disabled={retire.isPending}
                            onClick={async () => {
                                if (!retiring) return;
                                await retire.mutateAsync(retiring.id);
                                setRetiring(null);
                            }}
                        >
                            {retire.isPending ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : (
                                <Trash2 className="mr-2 h-4 w-4" />
                            )}
                            Retire
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
