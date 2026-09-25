'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useMyTenant, useUpdateTenant } from '@/lib/hooks/use-tenant';
import { formatMoney } from '@/lib/utils/money';

/**
 * The school's loan policy: four settings, each with the API's default, so
 * every school has limits from its first day. The API validates and applies
 * them; these are the same ranges.
 */
const FIELDS = [
    {
        key: 'loanDeductionCapPercent',
        label: 'Loan repayments may take at most',
        unit: '% of gross pay a month',
        min: 1,
        max: 100,
        fallback: 33,
    },
    {
        key: 'loanMaxTermMonths',
        label: 'A loan can be repaid over at most',
        unit: 'months',
        min: 1,
        max: 120,
        fallback: 12,
    },
    {
        key: 'advanceMaxPercent',
        label: 'A salary advance can be at most',
        unit: '% of a month’s gross pay',
        min: 1,
        max: 100,
        // Unset, it follows the monthly limit, so an advance comes back on
        // the next payday.
        fallback: null,
    },
    {
        key: 'loanMaxMonthsOfPay',
        label: 'A loan can be at most',
        unit: 'months of gross pay',
        min: 1,
        max: 24,
        fallback: 3,
    },
] as const;

type Key = (typeof FIELDS)[number]['key'];
type Policy = Record<Key, number>;

function whole(v: unknown, min: number, max: number): v is number {
    return typeof v === 'number' && Number.isInteger(v) && v >= min && v <= max;
}

/** The school's figures, the defaults where it has none. */
export function loanPolicyOf(settings: Record<string, unknown> | null | undefined): Policy {
    const s = settings ?? {};
    const out = {} as Policy;
    for (const f of FIELDS) {
        const fallback = f.fallback ?? out.loanDeductionCapPercent;
        out[f.key] = whole(s[f.key], f.min, f.max) ? (s[f.key] as number) : fallback;
    }
    return out;
}

export function LoanLimitSetting({ canEdit }: { canEdit: boolean }) {
    const { data: tenant } = useMyTenant();
    const saved = loanPolicyOf(tenant?.settings);
    // Keyed on the saved figures, so the fields start again from them once
    // they load or change.
    return <LoanPolicyForm key={JSON.stringify(saved)} saved={saved} canEdit={canEdit} />;
}

function LoanPolicyForm({ saved, canEdit }: { saved: Policy; canEdit: boolean }) {
    const update = useUpdateTenant();
    const [values, setValues] = useState<Record<Key, string>>(
        () => Object.fromEntries(FIELDS.map((f) => [f.key, String(saved[f.key])])) as Record<Key, string>,
    );
    const valid = (f: (typeof FIELDS)[number]) =>
        /^\d+$/.test(values[f.key]) && whole(Number(values[f.key]), f.min, f.max);
    const allValid = FIELDS.every(valid);
    const changed = FIELDS.some((f) => Number(values[f.key]) !== saved[f.key]);
    const cap = Number(values.loanDeductionCapPercent);

    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-base">Loans and advances</CardTitle>
                <CardDescription>
                    What staff may borrow, and how much of a month’s pay repayments may take.
                    Anything over the monthly limit is carried to the next month, so nobody is
                    left with nothing on payday. Requests over the other limits are refused, with
                    the reason, when they are made.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <form
                    className="space-y-4"
                    onSubmit={(e) => {
                        e.preventDefault();
                        if (!allValid || !changed) return;
                        update.mutate({
                            settings: Object.fromEntries(
                                FIELDS.map((f) => [f.key, Number(values[f.key])]),
                            ),
                        });
                    }}
                >
                    {FIELDS.map((f) => (
                        <div key={f.key} className="space-y-1">
                            <Label htmlFor={`loan-policy-${f.key}`}>{f.label}</Label>
                            <div className="flex items-center gap-2">
                                <Input
                                    id={`loan-policy-${f.key}`}
                                    inputMode="numeric"
                                    className="w-20"
                                    value={values[f.key]}
                                    disabled={!canEdit}
                                    aria-invalid={!valid(f)}
                                    onChange={(e) =>
                                        setValues((v) => ({ ...v, [f.key]: e.target.value.trim() }))
                                    }
                                />
                                <span className="text-sm">{f.unit}</span>
                            </div>
                            {!valid(f) && (
                                <p className="text-xs text-destructive">
                                    A whole number from {f.min} to {f.max}.
                                </p>
                            )}
                        </div>
                    ))}
                    <p className="text-xs text-muted-foreground">
                        {whole(cap, 1, 100)
                            ? `Someone earning ${formatMoney(120000)} would repay at most ${formatMoney(
                                  (120000 * cap) / 100,
                              )} a month.`
                            : null}
                        {cap === 100 && ' 100 lets a loan take as much as the pay allows.'}
                    </p>
                    <Button type="submit" disabled={!canEdit || !allValid || !changed || update.isPending}>
                        Save
                    </Button>
                </form>
            </CardContent>
        </Card>
    );
}
