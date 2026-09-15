'use client';

import { useMemo, useState } from 'react';
import { CalendarPlus, Loader2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
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
import { useCurrentSession, useTerms } from '@/lib/hooks/use-academics';
import {
    useCalendar,
    useGenerateCalendar,
    useSetCalendarRange,
    useUpdateSchoolDay,
} from '@/lib/hooks/use-attendance';
import { DAY_TYPE_LABELS, type DayType } from '@/lib/api/attendance';
import { cn } from '@/lib/utils';

const DAY_TYPES = Object.keys(DAY_TYPE_LABELS) as DayType[];

const SWATCH: Record<DayType, string> = {
    TEACHING:
        'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300',
    HOLIDAY: 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300',
    BREAK: 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300',
    EXAM: 'bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300',
    CLOSURE: 'bg-red-100 text-red-800 dark:bg-red-950/60 dark:text-red-300',
    WEEKEND: 'bg-muted text-muted-foreground',
};

/**
 * The school calendar.
 *
 * Every attendance figure the school quotes has teaching days as its
 * denominator, so this page decides all of them. Generation seeds a term from
 * its own dates and never overwrites an edit — a school that has already marked
 * its mid-term break must be able to re-run it after extending a term.
 */
export default function CalendarPage() {
    const { data: session } = useCurrentSession();
    const { data: terms = [] } = useTerms(session?.id);
    const [termId, setTermId] = useState<string | null>(null);
    const activeTerm = termId ?? terms.find((t) => t.isCurrent)?.id ?? terms[0]?.id;

    const { data: days = [], isLoading } = useCalendar(activeTerm);
    const generate = useGenerateCalendar();
    const setRange = useSetCalendarRange();
    const updateDay = useUpdateSchoolDay();

    const [from, setFrom] = useState('');
    const [to, setTo] = useState('');
    const [rangeType, setRangeType] = useState<DayType>('BREAK');
    const [note, setNote] = useState('');

    const teaching = useMemo(
        () => days.filter((d) => d.dayType === 'TEACHING').length,
        [days],
    );

    if (terms.length === 0) {
        return (
            <EmptyState
                title="No terms yet"
                description="Create an academic session and its terms before generating a calendar."
            />
        );
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-semibold">School calendar</h1>
                <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
                    Which dates are teaching days. Every attendance figure is counted
                    against these, so a day marked here as a holiday or a closure never
                    counts against a pupil.
                </p>
            </div>

            <div className="flex flex-wrap items-end gap-4">
                <div className="space-y-1.5">
                    <Label htmlFor="calendar-term">Term</Label>
                    <Select value={activeTerm} onValueChange={setTermId}>
                        <SelectTrigger id="calendar-term" className="w-56">
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
                    disabled={!activeTerm || generate.isPending}
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
            </div>

            {isLoading ? (
                <div className="flex justify-center py-16">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
            ) : days.length === 0 ? (
                <EmptyState
                    title="This term has no calendar yet"
                    description="Generate it from the term dates, then mark the holidays and breaks. No register can be taken until this exists."
                />
            ) : (
                <>
                    <Card>
                        <CardContent className="py-4">
                            <p className="text-sm tabular-nums">
                                <span className="font-semibold">{teaching}</span> teaching
                                days of <span className="font-semibold">{days.length}</span>{' '}
                                in this term.
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="space-y-4 py-5">
                            <h2 className="text-sm font-semibold">
                                Set a run of dates — a break is a week, not seven edits
                            </h2>
                            <div className="flex flex-wrap items-end gap-3">
                                <div className="space-y-1.5">
                                    <Label htmlFor="range-from">From</Label>
                                    <Input
                                        id="range-from"
                                        type="date"
                                        value={from}
                                        onChange={(e) => setFrom(e.target.value)}
                                        className="w-40"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <Label htmlFor="range-to">To</Label>
                                    <Input
                                        id="range-to"
                                        type="date"
                                        value={to}
                                        onChange={(e) => setTo(e.target.value)}
                                        className="w-40"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <Label htmlFor="range-type">Mark as</Label>
                                    <Select
                                        value={rangeType}
                                        onValueChange={(v) => setRangeType(v as DayType)}
                                    >
                                        <SelectTrigger id="range-type" className="w-40">
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
                                </div>
                                <div className="space-y-1.5">
                                    <Label htmlFor="range-note">Note</Label>
                                    <Input
                                        id="range-note"
                                        value={note}
                                        onChange={(e) => setNote(e.target.value)}
                                        placeholder="Mid-term break"
                                        className="w-52"
                                    />
                                </div>
                                <Button
                                    className="h-10"
                                    disabled={!from || !to || !activeTerm || setRange.isPending}
                                    onClick={() =>
                                        activeTerm &&
                                        setRange.mutate({
                                            termId: activeTerm,
                                            from,
                                            to,
                                            dayType: rangeType,
                                            note: note || undefined,
                                        })
                                    }
                                >
                                    Apply
                                </Button>
                            </div>
                        </CardContent>
                    </Card>

                    <div className="overflow-x-auto rounded-lg border">
                        <table className="w-full min-w-[520px] text-sm">
                            <caption className="sr-only">
                                Every date in this term and what kind of day it is
                            </caption>
                            <thead>
                                <tr className="border-b bg-muted/50 text-left">
                                    <th scope="col" className="px-4 py-2.5 font-medium">
                                        Date
                                    </th>
                                    <th scope="col" className="px-4 py-2.5 font-medium">
                                        Kind
                                    </th>
                                    <th scope="col" className="px-4 py-2.5 font-medium">
                                        Note
                                    </th>
                                    <th scope="col" className="px-4 py-2.5 font-medium">
                                        Change
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {days.map((d) => (
                                    <tr key={d.id} className="border-b last:border-0">
                                        <td className="px-4 py-2 tabular-nums">
                                            {new Date(
                                                `${d.calendarDate}T00:00:00`,
                                            ).toLocaleDateString('en-NG', {
                                                weekday: 'short',
                                                day: 'numeric',
                                                month: 'short',
                                            })}
                                        </td>
                                        <td className="px-4 py-2">
                                            <span
                                                className={cn(
                                                    'rounded px-2 py-0.5 text-xs font-semibold',
                                                    SWATCH[d.dayType],
                                                )}
                                            >
                                                {DAY_TYPE_LABELS[d.dayType]}
                                            </span>
                                        </td>
                                        <td className="px-4 py-2 text-muted-foreground">
                                            {d.note ?? '—'}
                                        </td>
                                        <td className="px-4 py-2">
                                            <Label
                                                htmlFor={`day-${d.id}`}
                                                className="sr-only"
                                            >
                                                Change {d.calendarDate}
                                            </Label>
                                            <Select
                                                value={d.dayType}
                                                onValueChange={(v) =>
                                                    updateDay.mutate({
                                                        id: d.id,
                                                        dayType: v as DayType,
                                                        note: d.note ?? undefined,
                                                    })
                                                }
                                            >
                                                <SelectTrigger
                                                    id={`day-${d.id}`}
                                                    className="h-8 w-36"
                                                >
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
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </>
            )}
        </div>
    );
}
