'use client';

import { useState, type ReactNode } from 'react';
import type { FieldValues, UseFormReturn } from 'react-hook-form';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Form } from '@/components/ui/form';
import { applyServerErrors } from '@/lib/utils/form-errors';

interface FormDialogProps<T extends FieldValues> {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    title: string;
    description?: ReactNode;
    form: UseFormReturn<T>;
    /** Save. Resolve to close; throw (the mutation's error) to stay open. */
    onSubmit: (values: T) => Promise<unknown>;
    /** The verb: "Add department", "Save changes". */
    submitLabel: string;
    children: ReactNode;
}

/**
 * The one way the product asks for a few fields in a dialog
 * (ROADMAP-EXECUTION.md, C3.7; wording in docs/COPY.md).
 *
 * Cancel beside the action, the action names what happens, the button spins
 * and the dialog stays put while saving, and a refusal from the API lands on
 * the field it is about (lib/utils/form-errors) instead of in a toast that
 * disappears. The success toast is the mutation's job, so it reads the same
 * wherever the change is made.
 */
export function FormDialog<T extends FieldValues>({
    open,
    onOpenChange,
    title,
    description,
    form,
    onSubmit,
    submitLabel,
    children,
}: FormDialogProps<T>) {
    const [formError, setFormError] = useState<string | null>(null);
    const saving = form.formState.isSubmitting;

    const submit = form.handleSubmit(async (values) => {
        setFormError(null);
        try {
            await onSubmit(values);
            onOpenChange(false);
        } catch (err) {
            setFormError(applyServerErrors(form, err));
        }
    });

    return (
        <Dialog
            open={open}
            onOpenChange={(next) => {
                if (saving) return;
                if (!next) setFormError(null);
                onOpenChange(next);
            }}
        >
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{title}</DialogTitle>
                    {description && <DialogDescription>{description}</DialogDescription>}
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={submit} className="space-y-4" noValidate>
                        {formError && (
                            <p
                                role="alert"
                                className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
                            >
                                {formError}
                            </p>
                        )}
                        {children}
                        <DialogFooter className="gap-2">
                            <Button
                                type="button"
                                variant="outline"
                                disabled={saving}
                                onClick={() => onOpenChange(false)}
                            >
                                Cancel
                            </Button>
                            <Button type="submit" disabled={saving}>
                                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                {submitLabel}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
