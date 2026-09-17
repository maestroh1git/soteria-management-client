'use client';

import { useState } from 'react';
import { Loader2, Phone } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { EmptyState } from '@/components/common/empty-state';
import { useCurrentSession, useTerms } from '@/lib/hooks/use-academics';
import { useAtRisk } from '@/lib/hooks/use-attendance';

/**
 * Pupils whose attendance has fallen.
 *
 * The most operationally valuable screen in the phase: falling attendance
 * precedes a withdrawal by weeks, and a withdrawal precedes unpaid fees. Every
 * row carries the primary guardian's name and number, because the action is
 * always to contact someone and a report that needs a second screen to act on
 * does not get acted on.
 */
export default function AtRiskPage() {
    const { data: session } = useCurrentSession();
    const { data: terms = [] } = useTerms(session?.id);
    const [termId, setTermId] = useState<string | null>(null);
    const [threshold, setThreshold] = useState(85);
    const activeTerm = termId ?? terms.find((t) => t.isCurrent)?.id ?? terms[0]?.id;

    const { data, isLoading, isError } = useAtRisk({ termId: activeTerm, threshold });

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-semibold">Pupils to follow up</h1>
                <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
                    Attendance below your threshold this term, worst first. A child who
                    stops coming usually stops weeks before anyone notices.
                </p>
            </div>

            <div className="flex flex-wrap items-end gap-4">
                <div className="space-y-1.5">
                    <Label htmlFor="risk-term">Term</Label>
                    <Select value={activeTerm} onValueChange={setTermId}>
                        <SelectTrigger id="risk-term" className="w-52">
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
                <div className="space-y-1.5">
                    <Label htmlFor="risk-threshold">Below (%)</Label>
                    <Input
                        id="risk-threshold"
                        type="number"
                        min={1}
                        max={100}
                        value={threshold}
                        onChange={(e) => setThreshold(Number(e.target.value) || 85)}
                        className="w-24"
                    />
                </div>
            </div>

            {isLoading ? (
                <div className="flex justify-center py-16">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
            ) : !data || data.items.length === 0 ? (
                <EmptyState
                    isError={isError}
                    subject="the attendance figures"
                    title="Nobody is below this threshold"
                    description="Every pupil with a register this term is attending above the level you set."
                />
            ) : (
                <>
                    <p className="text-sm text-muted-foreground tabular-nums">
                        {data.total} {data.total === 1 ? 'pupil' : 'pupils'} of{' '}
                        {data.teachingDays} teaching days so far.
                    </p>
                    <div className="overflow-x-auto rounded-lg border">
                        <table className="w-full min-w-[640px] text-sm">
                            <caption className="sr-only">
                                Pupils below {threshold}% attendance this term
                            </caption>
                            <thead>
                                <tr className="border-b bg-muted/50 text-left">
                                    <th scope="col" className="px-4 py-2.5 font-medium">
                                        Pupil
                                    </th>
                                    <th scope="col" className="px-4 py-2.5 font-medium">
                                        Class
                                    </th>
                                    <th scope="col" className="px-4 py-2.5 font-medium">
                                        In school
                                    </th>
                                    <th scope="col" className="px-4 py-2.5 font-medium">
                                        Attendance
                                    </th>
                                    <th scope="col" className="px-4 py-2.5 font-medium">
                                        Who to call
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {data.items.map((p) => (
                                    <tr key={p.studentId} className="border-b last:border-0">
                                        <td className="px-4 py-3">
                                            <span className="font-medium">
                                                {p.lastName}, {p.firstName}
                                            </span>
                                            <span className="block text-xs tabular-nums text-muted-foreground">
                                                {p.admissionNumber}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-muted-foreground">
                                            {p.className}
                                        </td>
                                        <td className="px-4 py-3 tabular-nums">
                                            {p.inSchool} of {p.teachingDays}
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className="rounded bg-red-50 px-2 py-0.5 text-xs font-semibold tabular-nums text-red-700 dark:bg-red-950/50 dark:text-red-300">
                                                {p.attendanceRate}%
                                            </span>
                                        </td>
                                        <td className="px-4 py-3">
                                            {p.guardianPhone ? (
                                                <a
                                                    href={`tel:${p.guardianPhone}`}
                                                    className="inline-flex items-center gap-1.5 hover:underline"
                                                >
                                                    <Phone
                                                        className="h-3.5 w-3.5"
                                                        aria-hidden="true"
                                                    />
                                                    <span>
                                                        {p.guardianName}
                                                        <span className="block text-xs tabular-nums text-muted-foreground">
                                                            {p.guardianPhone}
                                                        </span>
                                                    </span>
                                                </a>
                                            ) : (
                                                <span className="text-xs text-muted-foreground">
                                                    No guardian on file
                                                </span>
                                            )}
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
