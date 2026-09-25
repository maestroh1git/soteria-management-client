'use client';

import { use, useMemo, useState } from 'react';
import { AlertTriangle, Star, Loader2, Plus } from 'lucide-react';

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
import { StudentAwards } from '@/components/attendance/student-awards';
import { useCurrentSession, useTerms } from '@/lib/hooks/use-academics';
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
import { useCan } from '@/lib/hooks/use-can';
import { StudentDocuments } from '@/components/students/student-documents';
import { formatDate } from '@/lib/utils/dates';
import type { StudentGuardianLink } from '@/lib/api/students';
import { AddGuardianDialog } from '@/components/students/add-guardian-dialog';
import { useTabParam } from '@/lib/hooks/use-tab-param';
import { PageHeader } from '@/components/layout/page-header';
import { InviteParentButton } from '@/features/students/record/invite-parent-button';
import { AttendanceTab } from '@/features/students/record/attendance-tab';
import { ContactsCard } from '@/features/students/record/contacts-card';
import { FeesTab } from '@/features/students/record/fees-tab';
import { AdmissionTab } from '@/features/students/record/admission-tab';
import { SupportCard } from '@/features/students/record/support-card';
import { SUPPORT_NEED_LABELS } from '@/lib/support-needs';

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
const GENOTYPES = ['AA', 'AS', 'SS', 'AC', 'SC'];

/** Sickle cell disease. Worth calling out rather than showing as two letters. */
const SICKLE = ['SS', 'SC'];

const TAB_LABELS: Record<string, string> = {
    bio: 'Bio',
    guardians: 'Guardians',
    attendance: 'Class & attendance',
    fees: 'Fees',
    awards: 'Awards',
    medical: 'Medical',
    documents: 'Documents',
    admission: 'Admission',
};

