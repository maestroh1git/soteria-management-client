'use client';

import { useEffect } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { FormDialog } from '@/components/common/form-dialog';
import { useRequestMyLoan } from '@/lib/hooks/use-self-service';

const schema = z
    .object({
        kind: z.enum(['LOAN', 'ADVANCE']),
        amount: z.coerce.number().positive('Enter an amount above zero.'),
        termMonths: z.coerce.number().int().optional(),
        reason: z.string().trim().min(3, 'Say what it is for: the approver reads this.'),
    })
    .refine((v) => v.kind === 'ADVANCE' || (v.termMonths !== undefined && v.termMonths >= 1 && v.termMonths <= 36), {
        path: ['termMonths'],
        message: 'Repay over 1 to 36 months.',
    });
type Values = z.input<typeof schema>;

const EMPTY: Values = { kind: 'ADVANCE', amount: '', termMonths: 6, reason: '' };

/**
 * Ask for a loan or a salary advance (ROADMAP-EXECUTION.md, 5.6). It is raised
 * interest-free and waits for an approver, who is never the borrower; the
 * payroll office sets up repayment once it is approved.
 */
export function RequestLoanDialog({
    open,
    onOpenChange,
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}) {
    const request = useRequestMyLoan();
    const form = useForm<Values>({ resolver: zodResolver(schema), defaultValues: EMPTY });
    useEffect(() => {
        if (open) form.reset(EMPTY);
    }, [open, form]);
    const kind = useWatch({ control: form.control, name: 'kind' });

    return (
        <FormDialog
            open={open}
            onOpenChange={onOpenChange}
            form={form}
            title="Ask for a loan or advance"
            description="An approver decides it. Once approved, repayments come out of your pay."
            submitLabel="Send request"
            onSubmit={(values) => {
                const v = schema.parse(values);
                return request.mutateAsync({
                    kind: v.kind,
                    amount: v.amount,
                    termMonths: v.kind === 'LOAN' ? v.termMonths : undefined,
                    reason: v.reason,
                });
            }}
        >
            <div className="grid gap-4 sm:grid-cols-2">
                <FormField
                    control={form.control}
                    name="kind"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>What</FormLabel>
                            <Select value={field.value} onValueChange={field.onChange}>
                                <FormControl>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    <SelectItem value="ADVANCE">A salary advance</SelectItem>
                                    <SelectItem value="LOAN">A loan</SelectItem>
                                </SelectContent>
                            </Select>
                            <FormDescription>
                                {kind === 'ADVANCE'
                                    ? 'Paid back in full from your next salary.'
                                    : 'Paid back in equal monthly amounts.'}
                            </FormDescription>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="amount"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Amount</FormLabel>
                            <FormControl>
                                <Input
                                    type="number"
                                    inputMode="decimal"
                                    min={1}
                                    {...field}
                                    value={(field.value as string | number | undefined) ?? ''}
                                />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                {kind === 'LOAN' && (
                    <FormField
                        control={form.control}
                        name="termMonths"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Months to repay over</FormLabel>
                                <FormControl>
                                    <Input
                                        type="number"
                                        inputMode="numeric"
                                        min={1}
                                        max={36}
                                        {...field}
                                        value={(field.value as string | number | undefined) ?? ''}
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                )}
            </div>
            <FormField
                control={form.control}
                name="reason"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel>What it is for</FormLabel>
                        <FormControl>
                            <Textarea rows={3} {...field} />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                )}
            />
        </FormDialog>
    );
}
