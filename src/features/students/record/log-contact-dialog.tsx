'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
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
import { useLogContact } from '@/lib/hooks/use-contacts';
import { CONTACT_CHANNEL_LABELS, type ContactChannel } from '@/lib/api/contacts';

const CHANNELS = Object.keys(CONTACT_CHANNEL_LABELS) as ContactChannel[];

const schema = z.object({
    channel: z.enum(CHANNELS as [ContactChannel, ...ContactChannel[]]),
    reached: z.enum(['yes', 'no']),
    withWhom: z.string().trim().max(120).optional(),
    when: z
        .string()
        .min(1, 'Say when.')
        .refine((v) => new Date(v).getTime() <= Date.now() + 60_000, 'A contact has already happened.'),
    note: z.string().trim().min(2, 'Say what came of it: the next person to call reads this.'),
});
type Values = z.infer<typeof schema>;

/** Now, as a datetime-local input reads it (local time, no seconds). */
function nowLocal(): string {
    const d = new Date();
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
    return d.toISOString().slice(0, 16);
}

/**
 * Write down a call, message or meeting with a pupil's family
 * (ROADMAP-EXECUTION.md, 5.5), so the next person to follow the pupil up
 * knows it happened and what came of it.
 */
export function LogContactDialog({
    open,
    onOpenChange,
    studentId,
    pupilName,
    guardianName,
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    studentId: string;
    /** "Adaeze Okonkwo", for the title. */
    pupilName?: string;
    /** Prefills "Spoke to". */
    guardianName?: string | null;
}) {
    const log = useLogContact();
    const form = useForm<Values>({ resolver: zodResolver(schema) });
    useEffect(() => {
        if (open)
            form.reset({
                channel: 'CALL',
                reached: 'yes',
                withWhom: guardianName ?? '',
                when: nowLocal(),
                note: '',
            });
    }, [open, form, guardianName]);

    return (
        <FormDialog
            open={open}
            onOpenChange={onOpenChange}
            form={form}
            title={pupilName ? `Log a contact about ${pupilName}` : 'Log a contact'}
            description="Staff who follow up this pupil will see it on their record."
            submitLabel="Save contact"
            onSubmit={(v) =>
                log.mutateAsync({
                    studentId,
                    channel: v.channel,
                    reached: v.reached === 'yes',
                    withWhom: v.withWhom || undefined,
                    contactedAt: new Date(v.when).toISOString(),
                    note: v.note,
                })
            }
        >
            <div className="grid gap-4 sm:grid-cols-2">
                <FormField
                    control={form.control}
                    name="channel"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>How</FormLabel>
                            <Select value={field.value} onValueChange={field.onChange}>
                                <FormControl>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    {CHANNELS.map((c) => (
                                        <SelectItem key={c} value={c}>
                                            {CONTACT_CHANNEL_LABELS[c]}
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
                    name="reached"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Did you get through?</FormLabel>
                            <Select value={field.value} onValueChange={field.onChange}>
                                <FormControl>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    <SelectItem value="yes">Yes, we spoke</SelectItem>
                                    <SelectItem value="no">No answer</SelectItem>
                                </SelectContent>
                            </Select>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="withWhom"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>With</FormLabel>
                            <FormControl>
                                <Input placeholder="Mother, Mr Okafor…" {...field} value={field.value ?? ''} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="when"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>When</FormLabel>
                            <FormControl>
                                <Input type="datetime-local" max={nowLocal()} {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
            </div>
            <FormField
                control={form.control}
                name="note"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel>What came of it</FormLabel>
                        <FormControl>
                            <Textarea rows={3} placeholder="Sick with malaria, back on Monday" {...field} />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                )}
            />
        </FormDialog>
    );
}
