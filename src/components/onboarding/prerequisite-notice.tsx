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
}: {
    message: string;
    href: string;
    actionLabel: string;
}) {
    return (
        <div className="flex items-center gap-3 rounded-lg border border-amber-200 bg-amber-50 p-3 dark:border-amber-900/60 dark:bg-amber-950/20">
            <AlertTriangle className="h-4 w-4 shrink-0 text-amber-600" />
            <p className="flex-1 text-sm text-amber-800 dark:text-amber-200">{message}</p>
            <Link href={href}>
                <Button size="sm" variant="outline" className="shrink-0">
                    {actionLabel} <ArrowRight className="ml-1 h-3.5 w-3.5" />
                </Button>
            </Link>
        </div>
    );
}
