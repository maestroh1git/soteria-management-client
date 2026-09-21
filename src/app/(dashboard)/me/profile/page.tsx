'use client';

import { useState } from 'react';
import { AlertCircle, Mail, Phone, Calendar, MapPin, Briefcase, Building2, Hash, CalendarClock, Pencil } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { MyCompletenessPanel } from '@/components/self-service/my-completeness-panel';
import { MyDetailsForm } from '@/components/self-service/my-details-form';
import { StatusBadge } from '@/components/common/status-badge';
import { LoadingSkeleton } from '@/components/common/loading-skeleton';
import { useMyEmployee } from '@/lib/hooks/use-self-service';
import { formatDate } from '@/lib/utils/dates';
import type { ApiError } from '@/lib/types/api';

function errorMessage(error: unknown): string {
    const message = (error as ApiError)?.message;
    return Array.isArray(message) ? message.join(', ') : (message ?? 'Something went wrong');
}

export default function MyProfilePage() {
    const { data: me, isLoading, isError, error } = useMyEmployee();
    const [editing, setEditing] = useState(false);

    if (isLoading) return <LoadingSkeleton variant="detail" />;

    if (isError) {
        return (
            <Card className="max-w-2xl">
                <CardContent className="flex gap-3 py-8">
                    <AlertCircle className="h-5 w-5 flex-shrink-0 text-amber-600" />
                    <div>
                        <p className="font-medium">No personal record</p>
                        <p className="mt-1 text-sm text-muted-foreground">
                            {errorMessage(error)}
                        </p>
                    </div>
                </CardContent>
            </Card>
        );
    }

    const p = me!;
    const initials = `${p.firstName[0] ?? ''}${p.lastName[0] ?? ''}`.toUpperCase();

    return (
        <div className="space-y-6">
            {/* Identity header */}
            <div className="flex items-center gap-4">
                <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 text-xl font-semibold text-white">
                    {initials}
                </div>
                <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-3">
                        <h1 className="text-3xl font-bold tracking-tight">
                            {p.firstName} {p.lastName}
                        </h1>
                        <StatusBadge status={p.status} />
                    </div>
                    <p className="text-muted-foreground">
                        {p.employeeNumber}
                        {p.role ? ` · ${p.role}` : ''}
                        {p.department ? ` · ${p.department}` : ''}
                    </p>
                </div>
                {!editing && (
                    <Button
                        variant="outline"
                        size="sm"
                        className="ml-auto"
                        onClick={() => setEditing(true)}
                    >
                        <Pencil className="mr-2 h-4 w-4" />
                        Edit my details
                    </Button>
                )}
            </div>

            {editing ? (
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg">My details</CardTitle>
                        <CardDescription>
                            Blank means “not yet” — leaving a field empty never removes
                            anything already on file.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <MyDetailsForm me={p} onDone={() => setEditing(false)} />
                    </CardContent>
                </Card>
            ) : (
                /* What is still outstanding from this person, in their own terms.
                   Above the record, because it is the only part of this page
                   that asks anything of them. */
                <MyCompletenessPanel onFillIn={() => setEditing(true)} />
            )}

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                {/* Personal */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg">Personal information</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <InfoRow icon={<Mail className="h-4 w-4" />} label="Email" value={p.email} />
                        <InfoRow icon={<Phone className="h-4 w-4" />} label="Phone" value={p.phone} />
                        <InfoRow
                            icon={<Calendar className="h-4 w-4" />}
                            label="Date of birth"
                            value={p.dateOfBirth ? formatDate(p.dateOfBirth) : null}
                        />
                        <InfoRow label="Gender" value={p.gender ? title(p.gender) : null} />
                        <InfoRow icon={<MapPin className="h-4 w-4" />} label="Address" value={p.address} />
                    </CardContent>
                </Card>

                {/* Employment */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg">Employment</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <InfoRow icon={<Hash className="h-4 w-4" />} label="Employee number" value={p.employeeNumber} />
                        <InfoRow icon={<Briefcase className="h-4 w-4" />} label="Role" value={p.role} />
                        <InfoRow icon={<Building2 className="h-4 w-4" />} label="Department" value={p.department} />
                        <InfoRow
                            label="Grade"
                            value={p.grade ? `${p.grade.code} — ${p.grade.name}` : null}
                        />
                        <InfoRow
                            icon={<CalendarClock className="h-4 w-4" />}
                            label="Joined"
                            value={formatDate(p.joinDate)}
                        />
                    </CardContent>
                </Card>
            </div>

            {/* The person's own statutory numbers. Empty rows are shown rather
                than hidden — "Not provided" is the only thing that tells
                somebody a number is missing. */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg">Tax, pension &amp; next of kin</CardTitle>
                    <CardDescription>
                        What your PAYE, pension and NHF deductions are filed against.
                    </CardDescription>
                </CardHeader>
                <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    <InfoRow label="TIN" value={p.tin} />
                    <InfoRow label="State you live in" value={p.taxState} />
                    {p.taxState === 'Lagos' && (
                        <InfoRow label="LASRRA number" value={p.lasrraId} />
                    )}
                    <InfoRow label="NIN" value={p.nin} />
                    <InfoRow label="BVN" value={p.bvn} />
                    <InfoRow label="RSA PIN" value={p.rsaPin} />
                    <InfoRow label="PFA" value={p.pfaName} />
                    <InfoRow label="NHF number" value={p.nhfNumber} />
                    <InfoRow
                        label="Next of kin"
                        value={
                            p.nextOfKinName
                                ? `${p.nextOfKinName}${
                                      p.nextOfKinRelationship
                                          ? ` (${p.nextOfKinRelationship})`
                                          : ''
                                  }${p.nextOfKinPhone ? ` · ${p.nextOfKinPhone}` : ''}`
                                : null
                        }
                    />
                </CardContent>
            </Card>

            <p className="text-xs text-muted-foreground">
                Your contact details, tax and pension numbers and next of kin are yours
                to edit. Your name, role, grade, pay and bank details are your
                employer’s record — ask your administrator if one of those is wrong.
            </p>
        </div>
    );
}

function title(s: string) {
    return s.charAt(0) + s.slice(1).toLowerCase();
}

function InfoRow({
    icon,
    label,
    value,
}: {
    icon?: React.ReactNode;
    label: string;
    value: string | null | undefined;
}) {
    return (
        <div className="flex items-start gap-3">
            {icon && <span className="mt-0.5 text-muted-foreground">{icon}</span>}
            <div className="min-w-0">
                <p className="text-xs text-muted-foreground">{label}</p>
                <p className="break-words text-sm font-medium">{value || '—'}</p>
            </div>
        </div>
    );
}
