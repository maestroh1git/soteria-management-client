'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { FormDialog } from '@/components/common/form-dialog';
import type { User } from '@/lib/types/api';
import { useChangeAccess } from '../hooks';
import { accessOf, inheritedOf } from '../roles';
import { AccessChecklist } from './access-checklist';

const accessSchema = z.object({
    access: z.array(z.string()).min(1, 'Leave them at least one kind of access, or deactivate them.'),
});
type AccessValues = z.infer<typeof accessSchema>;

/** Change what one person may do. */
export function AccessDialog({
    user,
    onOpenChange,
    accessOptions,
}: {
    user: User | null;
    onOpenChange: (open: boolean) => void;
    accessOptions: string[];
}) {
    const change = useChangeAccess();
    const form = useForm<AccessValues>({
        resolver: zodResolver(accessSchema),
        defaultValues: { access: [] },
    });
    useEffect(() => {
        if (user) form.reset({ access: [...accessOf(user)] });
    }, [user, form]);

    // Access they hold that this person may not grant (an owner, seen by an
    // admin) stays listed so it is not silently removed.
    const options = user
        ? [...new Set([...accessOptions, ...accessOf(user).filter((r) => r !== 'PARENT')])]
        : accessOptions;

    return (
        <FormDialog
            open={!!user}
            onOpenChange={onOpenChange}
            form={form}
            title={user ? `Access for ${user.firstName} ${user.lastName}` : 'Access'}
            description={
                user && inheritedOf(user)
                    ? `What they may do in the software. Locked access comes with their position, ${inheritedOf(user)!.from}, and changes there; what you tick here is theirs on top of it.`
                    : 'What they may do in the software. Their job is their position, set on their staff record.'
            }
            submitLabel="Save access"
            onSubmit={(values) =>
                user ? change.mutateAsync({ id: user.id, systemRoles: values.access }) : Promise.resolve()
            }
        >
            <FormField
                control={form.control}
                name="access"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel id="access-dialog-label">Access</FormLabel>
                        <AccessChecklist
                            options={options}
                            value={field.value}
                            onChange={field.onChange}
                            labelledBy="access-dialog-label"
                            locked={user ? inheritedOf(user) : null}
                        />
                        <FormMessage />
                    </FormItem>
                )}
            />
        </FormDialog>
    );
}
