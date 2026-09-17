'use client';

import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { EmptyState } from '@/components/common/empty-state';
import { useCurrentSession, useTerms } from '@/lib/hooks/use-academics';
import { CalendarScreen } from './calendar-screen';

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
    const {
        data: terms = [],
        isLoading,
        isError,
    } = useTerms(session?.id);
    const [termId, setTermId] = useState<string | null>(null);
    const activeTerm = termId ?? terms.find((t) => t.isCurrent)?.id ?? terms[0]?.id;

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

            {isLoading ? (
                <div className="flex justify-center py-16">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
            ) : isError ? (
                /*
                    "No terms yet" on a failed request is a lie: it tells a
                    school it has no academic year when we simply could not ask.
                    The same conflation shipped on both award surfaces.
                */
                <EmptyState
                    title="We couldn't load this school's terms"
                    description="Please try again in a moment. If it keeps happening, you may have been signed out."
                />
            ) : terms.length === 0 ? (
                <EmptyState
                    title="No terms yet"
                    description="Create an academic session and its terms before generating a calendar."
                />
            ) : activeTerm ? (
                <CalendarScreen
                    key={activeTerm}
                    activeTerm={activeTerm}
                    terms={terms}
                    onTermChange={setTermId}
                />
            ) : null}
        </div>
    );
}
