'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Plus, Pencil, Trash2, Loader2, Shield } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
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
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/form';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { LoadingSkeleton } from '@/components/common/loading-skeleton';
import { ConfirmDialog } from '@/components/common/confirm-dialog';
import {
    getRoles,
    createRole,
    updateRole,
    deleteRole,
    getPermissions,
    type CreateRoleDto,
} from '@/lib/api/roles';
import { getDepartments } from '@/lib/api/departments';
import { createRoleSchema, type CreateRoleValues } from '@/lib/utils/validation';
import { RoleType } from '@/lib/types/enums';
import type { Role } from '@/lib/types/api';

export default function RolesPage() {
    const qc = useQueryClient();
    const { data: roles = [], isLoading } = useQuery({
        queryKey: ['roles'],
        queryFn: getRoles,
    });

    const [dialogOpen, setDialogOpen] = useState(false);
    const [editTarget, setEditTarget] = useState<Role | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<Role | null>(null);

    const createMutation = useMutation({
        mutationFn: (dto: CreateRoleDto) => createRole(dto),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['roles'] });
            toast.success('Role created');
            setDialogOpen(false);
        },
        onError: (e: Error) => toast.error(e.message),
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, dto }: { id: string; dto: Partial<CreateRoleDto> }) =>
            updateRole(id, dto),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['roles'] });
            toast.success('Role updated');
            setEditTarget(null);
            setDialogOpen(false);
        },
        onError: (e: Error) => toast.error(e.message),
    });

    const delMutation = useMutation({
        mutationFn: (id: string) => deleteRole(id),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['roles'] });
            toast.success('Role deleted');
            setDeleteTarget(null);
        },
        onError: (e: Error) => toast.error(e.message),
    });

    if (isLoading) return <LoadingSkeleton variant="table" />;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Roles</h1>
                    <p className="text-muted-foreground">
                        Define positions and permissions
                    </p>
                </div>
                <Button
                    onClick={() => {
                        setEditTarget(null);
                        setDialogOpen(true);
                    }}
                    className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                >
                    <Plus className="mr-2 h-4 w-4" /> Add Role
                </Button>
            </div>

            <div className="rounded-md border bg-white dark:bg-slate-950">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="border-b bg-muted/50">
                            <th className="px-4 py-3 text-left font-medium">Name</th>
                            <th className="px-4 py-3 text-left font-medium">Department</th>
                            <th className="px-4 py-3 text-left font-medium">Type</th>
                            <th className="px-4 py-3 text-left font-medium">Permissions</th>
                            <th className="px-4 py-3 text-right font-medium">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {roles.map((role) => (
                            <tr key={role.id} className="border-b">
                                <td className="px-4 py-3 font-medium">{role.name}</td>
                                <td className="px-4 py-3 text-muted-foreground">
                                    {role.department?.name || '—'}
                                </td>
                                <td className="px-4 py-3">
                                    <Badge variant="outline">{role.roleType}</Badge>
                                </td>
                                <td className="px-4 py-3">
                                    <div className="flex items-center gap-1">
                                        <Shield className="h-3.5 w-3.5 text-muted-foreground" />
                                        <span className="text-xs text-muted-foreground">
                                            {role.permissions?.length ?? 0}
                                        </span>
                                    </div>
                                </td>
                                <td className="px-4 py-3">
                                    <div className="flex items-center justify-end gap-1">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8"
                                            onClick={() => {
                                                setEditTarget(role);
                                                setDialogOpen(true);
                                            }}
                                        >
                                            <Pencil className="h-4 w-4" />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8 text-red-600"
                                            onClick={() => setDeleteTarget(role)}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                        {roles.length === 0 && (
                            <tr>
                                <td colSpan={5} className="text-center py-12 text-muted-foreground">
                                    No roles yet. Create one to get started.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            <RoleFormDialog
                open={dialogOpen}
                onOpenChange={setDialogOpen}
                role={editTarget}
                isLoading={createMutation.isPending || updateMutation.isPending}
                onSubmit={(values) => {
                    const dto: CreateRoleDto = {
                        name: values.name,
                        description: values.description || undefined,
                        departmentId: values.departmentId || undefined,
                        roleType: values.roleType,
                        permissionIds: values.permissionIds,
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
                title="Delete Role"
                description={`Delete "${deleteTarget?.name}"? Employees with this role will need reassignment.`}
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

function RoleFormDialog({
    open,
    onOpenChange,
    role,
    isLoading,
    onSubmit,
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    role: Role | null;
    isLoading: boolean;
    onSubmit: (values: CreateRoleValues) => void;
}) {
    const { data: departments = [] } = useQuery({
        queryKey: ['departments'],
        queryFn: getDepartments,
    });
    const { data: permissions = [] } = useQuery({
        queryKey: ['permissions'],
        queryFn: getPermissions,
    });

    const form = useForm<CreateRoleValues>({
        resolver: zodResolver(createRoleSchema),
        values: role
            ? {
                name: role.name,
                description: role.description ?? '',
                departmentId: role.departmentId ?? '',
                roleType: role.roleType as RoleType,
                permissionIds: role.permissions?.map((p) => p.id) ?? [],
            }
            : {
                name: '',
                description: '',
                departmentId: '',
                roleType: RoleType.FULL_TIME,
                permissionIds: [],
            },
    });

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle>{role ? 'Edit Role' : 'New Role'}</DialogTitle>
                    <DialogDescription>
                        {role ? 'Update role details and permissions' : 'Define a new position'}
                    </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Name *</FormLabel>
                                    <FormControl>
                                        <Input placeholder="e.g. Senior Teacher" {...field} />
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
                                        <Input placeholder="Role description" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="departmentId"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Department</FormLabel>
                                        <Select onValueChange={field.onChange} value={field.value}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                {departments.map((d) => (
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
                            <FormField
                                control={form.control}
                                name="roleType"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Type</FormLabel>
                                        <Select onValueChange={field.onChange} value={field.value}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                {Object.values(RoleType).map((t) => (
                                                    <SelectItem key={t} value={t}>
                                                        {t.replace(/_/g, ' ')}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        {/* Permissions */}
                        <FormField
                            control={form.control}
                            name="permissionIds"
                            render={() => (
                                <FormItem>
                                    <FormLabel>Permissions</FormLabel>
                                    <ScrollArea className="h-40 rounded-md border p-3">
                                        <div className="space-y-2">
                                            {permissions.map((perm) => (
                                                <FormField
                                                    key={perm.id}
                                                    control={form.control}
                                                    name="permissionIds"
                                                    render={({ field }) => (
                                                        <FormItem className="flex items-center space-x-2 space-y-0">
                                                            <FormControl>
                                                                <Checkbox
                                                                    checked={field.value?.includes(perm.id)}
                                                                    onCheckedChange={(checked) => {
                                                                        const current = field.value ?? [];
                                                                        field.onChange(
                                                                            checked
                                                                                ? [...current, perm.id]
                                                                                : current.filter((id) => id !== perm.id),
                                                                        );
                                                                    }}
                                                                />
                                                            </FormControl>
                                                            <span className="text-sm">
                                                                {perm.name}
                                                                {perm.description && (
                                                                    <span className="text-xs text-muted-foreground ml-1">
                                                                        — {perm.description}
                                                                    </span>
                                                                )}
                                                            </span>
                                                        </FormItem>
                                                    )}
                                                />
                                            ))}
                                            {permissions.length === 0 && (
                                                <p className="text-xs text-muted-foreground text-center py-4">
                                                    No permissions available
                                                </p>
                                            )}
                                        </div>
                                    </ScrollArea>
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
                                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                                {role ? 'Update' : 'Create'}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
