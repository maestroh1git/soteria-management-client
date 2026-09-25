'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { SupportNeedsFields } from '@/components/common/support-needs-fields';
import { useUpdateStudentSupport } from '@/lib/hooks/use-students';
import { SUPPORT_NEED_LABELS } from '@/lib/support-needs';
import type { Student } from '@/lib/api/students';

/**
 * What the pupil needs support with (roadmap 5.15): from the family's
 * application and what admissions noted, carried at enrolment; kept up to
 * date by the office.
 */
export function SupportCard({ student, canEdit }: { student: Student; canEdit: boolean }) {
    const save = useUpdateStudentSupport(student.id);
    const [editing, setEditing] = useState(false);
    const [needs, setNeeds] = useState<string[]>([]);
    const [notes, setNotes] = useState('');
    const has = (student.supportNeeds?.length ?? 0) > 0 || !!student.supportNotes;

    const begin = () => {
        setNeeds(student.supportNeeds ?? []);
        setNotes(student.supportNotes ?? '');
        setEditing(true);
    };

    return (
        <Card>
            <CardHeader className="flex flex-row items-start justify-between">
                <div>
                    <CardTitle className="text-lg">Support needs</CardTitle>
                    <CardDescription>
                        Sight, hearing, learning and the rest: what helps this child in class.
                    </CardDescription>
                </div>
                {canEdit && !editing && (
                    <Button variant="outline" size="sm" onClick={begin}>
                        {has ? 'Edit' : 'Record'}
                    </Button>
                )}
            </CardHeader>
            <CardContent className="space-y-3">
                {editing ? (
                    <>
                        <SupportNeedsFields
                            idPrefix={`support-${student.id}`}
                            needs={needs}
                            notes={notes}
                            onNeedsChange={setNeeds}
                            onNotesChange={setNotes}
                            notesLabel="Detail"
                        />
                        <div className="flex gap-2">
                            <Button
                                disabled={save.isPending}
                                onClick={() =>
                                    save.mutate(
                                        { supportNeeds: needs, supportNotes: notes.trim() || null },
                                        { onSuccess: () => setEditing(false) },
                                    )
                                }
                            >
                                Save
                            </Button>
                            <Button variant="outline" onClick={() => setEditing(false)}>
                                Cancel
                            </Button>
                        </div>
                    </>
                ) : has ? (
                    <>
                        {!!student.supportNeeds?.length && (
                            <ul className="flex flex-wrap gap-2">
                                {student.supportNeeds.map((n) => (
                                    <li key={n} className="rounded-full bg-muted px-3 py-1 text-sm">
                                        {SUPPORT_NEED_LABELS[n] ?? n}
                                    </li>
                                ))}
                            </ul>
                        )}
                        {student.supportNotes && (
                            <p className="whitespace-pre-line text-sm">{student.supportNotes}</p>
                        )}
                    </>
                ) : (
                    <p className="text-sm text-muted-foreground">None recorded.</p>
                )}
            </CardContent>
        </Card>
    );
}
