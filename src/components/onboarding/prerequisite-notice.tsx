'use client';

import Link from 'next/link';
import { AlertTriangle, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

/**
 * Inline banner that catches dependency dead-ends (e.g. "add employees before
 * running payroll") at the point of action, with a one-click link to the
 * missing prerequisite. Pair with the dashboard checklist for off-path users.
 */
export function PrerequisiteNotice({
    message,
    href,
    actionLabel,
    onAction,
}: {
    message: string;
    /** Where the missing thing is created. Omit when `onAction` opens it here. */
    href?: string;
    actionLabel: string;
    /**
     * Handle it on this page instead of navigating — when the thing that is
     * missing is created by a dialog already on screen, sending somebody
     * somewhere else to come back is worse than opening it.
     */
    onAction?: () => void;
}) {
    const action = (
        <Button size="sm" variant="outline" className="shrink-0" onClick={onAction}>
            {actionLabel} <ArrowRight className="ml-1 h-3.5 w-3.5" />
        </Button>
    );

    return (
        <div className="flex items-center gap-3 rounded-lg border border-amber-200 bg-amber-50 p-3 dark:border-amber-900/60 dark:bg-amber-950/20">
            <AlertTriangle className="h-4 w-4 shrink-0 text-amber-600" />
            <p className="flex-1 text-sm text-amber-800 dark:text-amber-200">{message}</p>
            {onAction || !href ? action : <Link href={href}>{action}</Link>}
        </div>
    );
}
