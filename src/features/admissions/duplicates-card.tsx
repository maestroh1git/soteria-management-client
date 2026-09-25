'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Copy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ConfirmDialog } from '@/components/common/confirm-dialog';
import { StatusBadge } from '@/components/common/status-badge';
import { usePossibleDuplicates, useTransitionApplication } from '@/lib/hooks/use-admissions';
import type { AdmissionApplication } from '@/lib/api/admissions';
import { formatDate } from '@/lib/utils/dates';

/** Applications that ended without a place: never the one to keep. */
const ENDED = new Set(['REJECTED', 'WITHDRAWN', 'OFFER_DECLINED', 'OFFER_EXPIRED']);

/**
 * Other applications with the same name and date of birth
 * (ROADMAP-EXECUTION.md, 5.10). Parents apply twice having forgotten far more
 * often than two children share both, so the office sees them side by side
 * and can withdraw this one as the duplicate, keeping the other. Nothing is
 * copied across: whatever this one holds stays on it, withdrawn.
 */
export function DuplicatesCard({
    application,
    canDecide,
}: {
    application: AdmissionApplication;
    canDecide: boolean;
}) {
    const { data: others = [] } = usePossibleDuplicates(application);
    const transition = useTransitionApplication(application.id);
    const [keep, setKeep] = useState<AdmissionApplication | null>(null);
    const canWithdraw = canDecide && application.allowedTransitions.includes('WITHDRAWN');

    if (others.length === 0) return null;

    return (
        <Card className="border-amber-200 dark:border-amber-900/50">
            <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                    <Copy className="h-4 w-4" aria-hidden />
                    May be the same child
                </CardTitle>
                <CardDescription>
                    {others.length === 1 ? 'Another application has' : `${others.length} other applications have`} the
                    same name and date of birth.
                </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
                <ul className="list-none divide-y p-0">
                    {others.map((o) => (
                        <li key={o.id} className="flex flex-wrap items-center justify-between gap-3 px-6 py-3 text-sm">
                            <div className="flex flex-wrap items-center gap-3">
                                <Link href={`/admissions/${o.id}`} className="font-medium hover:underline underline-offset-2">
                                    {o.applicationNumber}
                                </Link>
                                <StatusBadge kind="application" status={o.status} />
                                <span className="text-muted-foreground">applied {formatDate(o.createdAt)}</span>
                                {o.guardianPhone && <span className="text-muted-foreground">· {o.guardianPhone}</span>}
                            </div>
                            {canWithdraw && !ENDED.has(o.status) && (
                                <Button variant="outline" size="sm" onClick={() => setKeep(o)}>
                                    Keep {o.applicationNumber}, withdraw this one
                                </Button>
                            )}
                        </li>
                    ))}
                </ul>
            </CardContent>
            <ConfirmDialog
                open={!!keep}
                onOpenChange={(o) => !o && setKeep(null)}
                title={`Withdraw ${application.applicationNumber} as a duplicate?`}
                description={`${keep?.applicationNumber ?? ''} carries on. This application is withdrawn with a note saying it duplicated that one; its assessments and documents stay on it.`}
                confirmLabel="Withdraw as duplicate"
                variant="destructive"
                loading={transition.isPending}
                onConfirm={async () => {
                    if (!keep) return;
                    await transition.mutateAsync({
                        status: 'WITHDRAWN',
                        notes: `Duplicate of ${keep.applicationNumber}.`,
                    });
                    setKeep(null);
                }}
            />
        </Card>
    );
}
