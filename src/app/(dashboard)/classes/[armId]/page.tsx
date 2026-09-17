'use client';

import { use, useState } from 'react';
import Link from 'next/link';
import {
    ArrowLeft,
    AlertTriangle,
    Users,
    Eye,
    Award as AwardIcon,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { EmptyState } from '@/components/common/empty-state';
import { LoadingSkeleton } from '@/components/common/loading-skeleton';
import { useStudents, useMedicalAlerts } from '@/lib/hooks/use-students';
import {
    useClassArms,
    useArmOccupancy,
    useCurrentSession,
    useTerms,
} from '@/lib/hooks/use-academics';
import { AwardDialog } from '@/components/attendance/award-dialog';
import { formatDate } from '@/lib/utils/dates';

const SICKLE = ['SS', 'SC'];

/**
 * The class register.
 *
 * The screen that makes `academic.teacher` a real role rather than a label: it
 * is the only place a teacher sees the children they teach together with the
 * medical facts that matter in a classroom.
 *
 * Alerts come FIRST, above the register. The entire argument for holding
 * allergy and genotype data was that somebody sees it before an incident, and
 * a teacher who has to open each child's record one at a time will not.
 */
export default function ClassRegisterPage({
    params,
}: {
    params: Promise<{ armId: string }>;
}) {
    const { armId } = use(params);

    const { data: arms = [] } = useClassArms();
    const arm = arms.find((a) => a.id === armId);
    // A class register, bounded by the size of a class. 200 is the server's
    // cap and far above any real arm.
    const {
        data: armPage,
        isLoading,
        isError,
    } = useStudents({ classArmId: armId, limit: 200 });
    const students = armPage?.items ?? [];
    const { data: alerts = [] } = useMedicalAlerts(armId);
    const { data: occupancy } = useArmOccupancy(armId);
    const { data: session } = useCurrentSession();
    const { data: terms = [] } = useTerms(session?.id);
    const currentTerm = terms.find((t) => t.isCurrent) ?? terms[0];
    const [recognising, setRecognising] = useState<{
        id: string;
        name: string;
    } | null>(null);

    if (isLoading) return <LoadingSkeleton variant="detail" />;

    const className = arm
        ? `${arm.level?.name ?? ''} ${arm.name}`.trim()
        : 'Class';

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-3">
                <Button variant="ghost" size="icon" asChild>
                    <Link href="/classes" aria-label="Back to classes">
                        <ArrowLeft className="h-4 w-4" />
                    </Link>
                </Button>
                <div className="flex-1">
                    <h1 className="text-2xl font-semibold">{className}</h1>
                    <p className="text-sm text-muted-foreground">
                        {students.length} on the register
                        {occupancy?.capacity != null &&
                            ` · ${occupancy.capacity} seats`}
                        {occupancy?.free != null &&
                            occupancy.free <= 0 &&
                            ' · full'}
                    </p>
                </div>
            </div>

            {/* Above the register, deliberately. A record nobody sees in time is
                the same as no record. */}
            {alerts.length > 0 && (
                <Card className="border-amber-300 bg-amber-50 dark:border-amber-900/50 dark:bg-amber-950/30">
                    <CardHeader className="pb-3">
                        <CardTitle className="flex items-center gap-2 text-lg text-amber-900 dark:text-amber-200">
                            <AlertTriangle className="h-5 w-5" />
                            {alerts.length} child
                            {alerts.length === 1 ? '' : 'ren'} to know about
                        </CardTitle>
                        <CardDescription className="text-amber-900/80 dark:text-amber-200/80">
                            Check before a trip, games, or anything involving food.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        {alerts.map(({ student, medical }) => (
                            <div
                                key={student.id}
                                className="rounded-lg border border-amber-200 bg-background/60 p-3 dark:border-amber-900/40"
                            >
                                <div className="flex items-center justify-between">
                                    <p className="font-medium">
                                        {student.firstName} {student.lastName}
                                    </p>
                                    <Link href={`/students/${student.id}`}>
                                        <Button variant="ghost" size="sm">
                                            <Eye className="mr-2 h-4 w-4" /> Record
                                        </Button>
                                    </Link>
                                </div>
                                <ul className="mt-1 list-inside list-disc text-sm">
                                    {medical.allergies && (
                                        <li>
                                            <span className="font-medium">Allergies:</span>{' '}
                                            {medical.allergies}
                                        </li>
                                    )}
                                    {medical.chronicConditions && (
                                        <li>{medical.chronicConditions}</li>
                                    )}
                                    {medical.genotype &&
                                        SICKLE.includes(medical.genotype) && (
                                            <li>
                                                Genotype {medical.genotype} — sickle cell disease.
                                                Care with exertion and heat.
                                            </li>
                                        )}
                                    {medical.emergencyContactPhone && (
                                        <li className="text-muted-foreground">
                                            Emergency: {medical.emergencyContactName} ·{' '}
                                            {medical.emergencyContactPhone}
                                        </li>
                                    )}
                                </ul>
                            </div>
                        ))}
                    </CardContent>
                </Card>
            )}

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                        <Users className="h-5 w-5" /> Register
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {isError || students.length === 0 ? (
                        <EmptyState
                            isError={isError}
                            subject="this class’s roll"
                            title="Nobody in this class yet"
                            description="Children are placed here when they are admitted, or by importing a roll."
                        />
                    ) : (
                        <div className="overflow-x-auto rounded-md border">
                            <table className="w-full text-sm">
                                <thead className="bg-muted/50">
                                    <tr>
                                        <th className="px-3 py-2 text-left font-medium">Adm. No.</th>
                                        <th className="px-3 py-2 text-left font-medium">Name</th>
                                        <th className="px-3 py-2 text-left font-medium">Born</th>
                                        <th className="px-3 py-2 text-left font-medium"></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {students.map((s) => {
                                        const flagged = alerts.some(
                                            (a) => a.student.id === s.id,
                                        );
                                        return (
                                            <tr key={s.id} className="border-t">
                                                <td className="px-3 py-2 text-muted-foreground">
                                                    {s.admissionNumber}
                                                </td>
                                                <td className="px-3 py-2">
                                                    <span className="font-medium">
                                                        {s.firstName} {s.lastName}
                                                    </span>
                                                    {flagged && (
                                                        <Badge
                                                            variant="outline"
                                                            className="ml-2 border-amber-400 text-amber-700 dark:text-amber-300"
                                                        >
                                                            medical
                                                        </Badge>
                                                    )}
                                                </td>
                                                <td className="px-3 py-2 text-muted-foreground">
                                                    {formatDate(s.dateOfBirth)}
                                                </td>
                                                <td className="px-3 py-2 text-right">
                                                    {/*
                                                        The in-the-moment path. An
                                                        educator noticing something is
                                                        already looking at this roster;
                                                        making them go to Students,
                                                        search, open a pupil and find a
                                                        tab is how a recognition feature
                                                        ends up unused.
                                                    */}
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        aria-label={`Recognise ${s.firstName} ${s.lastName}`}
                                                        onClick={() =>
                                                            setRecognising({
                                                                id: s.id,
                                                                name: `${s.lastName}, ${s.firstName}`,
                                                            })
                                                        }
                                                    >
                                                        <AwardIcon className="h-4 w-4" />
                                                    </Button>
                                                    <Link href={`/students/${s.id}`}>
                                                        <Button variant="ghost" size="sm">
                                                            <Eye className="h-4 w-4" />
                                                        </Button>
                                                    </Link>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </CardContent>
            </Card>

            <AwardDialog
                open={!!recognising}
                onOpenChange={(o) => !o && setRecognising(null)}
                studentId={recognising?.id ?? ''}
                pupilName={recognising?.name ?? ''}
                termId={currentTerm?.id}
            />
        </div>
    );
}
