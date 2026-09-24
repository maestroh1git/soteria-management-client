'use client';

import { useState } from 'react';
import { useForm, type Resolver } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Plus, Pencil, Trash2, Loader2, Shield } from 'lucide-react';

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
import { PrerequisiteNotice } from '@/components/onboarding/prerequisite-notice';
import {
    type CreateRoleDto,
} from '@/features/staff/positions/api';
import { createRoleSchema, type CreateRoleValues } from '@/lib/utils/validation';
import { RoleType } from '@/lib/types/enums';
import type { Role } from '@/lib/types/api';
import { useDepartments } from '@/features/staff/departments/hooks';
import {
    useCreatePosition,
    useDeletePosition,
    usePermissionCatalogue,
    usePositions,
    useUpdatePosition,
} from '@/features/staff/positions/hooks';
import { PageHeader } from '@/components/layout/page-header';

export default function PositionsPage() {
    const { data: roles = [], isLoading } = usePositions();
    // Roles should be grouped under a department (powers the department-scoped
    // role picker on the employee form) — nudge users to create one first.
    const departmentsQuery = useDepartments();
    const noDepartments =
        departmentsQuery.data !== undefined && departmentsQuery.data.length === 0;

    const [dialogOpen, setDialogOpen] = useState(false);
    const [editTarget, setEditTarget] = useState<Role | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<Role | null>(null);

    const createMutation = useCreatePosition();

    const updateMutation = useUpdatePosition();

    const delMutation = useDeletePosition();

    if (isLoading) return <LoadingSkeleton variant="table" />;

    return (
        <div className="space-y-6">
            <PageHeader
                title="Positions"
                description="The jobs in your organisation, and who reports to whom. Someone's access is set in Setup, under Organisation & access."
                actions={
                    <Button
                        onClick={() => {
                            setEditTarget(null);
                            setDialogOpen(true);
                        }}
                    >
                        <Plus className="mr-2 h-4 w-4" /> Add position
                    </Button>
                }
            />

            {noDepartments && (
                <PrerequisiteNotice
                    message="Create a department first, then add positions to it. The employee form offers the positions in the department you pick."
                    href="/setup/departments"
                    actionLabel="Create a department"
                />
            )}

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
                                    No positions yet. Add the jobs people are hired into.
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
                        updateMutation.mutate(
                            { id: editTarget.id, dto },
                            { onSuccess: () => { setEditTarget(null); setDialogOpen(false); } },
                        );
                    } else {
                        createMutation.mutate(dto, { onSuccess: () => setDialogOpen(false) });
                    }
                }}
            />

            <ConfirmDialog
                open={!!deleteTarget}
                onOpenChange={(open) => !open && setDeleteTarget(null)}
                title={`Delete ${deleteTarget?.name ?? 'position'}?`}
                description="Staff in this position will need another one. This cannot be undone."
                confirmLabel="Delete position"
                variant="destructive"
                loading={delMutation.isPending}
                onConfirm={async () => {
                    if (!deleteTarget) return;
                    // A refusal is toasted by the hook; the dialog stays open.
                    await delMutation.mutateAsync(deleteTarget.id).then(
                        () => setDeleteTarget(null),
                        () => undefined,
                    );
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
    const { data: departments = [] } = useDepartments();
    const { data: permissions = [] } = usePermissionCatalogue();
    // For the reporting line. A role cannot report to itself.
    const { data: allRoles = [] } = usePositions();
    const reportingOptions = allRoles.filter((r) => r.id !== role?.id);

    const form = useForm<CreateRoleValues>({
        resolver: zodResolver(createRoleSchema) as Resolver<CreateRoleValues>,
        values: role
            ? {
                name: role.name,
                description: role.description ?? '',
                departmentId: role.departmentId ?? '',
                roleType: role.roleType as RoleType,
                baseSalaryRange: role.baseSalaryRange ?? undefined,
                reportingTo: role.reportingTo ?? '',
                isDottedLine: role.isDottedLine ?? false,
                permissionIds: role.permissions?.map((p) => p.id) ?? [],
            }
            : {
                name: '',
                description: '',
                departmentId: '',
                roleType: RoleType.FULL_TIME,
                baseSalaryRange: undefined,
                reportingTo: '',
                isDottedLine: false,
                permissionIds: [],
            },
    });

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle>{role ? `Edit ${role.name}` : 'Add a position'}</DialogTitle>
                    <DialogDescription>
                        {role ? 'Change the job, where it sits and who it reports to.' : 'A job people are hired into.'}
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
                                        <Input placeholder="e.g. Senior Educator" {...field} />
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
                                        <Input placeholder="What the job involves" {...field} />
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

                        {/*
                            Salary band and reporting line. The API has accepted
                            all three of these since the role module was written
                            and nothing drew them, so an org chart the product
                            supported could not be entered.
                        */}
                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="baseSalaryRange.min"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Salary band from (optional)</FormLabel>
                                        <FormControl>
                                            <Input
                                                type="number"
                                                min={0}
                                                placeholder="0"
                                                {...field}
                                                value={field.value ?? ''}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="baseSalaryRange.max"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>to</FormLabel>
                                        <FormControl>
                                            <Input
                                                type="number"
                                                min={0}
                                                placeholder="0"
                                                {...field}
                                                value={field.value ?? ''}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <FormField
                            control={form.control}
                            name="reportingTo"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Reports to (optional)</FormLabel>
                                    <Select
                                        onValueChange={(v) =>
                                            field.onChange(v === 'none' ? '' : v)
                                        }
                                        value={field.value || 'none'}
                                    >
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Nobody" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            <SelectItem value="none">Nobody</SelectItem>
                                            {reportingOptions.map((r) => (
                                                <SelectItem key={r.id} value={r.id}>
                                                    {r.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {form.watch('reportingTo') ? (
                            <FormField
                                control={form.control}
                                name="isDottedLine"
                                render={({ field }) => (
                                    <FormItem className="flex items-start gap-2 space-y-0">
                                        <FormControl>
                                            <Checkbox
                                                checked={!!field.value}
                                                onCheckedChange={field.onChange}
                                            />
                                        </FormControl>
                                        <div>
                                            <FormLabel className="font-normal">
                                                Dotted line
                                            </FormLabel>
                                            <p className="text-xs text-muted-foreground">
                                                An advisory reporting line rather than a
                                                direct one.
                                            </p>
                                        </div>
                                    </FormItem>
                                )}
                            />
                        ) : null}

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
                                {role ? 'Save changes' : 'Add position'}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
