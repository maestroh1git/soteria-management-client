'use client';

import Link from 'next/link';
import { AlertTriangle, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import type { Student, StudentMedical } from '@/lib/api/students';
import { useCan } from '@/lib/hooks/use-can';
import { StudentLink } from '@/components/common/entity-link';

const SICKLE = ['SS', 'SC'];

/**
 * The children in a class with something a teacher must know — allergies,
 * chronic conditions, sickle cell disease — and who to call.
 *
 * Shown above the register wherever a class is opened: the staff roster and a
 * form teacher's own class. A record nobody sees in time is the same as no
 * record. The link to a pupil's full record appears only to those who may open
 * it; a form teacher reads what matters here without it.
 */
export function MedicalAlertsCard({
    alerts,
}: {
    alerts: Array<{ student: Student; medical: StudentMedical }>;
}) {
    const canOpenRecord = useCan()('students.read');
    if (alerts.length === 0) return null;

    return (
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
                                <StudentLink id={student.id} student={student} />
                            </p>
                            {canOpenRecord && (
                                <Link href={`/students/${student.id}`}>
                                    <Button variant="ghost" size="sm">
                                        <Eye className="mr-2 h-4 w-4" /> Record
                                    </Button>
                                </Link>
                            )}
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
    );
}
