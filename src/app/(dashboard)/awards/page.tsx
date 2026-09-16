'use client';

import { useState } from 'react';
import { Award as AwardIcon, EyeOff, Loader2 } from 'lucide-react';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/common/empty-state';
import {
    useCurrentSession,
    useTerms,
    useClassArms,
} from '@/lib/hooks/use-academics';
import { useAwardFeed } from '@/lib/hooks/use-attendance';
import {
    AWARD_CATEGORY_LABELS,
    type AwardCategory,
} from '@/lib/api/attendance';

const CATEGORIES = Object.keys(AWARD_CATEGORY_LABELS) as AwardCategory[];
const ANY = 'any';

const shortDate = (iso: string) =>
    new Date(`${iso}T00:00:00`).toLocaleDateString('en-NG', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
    });

/**
 * Awards across the school.
 *
 * Two jobs: assembling prize-giving, and seeing whether recognition lands evenly
 * — one educator giving most of them, or a whole class getting none.
 *
 * Deliberately a list and not a ranking. The rule that governs badges governs
 * this too: a head seeing distribution is management, a screen ordering children
 * against one another is not, and that line is easy to cross by accident.
 */
export default function AwardsPage() {
    const { data: session } = useCurrentSession();
    const { data: terms = [] } = useTerms(session?.id);
    const { data: arms = [] } = useClassArms();

    const [termId, setTermId] = useState<string>(ANY);
    const [classArmId, setClassArmId] = useState<string>(ANY);
    const [category, setCategory] = useState<string>(ANY);
    const [page, setPage] = useState(1);

    const { data, isLoading } = useAwardFeed({
        termId: termId === ANY ? undefined : termId,
        classArmId: classArmId === ANY ? undefined : classArmId,
        category: category === ANY ? undefined : (category as AwardCategory),
        page,
    });

    const reset = (fn: (v: string) => void) => (v: string) => {
        fn(v);
        setPage(1);
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-semibold">Awards</h1>
                <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
                    Everything the school has recognised. Useful for putting a
                    prize-giving together, and for noticing when recognition is
                    landing in one class and not another.
                </p>
            </div>

            <div className="flex flex-wrap items-end gap-4">
                <div className="space-y-1.5">
                    <Label htmlFor="awards-term">Term</Label>
                    <Select value={termId} onValueChange={reset(setTermId)}>
                        <SelectTrigger id="awards-term" className="w-44">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value={ANY}>Any term</SelectItem>
                            {terms.map((t) => (
                                <SelectItem key={t.id} value={t.id}>
                                    {t.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                <div className="space-y-1.5">
                    <Label htmlFor="awards-class">Class</Label>
                    <Select value={classArmId} onValueChange={reset(setClassArmId)}>
                        <SelectTrigger id="awards-class" className="w-44">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value={ANY}>Any class</SelectItem>
                            {arms.map((a) => (
                                <SelectItem key={a.id} value={a.id}>
                                    {`${a.level?.name ?? ''} ${a.name}`.trim()}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                <div className="space-y-1.5">
                    <Label htmlFor="awards-category">Kind</Label>
                    <Select value={category} onValueChange={reset(setCategory)}>
                        <SelectTrigger id="awards-category" className="w-44">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value={ANY}>Any kind</SelectItem>
                            {CATEGORIES.map((c) => (
                                <SelectItem key={c} value={c}>
                                    {AWARD_CATEGORY_LABELS[c]}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {isLoading ? (
                <div className="flex justify-center py-16">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
            ) : !data || data.items.length === 0 ? (
                <EmptyState
                    title="Nothing recorded yet"
                    description="Awards recorded from a class roster or a pupil's page appear here."
                />
            ) : (
                <>
                    <p className="text-sm tabular-nums text-muted-foreground">
                        {data.total} {data.total === 1 ? 'award' : 'awards'}.
                    </p>
                    <div className="overflow-x-auto rounded-lg border">
                        <table className="w-full min-w-[720px] text-sm">
                            <caption className="sr-only">
                                Awards recorded across the school
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
                                        Award
                                    </th>
                                    <th scope="col" className="px-4 py-2.5 font-medium">
                                        Given
                                    </th>
                                    <th scope="col" className="px-4 py-2.5 font-medium">
                                        By
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {data.items.map((a) => (
                                    <tr key={a.id} className="border-b last:border-0">
                                        <td className="px-4 py-3">
                                            <span className="font-medium">
                                                {a.pupilName}
                                            </span>
                                            <span className="block text-xs tabular-nums text-muted-foreground">
                                                {a.admissionNumber}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-muted-foreground">
                                            {a.className ?? '—'}
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className="flex items-center gap-1.5">
                                                <AwardIcon
                                                    className="h-3.5 w-3.5 flex-none text-amber-600 dark:text-amber-400"
                                                    aria-hidden="true"
                                                />
                                                {a.title}
                                                {!a.visibleToParent && (
                                                    <EyeOff
                                                        className="h-3 w-3 text-muted-foreground"
                                                        aria-label="Not shown to parents"
                                                    />
                                                )}
                                            </span>
                                            <span className="block text-xs text-muted-foreground">
                                                {AWARD_CATEGORY_LABELS[a.category] ??
                                                    a.category}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 tabular-nums text-muted-foreground">
                                            {shortDate(a.awardedOn)}
                                        </td>
                                        <td className="px-4 py-3 text-muted-foreground">
                                            {a.awardedByName ?? '—'}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {data.totalPages > 1 && (
                        <div className="flex items-center justify-between gap-3">
                            <p className="text-sm tabular-nums text-muted-foreground">
                                Page {data.page} of {data.totalPages}
                            </p>
                            <div className="flex gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    disabled={data.page <= 1}
                                    onClick={() => setPage((p) => p - 1)}
                                >
                                    Previous
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    disabled={data.page >= data.totalPages}
                                    onClick={() => setPage((p) => p + 1)}
                                >
                                    Next
                                </Button>
                            </div>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
