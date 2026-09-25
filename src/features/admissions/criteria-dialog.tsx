'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { FormDialog } from '@/components/common/form-dialog';
import { useSetCriteria } from '@/lib/hooks/use-admissions';
import type { AdmissionCriteria } from '@/lib/api/admissions';

/** Empty means "no limit"; otherwise a number of years, in halves. */
const years = z
    .string()
    .trim()
    .refine((v) => v === '' || (!Number.isNaN(Number(v)) && Number(v) >= 0 && Number(v) <= 25), 'Enter an age in years, or leave it empty.');

const schema = z
    .object({
        minYears: years,
        maxYears: years,
        minExamScore: z
            .string()
            .trim()
            .refine((v) => v === '' || (!Number.isNaN(Number(v)) && Number(v) >= 0 && Number(v) <= 100), 'A score from 0 to 100, or leave it empty.'),
        requiresInterview: z.boolean(),
        notes: z.string().max(2000).optional(),
    })
    .refine((v) => v.minYears === '' || v.maxYears === '' || Number(v.maxYears) >= Number(v.minYears), {
        path: ['maxYears'],
        message: 'The oldest cannot be younger than the youngest.',
    });
type Values = z.infer<typeof schema>;

const toYears = (months: number | null) => (months == null ? '' : String(Math.round((months / 12) * 10) / 10));
const toMonths = (years: string) => (years === '' ? undefined : Math.round(Number(years) * 12));

/**
 * The standard for one class level in one session (ROADMAP-EXECUTION.md,
 * 5.10). Advisory: a candidate who falls short is flagged on their
 * application, never refused.
 */
export function CriteriaDialog({
    open,
    onOpenChange,
    sessionId,
    level,
    current,
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    sessionId: string;
    level: { id: string; name: string } | null;
    current?: AdmissionCriteria;
}) {
    const save = useSetCriteria();
    const form = useForm<Values>({ resolver: zodResolver(schema) });
    useEffect(() => {
        if (open)
            form.reset({
                minYears: toYears(current?.minAgeMonths ?? null),
                maxYears: toYears(current?.maxAgeMonths ?? null),
                minExamScore: current?.minExamScore ? String(Number(current.minExamScore)) : '',
                requiresInterview: current?.requiresInterview ?? false,
                notes: current?.notes ?? '',
            });
    }, [open, current, form]);

    return (
        <FormDialog
            open={open}
            onOpenChange={onOpenChange}
            form={form}
            title={level ? `What ${level.name} asks for` : 'Criteria'}
            description="Applications that fall short are flagged for the office to weigh, never refused. Leave a box empty for no limit."
            submitLabel="Save criteria"
            onSubmit={(v) =>
                save.mutateAsync({
                    sessionId,
                    classLevelId: level!.id,
                    minAgeMonths: toMonths(v.minYears),
                    maxAgeMonths: toMonths(v.maxYears),
                    minExamScore: v.minExamScore === '' ? undefined : Number(v.minExamScore),
                    requiresInterview: v.requiresInterview,
                    notes: v.notes?.trim() || undefined,
                })
            }
        >
            <div className="grid gap-4 sm:grid-cols-2">
                <FormField
                    control={form.control}
                    name="minYears"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Youngest (years)</FormLabel>
                            <FormControl>
                                <Input type="number" inputMode="decimal" step={0.5} min={0} placeholder="No limit" {...field} />
                            </FormControl>
                            <FormDescription>Age when the session starts.</FormDescription>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="maxYears"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Oldest (years)</FormLabel>
                            <FormControl>
                                <Input type="number" inputMode="decimal" step={0.5} min={0} placeholder="No limit" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="minExamScore"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Lowest exam score (%)</FormLabel>
                            <FormControl>
                                <Input type="number" inputMode="decimal" min={0} max={100} placeholder="No minimum" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="requiresInterview"
                    render={({ field }) => (
                        <FormItem className="flex flex-row items-center gap-2 space-y-0 pt-7">
                            <FormControl>
                                <Checkbox checked={field.value} onCheckedChange={(c) => field.onChange(c === true)} />
                            </FormControl>
                            <FormLabel className="font-normal">An interview is required</FormLabel>
                        </FormItem>
                    )}
                />
            </div>
            <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel>Notes for the office</FormLabel>
                        <FormControl>
                            <Textarea rows={2} placeholder="Anything else the panel weighs" {...field} value={field.value ?? ''} />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                )}
            />
        </FormDialog>
    );
}
