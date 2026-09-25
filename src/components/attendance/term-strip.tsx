'use client';

import { cn } from '@/lib/utils';
import type { AttendanceStatus } from '@/lib/api/attendance';

export const ATTENDANCE_LOOK: Record<
    AttendanceStatus | 'UNMARKED',
    { letter: string; label: string; className: string }
> = {
    PRESENT: {
        letter: 'P',
        label: 'Present',
        className:
            'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300',
    },
    LATE: {
        letter: 'L',
        label: 'Late',
        className:
            'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300',
    },
    ABSENT: {
        letter: 'A',
        label: 'Away',
        className: 'bg-red-100 text-red-800 dark:bg-red-950/60 dark:text-red-300',
    },
    EXCUSED: {
        letter: 'E',
        label: 'Excused',
        className: 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300',
    },
    UNMARKED: {
        letter: '·',
        label: 'No register taken',
        className: 'bg-muted text-muted-foreground',
    },
};

interface Props {
    days: Array<{ date: string; status: AttendanceStatus | null }>;
}

/**
 * One square per teaching day.
 *
 * Every square carries its letter, because a red-and-green strip alone fails a
 * colour-blind parent and a screen reader at the same time. The day list beneath
 * this on the page is the full text alternative, so the strip itself is marked
 * up as a list with a label on each square rather than as an image.
 */
export function TermStrip({ days }: Props) {
    if (days.length === 0) return null;
    return (
        <div>
            <ul
                className="grid list-none gap-1 p-0"
                style={{
                    gridTemplateColumns: 'repeat(auto-fill, minmax(26px, 1fr))',
                }}
            >
                {days.map((d) => {
                    const look = ATTENDANCE_LOOK[d.status ?? 'UNMARKED'];
                    return (
                        <li key={d.date}>
                            <span
                                className={cn(
                                    'grid aspect-square min-h-[26px] w-full place-items-center rounded-md text-[10px] font-bold',
                                    look.className,
                                )}
                                title={`${d.date} — ${look.label}`}
                            >
                                <span aria-hidden="true">{look.letter}</span>
                                <span className="sr-only">
                                    {d.date}: {look.label}
                                </span>
                            </span>
                        </li>
                    );
                })}
            </ul>
            <ul className="mt-3 flex list-none flex-wrap gap-x-4 gap-y-2 p-0 text-xs text-muted-foreground">
                {(['PRESENT', 'LATE', 'ABSENT', 'EXCUSED'] as const).map((s) => (
                    <li key={s} className="flex items-center gap-1.5">
                        <span
                            aria-hidden="true"
                            className={cn(
                                'grid h-4 w-4 place-items-center rounded text-[9px] font-bold',
                                ATTENDANCE_LOOK[s].className,
                            )}
                        >
                            {ATTENDANCE_LOOK[s].letter}
                        </span>
                        {ATTENDANCE_LOOK[s].label}
                    </li>
                ))}
            </ul>
        </div>
    );
}
