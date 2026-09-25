'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useMyTenant, useUpdateTenant } from '@/lib/hooks/use-tenant';
import { formatMoney } from '@/lib/utils/money';

/** The API's default when a school has not chosen: a third of gross pay. */
export const DEFAULT_LOAN_LIMIT_PERCENT = 33;

/** The school's limit, or the default. */
export function loanLimitPercent(settings: Record<string, unknown> | null | undefined): number {
    const v = settings?.loanDeductionCapPercent;
    return typeof v === 'number' && Number.isInteger(v) && v >= 1 && v <= 100
        ? v
        : DEFAULT_LOAN_LIMIT_PERCENT;
}

/**
 * The most loans may take from a month's pay. Payroll holds each month to
 * it and carries the rest to the next month, so nobody is paid nothing
 * because of a loan.
 */
export function LoanLimitSetting({ canEdit }: { canEdit: boolean }) {
    const { data: tenant } = useMyTenant();
    const saved = loanLimitPercent(tenant?.settings);
    // Keyed on the saved figure, so the field starts again from it once it
    // loads or changes.
    return <LoanLimitForm key={saved} saved={saved} canEdit={canEdit} />;
}

function LoanLimitForm({ saved, canEdit }: { saved: number; canEdit: boolean }) {
    const update = useUpdateTenant();
    const [value, setValue] = useState(String(saved));

    const n = Number(value);
    const valid = /^\d+$/.test(value) && n >= 1 && n <= 100;

    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-base">Loan deductions</CardTitle>
                <CardDescription>
                    The most staff loans and advances may take from one month’s gross pay.
                    Anything over it is carried to the next month, so nobody is left with
                    nothing on payday.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <form
                    className="flex flex-wrap items-end gap-3"
                    onSubmit={(e) => {
                        e.preventDefault();
                        if (valid && n !== saved) {
                            update.mutate({ settings: { loanDeductionCapPercent: n } });
                        }
                    }}
                >
                    <div className="space-y-1">
                        <Label htmlFor="loan-limit">At most</Label>
                        <div className="flex items-center gap-2">
                            <Input
                                id="loan-limit"
                                inputMode="numeric"
                                className="w-20"
                                value={value}
                                disabled={!canEdit}
                                aria-invalid={!valid}
                                aria-describedby="loan-limit-help"
                                onChange={(e) => setValue(e.target.value.trim())}
                            />
                            <span className="text-sm">% of gross pay a month</span>
                        </div>
                    </div>
                    <Button type="submit" disabled={!canEdit || !valid || n === saved || update.isPending}>
                        Save
                    </Button>
                    <p id="loan-limit-help" className="w-full text-xs text-muted-foreground">
                        {valid
                            ? `Someone earning ${formatMoney(120000)} would repay at most ${formatMoney(
                                  (120000 * n) / 100,
                              )} a month.`
                            : 'A whole number from 1 to 100.'}
                        {valid && n === 100 && ' 100 lets a loan take as much as the pay allows.'}
                    </p>
                </form>
            </CardContent>
        </Card>
    );
}
