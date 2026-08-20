'use client';

import Link from 'next/link';
import { ArrowRight, GraduationCap, ClipboardList, School } from 'lucide-react';

import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { useAuth } from '@/lib/hooks/use-auth';
import { useStudents } from '@/lib/hooks/use-students';
import { useClassArms } from '@/lib/hooks/use-academics';
import { useApplications } from '@/lib/hooks/use-admissions';

/**
 * The school, for the people who run it.
 *
 * The dashboard used to open with payroll totals whoever was looking — so an
 * educator or a registrar, who may not read payroll at all, landed on a row of
 * zeros where the server had refused the request. This is what those roles get
 * instead: how many children are on the roll, how many classes they sit in, and
 * what is waiting in the admissions queue.
 *
 * Renders nothing outside a school, and nothing before there is a roll — a tile
 * reading zero teaches people to stop looking at that corner of the screen.
 */
export function SchoolWidget() {
    const { tenantOrgType, hasRole } = useAuth();
    const canSee = hasRole([
        'tenant_owner',
        'ADMIN',
        'admissions.registrar',
        'admissions.officer',
        'academic.teacher',
    ]);
    const isSchool = tenantOrgType === 'SCHOOL';
    const active = isSchool && canSee;

    const { data: students } = useStudents(undefined, active);
    const { data: arms } = useClassArms(undefined, active);
    // Only the registrar's side sees the admissions queue; a form teacher has
    // no business in it, and the endpoint would refuse them anyway.
    const canSeeAdmissions = hasRole([
        'tenant_owner',
        'ADMIN',
        'admissions.registrar',
        'admissions.officer',
    ]);
    const { data: applications } = useApplications(
        undefined,
        active && canSeeAdmissions,
    );

    if (!active) return null;

    const onRoll = students?.length ?? 0;
    const classes = arms?.length ?? 0;
    // Anything not yet enrolled, rejected or withdrawn is still work.
    const inProgress = (applications ?? []).filter((a) =>
        ['APPLIED', 'ASSESSMENT_SCHEDULED', 'ASSESSED', 'OFFERED', 'ACCEPTED'].includes(
            a.status,
        ),
    ).length;

    if (onRoll === 0 && classes === 0 && inProgress === 0) return null;

    return (
        <Card>
            <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                    <div>
                        <CardTitle className="text-base">The school</CardTitle>
                        <CardDescription>Who is here, and who is coming.</CardDescription>
                    </div>
                    <Link
                        href="/students"
                        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:underline"
                    >
                        Pupils
                        <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                </div>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                    <Link href="/students" className="group">
                        <div className="flex items-center gap-3">
                            <GraduationCap className="h-5 w-5 text-muted-foreground" />
                            <div>
                                <p className="text-2xl font-bold tabular-nums">{onRoll}</p>
                                <p className="text-xs text-muted-foreground group-hover:underline">
                                    on the roll
                                </p>
                            </div>
                        </div>
                    </Link>

                    <Link href="/classes" className="group">
                        <div className="flex items-center gap-3">
                            <School className="h-5 w-5 text-muted-foreground" />
                            <div>
                                <p className="text-2xl font-bold tabular-nums">{classes}</p>
                                <p className="text-xs text-muted-foreground group-hover:underline">
                                    {classes === 1 ? 'class' : 'classes'}
                                </p>
                            </div>
                        </div>
                    </Link>

                    {canSeeAdmissions && (
                        <Link href="/admissions" className="group">
                            <div className="flex items-center gap-3">
                                <ClipboardList className="h-5 w-5 text-muted-foreground" />
                                <div>
                                    <p className="text-2xl font-bold tabular-nums">
                                        {inProgress}
                                    </p>
                                    <p className="text-xs text-muted-foreground group-hover:underline">
                                        {inProgress === 1
                                            ? 'application waiting'
                                            : 'applications waiting'}
                                    </p>
                                </div>
                            </div>
                        </Link>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
