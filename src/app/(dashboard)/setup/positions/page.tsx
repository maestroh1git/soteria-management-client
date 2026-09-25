'use client';

import { useState } from 'react';
import { useForm, type Resolver } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Plus, Pencil, Trash2, Loader2 } from 'lucide-react';

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
    usePositions,
    useUpdatePosition,
} from '@/features/staff/positions/hooks';
import { PageHeader } from '@/components/layout/page-header';
import { useCan } from '@/lib/hooks/use-can';
import { useAuth } from '@/lib/hooks/use-auth';
import { AccessChecklist } from '@/features/access/components/access-checklist';
import { ACCESS_LABELS, grantableAccess } from '@/features/access/roles';

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

    // A position's default access gives access to everyone in it (5.17), so it
    // is set by those who manage access, and a change that reaches people
    // says so before it is saved.
    const can = useCan();
    const canGiveAccess = can('users.manage');
    const [pendingAccess, setPendingAccess] = useState<{
        role: Role;
        dto: CreateRoleDto;
        added: string[];
        removed: string[];
    } | null>(null);

    const saveEdit = (id: string, dto: CreateRoleDto) =>
        updateMutation.mutate(
            { id, dto },
            {
                onSuccess: () => {
                    setEditTarget(null);
                    setDialogOpen(false);
                    setPendingAccess(null);
                },
            },
        );

    if (isLoading) return <LoadingSkeleton variant="table" />;

    return (
        <div className="space-y-6">
            <PageHeader
                title="Positions"
                description="The jobs in your organisation, and who reports to whom. Someone's access is set in Setup, under Team & access."
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
                            <th className="px-4 py-3 text-left font-medium">Default access</th>
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
                                    {role.accessRoles?.length ? (
                                        <div className="flex flex-wrap gap-1">
                                            {role.accessRoles.map((r) => (
                                                <Badge key={r} variant="secondary" className="font-normal">
                                                    {ACCESS_LABELS[r] ?? r}
                                                </Badge>
                                            ))}
                                        </div>
                                    ) : (
                                        <span className="text-xs text-muted-foreground">None</span>
                                    )}
                                </td>
                                <td className="px-4 py-3">
                                    <div className="flex items-center justify-end gap-1">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8"
                                            aria-label={`Edit ${role.name}`}
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
                                            aria-label={`Delete ${role.name}`}
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
                canGiveAccess={canGiveAccess}
                onSubmit={(values) => {
                    const dto: CreateRoleDto = {
                        name: values.name,
                        description: values.description || undefined,
                        departmentId: values.departmentId || undefined,
                        roleType: values.roleType,
                    };
                    if (canGiveAccess) dto.accessRoles = values.accessRoles ?? [];
                    if (editTarget) {
                        const before = editTarget.accessRoles ?? [];
                        const after = dto.accessRoles ?? before;
                        const added = after.filter((r) => !before.includes(r));
                        const removed = before.filter((r) => !after.includes(r));
                        if ((added.length || removed.length) && (editTarget.staffCount ?? 0) > 0) {
                            setPendingAccess({ role: editTarget, dto, added, removed });
                            return;
                        }
                        saveEdit(editTarget.id, dto);
                    } else {
                        createMutation.mutate(dto, { onSuccess: () => setDialogOpen(false) });
                    }
                }}
            />

            <ConfirmDialog
                open={!!pendingAccess}
                onOpenChange={(open) => !open && setPendingAccess(null)}
                title={`Change access for everyone in ${pendingAccess?.role.name ?? 'this position'}?`}
                description={pendingAccess ? describeAccessChange(pendingAccess) : ''}
                confirmLabel="Change their access"
                loading={updateMutation.isPending}
                onConfirm={() => pendingAccess && saveEdit(pendingAccess.role.id, pendingAccess.dto)}
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
    canGiveAccess,
    onSubmit,
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    role: Role | null;
    isLoading: boolean;
    canGiveAccess: boolean;
    onSubmit: (values: CreateRoleValues) => void;
}) {
    const { data: departments = [] } = useDepartments();
    const { tenantOrgType } = useAuth();
    // Ownership belongs to a named person, never to a post.
    const accessOptions = grantableAccess(tenantOrgType, false);
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
                accessRoles: role.accessRoles ?? [],
            }
            : {
                name: '',
                description: '',
                departmentId: '',
                roleType: RoleType.FULL_TIME,
                baseSalaryRange: undefined,
                reportingTo: '',
                isDottedLine: false,
                accessRoles: [],
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

                        {/* Default access (5.17) */}
                        {canGiveAccess ? (
                            <FormField
                                control={form.control}
                                name="accessRoles"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel id="position-access-label">Default access</FormLabel>
                                        <p className="text-xs text-muted-foreground">
                                            Everyone in this position has this access, on top of any
                                            given to them in Team &amp; access.
                                        </p>
                                        <AccessChecklist
                                            options={accessOptions}
                                            value={field.value ?? []}
                                            onChange={field.onChange}
                                            labelledBy="position-access-label"
                                        />
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        ) : role?.accessRoles?.length ? (
                            <p className="text-sm text-muted-foreground">
                                Default access:{' '}
                                {role.accessRoles.map((r) => ACCESS_LABELS[r] ?? r).join(', ')}. Only
                                someone who manages access can change it.
                            </p>
                        ) : null}

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

/** "Everyone in Head Teacher (4 people) will have Approver, and no longer Viewer." */
function describeAccessChange({
    role,
    added,
    removed,
}: {
    role: Role;
    added: string[];
    removed: string[];
}): string {
    const names = (rs: string[]) => rs.map((r) => ACCESS_LABELS[r] ?? r).join(', ');
    const n = role.staffCount ?? 0;
    const who = `${n} ${n === 1 ? 'person' : 'people'} in ${role.name}`;
    const parts = [
        added.length ? `will have ${names(added)}` : '',
        removed.length ? `${added.length ? 'and ' : 'will '}no longer have ${names(removed)} from this position` : '',
    ].filter(Boolean);
    return `The ${who} ${parts.join(', ')}. It applies from their next click. Access given to them individually is not changed.`;
}
