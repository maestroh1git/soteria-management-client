'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useUpdateTenant } from '@/lib/hooks/use-tenant';
import { useLearnerTerm } from '@/lib/hooks/use-learner-term';
import type { LearnerTerm } from '@/lib/copy/glossary';

/**
 * Pupils or students (decision D7). The sidebar and the school screens use
 * the word chosen here; the records, reports and API keep "student".
 */
export function LearnerTermSetting({ canEdit }: { canEdit: boolean }) {
    const { term } = useLearnerTerm();
    const update = useUpdateTenant();
    const choose = (next: LearnerTerm) =>
        next !== term && update.mutate({ settings: { learnerTerm: next } });

    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-base">Your school calls them</CardTitle>
                <CardDescription>
                    Primary schools usually say pupils, secondary schools students. The
                    sidebar and the class screens use the word you choose.
                </CardDescription>
            </CardHeader>
            <CardContent className="flex gap-2" role="radiogroup" aria-label="Learners are called">
                {(['pupil', 'student'] as const).map((t) => (
                    <Button
                        key={t}
                        type="button"
                        role="radio"
                        aria-checked={term === t}
                        variant={term === t ? 'default' : 'outline'}
                        disabled={!canEdit || update.isPending}
                        onClick={() => choose(t)}
                    >
                        {t === 'pupil' ? 'Pupils' : 'Students'}
                    </Button>
                ))}
            </CardContent>
        </Card>
    );
}
