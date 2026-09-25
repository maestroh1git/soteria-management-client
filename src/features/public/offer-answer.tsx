'use client';

import { useState } from 'react';
import { CheckCircle2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/common/confirm-dialog';
import { useRespondToOffer } from '@/lib/hooks/use-public';
import { formatLongDate } from '@/lib/utils/dates';

/**
 * Accept or decline a place from the family's link (ROADMAP-EXECUTION.md,
 * 5.11). Declining gives the place away, so it asks first; accepting does
 * not need to, since the school still has to enrol the child.
 */
export function OfferAnswer({
    token,
    childFirstName,
    expiresAt,
}: {
    token: string;
    childFirstName: string;
    expiresAt: string | null;
}) {
    const respond = useRespondToOffer(token);
    const [confirmDecline, setConfirmDecline] = useState(false);

    return (
        <div className="space-y-3 rounded-lg border border-amber-200 bg-amber-50 p-4 dark:border-amber-900/50 dark:bg-amber-950/30">
            <p className="text-sm text-amber-900 dark:text-amber-200">
                Would you like to take up the place for {childFirstName}?
                {expiresAt && <> Please answer by {formatLongDate(expiresAt)}.</>}
            </p>
            <div className="flex flex-wrap gap-2">
                <Button onClick={() => respond.mutate('ACCEPT')} disabled={respond.isPending}>
                    {respond.isPending && respond.variables === 'ACCEPT' ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                        <CheckCircle2 className="mr-2 h-4 w-4" />
                    )}
                    Accept the place
                </Button>
                <Button variant="outline" onClick={() => setConfirmDecline(true)} disabled={respond.isPending}>
                    Decline
                </Button>
            </div>
            {respond.isError && (
                <p role="alert" className="text-sm text-destructive">
                    {respond.error.message}
                </p>
            )}
            <ConfirmDialog
                open={confirmDecline}
                onOpenChange={setConfirmDecline}
                title="Decline the place?"
                description={`The school will offer ${childFirstName}'s place to another family. This cannot be undone from here.`}
                confirmLabel="Decline the place"
                variant="destructive"
                loading={respond.isPending}
                onConfirm={async () => {
                    await respond.mutateAsync('DECLINE').catch(() => undefined);
                    setConfirmDecline(false);
                }}
            />
        </div>
    );
}
