'use client';

import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
} from '@/components/ui/sheet';
import { EmptyState } from '@/components/common/empty-state';
import { LoadingSkeleton } from '@/components/common/loading-skeleton';
import { useUserActivity } from '@/lib/hooks/use-audit';
import { formatDateTime } from '@/lib/utils/dates';
import type { User } from '@/lib/types/api';

const VERB: Record<string, string> = {
    CREATE: 'Created',
    UPDATE: 'Changed',
    DELETE: 'Removed',
    APPROVE: 'Approved',
    REJECT: 'Rejected',
    LOGIN: 'Signed in',
};

/** What one person has done, most recent first (the audit log, for them). */
export function ActivitySheet({
    user,
    onClose,
}: {
    user: User | null;
    onClose: () => void;
}) {
    const { data: logs = [], isLoading, isError } = useUserActivity(user?.id ?? '');
    return (
        <Sheet open={!!user} onOpenChange={(o) => !o && onClose()}>
            <SheetContent className="w-full overflow-y-auto sm:max-w-md">
                <SheetHeader>
                    <SheetTitle>
                        {user ? `${user.firstName} ${user.lastName}` : 'Activity'}
                    </SheetTitle>
                    <SheetDescription>What they have done, most recent first.</SheetDescription>
                </SheetHeader>
                <div className="px-4 pb-6">
                    {isLoading ? (
                        <LoadingSkeleton rows={6} />
                    ) : logs.length === 0 ? (
                        <EmptyState
                            isError={isError}
                            subject="their activity"
                            title="Nothing recorded yet"
                            description="Changes they make and sign-ins appear here."
                        />
                    ) : (
                        <ol className="space-y-3">
                            {logs.map((log) => (
                                <li key={log.id} className="rounded-md border p-3 text-sm">
                                    <p className="font-medium">
                                        {VERB[log.action] ?? log.action}{' '}
                                        {log.entityType.replace(/_/g, ' ').toLowerCase()}
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                        {formatDateTime(log.createdAt)}
                                    </p>
                                </li>
                            ))}
                        </ol>
                    )}
                </div>
            </SheetContent>
        </Sheet>
    );
}
