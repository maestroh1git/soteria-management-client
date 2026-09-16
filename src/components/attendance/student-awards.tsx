'use client';

import { useState } from 'react';
import { Award as AwardIcon, EyeOff, Loader2, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { EmptyState } from '@/components/common/empty-state';
import { ConfirmDialog } from '@/components/common/confirm-dialog';
import { AwardDialog } from './award-dialog';
import { useAwards, useDeleteAward } from '@/lib/hooks/use-attendance';
import { AWARD_CATEGORY_LABELS, type AwardCategory } from '@/lib/api/attendance';

const longDate = (iso: string) =>
    new Date(`${iso}T00:00:00`).toLocaleDateString('en-NG', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
    });

/** A pupil's awards: the canonical record, and where one gets recorded. */
export function StudentAwards({
    studentId,
    pupilName,
    termId,
}: {
    studentId: string;
    pupilName: string;
    termId?: string | null;
}) {
    const { data: awards = [], isLoading } = useAwards(studentId);
    const remove = useDeleteAward(studentId);
    const [adding, setAdding] = useState(false);
    const [removing, setRemoving] = useState<{ id: string; title: string } | null>(
        null,
    );
    const today = new Date().toISOString().slice(0, 10);

    if (isLoading) {
        return (
            <div className="flex justify-center py-12">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between gap-3">
                <p className="text-sm text-muted-foreground">
                    {awards.length === 0
                        ? 'Nothing recorded yet.'
                        : `${awards.length} ${awards.length === 1 ? 'award' : 'awards'}.`}
                </p>
                <Button size="sm" onClick={() => setAdding(true)}>
                    <Plus className="mr-1.5 h-4 w-4" />
                    Recognise
                </Button>
            </div>

            {awards.length === 0 ? (
                <EmptyState
                    title="No awards yet"
                    description="Anything the school recognises — a prize, a commendation, an act worth remembering."
                />
            ) : (
                <ul className="list-none space-y-2 p-0">
                    {awards.map((a) => (
                        <li key={a.id}>
                            <Card>
                                <CardContent className="flex items-start gap-3 py-4">
                                    <AwardIcon
                                        className="mt-0.5 h-4 w-4 flex-none text-amber-600 dark:text-amber-400"
                                        aria-hidden="true"
                                    />
                                    <div className="min-w-0 flex-1">
                                        <p className="text-sm font-medium">{a.title}</p>
                                        <p className="mt-0.5 text-xs text-muted-foreground">
                                            {AWARD_CATEGORY_LABELS[
                                                a.category as AwardCategory
                                            ] ?? a.category}{' '}
                                            · {longDate(a.awardedOn)}
                                        </p>
                                        {a.description && (
                                            <p className="mt-1.5 text-sm text-muted-foreground">
                                                {a.description}
                                            </p>
                                        )}
                                        {!a.visibleToParent && (
                                            <p className="mt-1.5 flex items-center gap-1.5 text-xs text-muted-foreground">
                                                <EyeOff
                                                    className="h-3 w-3"
                                                    aria-hidden="true"
                                                />
                                                Internal — not shown to parents
                                            </p>
                                        )}
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 flex-none"
                                        aria-label={`Withdraw ${a.title}`}
                                        onClick={() =>
                                            setRemoving({ id: a.id, title: a.title })
                                        }
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </CardContent>
                            </Card>
                        </li>
                    ))}
                </ul>
            )}

            <AwardDialog
                open={adding}
                onOpenChange={setAdding}
                studentId={studentId}
                pupilName={pupilName}
                termId={termId}
            />

            {/*
                The server enforces the window; this says what it is before the
                click rather than after. An award given on an earlier day needs
                the office, and a parent may already have seen it.
            */}
            <ConfirmDialog
                open={!!removing}
                onOpenChange={(o) => !o && setRemoving(null)}
                title={`Withdraw “${removing?.title ?? ''}”?`}
                description={
                    awards.find((a) => a.id === removing?.id)?.awardedOn === today
                        ? 'You can withdraw an award you gave today. After today only the school office can.'
                        : 'This was given on an earlier day, so only the school office can withdraw it — and a parent may already have seen it.'
                }
                confirmLabel="Withdraw"
                variant="destructive"
                onConfirm={() => {
                    if (removing) remove.mutate(removing.id);
                    setRemoving(null);
                }}
            />
        </div>
    );
}
