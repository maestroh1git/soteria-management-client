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
import { useCreateDepartment, useDepartments, useUpdateDepartment } from '../hooks';
import { useEmployees } from '@/lib/hooks/use-employees';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';

const NONE = '__none__';

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
    const { data: departments = [] } = useDepartments(open);
    const { data: staff = [] } = useEmployees({ status: 'ACTIVE' }, open);
    // Not itself, and not one of its own sub-departments (a loop).
    const below = new Set<string>();
    if (department) {
        const walk = (id: string) =>
            departments
                .filter((d) => d.parentDepartmentId === id && !below.has(d.id))
                .forEach((d) => {
                    below.add(d.id);
                    walk(d.id);
                });
        walk(department.id);
    }
    const parents = departments.filter((d) => d.id !== department?.id && !below.has(d.id));
    const update = useUpdateDepartment();
    const form = useForm<DepartmentValues>({
        resolver: zodResolver(departmentSchema),
        defaultValues: { name: '', description: '', headOfDepartment: '', parentDepartmentId: '' },
    });

    useEffect(() => {
        if (open) {
            form.reset({
                name: department?.name ?? '',
                description: department?.description ?? '',
                headOfDepartment: department?.headOfDepartment ?? '',
                parentDepartmentId: department?.parentDepartmentId ?? '',
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
                    headOfDepartment: values.headOfDepartment || undefined,
                    parentDepartmentId: values.parentDepartmentId || undefined,
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
            <FormField
                control={form.control}
                name="headOfDepartment"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel>Head of department (optional)</FormLabel>
                        <Select
                            value={field.value || NONE}
                            onValueChange={(v) => field.onChange(v === NONE ? '' : v)}
                        >
                            <FormControl>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                                <SelectItem value={NONE}>Nobody yet</SelectItem>
                                {staff.map((e) => (
                                    <SelectItem key={e.id} value={e.id}>
                                        {e.firstName} {e.lastName} ({e.employeeNumber})
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
                name="parentDepartmentId"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel>Part of (optional)</FormLabel>
                        <Select
                            value={field.value || NONE}
                            onValueChange={(v) => field.onChange(v === NONE ? '' : v)}
                        >
                            <FormControl>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                                <SelectItem value={NONE}>Top level</SelectItem>
                                {parents.map((d) => (
                                    <SelectItem key={d.id} value={d.id}>
                                        {d.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <FormMessage />
                    </FormItem>
                )}
            />
        </FormDialog>
    );
}
