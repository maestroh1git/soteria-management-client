'use client';

import type { KeyboardEvent } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { DAY_TYPE_LABELS, type DayType, type SchoolDay } from '@/lib/api/attendance';
import { formatDayOfWeek, formatMonthYear } from '@/lib/utils/dates';
import { cn } from '@/lib/utils';

/**
 * The cell fill for each kind of day. The legend is the only key to these, so
 * they have to stay apart from one another in light and dark alike — and the
 * day number has to stay readable on top of every one of them.
 */
export const DAY_CELL: Record<DayType, string> = {
    TEACHING:
        'bg-emerald-50 text-emerald-900 hover:bg-emerald-100 dark:bg-emerald-950/50 dark:text-emerald-200 dark:hover:bg-emerald-900/50',
    HOLIDAY:
        'bg-blue-100 text-blue-900 hover:bg-blue-200 dark:bg-blue-950/60 dark:text-blue-200 dark:hover:bg-blue-900/50',
    BREAK: 'bg-amber-100 text-amber-900 hover:bg-amber-200 dark:bg-amber-950/60 dark:text-amber-200 dark:hover:bg-amber-900/50',
    EXAM: 'bg-purple-100 text-purple-900 hover:bg-purple-200 dark:bg-purple-950/60 dark:text-purple-200 dark:hover:bg-purple-900/50',
    CLOSURE:
        'bg-red-100 text-red-900 hover:bg-red-200 dark:bg-red-950/60 dark:text-red-200 dark:hover:bg-red-900/50',
    WEEKEND:
        'bg-muted/60 text-muted-foreground hover:bg-muted dark:bg-slate-900/60',
};

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

/** 0 = Monday. Read in UTC — a calendar date is a fact, not an instant. */
function mondayIndex(iso: string): number {
    return (new Date(`${iso}T00:00:00Z`).getUTCDay() + 6) % 7;
}

interface MonthGridProps {
    /** `YYYY-MM`. */
    month: string;
    /** This month's days, ascending. */
    days: SchoolDay[];
    selected: Set<string>;
    /** The one cell in the whole calendar that Tab reaches. */
    tabbableDate: string | null;
    /** Null until mounted — the ring must not differ between server and client. */
    today: string | null;
    onPick: (date: string, extend: boolean) => void;
    onKeyDown: (e: KeyboardEvent<HTMLButtonElement>, date: string) => void;
    registerCell: (date: string, el: HTMLButtonElement | null) => void;
}

/**
 * One month, as a month actually looks.
 *
 * A term is ninety-odd dates. As a list that is ninety rows nobody can hold in
 * their head; as four of these it is the shape a school already thinks in — you
 * can see that the whole of the last week of October is a break without reading
 * a single date.
 */
export function MonthGrid({
    month,
    days,
    selected,
    tabbableDate,
    today,
    onPick,
    onKeyDown,
    registerCell,
}: MonthGridProps) {
    if (days.length === 0) return null;

    const [year, monthNo] = month.split('-').map(Number);
    const title = formatMonthYear(monthNo, year);
    const lead = mondayIndex(days[0].calendarDate);
    const teaching = days.filter((d) => d.dayType === 'TEACHING').length;

    return (
        <Card>
            <CardContent className="p-3 sm:p-4">
                <div className="mb-3 flex items-baseline justify-between gap-2">
                    <h2 className="text-sm font-semibold">{title}</h2>
                    <span className="text-xs tabular-nums text-muted-foreground">
                        {teaching} teaching
                    </span>
                </div>
                <div
                    role="group"
                    aria-label={title}
                    /* select-none: shift-click is a range gesture here, and
                       without it the browser also paints a text selection
                       across half the page. */
                    className="grid select-none grid-cols-7 gap-1"
                >
                    {WEEKDAYS.map((w, i) => (
                        <div
                            key={w}
                            aria-hidden="true"
                            className={cn(
                                'pb-1 text-center text-[11px] font-medium text-muted-foreground',
                                i > 4 && 'opacity-60',
                            )}
                        >
                            {w}
                        </div>
                    ))}
                    {Array.from({ length: lead }, (_, i) => (
                        <div key={`lead-${i}`} aria-hidden="true" />
                    ))}
                    {days.map((d) => {
                        const isSelected = selected.has(d.calendarDate);
                        const isToday = d.calendarDate === today;
                        const long = formatDayOfWeek(d.calendarDate);
                        return (
                            <button
                                key={d.id}
                                ref={(el) => {
                                    registerCell(d.calendarDate, el);
                                }}
                                type="button"
                                aria-pressed={isSelected}
                                aria-label={`${long}, ${DAY_TYPE_LABELS[d.dayType]}${
                                    d.note ? `, ${d.note}` : ''
                                }${isToday ? ', today' : ''}`}
                                title={d.note ?? undefined}
                                tabIndex={d.calendarDate === tabbableDate ? 0 : -1}
                                onClick={(e) => onPick(d.calendarDate, e.shiftKey)}
                                onKeyDown={(e) => onKeyDown(e, d.calendarDate)}
                                className={cn(
                                    'relative flex h-10 items-center justify-center rounded-md text-sm tabular-nums transition-colors',
                                    /* Arrowing upwards focuses a cell above the
                                       viewport, and the browser scrolls it flush
                                       to the top of the scrollport — which is
                                       exactly where the sticky term bar is
                                       painted. Without this the focused day, and
                                       its ring, end up behind it. */
                                    'scroll-mt-24',
                                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:ring-offset-background',
                                    DAY_CELL[d.dayType],
                                    isToday && 'font-bold underline underline-offset-4',
                                    isSelected &&
                                        'font-semibold ring-2 ring-primary ring-offset-1 ring-offset-background',
                                )}
                            >
                                {Number(d.calendarDate.slice(8, 10))}
                                {d.note && (
                                    <span
                                        aria-hidden="true"
                                        className="absolute bottom-1 h-1 w-1 rounded-full bg-current opacity-70"
                                    />
                                )}
                            </button>
                        );
                    })}
                </div>
            </CardContent>
        </Card>
    );
}
