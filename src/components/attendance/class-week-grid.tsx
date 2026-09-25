'use client';

import { useState } from 'react';
import { ChevronLeft, ChevronRight, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LoadingSkeleton } from '@/components/common/loading-skeleton';
import { EmptyState } from '@/components/common/empty-state';
import { StudentLink } from '@/components/common/entity-link';
import { cn } from '@/lib/utils';
import { useClassWeek, useDownloadAttendance } from '@/lib/hooks/use-attendance';
import { formatDate, formatDayOfWeek, shiftDate, todayIso } from '@/lib/utils/dates';
import { DAY_TYPE_LABELS, type DayType } from '@/lib/api/attendance';
import { ATTENDANCE_LOOK } from './term-strip';

/**
 * One class, one week: a row per pupil, a column per day, each cell the mark
 * that stands (ROADMAP-EXECUTION.md, 5.4). The pattern a single register
 * cannot show: the child who is late every Monday. Each cell carries its
 * letter as well as its colour, like the term strip.
 *
 * `canExport`: the office, or this class's own educator; the API decides.
 */
export function ClassWeekGrid({
    armId,
    className,
    canExport,
}: {
    armId: string;
    className: string;
    canExport: boolean;
}) {
    const [date, setDate] = useState(todayIso());
    const { data, isLoading, isError } = useClassWeek(armId, date);
    const download = useDownloadAttendance();
    const thisWeek = data && todayIso() >= data.from && todayIso() <= data.to;

    return (
        <Card>
            <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-2 space-y-0">
                <div>
                    <CardTitle className="text-lg">The week</CardTitle>
                    <CardDescription>
                        {data ? `${formatDate(data.from)} to ${formatDate(data.to)}` : 'Each pupil, each day.'}
                    </CardDescription>
                </div>
                <div className="flex flex-wrap items-center gap-1">
                    <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8"
                        aria-label="Previous week"
                        onClick={() => setDate(shiftDate(data?.from ?? date, -7))}
                    >
                        <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        disabled={!!thisWeek}
                        onClick={() => setDate(todayIso())}
                    >
                        This week
                    </Button>
                    <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8"
                        aria-label="Next week"
                        disabled={!!thisWeek}
                        onClick={() => setDate(shiftDate(data?.from ?? date, 7))}
                    >
                        <ChevronRight className="h-4 w-4" />
                    </Button>
                    {canExport && data && (
                        <Button
                            variant="outline"
                            size="sm"
                            disabled={download.isPending}
                            onClick={() =>
                                download.mutate({ from: data.from, to: data.to, classArmId: armId, label: className })
                            }
                        >
                            <Download className="mr-2 h-4 w-4" /> CSV
                        </Button>
                    )}
                </div>
            </CardHeader>
            <CardContent>
                {isLoading ? (
                    <LoadingSkeleton rows={4} />
                ) : !data || data.pupils.length === 0 ? (
                    <EmptyState
                        isError={isError}
                        subject="this week’s register"
                        title="No pupils in this class"
                    />
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <caption className="sr-only">
                                {className}: each pupil’s mark, {formatDate(data.from)} to {formatDate(data.to)}
                            </caption>
                            <thead>
                                <tr className="border-b">
                                    <th scope="col" className="py-2 pr-3 text-left font-medium">
                                        Pupil
                                    </th>
                                    {data.days.map((d) => (
                                        <th key={d.date} scope="col" className="px-1 py-2 text-center font-medium">
                                            <span className="block">{formatDayOfWeek(d.date).slice(0, 3)}</span>
                                            <span className="block text-xs font-normal text-muted-foreground">
                                                {d.date.slice(8, 10)}
                                            </span>
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {data.pupils.map((p) => (
                                    <tr key={p.studentId} className="border-b last:border-0">
                                        <th scope="row" className="py-1.5 pr-3 text-left font-normal">
                                            <StudentLink id={p.studentId} name={`${p.lastName}, ${p.firstName}`} />
                                        </th>
                                        {data.days.map((d) => {
                                            const closed = d.dayType && d.dayType !== 'TEACHING';
                                            const status = p.marks[d.date];
                                            const future = d.date > todayIso();
                                            const look = ATTENDANCE_LOOK[status ?? 'UNMARKED'];
                                            const label = closed
                                                ? (DAY_TYPE_LABELS[d.dayType as DayType] ?? 'No school')
                                                : future
                                                  ? 'Not yet'
                                                  : look.label;
                                            return (
                                                <td key={d.date} className="px-1 py-1.5 text-center">
                                                    <span
                                                        className={cn(
                                                            'mx-auto grid h-7 w-7 place-items-center rounded-md text-[11px] font-bold',
                                                            closed || future ? 'text-muted-foreground/60' : look.className,
                                                        )}
                                                        title={`${formatDate(d.date)}: ${label}`}
                                                    >
                                                        <span aria-hidden="true">
                                                            {closed ? '—' : future ? '' : look.letter}
                                                        </span>
                                                        <span className="sr-only">{label}</span>
                                                    </span>
                                                </td>
                                            );
                                        })}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
