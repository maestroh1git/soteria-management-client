'use client';

import { Money } from '@/components/common/money';
import type { TargetedStaff } from '@/lib/api/staff-target';

/**
 * What a bulk pay action is about to do, person by person, before anything
 * is saved: who it reaches (and how much, for a one-off), who it skips and
 * why. The confirm button beside it acts on exactly this list.
 */
export function BulkPreview({
    reached,
    reachedLabel,
    skipped,
    total,
}: {
    reached: Array<TargetedStaff & { amount?: number }>;
    /** "will be paid", "will get it". */
    reachedLabel: string;
    skipped: Array<TargetedStaff & { reason: string }>;
    /** The sum of the amounts, when there are amounts. */
    total?: number;
}) {
    return (
        <div className="space-y-3 rounded-md border bg-muted/30 p-3 text-sm">
            <p>
                <span className="font-medium">
                    {reached.length} {reached.length === 1 ? 'person' : 'people'}
                </span>{' '}
                {reachedLabel}
                {total !== undefined && reached.length > 0 && (
                    <>
                        {', '}
                        <span className="font-medium tabular-nums">
                            <Money value={total} />
                        </span>{' '}
                        in all
                    </>
                )}
                .{skipped.length > 0 && ` ${skipped.length} skipped.`}
            </p>
            {reached.length > 0 && (
                <ul className="max-h-40 divide-y overflow-y-auto rounded border bg-background">
                    {reached.map((s) => (
                        <li
                            key={s.id}
                            className="flex items-center justify-between gap-3 px-3 py-1.5"
                        >
                            <span className="min-w-0 truncate">
                                {s.name}
                                <span className="ml-1.5 text-xs text-muted-foreground">
                                    {s.employeeNumber}
                                </span>
                            </span>
                            {s.amount !== undefined && (
                                <span className="shrink-0 tabular-nums">
                                    <Money value={s.amount} />
                                </span>
                            )}
                        </li>
                    ))}
                </ul>
            )}
            {skipped.length > 0 && (
                <details>
                    <summary className="cursor-pointer text-muted-foreground">
                        Skipped ({skipped.length})
                    </summary>
                    <ul className="mt-2 max-h-32 divide-y overflow-y-auto rounded border bg-background">
                        {skipped.map((s) => (
                            <li
                                key={s.id}
                                className="flex items-center justify-between gap-3 px-3 py-1.5"
                            >
                                <span className="min-w-0 truncate">{s.name}</span>
                                <span className="shrink-0 text-xs text-muted-foreground">
                                    {s.reason}
                                </span>
                            </li>
                        ))}
                    </ul>
                </details>
            )}
        </div>
    );
}
