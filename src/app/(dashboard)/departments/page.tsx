'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Plus, Pencil, Trash2, Loader2, ToggleLeft, ToggleRight } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter,
} from '@/components/ui/dialog';
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/form';
import { Badge } from '@/components/ui/badge';
import { StatusBadge } from '@/components/common/status-badge';
import { LoadingSkeleton } from '@/components/common/loading-skeleton';
import { ConfirmDialog } from '@/components/common/confirm-dialog';
import {
    getDepartments,
    createDepartment,
    updateDepartment,
    deleteDepartment,
    activateDepartment,
    deactivateDepartment,
    type CreateDepartmentDto,
} from '@/lib/api/departments';
import {
    createDepartmentSchema,
    type CreateDepartmentValues,
} from '@/lib/utils/validation';
import type { Department } from '@/lib/types/api';

export default function DepartmentsPage() {
    const qc = useQueryClient();
    const { data: departments = [], isLoading } = useQuery({
        queryKey: ['departments'],
        queryFn: getDepartments,
    });

    const [dialogOpen, setDialogOpen] = useState(false);
    const [editTarget, setEditTarget] = useState<Department | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<Department | null>(null);

    const createMutation = useMutation({
        mutationFn: (dto: CreateDepartmentDto) => createDepartment(dto),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['departments'] });
            toast.success('Department created');
            setDialogOpen(false);
        },
        onError: (e: Error) => toast.error(e.message),
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, dto }: { id: string; dto: Partial<CreateDepartmentDto> }) =>
            updateDepartment(id, dto),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['departments'] });
            toast.success('Department updated');
            setEditTarget(null);
            setDialogOpen(false);
        },
        onError: (e: Error) => toast.error(e.message),
    });

    const delMutation = useMutation({
        mutationFn: (id: string) => deleteDepartment(id),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['departments'] });
            toast.success('Department deleted');
            setDeleteTarget(null);
        },
        onError: (e: Error) => toast.error(e.message),
    });

    const toggleMutation = useMutation({
        mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
            isActive ? deactivateDepartment(id) : activateDepartment(id),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['departments'] });
            toast.success('Status toggled');
        },
        onError: (e: Error) => toast.error(e.message),
    });

    function openCreate() {
        setEditTarget(null);
        setDialogOpen(true);
    }
    function openEdit(dept: Department) {
        setEditTarget(dept);
        setDialogOpen(true);
    }

    if (isLoading) return <LoadingSkeleton variant="table" />;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Departments</h1>
                    <p className="text-muted-foreground">
                        Organizational units for your school
                    </p>
                </div>
                <Button
                    onClick={openCreate}
                    className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                >
                    <Plus className="mr-2 h-4 w-4" /> Add Department
                </Button>
            </div>

            <div className="rounded-md border bg-white dark:bg-slate-950">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="border-b bg-muted/50">
                            <th className="px-4 py-3 text-left font-medium">Name</th>
                            <th className="px-4 py-3 text-left font-medium">Description</th>
                            <th className="px-4 py-3 text-left font-medium">Status</th>
                            <th className="px-4 py-3 text-right font-medium">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {departments.map((dept) => (
                            <tr key={dept.id} className="border-b">
                                <td className="px-4 py-3 font-medium">{dept.name}</td>
                                <td className="px-4 py-3 text-muted-foreground">
                                    {dept.description || '—'}
                                </td>
                                <td className="px-4 py-3">
                                    <Badge variant={dept.isActive ? 'default' : 'secondary'}>
                                        {dept.isActive ? 'Active' : 'Inactive'}
                                    </Badge>
                                </td>
                                <td className="px-4 py-3">
                                    <div className="flex items-center justify-end gap-1">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8"
                                            onClick={() =>
                                                toggleMutation.mutate({
                                                    id: dept.id,
                                                    isActive: dept.isActive,
                                                })
                                            }
                                            title={dept.isActive ? 'Deactivate' : 'Activate'}
                                        >
                                            {dept.isActive ? (
                                                <ToggleRight className="h-4 w-4 text-green-600" />
                                            ) : (
                                                <ToggleLeft className="h-4 w-4 text-slate-400" />
                                            )}
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8"
                                            onClick={() => openEdit(dept)}
                                        >
                                            <Pencil className="h-4 w-4" />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8 text-red-600"
                                            onClick={() => setDeleteTarget(dept)}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                        {departments.length === 0 && (
                            <tr>
                                <td colSpan={4} className="text-center py-12 text-muted-foreground">
                                    No departments yet. Add one to get started.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Create / Edit Dialog */}
            <DepartmentFormDialog
                open={dialogOpen}
                onOpenChange={setDialogOpen}
                department={editTarget}
                isLoading={createMutation.isPending || updateMutation.isPending}
                onSubmit={(values) => {
                    const dto: CreateDepartmentDto = {
                        name: values.name,
                        description: values.description || undefined,
                        headOfDepartment: values.headOfDepartment || undefined,
                        parentDepartmentId: values.parentDepartmentId || undefined,
                    };
                    if (editTarget) {
                        updateMutation.mutate({ id: editTarget.id, dto });
                    } else {
                        createMutation.mutate(dto);
                    }
                }}
            />

            <ConfirmDialog
                open={!!deleteTarget}
                onOpenChange={(open) => !open && setDeleteTarget(null)}
                title="Delete Department"
                description={`Delete "${deleteTarget?.name}"? This cannot be undone.`}
                confirmLabel="Delete"
                variant="destructive"
                loading={delMutation.isPending}
                onConfirm={async () => {
                    if (deleteTarget) await delMutation.mutateAsync(deleteTarget.id);
                }}
            />
        </div>
    );
}

function DepartmentFormDialog({
    open,
    onOpenChange,
    department,
    isLoading,
    onSubmit,
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    department: Department | null;
    isLoading: boolean;
    onSubmit: (values: CreateDepartmentValues) => void;
}) {
    const form = useForm<CreateDepartmentValues>({
        resolver: zodResolver(createDepartmentSchema),
        values: department
            ? {
                name: department.name,
                description: department.description ?? '',
            }
            : { name: '', description: '' },
    });

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>
                        {department ? 'Edit Department' : 'New Department'}
                    </DialogTitle>
                    <DialogDescription>
                        {department
                            ? 'Update the department details'
                            : 'Create a new organizational unit'}
                    </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form
                        onSubmit={form.handleSubmit(onSubmit)}
                        className="space-y-4"
                    >
                        <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Name *</FormLabel>
                                    <FormControl>
                                        <Input placeholder="e.g. Mathematics" {...field} />
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
                                    <FormLabel>Description</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Short description" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <DialogFooter>
                            <Button
                                type="submit"
                                disabled={isLoading}
                                className="bg-gradient-to-r from-blue-600 to-indigo-600"
                            >
                                {isLoading ? (
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                ) : null}
                                {department ? 'Update' : 'Create'}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