export default function StudentDetailPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id } = use(params);
    const can = useCan();
    const canEdit = can('students.manage');
    // D4: the registrar who keeps the guardians may give them a login.
    const canInvite = can('guardians.invite');
    // The pupil record hub (C4.5): each tab is shown to whoever may read it.
    const tabs = useMemo(
        () =>
            (
                [
                    ['bio', true],
                    ['guardians', true],
                    ['attendance', can('attendance.report')],
                    ['fees', can('fees.read')],
                    ['awards', can('awards.read')],
                    ['medical', true],
                    ['documents', true],
                    ['admission', can('admissions.read')],
                ] as const
            )
                .filter(([, shown]) => shown)
                .map(([t]) => t),
        [can],
    );
    const [tab, setTab] = useTabParam<(typeof tabs)[number]>(tabs);

    const { data: student, isLoading, isError } = useStudent(id);
    const { data: guardians = [], isError: guardiansFailed } =
        useStudentGuardians(id);
    const { data: medical } = useStudentMedical(id);
    const primary = guardians.find((g) => g.isPrimary)?.guardian;
    const primaryGuardianName = primary ? `${primary.firstName} ${primary.lastName}` : null;
    // So an award lands in a term rather than nowhere. termId is nullable and
    // nothing had ever set it.
    const { data: session } = useCurrentSession();
    const { data: terms = [] } = useTerms(session?.id);
    const currentTerm = terms.find((t) => t.isCurrent) ?? terms[0];
    const save = useUpsertStudentMedical(id);

    const [form, setForm] = useState<Record<string, string>>({});
    const [editing, setEditing] = useState(false);
    const [addingGuardian, setAddingGuardian] = useState(false);

    if (isLoading) return <LoadingSkeleton variant="detail" />;
    if (isError || !student)
        return (
            <EmptyState
                isError={isError}
                subject="this pupil"
                title="Student not found"
            />
        );

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
        (medical &&
            (medical.allergies?.trim() ||
                medical.chronicConditions?.trim() ||
                (medical.genotype && SICKLE.includes(medical.genotype)))) ||
        (student.supportNeeds?.length ?? 0) > 0;

    return (
        <div className="space-y-6">
            <PageHeader
                title={`${student.firstName} ${student.middleName ?? ''} ${student.lastName}`.replace(/\s+/g, ' ')}
                badge={<StatusBadge kind="student" status={student.status} />}
                description={`${student.admissionNumber}${
                    student.currentClassArm
                        ? ` · ${`${student.currentClassArm.level?.name ?? ''} ${student.currentClassArm.name}`.trim()}`
                        : ''
                }`}
                crumbs={[{ label: `${student.firstName} ${student.lastName}` }]}
            />

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
                            {!!student.supportNeeds?.length && (
                                <li>
                                    Support: {student.supportNeeds.map((n) => SUPPORT_NEED_LABELS[n] ?? n).join(', ')}
                                </li>
                            )}
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

            <Tabs value={tab} onValueChange={setTab}>
                <TabsList className="h-auto flex-wrap justify-start">
                    {tabs.map((t) => (
                        <TabsTrigger key={t} value={t}>
                            {TAB_LABELS[t]}
                            {t === 'guardians' && guardians.length ? ` (${guardians.length})` : ''}
                        </TabsTrigger>
                    ))}
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
                        <CardHeader className="flex flex-row items-start justify-between">
                            <div>
                                <CardTitle className="text-lg">Guardians</CardTitle>
                                <CardDescription>
                                    The primary contact is who the school rings first.
                                </CardDescription>
                            </div>
                            {canEdit && (
                                <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => setAddingGuardian(true)}
                                >
                                    <Plus className="mr-2 h-4 w-4" /> Add guardian
                                </Button>
                            )}
                        </CardHeader>
                        <CardContent>
                            {guardiansFailed || guardians.length === 0 ? (
                                <EmptyState
                                    isError={guardiansFailed}
                                    subject="this pupil’s guardians"
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
                                            <div className="flex items-center gap-2">
                                                {!link.canCollect && (
                                                    <Badge variant="destructive">May not collect</Badge>
                                                )}
                                                {/* Creating a login is Owner/Admin
                                                    on the API. Everyone else who can
                                                    open a pupil was offered this and
                                                    refused (A3). */}
                                                {canInvite && (
                                                    <InviteParentButton
                                                        guardianId={link.guardian.id}
                                                        firstName={link.guardian.firstName}
                                                        lastName={link.guardian.lastName}
                                                        email={link.guardian.email}
                                                    />
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                {tabs.includes('attendance') && (
                    <TabsContent value="attendance">
                        <div className="space-y-6">
                            <AttendanceTab studentId={id} classArm={student.currentClassArm} />
                            {can('contacts.read') && (
                                <ContactsCard
                                    studentId={id}
                                    pupilName={`${student.firstName} ${student.lastName}`}
                                    guardianName={primaryGuardianName}
                                />
                            )}
                        </div>
                    </TabsContent>
                )}

                {tabs.includes('fees') && (
                    <TabsContent value="fees">
                        <FeesTab student={student} />
                    </TabsContent>
                )}

                <TabsContent value="medical" className="space-y-4">
                    <SupportCard student={student} canEdit={canEdit} />
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
                                            <Label htmlFor="id-page-blood-group">Blood group</Label>
                                            <Select
                                                value={value('bloodGroup')}
                                                onValueChange={(v) => set('bloodGroup', v)}
                                            >
                                                <SelectTrigger id="id-page-blood-group">
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
                                            <Label htmlFor="id-page-genotype">Genotype</Label>
                                            <Select
                                                value={value('genotype')}
                                                onValueChange={(v) => set('genotype', v)}
                                            >
                                                <SelectTrigger id="id-page-genotype">
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
                                        hint="What happens, and what to do. An educator reads this, not a query."
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

                {tabs.includes('awards') && (
                    <TabsContent value="awards" className="space-y-4">
                        <StudentAwards
                            studentId={student.id}
                            pupilName={`${student.lastName}, ${student.firstName}`}
                            termId={currentTerm?.id}
                        />
                    </TabsContent>
                )}

                <TabsContent value="documents" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">Documents</CardTitle>
                            <CardDescription>
                                Papers that came with this child. Anything uploaded with
                                their application moved here when they enrolled.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <StudentDocuments studentId={id} canEdit={canEdit} />
                        </CardContent>
                    </Card>
                </TabsContent>

                {tabs.includes('admission') && (
                    <TabsContent value="admission">
                        <AdmissionTab studentId={id} admittedOn={student.admissionDate} />
                    </TabsContent>
                )}
            </Tabs>

            <AddGuardianDialog
                open={addingGuardian}
                onOpenChange={setAddingGuardian}
                studentId={id}
                studentName={`${student.firstName} ${student.lastName}`}
                isFirst={guardians.length === 0}
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
            <Label htmlFor="id-page-label">{label}</Label>
            <Textarea id="id-page-label" rows={2} value={value} onChange={(e) => onChange(e.target.value)} />
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
            <Label htmlFor="id-page-label-2">{label}</Label>
            <Input id="id-page-label-2" value={value} onChange={(e) => onChange(e.target.value)} />
            {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
        </div>
    );
}
