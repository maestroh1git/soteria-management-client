'use client';

import { CheckCircle2, AlertTriangle, Loader2 } from 'lucide-react';

import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { usePayrollCheck } from '@/lib/hooks/use-finance';

const money = (v: string) => {
    const [whole, fraction = '00'] = v.split('.');
    const sign = whole.startsWith('-') ? '-' : '';
    return `${sign}${whole.replace('-', '').replace(/\B(?=(\d{3})+(?!\d))/g, ',')}.${fraction}`;
};

/**
 * Payroll's numbers against the ledger's.
 *
 * Lives on the pay period screen rather than in the finance section, because
 * this is where a disagreement would actually be noticed — the person closing a
 * run is the one who can still explain it. Tucked into a finance report nobody
 * opens, it would answer the question after everyone had stopped asking.
 *
 * Gross is the comparison, not net: the cost to the school is what it agreed to
 * pay, and the deductions are liabilities owed onward rather than money kept.
 */
export function PayrollLedgerCheck({ payPeriodId }: { payPeriodId: string }) {
    const { data, isLoading, isError } = usePayrollCheck(payPeriodId);

    // Quiet on failure. This is a cross-check beside the real work, and an
    // error card here would read as something being wrong with the payroll.
    if (isError) return null;

    if (isLoading) {
        return (
            <Card>
                <CardContent className="flex items-center gap-2 pt-6 text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" /> Checking the books…
                </CardContent>
            </Card>
        );
    }
    if (!data) return null;

    // Nothing approved yet is not a disagreement — there is simply nothing to
    // compare, and "does not agree" would be alarming and wrong.
    const nothingYet = Number(data.payrollGross) === 0 && data.entries === 0;
    if (nothingYet) return null;

    return (
        <Card
            className={
                data.agrees
                    ? 'border-green-200 dark:border-green-900/50'
                    : 'border-destructive'
            }
        >
            <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                    {data.agrees ? (
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                    ) : (
                        <AlertTriangle className="h-4 w-4 text-destructive" />
                    )}
                    {data.agrees
                        ? 'Payroll and the books agree'
                        : 'Payroll and the books disagree'}
                </CardTitle>
                <CardDescription>{data.note}</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-3">
                <Figure label="Payroll cost (gross)" value={money(data.payrollGross)} />
                <Figure label="Posted to the ledger" value={money(data.postedDebits)} />
                <Figure
                    label="Difference"
                    value={money(data.difference)}
                    tone={data.agrees ? undefined : 'text-destructive'}
                />
            </CardContent>
        </Card>
    );
}

function Figure({
    label,
    value,
    tone,
}: {
    label: string;
    value: string;
    tone?: string;
}) {
    return (
        <div>
            <p className="text-xs uppercase tracking-wide text-muted-foreground">
                {label}
            </p>
            <p className={`text-lg font-semibold tabular-nums ${tone ?? ''}`}>
                ₦{value}
            </p>
        </div>
    );
}
