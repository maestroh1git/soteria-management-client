'use client';

import { useState } from 'react';
import { MessageSquarePlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LoadingSkeleton } from '@/components/common/loading-skeleton';
import { StatusBadge } from '@/components/common/status-badge';
import { useCan } from '@/lib/hooks/use-can';
import { useStudentContacts } from '@/lib/hooks/use-contacts';
import { CONTACT_CHANNEL_LABELS } from '@/lib/api/contacts';
import { formatDateTime } from '@/lib/utils/dates';
import { LogContactDialog } from './log-contact-dialog';

/**
 * Every contact with this pupil's family, newest first (ROADMAP-EXECUTION.md,
 * 5.5): the follow-up list's calls, and anything else the office wrote down.
 */
export function ContactsCard({
    studentId,
    pupilName,
    guardianName,
}: {
    studentId: string;
    pupilName?: string;
    guardianName?: string | null;
}) {
    const can = useCan();
    const { data: contacts = [], isLoading, isError } = useStudentContacts(studentId);
    const [open, setOpen] = useState(false);

    return (
        <Card>
            <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0">
                <div>
                    <CardTitle className="text-lg">Contact with the family</CardTitle>
                    <CardDescription>Calls, messages and meetings about this pupil.</CardDescription>
                </div>
                {can('contacts.log') && (
                    <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
                        <MessageSquarePlus className="mr-2 h-4 w-4" />
                        Log a contact
                    </Button>
                )}
            </CardHeader>
            <CardContent>
                {isLoading ? (
                    <LoadingSkeleton variant="card" />
                ) : isError ? (
                    <p className="text-sm text-muted-foreground">The contact log could not be loaded.</p>
                ) : contacts.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Nobody has written down a contact yet.</p>
                ) : (
                    <ol className="list-none space-y-3 p-0">
                        {contacts.map((c) => (
                            <li key={c.id} className="rounded-lg border p-3">
                                <div className="flex flex-wrap items-center gap-2 text-sm">
                                    <span className="font-medium">{CONTACT_CHANNEL_LABELS[c.channel]}</span>
                                    {c.withWhom && <span className="text-muted-foreground">with {c.withWhom}</span>}
                                    <StatusBadge kind="contactOutcome" status={c.reached ? 'REACHED' : 'NOT_REACHED'} />
                                </div>
                                <p className="mt-1.5 whitespace-pre-line text-sm">{c.note}</p>
                                <p className="mt-1.5 text-xs text-muted-foreground">
                                    {formatDateTime(c.contactedAt)}
                                    {c.recordedByName ? ` · written down by ${c.recordedByName}` : ''}
                                </p>
                            </li>
                        ))}
                    </ol>
                )}
            </CardContent>
            <LogContactDialog
                open={open}
                onOpenChange={setOpen}
                studentId={studentId}
                pupilName={pupilName}
                guardianName={guardianName}
            />
        </Card>
    );
}
