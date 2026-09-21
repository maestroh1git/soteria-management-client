'use client';

import { AlertTriangle, CheckCircle2, Info, Pencil } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { useMyCompleteness } from '@/lib/hooks/use-self-service';
import type { CompletenessSeverity } from '@/lib/types/enums';

/**
 * What the employee still owes their own record.
 *
 * The same assessment HR sees, asked for the employee's audience — so the list
 * holds only gaps this person can actually close, and the reasons are about
 * them: "a pension contribution comes out of your pay every month", not "this
 * employee cannot be remitted for".
 *
 * Nothing here is a demand. The fields are optional by design and the employer
 * can still run payroll without them; what this fixes is the person never being
 * told that their own money has nowhere to go.
 */

const SEVERITY: Record<CompletenessSeverity, { label: string; className: string }> = {
    CRITICAL: {
        label: 'Needed before this can be paid',
        className:
            'border-red-200 bg-red-50 text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300',
    },
    IMPORTANT: {
        label: 'Needed for your tax filing',
        className:
            'border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-300',
    },
    ADVISORY: {
        label: 'Worth adding',
        className:
            'border-slate-200 bg-slate-50 text-slate-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300',
    },
};

const ORDER: CompletenessSeverity[] = ['CRITICAL', 'IMPORTANT', 'ADVISORY'];

export function MyCompletenessPanel({ onFillIn }: { onFillIn: () => void }) {
    const { data, isLoading, isError } = useMyCompleteness();

    // A failed check must never read as a complete record.
    if (isLoading || isError || !data) return null;

    if (data.missing.length === 0) {
        return (
            <Card>
                <CardContent className="flex items-center gap-3 py-4">
                    <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                    <div>
                        <p className="text-sm font-medium">Everything we need is on file</p>
                        <p className="text-xs text-muted-foreground">
                            Nothing is outstanding from you.
                        </p>
                    </div>
                </CardContent>
            </Card>
        );
    }

    const worst = data.missing[0].severity;

    return (
        <Card>
            <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-4">
                    <div>
                        <CardTitle className="flex items-center gap-2 text-lg">
                            {worst === 'CRITICAL' ? (
                                <AlertTriangle className="h-5 w-5 text-red-600" />
                            ) : (
                                <Info className="h-5 w-5 text-amber-600" />
                            )}
                            {data.missing.length} thing{data.missing.length === 1 ? '' : 's'} we
                            still need from you
                        </CardTitle>
                        <CardDescription>
                            {data.satisfied} of {data.applicable} on file. Each one takes a
                            moment, and nobody can fill them in for you.
                        </CardDescription>
                    </div>
                    <Button variant="outline" size="sm" onClick={onFillIn}>
                        <Pencil className="mr-2 h-4 w-4" />
                        Fill in
                    </Button>
                </div>
            </CardHeader>

            <CardContent className="space-y-4">
                {ORDER.map((severity) => {
                    const items = data.missing.filter((m) => m.severity === severity);
                    if (items.length === 0) return null;
                    return (
                        <div key={severity} className="space-y-2">
                            <Badge
                                variant="outline"
                                className={`text-[11px] font-medium ${SEVERITY[severity].className}`}
                            >
                                {SEVERITY[severity].label}
                            </Badge>
                            <ul className="space-y-2">
                                {items.map((item) => (
                                    <li key={item.field} className="flex gap-3">
                                        <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-muted-foreground/60" />
                                        <div className="min-w-0">
                                            <p className="text-sm font-medium">{item.label}</p>
                                            <p className="text-xs text-muted-foreground">
                                                {item.why}
                                            </p>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    );
                })}
            </CardContent>
        </Card>
    );
}
