'use client';

import Link from 'next/link';
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
import { useEmployeeCompleteness } from '@/lib/hooks/use-employees';
import type { CompletenessSeverity } from '@/lib/types/enums';

/**
 * What this record is still missing, and what each gap costs.
 *
 * Every statutory field on an employee is optional, and deliberately so — a
 * school records a new hire on their first day, long before the TIN and the
 * RSA PIN exist. The risk that creates is that optional quietly becomes
 * forgotten, and nobody finds out until a remittance is due. This panel is the
 * other half of that decision: the fields stay optional, and the record says
 * out loud what is not filled in.
 *
 * It shows the server's own `why` for each gap rather than a generic "this
 * field is empty". A checklist that only names fields gets skimmed; one that
 * says "a pension contribution is being deducted and there is nowhere to remit
 * it" gets acted on.
 */

const SEVERITY: Record<
    CompletenessSeverity,
    { label: string; badge: string; dot: string }
> = {
    CRITICAL: {
        label: 'Blocks payment or remittance',
        badge:
            'border-red-200 bg-red-50 text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300',
        dot: 'bg-red-500',
    },
    IMPORTANT: {
        label: 'Needed for a complete filing',
        badge:
            'border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-300',
        dot: 'bg-amber-500',
    },
    ADVISORY: {
        label: 'Worth having',
        badge:
            'border-slate-200 bg-slate-50 text-slate-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300',
        dot: 'bg-slate-400',
    },
};

const ORDER: CompletenessSeverity[] = ['CRITICAL', 'IMPORTANT', 'ADVISORY'];

export function RecordCompletenessPanel({
    employeeId,
    canEdit,
    enabled = true,
    onOpenBankTab,
}: {
    employeeId: string;
    /** Only offer a way to fix things to the roles that may edit. */
    canEdit: boolean;
    enabled?: boolean;
    /**
     * Bank gaps are not fixed on the employee form — they live on the Bank
     * Details tab. The parent owns the tab state and switches it, rather than
     * this linking somewhere that would land on the wrong tab: a link that
     * takes you to the wrong place is worse than no link.
     */
    onOpenBankTab?: () => void;
}) {
    const { data, isLoading, isError } = useEmployeeCompleteness(
        employeeId,
        enabled,
    );

    // A failed check must never look like a clean record — say nothing rather
    // than imply everything is in order.
    if (isLoading || isError || !data) return null;

    if (data.missing.length === 0) {
        return (
            <Card>
                <CardContent className="flex items-center gap-3 py-4">
                    <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                    <div>
                        <p className="text-sm font-medium">Record complete</p>
                        <p className="text-xs text-muted-foreground">
                            Everything this employee’s payroll and filings need is on file.
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
                            Missing information
                        </CardTitle>
                        <CardDescription>
                            {data.satisfied} of {data.applicable} details on file
                            {!data.readyToPay &&
                                ' — this employee cannot be paid or remitted for as things stand'}
                            .
                        </CardDescription>
                    </div>
                    {canEdit && (
                        <Link href={`/employees/${employeeId}/edit`}>
                            <Button variant="outline" size="sm">
                                <Pencil className="mr-2 h-4 w-4" />
                                Fill in
                            </Button>
                        </Link>
                    )}
                </div>

                {/* Progress, as a plain bar rather than a number alone: "11 of
                    16" is the honest version of a completeness score, and the
                    bar is what makes it readable at a glance. */}
                <div
                    className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-muted"
                    role="progressbar"
                    aria-valuenow={data.score}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-label="Record completeness"
                >
                    <div
                        className={`h-full rounded-full ${
                            worst === 'CRITICAL'
                                ? 'bg-red-500'
                                : worst === 'IMPORTANT'
                                  ? 'bg-amber-500'
                                  : 'bg-slate-400'
                        }`}
                        style={{ width: `${data.score}%` }}
                    />
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
                                className={`text-[11px] font-medium ${SEVERITY[severity].badge}`}
                            >
                                {SEVERITY[severity].label}
                            </Badge>
                            <ul className="space-y-2">
                                {items.map((item) => (
                                    <li key={item.field} className="flex gap-3">
                                        <span
                                            className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${SEVERITY[severity].dot}`}
                                        />
                                        <div className="min-w-0">
                                            <p className="text-sm font-medium">
                                                {!canEdit ? (
                                                    item.label
                                                ) : item.section === 'PAYMENT' ? (
                                                    onOpenBankTab ? (
                                                        <button
                                                            type="button"
                                                            onClick={onOpenBankTab}
                                                            className="hover:underline"
                                                        >
                                                            {item.label}
                                                        </button>
                                                    ) : (
                                                        item.label
                                                    )
                                                ) : (
                                                    <Link
                                                        href={`/employees/${employeeId}/edit`}
                                                        className="hover:underline"
                                                    >
                                                        {item.label}
                                                    </Link>
                                                )}
                                            </p>
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
