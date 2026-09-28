'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
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
                        <FormControl>
                            <StaffPicker
                                staff={staff}
                                value={field.value}
                                onChange={field.onChange}
                            />
                        </FormControl>
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

/**
 * Choose who to invite by typing a name or email, rather than scrolling a
 * dropdown of every member of staff. Chosen, it shows who, with a way back.
 * Long emails wrap under the name instead of widening the dialog.
 */
function StaffPicker({
    staff,
    value,
    onChange,
}: {
    staff: Employee[];
    value: string;
    onChange: (id: string) => void;
}) {
    const [text, setText] = useState('');
    const chosen = staff.find((e) => e.id === value);

    if (chosen) {
        return (
            <div className="flex min-w-0 items-center justify-between gap-3 rounded-md border px-3 py-2 text-sm">
                <span className="min-w-0">
                    <span className="block font-medium">{listName(chosen)}</span>
                    <span className="block truncate text-xs text-muted-foreground">{chosen.email}</span>
                </span>
                {staff.length > 1 && (
                    <button
                        type="button"
                        className="shrink-0 text-xs text-muted-foreground underline"
                        onClick={() => onChange('')}
                    >
                        Change
                    </button>
                )}
            </div>
        );
    }

    const needle = text.trim().toLowerCase();
    const results = (
        needle
            ? staff.filter((e) =>
                  `${listName(e)} ${e.email} ${e.employeeNumber}`.toLowerCase().includes(needle),
              )
            : staff
    ).slice(0, 50);

    return (
        // min-w-0: this sits in a form grid cell, which otherwise grows to fit
        // the longest email and pushes the dialog past the screen.
        <div className="min-w-0 space-y-1">
            <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                    aria-label="Find a member of staff"
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    placeholder="Type a name or email"
                    className="pl-9"
                    autoComplete="off"
                />
            </div>
            <ul className="max-h-48 overflow-y-auto rounded-md border" role="listbox">
                {results.length === 0 ? (
                    <li className="px-3 py-2 text-sm text-muted-foreground">
                        {staff.length === 0 ? 'Nobody left to invite.' : 'Nobody by that name or email.'}
                    </li>
                ) : (
                    results.map((e) => (
                        <li key={e.id}>
                            <button
                                type="button"
                                role="option"
                                aria-selected={false}
                                className="block w-full px-3 py-2 text-left text-sm hover:bg-muted"
                                onClick={() => onChange(e.id)}
                            >
                                <span className="block font-medium">{listName(e)}</span>
                                <span className="block truncate text-xs text-muted-foreground">{e.email}</span>
                            </button>
                        </li>
                    ))
                )}
            </ul>
        </div>
    );
}
