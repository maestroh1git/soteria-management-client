'use client';

import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LoadingSkeleton } from '@/components/common/loading-skeleton';
import { EmptyState } from '@/components/common/empty-state';
import { StatusBadge } from '@/components/common/status-badge';
import { useApplications } from '@/lib/hooks/use-admissions';
import { formatDate } from '@/lib/utils/dates';

/** The application this pupil came in on, when there was one. */
export function AdmissionTab({ studentId, admittedOn }: { studentId: string; admittedOn: string }) {
    const { data: applications = [], isLoading, isError } = useApplications({ studentId });

    if (isLoading) return <LoadingSkeleton rows={2} />;
    if (isError) return <EmptyState isError subject="this pupil’s application" title="Admission" />;

    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-lg">Admission</CardTitle>
                <CardDescription>Admitted {formatDate(admittedOn)}.</CardDescription>
            </CardHeader>
            <CardContent>
                {applications.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                        Entered straight onto the roll (imported or added by hand), not through an
                        application.
                    </p>
                ) : (
                    <ul className="divide-y">
                        {applications.map((a) => (
                            <li key={a.id} className="flex flex-wrap items-center justify-between gap-2 py-2">
                                <span className="text-sm">
                                    <Link href={`/admissions/${a.id}`} className="font-medium hover:underline">
                                        {a.applicationNumber}
                                    </Link>
                                    <span className="block text-xs text-muted-foreground">
                                        Applied {formatDate(a.createdAt)}
                                        {a.classLevel ? ` for ${a.classLevel.name}` : ''}
                                        {a.session ? `, ${a.session.name}` : ''}
                                    </span>
                                </span>
                                <StatusBadge kind="application" status={a.status} />
                            </li>
                        ))}
                    </ul>
                )}
            </CardContent>
        </Card>
    );
}
