'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { FormDialog } from '@/components/common/form-dialog';
import { StudentPicker, type PickedStudent } from '@/components/common/student-picker';
import { useSubscribeStudentFee } from '@/lib/hooks/use-fees';
import type { FeeItem } from '@/lib/api/fees';

const schema = z.object({
    student: z
        .object({ id: z.string(), name: z.string(), admissionNumber: z.string() })
        .nullable()
        .refine((s) => !!s, 'Choose the pupil.'),
    feeItemId: z.string().min(1, 'Choose the fee.'),
    amount: z
        .string()
        .trim()
        .refine((v) => v === '' || (Number(v) >= 0 && !Number.isNaN(Number(v))), 'Enter an amount, or leave it empty.'),
    notes: z.string().trim().max(200),
});
type Values = z.input<typeof schema>;

/** Put a pupil on an optional fee: the bus, lunch, a club. */
export function AddToFeeDialog({
    open,
    onOpenChange,
    sessionId,
    fees,
    feeItemId,
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    sessionId?: string;
    /** The optional fees to choose from. */
    fees: FeeItem[];
    /** Pre-chosen when adding from one fee's list. */
    feeItemId?: string;
}) {
    const subscribe = useSubscribeStudentFee();
    const form = useForm<Values>({
        resolver: zodResolver(schema),
        defaultValues: { student: null, feeItemId: '', amount: '', notes: '' },
    });
    useEffect(() => {
        if (open) form.reset({ student: null, feeItemId: feeItemId ?? '', amount: '', notes: '' });
    }, [open, feeItemId, form]);

    return (
        <FormDialog
            open={open}
            onOpenChange={onOpenChange}
            form={form}
            title="Add a pupil to an optional fee"
            description="They are billed for it from the next invoice run."
            submitLabel="Add to fee"
            onSubmit={(v) => {
                if (!sessionId || !v.student) return Promise.resolve();
                return subscribe.mutateAsync({
                    studentId: v.student.id,
                    feeItemId: v.feeItemId,
                    sessionId,
                    amount: v.amount === '' ? undefined : Number(v.amount),
                    notes: v.notes || undefined,
                });
            }}
        >
            <FormField
                control={form.control}
                name="student"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel htmlFor="optional-student">Pupil</FormLabel>
                        <StudentPicker
                            id="optional-student"
                            value={field.value as PickedStudent | null}
                            onChange={field.onChange}
                        />
                        <FormMessage />
                    </FormItem>
                )}
            />
            <FormField
                control={form.control}
                name="feeItemId"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel>Fee</FormLabel>
                        <Select value={field.value} onValueChange={field.onChange}>
                            <FormControl>
                                <SelectTrigger>
                                    <SelectValue placeholder="Choose the fee" />
                                </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                                {fees.map((f) => (
                                    <SelectItem key={f.id} value={f.id}>
                                        {f.name}
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
                name="amount"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel>Their price (optional)</FormLabel>
                        <FormControl>
                            <Input inputMode="decimal" placeholder="The price list’s, unless you enter one" {...field} />
                        </FormControl>
                        <p className="text-xs text-muted-foreground">
                            For fees priced per pupil, like transport by route.
                        </p>
                        <FormMessage />
                    </FormItem>
                )}
            />
            <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel>Note (optional)</FormLabel>
                        <FormControl>
                            <Input placeholder="e.g. Route 3, Lekki" {...field} />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                )}
            />
        </FormDialog>
    );
}
