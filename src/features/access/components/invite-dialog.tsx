'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { FormDialog } from '@/components/common/form-dialog';
import type { Employee } from '@/lib/types/api';
import { useInvite } from '../hooks';
import { AccessChecklist } from './access-checklist';
import { listName } from '@/lib/utils/names';

const inviteSchema = z.object({
    employeeId: z.string().min(1, 'Choose who to invite.'),
    access: z.array(z.string()).min(1, 'Give them at least one kind of access.'),
});
type InviteValues = z.infer<typeof inviteSchema>;

/**
 * Invite a member of staff to sign in. They get an email with a link to set
 * their own password; when mail is not set up, `onLink` receives the link to
 * pass on by hand.
 */
export function InviteDialog({
    open,
    onOpenChange,
    staff,
    accessOptions,
    onLink,
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    /** Staff without a login yet. */
    staff: Employee[];
    accessOptions: string[];
    onLink: (link: { name: string; url: string }) => void;
}) {
    const invite = useInvite();
    // Opened from one person's record, the choice is already made.
    const only = staff.length === 1 ? staff[0].id : '';
    const form = useForm<InviteValues>({
        resolver: zodResolver(inviteSchema),
        defaultValues: { employeeId: only, access: ['EMPLOYEE'] },
    });
    useEffect(() => {
        if (open) form.reset({ employeeId: only, access: ['EMPLOYEE'] });
    }, [open, form, only]);

    return (
        <FormDialog
            open={open}
            onOpenChange={onOpenChange}
            form={form}
            title="Invite someone to sign in"
            description="They get an email with a link to set their own password. You never set one for them."
            submitLabel="Send invite"
            onSubmit={async (values) => {
                const emp = staff.find((e) => e.id === values.employeeId);
                if (!emp) return;
                const res = await invite.mutateAsync({
                    email: emp.email,
                    firstName: emp.firstName,
                    lastName: emp.lastName,
                    employeeId: emp.id,
                    systemRoles: values.access,
                });
                if (res.emailed) toast.success(`Invite sent to ${emp.email}`);
                else if (res.inviteUrl)
                    onLink({ name: `${emp.firstName} ${emp.lastName}`, url: res.inviteUrl });
            }}
        >
            <FormField
                control={form.control}
                name="employeeId"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel>Member of staff</FormLabel>
                        <Select value={field.value} onValueChange={field.onChange}>
                            <FormControl>
                                <SelectTrigger>
                                    <SelectValue placeholder="Choose someone" />
                                </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                                {staff.map((e) => (
                                    <SelectItem key={e.id} value={e.id}>
                                        {listName(e)} · {e.email}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        {staff.length === 0 && (
                            <p className="text-xs text-muted-foreground">
                                Everyone on the staff list already has a login.
                            </p>
                        )}
                        <FormMessage />
                    </FormItem>
                )}
            />
            <FormField
                control={form.control}
                name="access"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel id="invite-access-label">Access</FormLabel>
                        <AccessChecklist
                            options={accessOptions}
                            value={field.value}
                            onChange={field.onChange}
                            labelledBy="invite-access-label"
                        />
                        <FormMessage />
                    </FormItem>
                )}
            />
        </FormDialog>
    );
}
