'use client';

import { use, useEffect, useState, useId } from 'react';
import { Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { CopyButton } from '@/components/common/copy-button';
import { SupportNeedsFields } from '@/components/common/support-needs-fields';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    getPublicSchool,
    submitApplication,
    type PublicSchool,
} from '@/lib/api/public-admissions';

const RELATIONSHIPS = ['MOTHER', 'FATHER', 'GUARDIAN', 'SPONSOR', 'OTHER'];

/**
 * The application form.
 *
 * One page in sections rather than a wizard: a wizard hides how much is left
 * and costs taps, and this is filled on a phone by somebody doing it once. The
 * whole ask should be visible before they start.
 */
export default function ApplyPage({
    params,
}: {
    params: Promise<{ slug: string }>;
}) {
    const { slug } = use(params);

    const [school, setSchool] = useState<PublicSchool | null>(null);
    const [loadError, setLoadError] = useState<string | null>(null);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [receipt, setReceipt] = useState<{
        applicationNumber: string;
        accessToken: string;
    } | null>(null);

    const [form, setForm] = useState({
        classLevelId: '',
        firstName: '',
        middleName: '',
        lastName: '',
        dateOfBirth: '',
        gender: '',
        previousSchool: '',
        guardianFirstName: '',
        guardianLastName: '',
        guardianPhone: '',
        guardianEmail: '',
        guardianRelationship: 'MOTHER',
    });
    const set = (k: string, v: string) => setForm({ ...form, [k]: v });
    const [supportNeeds, setSupportNeeds] = useState<string[]>([]);
    const [supportNotes, setSupportNotes] = useState('');

    useEffect(() => {
        getPublicSchool(slug)
            .then(setSchool)
            .catch((e) => setLoadError(e.message));
    }, [slug]);

    const complete =
        form.classLevelId &&
        form.firstName.trim() &&
        form.lastName.trim() &&
        form.dateOfBirth &&
        form.gender &&
        form.guardianFirstName.trim() &&
        form.guardianLastName.trim() &&
        form.guardianPhone.trim().length >= 7;

    const submit = async () => {
        setSubmitting(true);
        setError(null);
        try {
            setReceipt(
                await submitApplication(slug, {
                    ...form,
                    middleName: form.middleName.trim() || undefined,
                    previousSchool: form.previousSchool.trim() || undefined,
                    supportNeeds: supportNeeds.length ? supportNeeds : undefined,
                    supportNotes: supportNotes.trim() || undefined,
                    guardianEmail: form.guardianEmail.trim() || undefined,
                }),
            );
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Something went wrong');
        } finally {
            setSubmitting(false);
        }
    };

    if (loadError) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>We could not find that school</CardTitle>
                    <CardDescription>
                        Check the link you were given. {loadError}
                    </CardDescription>
                </CardHeader>
            </Card>
        );
    }

    if (!school) {
        return (
            <div className="flex items-center gap-2 text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" /> Loading…
            </div>
        );
    }

    // ── The receipt ─────────────────────────────────────────────────────────
    // Shown large and framed as something to keep: there is no recovery path
    // if the link is lost, so it should not look like a passing confirmation.
    if (receipt) {
        const link =
            typeof window !== 'undefined'
                ? `${window.location.origin}/application/${receipt.accessToken}`
                : '';
        return (
            <Card className="border-green-300 dark:border-green-900/50">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-green-700 dark:text-green-400">
                        <CheckCircle2 className="h-6 w-6" />
                        Application received
                    </CardTitle>
                    <CardDescription>
                        {school.name} has your application for {form.firstName}.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-5">
                    <div>
                        <p className="text-sm text-muted-foreground">
                            Your application number
                        </p>
                        <div className="flex flex-wrap items-center gap-3">
                            <p className="text-2xl font-semibold tracking-wide">
                                {receipt.applicationNumber}
                            </p>
                            <CopyButton text={receipt.applicationNumber} label="Copy number" />
                        </div>
                        <p className="mt-1 text-sm text-muted-foreground">
                            Quote this if you call the school.
                        </p>
                    </div>

                    <div className="rounded-lg border bg-muted/40 p-4">
                        <p className="font-medium">Keep this link</p>
                        <p className="mt-1 text-sm text-muted-foreground">
                            It is the only way to check progress, and it cannot be sent to
                            you again.
                        </p>
                        <div className="mt-3 flex items-center gap-2">
                            <code className="flex-1 truncate rounded bg-background px-3 py-2 text-xs">
                                {link}
                            </code>
                            <CopyButton text={link} label="Copy link" />
                        </div>
                    </div>

                    <Button asChild className="w-full">
                        <a href={`/application/${receipt.accessToken}`}>Check progress</a>
                    </Button>
                </CardContent>
            </Card>
        );
    }

    // ── The form ────────────────────────────────────────────────────────────
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-semibold">{school.name}</h1>
                <p className="text-muted-foreground">
                    Application for admission
                    {school.sessionName ? ` · ${school.sessionName}` : ''}
                </p>
            </div>

            {school.levels.length === 0 && (
                <Card className="border-amber-300 bg-amber-50 dark:border-amber-900/50 dark:bg-amber-950/30">
                    <CardContent className="flex items-start gap-2 pt-6 text-sm text-amber-900 dark:text-amber-200">
                        <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                        This school is not accepting applications at the moment.
                    </CardContent>
                </Card>
            )}

            <Card>
                <CardHeader>
                    <CardTitle className="text-lg">About the child</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="slug-page-class-applying-for">Class applying for *</Label>
                        <Select
                            value={form.classLevelId}
                            onValueChange={(v) => set('classLevelId', v)}
                        >
                            <SelectTrigger id="slug-page-class-applying-for">
                                <SelectValue placeholder="Select a class" />
                            </SelectTrigger>
                            <SelectContent>
                                {school.levels.map((l) => (
                                    <SelectItem key={l.id} value={l.id}>
                                        {l.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                        <Text label="First name *" value={form.firstName} onChange={(v) => set('firstName', v)} />
                        <Text label="Middle name" value={form.middleName} onChange={(v) => set('middleName', v)} />
                        <Text label="Surname *" value={form.lastName} onChange={(v) => set('lastName', v)} />
                        <div className="space-y-2">
                            <Label htmlFor="slug-page-gender">Gender *</Label>
                            <Select value={form.gender} onValueChange={(v) => set('gender', v)}>
                                <SelectTrigger id="slug-page-gender">
                                    <SelectValue placeholder="Select" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="FEMALE">Female</SelectItem>
                                    <SelectItem value="MALE">Male</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="apply-dob">Date of birth *</Label>
                            <Input
                                id="apply-dob"
                                type="date"
                                required
                                aria-required
                                value={form.dateOfBirth}
                                onChange={(e) => set('dateOfBirth', e.target.value)}
                            />
                        </div>
                        <Text
                            label="Previous school"
                            value={form.previousSchool}
                            onChange={(v) => set('previousSchool', v)}
                        />
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="text-lg">Support your child needs</CardTitle>
                    <CardDescription>
                        So the school is ready for them from the first day. Optional, and seen
                        only by the staff who need to know.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <SupportNeedsFields
                        idPrefix="apply-support"
                        needs={supportNeeds}
                        notes={supportNotes}
                        onNeedsChange={setSupportNeeds}
                        onNotesChange={setSupportNotes}
                    />
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="text-lg">About you</CardTitle>
                    <CardDescription>
                        The school will contact you on this number.
                    </CardDescription>
                </CardHeader>
                <CardContent className="grid gap-4 sm:grid-cols-2">
                    {/* autoComplete only on the parent's OWN details. The
                        child's name fields deliberately have none: autofilling
                        them from the browser would put the parent's name on the
                        application. */}
                    <Text
                        label="Your first name *"
                        autoComplete="given-name"
                        value={form.guardianFirstName}
                        onChange={(v) => set('guardianFirstName', v)}
                    />
                    <Text
                        label="Your surname *"
                        autoComplete="family-name"
                        value={form.guardianLastName}
                        onChange={(v) => set('guardianLastName', v)}
                    />
                    <div className="space-y-2">
                        <Label htmlFor="apply-phone">Phone number *</Label>
                        <Input
                            id="apply-phone"
                            inputMode="tel"
                            autoComplete="tel"
                            required
                            aria-required
                            placeholder="08031234567"
                            value={form.guardianPhone}
                            onChange={(e) => set('guardianPhone', e.target.value)}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="apply-email">Email</Label>
                        <Input
                            id="apply-email"
                            type="email"
                            inputMode="email"
                            autoComplete="email"
                            value={form.guardianEmail}
                            onChange={(e) => set('guardianEmail', e.target.value)}
                        />
                    </div>
                    <div className="space-y-2 sm:col-span-2">
                        <Label htmlFor="slug-page-you-are-the-childs">You are the child&apos;s *</Label>
                        <Select
                            value={form.guardianRelationship}
                            onValueChange={(v) => set('guardianRelationship', v)}
                        >
                            <SelectTrigger id="slug-page-you-are-the-childs">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {RELATIONSHIPS.map((r) => (
                                    <SelectItem key={r} value={r}>
                                        {r.charAt(0) + r.slice(1).toLowerCase()}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </CardContent>
            </Card>

            {error && (
                <div className="flex items-start gap-2 rounded-md border border-destructive/40 bg-destructive/5 p-3 text-sm text-destructive">
                    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                    {error}
                </div>
            )}

            <Button
                className="w-full"
                size="lg"
                disabled={!complete || submitting || school.levels.length === 0}
                onClick={submit}
            >
                {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Submit application
            </Button>
            <p className="pb-8 text-center text-xs text-muted-foreground">
                Fields marked * are required.
            </p>
        </div>
    );
}

function Text({
    label,
    value,
    onChange,
    autoComplete,
}: {
    label: string;
    value: string;
    onChange: (v: string) => void;
    autoComplete?: string;
}) {
    // Without htmlFor/id the label is decoration: it looks attached and is not,
    // so a screen reader announces an anonymous edit box. A label ending in *
    // is required, and saying so only in the text leaves that unannounced too.
    const id = useId();
    const required = label.trim().endsWith('*');
    return (
        <div className="space-y-2">
            <Label htmlFor={id}>{label}</Label>
            <Input
                id={id}
                value={value}
                required={required}
                aria-required={required || undefined}
                autoComplete={autoComplete}
                onChange={(e) => onChange(e.target.value)}
            />
        </div>
    );
}
