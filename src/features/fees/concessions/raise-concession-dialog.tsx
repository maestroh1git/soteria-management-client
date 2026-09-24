'use client';

import { useEffect } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
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
import { StudentPicker, type PickedStudent } from '@/components/common/student-picker';
import { useFeeItems, useCreateConcession } from '@/lib/hooks/use-fees';
import { useTerms } from '@/lib/hooks/use-academics';

const ALL = '__all__';

const schema = z
    .object({
        student: z
            .object({ id: z.string(), name: z.string(), admissionNumber: z.string() })
            .nullable()
            .refine((s) => !!s, 'Choose the pupil.'),
        feeItemId: z.string(),
        termId: z.string(),
        kind: z.enum(['PERCENTAGE', 'FIXED']),
        value: z.coerce.number().positive('Enter an amount above zero.'),
        reason: z.string().trim().min(3, 'Say why: the approver reads this.'),
    })
    .refine((v) => v.kind !== 'PERCENTAGE' || v.value <= 100, {
        path: ['value'],
        message: 'A percentage cannot be more than 100.',
    });
type Values = z.input<typeof schema>;

/**
 * Ask for a discount for one pupil. It does nothing until somebody else
 * approves it (decision D3); until then the bill shows it as waiting.
 */
export function RaiseConcessionDialog({
    open,
    onOpenChange,
    sessionId,
    student,
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    sessionId?: string;
    /** Pre-chosen, e.g. from a sibling suggestion. */
    student?: PickedStudent | null;
}) {
    const create = useCreateConcession();
    const { data: items = [] } = useFeeItems(false, open);
    const { data: terms = [] } = useTerms(sessionId);
    const form = useForm<Values>({
        resolver: zodResolver(schema),
        defaultValues: {
            student: null,
            feeItemId: ALL,
            termId: ALL,
            kind: 'PERCENTAGE',
            value: '',
            reason: '',
        },
    });
    useEffect(() => {
        if (open)
            form.reset({
                student: student ?? null,
                feeItemId: ALL,
                termId: ALL,
                kind: 'PERCENTAGE',
                value: '',
                reason: '',
            });
    }, [open, student, form]);
    const kind = useWatch({ control: form.control, name: 'kind' });

    return (
        <FormDialog
            open={open}
            onOpenChange={onOpenChange}
            form={form}
            title="Raise a concession"
            description="A discount on one pupil’s fees. Somebody else must approve it before it reaches the bill."
            submitLabel="Raise concession"
            onSubmit={(values) => {
                const v = schema.parse(values);
                if (!sessionId || !v.student) return Promise.resolve();
                return create.mutateAsync({
                    studentId: v.student.id,
                    sessionId,
                    feeItemId: v.feeItemId === ALL ? undefined : v.feeItemId,
                    termId: v.termId === ALL ? undefined : v.termId,
                    kind: v.kind,
                    value: v.value,
                    reason: v.reason,
                });
            }}
        >
            <FormField
                control={form.control}
                name="student"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel htmlFor="concession-student">Pupil</FormLabel>
                        <StudentPicker
                            id="concession-student"
                            value={field.value as PickedStudent | null}
                            onChange={field.onChange}
                        />
                        <FormMessage />
                    </FormItem>
                )}
            />
            <div className="grid gap-4 sm:grid-cols-2">
                <FormField
                    control={form.control}
                    name="feeItemId"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>On</FormLabel>
                            <Select value={field.value} onValueChange={field.onChange}>
                                <FormControl>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    <SelectItem value={ALL}>The whole bill</SelectItem>
                                    {items.map((i) => (
                                        <SelectItem key={i.id} value={i.id}>
                                            {i.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="termId"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>For</FormLabel>
                            <Select value={field.value} onValueChange={field.onChange}>
                                <FormControl>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    <SelectItem value={ALL}>Every term this session</SelectItem>
                                    {terms.map((t) => (
                                        <SelectItem key={t.id} value={t.id}>
                                            {t.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="kind"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Discount</FormLabel>
                            <Select value={field.value} onValueChange={field.onChange}>
                                <FormControl>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    <SelectItem value="PERCENTAGE">A percentage</SelectItem>
                                    <SelectItem value="FIXED">A fixed amount</SelectItem>
                                </SelectContent>
                            </Select>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="value"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>{kind === 'PERCENTAGE' ? 'Percent off' : 'Amount off'}</FormLabel>
                            <FormControl>
                                <Input
                                    inputMode="decimal"
                                    {...field}
                                    value={field.value as string | number}
                                    placeholder={kind === 'PERCENTAGE' ? 'e.g. 10' : 'e.g. 25000'}
                                />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
            </div>
            <FormField
                control={form.control}
                name="reason"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel>Reason</FormLabel>
                        <FormControl>
                            <Textarea rows={2} placeholder="e.g. Staff child; third sibling; hardship" {...field} />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                )}
            />
        </FormDialog>
    );
}
