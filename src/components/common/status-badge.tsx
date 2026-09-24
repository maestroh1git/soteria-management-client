'use client';

import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import {
    statusOf,
    TONE_CLASS,
    type StatusKind,
} from '@/lib/status/registry';

interface StatusBadgeProps {
    /** Which kind of record: statuses mean different things on each. */
    kind: StatusKind;
    status: string;
    className?: string;
}

/**
 * A record's status, named and coloured the same way on every screen. The
 * words and colours live in lib/status/registry.ts; this only draws them.
 */
export function StatusBadge({ kind, status, className }: StatusBadgeProps) {
    const { label, tone } = statusOf(kind, status);
    return (
        <Badge
            variant="secondary"
            className={cn(
                'rounded-full border-0 px-2.5 py-0.5 text-xs font-medium',
                TONE_CLASS[tone],
                className,
            )}
        >
            {label}
        </Badge>
    );
}
