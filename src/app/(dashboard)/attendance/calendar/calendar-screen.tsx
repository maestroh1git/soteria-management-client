'use client';

import {
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState,
    useSyncExternalStore,
    type KeyboardEvent,
} from 'react';
import { CalendarPlus, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { EmptyState } from '@/components/common/empty-state';
import type { AcademicTerm } from '@/lib/api/academics';
import {
    useCalendar,
    useGenerateCalendar,
    useSetCalendarDays,
} from '@/lib/hooks/use-attendance';
import { DAY_TYPE_LABELS, type DayType } from '@/lib/api/attendance';
import { shiftDate, toInputDate } from '@/lib/utils/dates';
import { cn } from '@/lib/utils';
import { DAY_CELL, MonthGrid } from './month-grid';

const DAY_TYPES = Object.keys(DAY_TYPE_LABELS) as DayType[];

/** Today, or null on the server. A session does not outlive a date change
 *  often enough to subscribe to one. */
const NEVER_CHANGES = () => () => {};
/* `toInputDate` formats in LOCAL time. `toISOString().slice(0, 10)` is the UTC
   date, which in WAT is yesterday until 01:00 — the underline would sit on the
   wrong day, and on nothing at all for the day that is actually today. A
   calendarDate is the school's local date, so today has to be read the same way. */
const todaySnapshot = () => toInputDate(new Date());

/** Arrow keys move a week or a day, the way a calendar reads. */
const ARROW_STEP: Record<string, number> = {
    ArrowLeft: -1,
    ArrowRight: 1,
    ArrowUp: -7,
    ArrowDown: 7,
};

interface CalendarScreenProps {
    /** The term being edited. Also this component's key — see the note below. */
    activeTerm: string;
    terms: AcademicTerm[];
    onTermChange: (id: string) => void;
}

/**
 * One term's calendar, as months.
 *
 * A term is ninety-odd dates, and a school does not hold its year as a list.
 * Editing is by selection — click a day, shift-click to take the run between —
 * because what gets marked is almost always a stretch of days, and picking them
 * off the calendar cannot swallow a weekend the way typing two dates could.
 *
 * Mounted under the term's own key, so changing term resets the selection by
 * remounting rather than by an effect racing the new term's data.
 */
export function CalendarScreen({
    activeTerm,
    terms,
    onTermChange,
}: CalendarScreenProps) {
    const { data: days = [], isLoading, isError } = useCalendar(activeTerm);
    const generate = useGenerateCalendar();
    const setDays = useSetCalendarDays();

    const [selected, setSelected] = useState<Set<string>>(new Set());
    const [anchor, setAnchor] = useState<string | null>(null);
    const [markAs, setMarkAs] = useState<DayType>('BREAK');
    const [note, setNote] = useState('');
    const [focusDate, setFocusDate] = useState<string | null>(null);

    /*
     * Null on the server, the date on the client. `new Date()` in render can
     * straddle midnight between the two, and a hydration mismatch for the sake
     * of an underline is not a trade worth making — this repo has spent enough
     * on React #418 already.
     */
    const today = useSyncExternalStore(NEVER_CHANGES, todaySnapshot, () => null);

    const cells = useRef(new Map<string, HTMLButtonElement>());
    const registerCell = useCallback((date: string, el: HTMLButtonElement | null) => {
        if (el) cells.current.set(date, el);
        else cells.current.delete(date);
    }, []);

    const order = useMemo(() => days.map((d) => d.calendarDate), [days]);
    const byDate = useMemo(
        () => new Map(days.map((d) => [d.calendarDate, d])),
        [days],
    );

    const months = useMemo(() => {
        const out = new Map<string, typeof days>();
        for (const d of days) {
            const key = d.calendarDate.slice(0, 7);
            const bucket = out.get(key);
            if (bucket) bucket.push(d);
            else out.set(key, [d]);
        }
        return [...out.entries()];
    }, [days]);

    const counts = useMemo(() => {
        const out = {} as Record<DayType, number>;
        for (const d of days) out[d.dayType] = (out[d.dayType] ?? 0) + 1;
        return out;
    }, [days]);

    /** Selected days that already carry a note. Applying without one wipes them. */
    const notesAtRisk = useMemo(
        () => [...selected].filter((date) => byDate.get(date)?.note).length,
        [selected, byDate],
    );

    /*
     * The selection as it stood when the anchor was last set.
     *
     * A shift-click REPLACES the anchor's run rather than adding to it, so
     * overshooting to the 28th and shift-clicking back to the 25th gives you
     * 21–25, not 21–28 with three days you thought you had dropped still ringed
     * and about to be marked. Rebuilding from this base is what makes the range
     * shrink; unioning into the live selection only ever grows it.
     */
    const base = useRef<Set<string>>(new Set());

    const clear = useCallback(() => {
        setSelected(new Set());
        setAnchor(null);
        setNote('');
        base.current = new Set();
    }, []);

    useEffect(() => {
        if (focusDate) cells.current.get(focusDate)?.focus();
    }, [focusDate]);

    const pick = useCallback(
        (date: string, extend: boolean) => {
            const from = extend && anchor ? order.indexOf(anchor) : -1;
            const to = order.indexOf(date);
            if (from >= 0 && to >= 0) {
                const next = new Set(base.current);
                const [lo, hi] = from < to ? [from, to] : [to, from];
                for (let i = lo; i <= hi; i++) next.add(order[i]);
                setSelected(next);
            } else {
                const next = new Set(selected);
                if (next.has(date)) next.delete(date);
                else next.add(date);
                // A plain click is the new anchor, so it is also the new base.
                base.current = next;
                setSelected(next);
            }
            if (!extend) setAnchor(date);
            setFocusDate(date);
        },
        [anchor, order, selected],
    );

    const onCellKeyDown = useCallback(
        (e: KeyboardEvent<HTMLButtonElement>, date: string) => {
            if (e.key === 'Escape') {
                clear();
                return;
            }
            const step = ARROW_STEP[e.key];
            const target =
                step !== undefined
                    ? shiftDate(date, step)
                    : e.key === 'Home'
                      ? order[0]
                      : e.key === 'End'
                        ? order[order.length - 1]
                        : undefined;
            if (target === undefined) return;
            e.preventDefault();
            if (byDate.has(target)) setFocusDate(target);
        },
        [byDate, clear, order],
    );

    const apply = () => {
        if (selected.size === 0) return;
        setDays.mutate(
            {
                termId: activeTerm,
                dates: [...selected],
                dayType: markAs,
                note: note || undefined,
            },
            { onSuccess: clear },
        );
    };

    return (
        <>
            {/*
              * Sticky, and full-bleed through the layout's padding so nothing
              * slides visibly past its edges. The term you are editing and the
              * count you are editing it towards have to stay on screen: on a
              * three-month term the bottom of the calendar is a long way from
              * the top, and losing both was the old page's real failing.
              */}
            <div className="sticky top-0 z-20 -mx-4 space-y-3 border-b bg-slate-50/95 px-4 py-3 backdrop-blur md:-mx-6 md:px-6 dark:bg-slate-950/95">
                <div className="flex flex-wrap items-end gap-3">
                    <div className="space-y-1.5">
                        <Label htmlFor="calendar-term">Term</Label>
                        <Select value={activeTerm} onValueChange={onTermChange}>
                            <SelectTrigger id="calendar-term" className="w-52">
                                <SelectValue placeholder="Choose a term" />
                            </SelectTrigger>
                            <SelectContent>
                                {terms.map((t) => (
                                    <SelectItem key={t.id} value={t.id}>
                                        {t.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <Button
                        onClick={() => activeTerm && generate.mutate(activeTerm)}
                        disabled={generate.isPending || isLoading || isError}
                        variant={days.length ? 'outline' : 'default'}
                        className="h-10"
                    >
                        {generate.isPending ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                            <CalendarPlus className="mr-2 h-4 w-4" />
                        )}
                        {days.length ? 'Fill any missing dates' : 'Generate calendar'}
                    </Button>
                    {/* Right-aligned only while it shares the row. Wrapped onto its
                        own line, ml-auto left it floating against the right margin
                        with everything else ranged left. */}
                    {days.length > 0 && (
                        <p className="w-full text-sm tabular-nums text-muted-foreground sm:ml-auto sm:w-auto sm:pb-2">
                            <span className="font-semibold text-foreground">
                                {counts.TEACHING ?? 0}
                            </span>{' '}
                            teaching days of {days.length} in this term
                        </p>
                    )}
                </div>

            </div>

            {isLoading ? (
                <div className="flex justify-center py-16">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
            ) : isError ? (
                /*
                    Not the same thing as an empty term: "no calendar yet"
                    invites the school to generate one, and generating over a
                    calendar we simply failed to read is not what anyone wants.
                */
                <EmptyState
                    title="We couldn't load this term's calendar"
                    description="Please try again in a moment. If it keeps happening, you may have been signed out."
                />
            ) : days.length === 0 ? (
                <EmptyState
                    title="This term has no calendar yet"
                    description="Generate it from the term dates, then mark the holidays and breaks. No register can be taken until this exists."
                />
            ) : (
                <>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                        {DAY_TYPES.map((t) => (
                            <span
                                key={t}
                                className="flex items-center gap-1.5 text-xs text-muted-foreground"
                            >
                                <span
                                    aria-hidden="true"
                                    className={cn(
                                        'h-3.5 w-3.5 rounded border',
                                        DAY_CELL[t],
                                    )}
                                />
                                {DAY_TYPE_LABELS[t]}
                                <span className="tabular-nums">
                                    ({counts[t] ?? 0})
                                </span>
                            </span>
                        ))}
                    </div>

                    <p className="text-xs text-muted-foreground">
                        Click a day to select it, shift-click to take the run between.
                        Arrow keys move, Enter selects, Escape clears. A dot marks a day
                        that carries a note.
                    </p>

                    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                        {months.map(([month, monthDays]) => (
                            <MonthGrid
                                key={month}
                                month={month}
                                days={monthDays}
                                selected={selected}
                                tabbableDate={focusDate ?? order[0] ?? null}
                                today={today}
                                onPick={pick}
                                onKeyDown={onCellKeyDown}
                                registerCell={registerCell}
                            />
                        ))}
                    </div>

                    {/*
                      * Last in the flow and stuck to the bottom, not folded into
                      * the header. Inside the header its appearance pushed every
                      * day in the calendar down by its own height, so the second
                      * click of a shift-click landed on the wrong date — which is
                      * exactly how it failed the first time it was tried. Down
                      * here it only ever extends the end of the page.
                      */}
                    {selected.size > 0 && (
                        <div className="sticky bottom-0 z-20 -mx-4 border-t bg-slate-50/95 px-4 py-3 backdrop-blur md:-mx-6 md:px-6 dark:bg-slate-950/95">
                            <div className="flex flex-wrap items-center gap-2">
                                <p className="text-sm font-medium tabular-nums">
                                    {selected.size === 1
                                        ? '1 day selected'
                                        : `${selected.size} days selected`}
                                </p>
                                <Label htmlFor="mark-as" className="sr-only">
                                    Mark the selected days as
                                </Label>
                                <Select
                                    value={markAs}
                                    onValueChange={(v) => setMarkAs(v as DayType)}
                                >
                                    <SelectTrigger id="mark-as" className="h-9 w-36">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {DAY_TYPES.map((t) => (
                                            <SelectItem key={t} value={t}>
                                                {DAY_TYPE_LABELS[t]}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <Label htmlFor="mark-note" className="sr-only">
                                    Note for the selected days
                                </Label>
                                <Input
                                    id="mark-note"
                                    value={note}
                                    onChange={(e) => setNote(e.target.value)}
                                    placeholder="Note — mid-term break"
                                    className="h-9 w-48"
                                />
                                <Button
                                    size="sm"
                                    className="h-9"
                                    onClick={apply}
                                    disabled={setDays.isPending}
                                >
                                    {setDays.isPending && (
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    )}
                                    Apply
                                </Button>
                                <Button
                                    size="sm"
                                    variant="ghost"
                                    className="h-9"
                                    onClick={clear}
                                >
                                    Clear
                                </Button>
                            </div>
                            {!note && notesAtRisk > 0 && (
                                <p className="mt-2 text-xs text-amber-700 dark:text-amber-400">
                                    {notesAtRisk === 1
                                        ? 'One of these days has a note. Applying with the note box empty clears it.'
                                        : `${notesAtRisk} of these days have notes. Applying with the note box empty clears them.`}
                                </p>
                            )}
                        </div>
                    )}
                </>
            )}
        </>
    );
}
