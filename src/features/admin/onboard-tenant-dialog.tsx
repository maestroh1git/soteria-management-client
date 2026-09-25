'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { FormDialog } from '@/components/common/form-dialog';
import { CopyButton } from '@/components/common/copy-button';
import { useOnboardTenant } from '@/lib/hooks/use-admin-tenants';
import type { OnboardedTenant } from '@/lib/api/tenants';

const TYPES: Array<{ value: string; label: string }> = [
    { value: 'SCHOOL', label: 'School' },
    { value: 'CORPORATE', label: 'Company' },
    { value: 'HOSPITAL', label: 'Hospital' },
    { value: 'NGO', label: 'NGO' },
    { value: 'NONPROFIT', label: 'Non-profit' },
    { value: 'GOVERNMENT', label: 'Government' },
    { value: 'HOSPITALITY', label: 'Hospitality' },
    { value: 'OTHER', label: 'Other' },
];

const schema = z.object({
    name: z.string().trim().min(2, 'Give the organisation its name.').max(200),
    organizationType: z.string().min(1, 'Choose what kind of organisation it is.'),
    slug: z
        .string()
        .trim()
        .refine((v) => v === '' || /^[a-z0-9-]{2,60}$/.test(v), 'Lowercase letters, numbers and hyphens.')
        .optional(),
    ownerFirstName: z.string().trim().min(1, 'The owner’s first name.').max(100),
    ownerLastName: z.string().trim().min(1, 'The owner’s surname.').max(100),
    ownerEmail: z.string().trim().email('An email address the owner reads.'),
});
type Values = z.infer<typeof schema>;

const EMPTY: Values = {
    name: '',
    organizationType: 'SCHOOL',
    slug: '',
    ownerFirstName: '',
    ownerLastName: '',
    ownerEmail: '',
};

/**
 * Set up an organisation for a customer (ROADMAP-EXECUTION.md, 5.13): the
 * organisation with its starter departments, positions and accounts, and an
 * invite for its owner, who chooses their own password.
 */
export function OnboardTenantDialog({
    open,
    onOpenChange,
    onCreated,
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    /** What was made, for the page to show once this dialog has closed. */
    onCreated: (result: OnboardedTenant) => void;
}) {
    const onboard = useOnboardTenant();
    const form = useForm<Values>({ resolver: zodResolver(schema), defaultValues: EMPTY });
    useEffect(() => {
        if (open) form.reset(EMPTY);
    }, [open, form]);

    return (
        <FormDialog
            open={open}
            onOpenChange={onOpenChange}
            form={form}
            title="Set up an organisation"
            description="It starts with default departments, positions, pay components and accounts. The owner is invited by email and chooses their own password."
            submitLabel="Create and invite"
            onSubmit={async (v) => {
                const result = await onboard.mutateAsync({
                    name: v.name,
                    organizationType: v.organizationType,
                    slug: v.slug || undefined,
                    ownerFirstName: v.ownerFirstName,
                    ownerLastName: v.ownerLastName,
                    ownerEmail: v.ownerEmail,
                });
                onCreated(result);
            }}
        >
            <div className="grid gap-4 sm:grid-cols-2">
                <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                        <FormItem className="sm:col-span-2">
                            <FormLabel>Name</FormLabel>
                            <FormControl>
                                <Input placeholder="Greenfield Academy" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="organizationType"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Kind</FormLabel>
                            <Select value={field.value} onValueChange={field.onChange}>
                                <FormControl>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    {TYPES.map((t) => (
                                        <SelectItem key={t.value} value={t.value}>
                                            {t.label}
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
                    name="slug"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Web address</FormLabel>
                            <FormControl>
                                <Input placeholder="Made from the name" {...field} value={field.value ?? ''} />
                            </FormControl>
                            <FormDescription>Used in its public links.</FormDescription>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="ownerFirstName"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Owner’s first name</FormLabel>
                            <FormControl>
                                <Input {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="ownerLastName"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Owner’s surname</FormLabel>
                            <FormControl>
                                <Input {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="ownerEmail"
                    render={({ field }) => (
                        <FormItem className="sm:col-span-2">
                            <FormLabel>Owner’s email</FormLabel>
                            <FormControl>
                                <Input type="email" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
            </div>
        </FormDialog>
    );
}

/** What was set up, and how the owner gets in. */
export function OnboardedDialog({
    result,
    onClose,
}: {
    result: OnboardedTenant | null;
    onClose: () => void;
}) {
    return (
        <Dialog open={!!result} onOpenChange={(o) => !o && onClose()}>
            <DialogContent className="sm:max-w-lg">
                {result && (
                    <>
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-2">
                                <CheckCircle2 className="h-5 w-5 text-emerald-600" aria-hidden />
                                {result.tenant.name} is set up
                            </DialogTitle>
                            <DialogDescription>
                                {result.emailed
                                    ? `An invite went to ${result.owner.email}. They choose their own password.`
                                    : `Email is not set up, so send ${result.owner.firstName} this link yourself. It works once and lasts a week.`}
                            </DialogDescription>
                        </DialogHeader>
                        {!result.emailed && result.inviteUrl && (
                            <div className="flex min-w-0 items-center gap-2">
                                <code className="min-w-0 flex-1 truncate rounded bg-muted px-3 py-2 text-xs">
                                    {result.inviteUrl}
                                </code>
                                <CopyButton text={result.inviteUrl} label="Copy link" />
                            </div>
                        )}
                        <DialogFooter>
                            <Button onClick={onClose}>Done</Button>
                        </DialogFooter>
                    </>
                )}
            </DialogContent>
        </Dialog>
    );
}
