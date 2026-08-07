'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Plus, Pencil, Trash2, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog';
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/form';
import { Badge } from '@/components/ui/badge';
import { LoadingSkeleton } from '@/components/common/loading-skeleton';
import { ConfirmDialog } from '@/components/common/confirm-dialog';
import {
    useGrades,
    useCreateGrade,
    useUpdateGrade,
    useDeleteGrade,
} from '@/lib/hooks/use-grades';
import { createGradeSchema, type CreateGradeValues } from '@/lib/utils/validation';
import type { Grade } from '@/lib/types/api';

export default function GradesPage() {
    const { data: grades = [], isLoading } = useGrades(true);

    const [dialogOpen, setDialogOpen] = useState(false);
    const [editTarget, setEditTarget] = useState<Grade | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<Grade | null>(null);

    const createMutation = useCreateGrade();
    const updateMutation = useUpdateGrade();
    const delMutation = useDeleteGrade();

    function openCreate() {
        setEditTarget(null);
        setDialogOpen(true);
    }
    function openEdit(grade: Grade) {
        setEditTarget(grade);
        setDialogOpen(true);
    }

    if (isLoading) return <LoadingSkeleton variant="table" />;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Grades</h1>
                    <p className="text-muted-foreground">
                        Pay bands that payroll rules apply to — exemptions and
                        contributions are set per grade
                    </p>
                </div>
                <Button
                    onClick={openCreate}
                    className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                >
                    <Plus className="mr-2 h-4 w-4" /> Add Grade
                </Button>
            </div>

            <div className="rounded-md border bg-white dark:bg-slate-950">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="border-b bg-muted/50">
                            <th className="px-4 py-3 text-left font-medium">Code</th>
                            <th className="px-4 py-3 text-left font-medium">Name</th>
                            <th className="px-4 py-3 text-left font-medium">Description</th>
                            <th className="px-4 py-3 text-left font-medium">Order</th>
                            <th className="px-4 py-3 text-left font-medium">Status</th>
                            <th className="px-4 py-3 text-right font-medium">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {grades.map((grade) => (
                            <tr key={grade.id} className="border-b">
                                <td className="px-4 py-3 font-mono font-medium">
                                    {grade.code}
                                </td>
                                <td className="px-4 py-3">{grade.name}</td>
                                <td className="px-4 py-3 text-muted-foreground">
                                    {grade.description || '—'}
                                </td>
                                <td className="px-4 py-3 text-muted-foreground">
                                    {grade.sortOrder}
                                </td>
                                <td className="px-4 py-3">
                                    <Badge variant={grade.active ? 'default' : 'secondary'}>
                                        {grade.active ? 'Active' : 'Inactive'}
                                    </Badge>
                                </td>
                                <td className="px-4 py-3">
                                    <div className="flex items-center justify-end gap-1">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8"
                                            onClick={() => openEdit(grade)}
                                        >
                                            <Pencil className="h-4 w-4" />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8 text-red-600"
                                            onClick={() => setDeleteTarget(grade)}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                        {grades.length === 0 && (
                            <tr>
                                <td
                                    colSpan={6}
                                    className="text-center py-12 text-muted-foreground"
                                >
                                    No grades yet. Add one to get started.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            <GradeFormDialog
                open={dialogOpen}
                onOpenChange={setDialogOpen}
                grade={editTarget}
                isLoading={createMutation.isPending || updateMutation.isPending}
                onSubmit={(values) => {
                    const dto = {
                        code: values.code,
                        name: values.name,
                        description: values.description || undefined,
                        sortOrder: values.sortOrder,
                    };
                    if (editTarget) {
                        updateMutation.mutate(
                            { id: editTarget.id, dto },
                            {
                                onSuccess: () => {
                                    setEditTarget(null);
                                    setDialogOpen(false);
                                },
                            },
                        );
                    } else {
                        createMutation.mutate(dto, {
                            onSuccess: () => setDialogOpen(false),
                        });
                    }
                }}
            />

            <ConfirmDialog
                open={!!deleteTarget}
                onOpenChange={(open) => !open && setDeleteTarget(null)}
                title="Delete Grade"
                description={`Delete "${deleteTarget?.code}"? This cannot be undone. Grades already assigned to employees cannot be deleted — deactivate them instead.`}
                confirmLabel="Delete"
                variant="destructive"
                loading={delMutation.isPending}
                onConfirm={async () => {
                    if (!deleteTarget) return;
                    try {
                        await delMutation.mutateAsync(deleteTarget.id);
                        setDeleteTarget(null);
                    } catch {
                        // Hook already surfaced the reason; keep the dialog open.
                    }
                }}
            />
        </div>
    );
}

function GradeFormDialog({
    open,
    onOpenChange,
    grade,
    isLoading,
    onSubmit,
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    grade: Grade | null;
    isLoading: boolean;
    onSubmit: (values: CreateGradeValues) => void;
}) {
    const form = useForm<CreateGradeValues>({
        resolver: zodResolver(createGradeSchema),
        values: grade
            ? {
                code: grade.code,
                name: grade.name,
                description: grade.description ?? '',
                sortOrder: grade.sortOrder,
            }
            : { code: '', name: '', description: '', sortOrder: 0 },
    });

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{grade ? 'Edit Grade' : 'New Grade'}</DialogTitle>
                    <DialogDescription>
                        {grade
                            ? 'Update the grade details'
                            : 'Create a pay band, e.g. GL1 or SS1'}
                    </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="code"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Code *</FormLabel>
                                    <FormControl>
                                        <Input placeholder="e.g. GL1" {...field} />
                                    </FormControl>
                                    <FormDescription>
                                        Shown on payroll advices
                                    </FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Name *</FormLabel>
                                    <FormControl>
                                        <Input placeholder="e.g. Grade Level 1" {...field} />
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
                        <FormField
                            control={form.control}
                            name="sortOrder"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Display order</FormLabel>
                                    <FormControl>
                                        <Input
                                            type="number"
                                            min={0}
                                            {...field}
                                            onChange={(e) =>
                                                field.onChange(
                                                    e.target.value === ''
                                                        ? undefined
                                                        : e.target.valueAsNumber,
                                                )
                                            }
                                        />
                                    </FormControl>
                                    <FormDescription>
                                        Grades are a ranked series, not an alphabetical list
                                    </FormDescription>
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
                                {grade ? 'Update' : 'Create'}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
