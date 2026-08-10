'use client';

import { use, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, AlertTriangle, Star, Loader2 } from 'lucide-react';

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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { LoadingSkeleton } from '@/components/common/loading-skeleton';
import { EmptyState } from '@/components/common/empty-state';
import { StatusBadge } from '@/components/common/status-badge';
import {
    useStudent,
    useStudentGuardians,
    useStudentMedical,
    useUpsertStudentMedical,
} from '@/lib/hooks/use-students';
import { useAuth } from '@/lib/hooks/use-auth';
import { formatDate } from '@/lib/utils/dates';
import type { StudentGuardianLink } from '@/lib/api/students';

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
const GENOTYPES = ['AA', 'AS', 'SS', 'AC', 'SC'];

/** Sickle cell disease. Worth calling out rather than showing as two letters. */
const SICKLE = ['SS', 'SC'];

export default function StudentDetailPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id } = use(params);
    const { hasRole } = useAuth();
    const canEdit = hasRole(['tenant_owner', 'ADMIN', 'admissions.registrar']);

    const { data: student, isLoading } = useStudent(id);
    const { data: guardians = [] } = useStudentGuardians(id);
    const { data: medical } = useStudentMedical(id);
    const save = useUpsertStudentMedical(id);

    const [form, setForm] = useState<Record<string, string>>({});
    const [editing, setEditing] = useState(false);

    if (isLoading) return <LoadingSkeleton variant="detail" />;
    if (!student) return <EmptyState title="Student not found" />;

    const value = (k: string) =>
        form[k] ?? ((medical as any)?.[k] ?? '') ?? '';
    const set = (k: string, v: string) => setForm({ ...form, [k]: v });

    const beginEdit = () => {
        setForm({});
        setEditing(true);
    };

    const submit = async () => {
        // Only send what was touched: a blank field the user never opened
        // should not overwrite something already on file.
        await save.mutateAsync(form as any);
        setEditing(false);
    };

    const hasAlerts =
        medical &&
        (medical.allergies?.trim() ||
            medical.chronicConditions?.trim() ||
            (medical.genotype && SICKLE.includes(medical.genotype)));

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-3">
                <Button variant="ghost" size="icon" asChild>
                    <Link href="/students" aria-label="Back to students">
                        <ArrowLeft className="h-4 w-4" />
                    </Link>
                </Button>
                <div className="flex-1">
                    <h1 className="text-2xl font-semibold">
                        {student.firstName} {student.middleName ?? ''} {student.lastName}
                    </h1>
                    <p className="text-sm text-muted-foreground">
                        {student.admissionNumber}
                        {student.currentClassArm &&
                            ` · ${student.currentClassArm.level?.name ?? ''} ${student.currentClassArm.name}`}
                    </p>
                </div>
                <StatusBadge status={student.status} />
            </div>

            {/* The point of holding medical data at all is that somebody sees it
                in time, so it is surfaced here rather than only inside its tab. */}
            {hasAlerts && (
                <div className="flex items-start gap-3 rounded-lg border border-amber-300 bg-amber-50 p-4 dark:border-amber-900/50 dark:bg-amber-950/30">
                    <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
                    <div className="space-y-1 text-sm">
                        <p className="font-medium text-amber-900 dark:text-amber-200">
                            Medical alert
                        </p>
                        <ul className="list-inside list-disc text-amber-900/90 dark:text-amber-200/90">
                            {medical?.allergies && <li>Allergies: {medical.allergies}</li>}
                            {medical?.chronicConditions && (
                                <li>{medical.chronicConditions}</li>
                            )}
                            {medical?.genotype && SICKLE.includes(medical.genotype) && (
                                <li>
                                    Genotype {medical.genotype} — sickle cell disease. Care
                                    with exertion and heat.
                                </li>
                            )}
                        </ul>
                    </div>
                </div>
            )}

            <Tabs defaultValue="bio">
                <TabsList>
                    <TabsTrigger value="bio">Biodata</TabsTrigger>
                    <TabsTrigger value="guardians">
                        Guardians{guardians.length ? ` (${guardians.length})` : ''}
                    </TabsTrigger>
                    <TabsTrigger value="medical">Medical</TabsTrigger>
                </TabsList>

                <TabsContent value="bio" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">Biodata</CardTitle>
                        </CardHeader>
                        <CardContent className="grid gap-4 sm:grid-cols-2">
                            <Field label="Admission number" value={student.admissionNumber} />
                            <Field
                                label="Date of birth"
                                value={formatDate(student.dateOfBirth)}
                            />
                            <Field
                                label="Gender"
                                value={student.gender === 'FEMALE' ? 'Female' : 'Male'}
                            />
                            <Field
                                label="Admitted"
                                value={formatDate(student.admissionDate)}
                            />
                            <Field
                                label="Class"
                                value={
                                    student.currentClassArm
                                        ? `${student.currentClassArm.level?.name ?? ''} ${student.currentClassArm.name}`.trim()
                                        : 'Not placed'
                                }
                            />
                            <Field label="Address" value={student.address ?? '—'} />
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="guardians" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">Guardians</CardTitle>
                            <CardDescription>
                                The primary contact is who the school rings first.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {guardians.length === 0 ? (
                                <EmptyState
                                    title="No guardians"
                                    description="Nobody is recorded as a contact for this child."
                                />
                            ) : (
                                <div className="space-y-3">
                                    {guardians.map((link: StudentGuardianLink) => (
                                        <div
                                            key={link.id}
                                            className="flex items-center justify-between rounded-lg border p-3"
                                        >
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <p className="font-medium">
                                                        {link.guardian.firstName} {link.guardian.lastName}
                                                    </p>
                                                    {link.isPrimary && (
                                                        <Badge variant="secondary" className="gap-1">
                                                            <Star className="h-3 w-3" /> Primary
                                                        </Badge>
                                                    )}
                                                </div>
                                                <p className="text-sm text-muted-foreground">
                                                    {link.relationship.toLowerCase()} ·{' '}
                                                    {link.guardian.phone}
                                                    {link.guardian.email
                                                        ? ` · ${link.guardian.email}`
                                                        : ''}
                                                </p>
                                            </div>
                                            {!link.canCollect && (
                                                <Badge variant="destructive">May not collect</Badge>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="medical" className="space-y-4">
                    <Card>
                        <CardHeader className="flex flex-row items-start justify-between">
                            <div>
                                <CardTitle className="text-lg">Medical biodata</CardTitle>
                                <CardDescription>
                                    Visible to teaching staff — an allergy is no use filed in
                                    an office.
                                </CardDescription>
                            </div>
                            {canEdit && !editing && (
                                <Button variant="outline" size="sm" onClick={beginEdit}>
                                    {medical ? 'Edit' : 'Record'}
                                </Button>
                            )}
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {!medical && !editing && (
                                <p className="text-sm text-muted-foreground">
                                    Nothing recorded. That is not the same as “no known
                                    allergies” — it means nobody has been asked.
                                </p>
                            )}

                            {medical && !editing && (
                                <div className="grid gap-4 sm:grid-cols-2">
                                    <Field label="Blood group" value={medical.bloodGroup ?? '—'} />
                                    <Field
                                        label="Genotype"
                                        value={
                                            medical.genotype
                                                ? medical.genotype +
                                                  (SICKLE.includes(medical.genotype)
                                                      ? ' (sickle cell)'
                                                      : '')
                                                : '—'
                                        }
                                    />
                                    <Field label="Allergies" value={medical.allergies ?? '—'} />
                                    <Field
                                        label="Conditions"
                                        value={medical.chronicConditions ?? '—'}
                                    />
                                    <Field label="Medications" value={medical.medications ?? '—'} />
                                    <Field
                                        label="Doctor"
                                        value={
                                            medical.doctorName
                                                ? `${medical.doctorName}${medical.doctorPhone ? ` · ${medical.doctorPhone}` : ''}`
                                                : '—'
                                        }
                                    />
                                    <Field label="Hospital" value={medical.hospital ?? '—'} />
                                    <Field
                                        label="Emergency contact"
                                        value={
                                            medical.emergencyContactName
                                                ? `${medical.emergencyContactName} · ${medical.emergencyContactPhone ?? ''}`
                                                : '—'
                                        }
                                    />
                                </div>
                            )}

                            {editing && (
                                <div className="space-y-4">
                                    <div className="grid gap-4 sm:grid-cols-2">
                                        <div className="space-y-2">
                                            <Label>Blood group</Label>
                                            <Select
                                                value={value('bloodGroup')}
                                                onValueChange={(v) => set('bloodGroup', v)}
                                            >
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Not known" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {BLOOD_GROUPS.map((g) => (
                                                        <SelectItem key={g} value={g}>
                                                            {g}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Genotype</Label>
                                            <Select
                                                value={value('genotype')}
                                                onValueChange={(v) => set('genotype', v)}
                                            >
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Not known" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {GENOTYPES.map((g) => (
                                                        <SelectItem key={g} value={g}>
                                                            {g}
                                                            {SICKLE.includes(g) ? ' — sickle cell' : ''}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>

                                    <Editable
                                        label="Allergies"
                                        hint="What happens, and what to do. A teacher reads this, not a query."
                                        value={value('allergies')}
                                        onChange={(v) => set('allergies', v)}
                                    />
                                    <Editable
                                        label="Chronic conditions"
                                        hint="Asthma, epilepsy, diabetes — anything to recognise."
                                        value={value('chronicConditions')}
                                        onChange={(v) => set('chronicConditions', v)}
                                    />
                                    <Editable
                                        label="Medications"
                                        hint="Including anything kept at school, such as an inhaler."
                                        value={value('medications')}
                                        onChange={(v) => set('medications', v)}
                                    />

                                    <div className="grid gap-4 sm:grid-cols-2">
                                        <Text
                                            label="Doctor"
                                            value={value('doctorName')}
                                            onChange={(v) => set('doctorName', v)}
                                        />
                                        <Text
                                            label="Doctor’s phone"
                                            value={value('doctorPhone')}
                                            onChange={(v) => set('doctorPhone', v)}
                                        />
                                        <Text
                                            label="Hospital"
                                            value={value('hospital')}
                                            onChange={(v) => set('hospital', v)}
                                        />
                                        <div />
                                        <Text
                                            label="Emergency contact"
                                            hint="Rung when no guardian answers — often a neighbour."
                                            value={value('emergencyContactName')}
                                            onChange={(v) => set('emergencyContactName', v)}
                                        />
                                        <Text
                                            label="Emergency phone"
                                            value={value('emergencyContactPhone')}
                                            onChange={(v) => set('emergencyContactPhone', v)}
                                        />
                                    </div>

                                    <div className="flex gap-2">
                                        <Button onClick={submit} disabled={save.isPending}>
                                            {save.isPending && (
                                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            )}
                                            Save
                                        </Button>
                                        <Button
                                            variant="outline"
                                            onClick={() => setEditing(false)}
                                        >
                                            Cancel
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
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

function Editable({
    label,
    hint,
    value,
    onChange,
}: {
    label: string;
    hint?: string;
    value: string;
    onChange: (v: string) => void;
}) {
    return (
        <div className="space-y-2">
            <Label>{label}</Label>
            <Textarea rows={2} value={value} onChange={(e) => onChange(e.target.value)} />
            {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
        </div>
    );
}

function Text({
    label,
    hint,
    value,
    onChange,
}: {
    label: string;
    hint?: string;
    value: string;
    onChange: (v: string) => void;
}) {
    return (
        <div className="space-y-2">
            <Label>{label}</Label>
            <Input value={value} onChange={(e) => onChange(e.target.value)} />
            {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
        </div>
    );
}
