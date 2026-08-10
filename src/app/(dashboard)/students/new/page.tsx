'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Loader2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
import { PrerequisiteNotice } from '@/components/onboarding/prerequisite-notice';
import { useCreateStudent } from '@/lib/hooks/use-students';
import { useClassArms } from '@/lib/hooks/use-academics';

/**
 * Admitting one child.
 *
 * The bulk import is the migration path; this is for the child who arrives in
 * March. Admission number is optional here for the same reason it is optional
 * there — it is allocated from the school's series, and a registrar should not
 * have to invent one.
 */
export default function NewStudentPage() {
    const router = useRouter();
    const create = useCreateStudent();
    const { data: arms = [], isLoading: armsLoading } = useClassArms();

    const [form, setForm] = useState({
        admissionNumber: '',
        firstName: '',
        middleName: '',
        lastName: '',
        dateOfBirth: '',
        gender: '',
        admissionDate: new Date().toISOString().slice(0, 10),
        currentClassArmId: '',
        address: '',
    });

    const set = (k: string, v: string) => setForm({ ...form, [k]: v });

    const needsClasses = !armsLoading && arms.length === 0;

    // Birth date before admission date is enforced server-side too; catching it
    // here means the registrar sees it while the dates are still on screen.
    const datesWrong =
        !!form.dateOfBirth &&
        !!form.admissionDate &&
        form.dateOfBirth >= form.admissionDate;

    const complete =
        form.firstName.trim() &&
        form.lastName.trim() &&
        form.dateOfBirth &&
        form.gender &&
        form.admissionDate &&
        !datesWrong;

    const submit = async () => {
        const student = await create.mutateAsync({
            ...form,
            admissionNumber: form.admissionNumber.trim() || undefined,
            middleName: form.middleName.trim() || undefined,
            address: form.address.trim() || undefined,
            currentClassArmId: form.currentClassArmId || undefined,
        } as any);
        router.push(`/students/${(student as any).id}`);
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-3">
                <Button variant="ghost" size="icon" asChild>
                    <Link href="/students" aria-label="Back to students">
                        <ArrowLeft className="h-4 w-4" />
                    </Link>
                </Button>
                <div>
                    <h1 className="text-2xl font-semibold">Admit a student</h1>
                    <p className="text-sm text-muted-foreground">
                        For a roll of children, use Import instead.
                    </p>
                </div>
            </div>

            {needsClasses && (
                <PrerequisiteNotice
                    message="No classes exist yet. A child can be admitted without one, but they will not appear on any register until they are placed."
                    href="/students"
                    actionLabel="Continue anyway"
                />
            )}

            <Card>
                <CardHeader>
                    <CardTitle className="text-lg">The child</CardTitle>
                    <CardDescription>
                        Guardians and medical details are added from the student’s page
                        once they exist.
                    </CardDescription>
                </CardHeader>
                <CardContent className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                        <Label>First name *</Label>
                        <Input
                            value={form.firstName}
                            onChange={(e) => set('firstName', e.target.value)}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label>Middle name</Label>
                        <Input
                            value={form.middleName}
                            onChange={(e) => set('middleName', e.target.value)}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label>Last name *</Label>
                        <Input
                            value={form.lastName}
                            onChange={(e) => set('lastName', e.target.value)}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label>Gender *</Label>
                        <Select
                            value={form.gender}
                            onValueChange={(v) => set('gender', v)}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Select" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="FEMALE">Female</SelectItem>
                                <SelectItem value="MALE">Male</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label>Date of birth *</Label>
                        <Input
                            type="date"
                            value={form.dateOfBirth}
                            onChange={(e) => set('dateOfBirth', e.target.value)}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label>Admission date *</Label>
                        <Input
                            type="date"
                            value={form.admissionDate}
                            onChange={(e) => set('admissionDate', e.target.value)}
                        />
                        {datesWrong && (
                            <p className="text-sm text-destructive">
                                The birth date must be before the admission date.
                            </p>
                        )}
                    </div>
                    <div className="space-y-2">
                        <Label>Class</Label>
                        <Select
                            value={form.currentClassArmId}
                            onValueChange={(v) => set('currentClassArmId', v)}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Not placed yet" />
                            </SelectTrigger>
                            <SelectContent>
                                {arms.map((a) => (
                                    <SelectItem key={a.id} value={a.id}>
                                        {`${a.level?.name ?? ''} ${a.name}`.trim()}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label>Admission number</Label>
                        <Input
                            placeholder="Leave blank to allocate one"
                            value={form.admissionNumber}
                            onChange={(e) => set('admissionNumber', e.target.value)}
                        />
                        <p className="text-xs text-muted-foreground">
                            Blank is usually right — the next number in the school’s series
                            is used.
                        </p>
                    </div>
                    <div className="space-y-2 sm:col-span-2">
                        <Label>Home address</Label>
                        <Textarea
                            rows={2}
                            value={form.address}
                            onChange={(e) => set('address', e.target.value)}
                        />
                    </div>
                </CardContent>
            </Card>

            <div className="flex gap-2">
                <Button onClick={submit} disabled={!complete || create.isPending}>
                    {create.isPending && (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    Admit student
                </Button>
                <Button variant="outline" asChild>
                    <Link href="/students">Cancel</Link>
                </Button>
            </div>
        </div>
    );
}
