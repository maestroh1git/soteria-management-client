'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/form';
import { FormDialog } from '@/components/common/form-dialog';
import type { Department } from '@/lib/types/api';
import { departmentSchema, type DepartmentValues } from '../schema';
import { useCreateDepartment, useUpdateDepartment } from '../hooks';

/** Adding a department, or editing one (`department` set). */
export function DepartmentFormDialog({
    open,
    onOpenChange,
    department,
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    department: Department | null;
}) {
    const create = useCreateDepartment();
    const update = useUpdateDepartment();
    const form = useForm<DepartmentValues>({
        resolver: zodResolver(departmentSchema),
        defaultValues: { name: '', description: '' },
    });

    useEffect(() => {
        if (open) {
            form.reset({
                name: department?.name ?? '',
                description: department?.description ?? '',
            });
        }
    }, [open, department, form]);

    return (
        <FormDialog
            open={open}
            onOpenChange={onOpenChange}
            form={form}
            title={department ? `Edit ${department.name}` : 'Add a department'}
            description={
                department
                    ? undefined
                    : 'A unit staff belong to. Positions and budgets hang off it.'
            }
            submitLabel={department ? 'Save changes' : 'Add department'}
            onSubmit={(values) => {
                const dto = {
                    name: values.name,
                    description: values.description || undefined,
                };
                return department
                    ? update.mutateAsync({ id: department.id, dto })
                    : create.mutateAsync(dto);
            }}
        >
            <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel>Name</FormLabel>
                        <FormControl>
                            <Input placeholder="e.g. Mathematics" autoFocus {...field} />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                )}
            />
            <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel>Description (optional)</FormLabel>
                        <FormControl>
                            <Textarea rows={3} placeholder="What this department does" {...field} />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                )}
            />
        </FormDialog>
    );
}
