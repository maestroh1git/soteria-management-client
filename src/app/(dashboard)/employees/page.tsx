'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ColumnDef } from '@tanstack/react-table';
import {
    MoreHorizontal,
    Plus,
    Eye,
    Pencil,
    UserX,
    Upload,
    AlertTriangle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { DataTable } from '@/components/common/data-table';
import { StatusBadge } from '@/components/common/status-badge';
import {
    useEmployees,
    useDeleteEmployee,
    useCompletenessSummary,
} from '@/lib/hooks/use-employees';
import { useAuth } from '@/lib/hooks/use-auth';
import { useRolesList } from '@/lib/hooks/use-onboarding';
import { PrerequisiteNotice } from '@/components/onboarding/prerequisite-notice';
import { ConfirmDialog } from '@/components/common/confirm-dialog';
import { EmployeeStatus } from '@/lib/types/enums';
import { formatDate } from '@/lib/utils/dates';
import type { Employee } from '@/lib/types/api';

export default function EmployeesPage() {
    const router = useRouter();
    const { hasRole } = useAuth();
    // VIEWER has read-only directory access (S13) — no create/edit/delete.
    const canManage = hasRole(['tenant_owner', 'ADMIN', 'PAYROLL_OFFICER']);
    // Only nudge on a *confirmed* empty roles list (data defined ⇒ the request
    // succeeded); a 403 leaves data undefined and shows nothing rather than a
    // false "create a role" prompt.
    const rolesQuery = useRolesList(canManage);
    const needsRole =
        canManage && rolesQuery.data !== undefined && rolesQuery.data.length === 0;
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [search, setSearch] = useState('');
    const [deleteTarget, setDeleteTarget] = useState<Employee | null>(null);

    const { data: employees = [], isLoading, isError } = useEmployees({
        status: statusFilter !== 'all' ? statusFilter : undefined,
        search: search || undefined,
    });

    const deleteMutation = useDeleteEmployee();

    // One request for the whole directory rather than one per row. Keyed by id
    // so the column can say, per person, what their record is missing — the
    // directory is where somebody notices that six people have no TIN.
    const { data: completeness } = useCompletenessSummary();
    const gapsByEmployee = new Map(
        (completeness?.incomplete ?? []).map((row) => [row.employeeId, row]),
    );

    const columns: ColumnDef<Employee>[] = [
        {
            accessorKey: 'employeeNumber',
            header: 'Emp #',
            cell: ({ row }) => (
                // Was a blue span: it read as a link, and clicking it did
                // nothing. The only way in was the row's overflow menu.
                <Link
                    href={`/employees/${row.original.id}`}
                    className="font-medium text-blue-600 hover:underline dark:text-blue-400"
                >
                    {row.original.employeeNumber}
                </Link>
            ),
        },
        {
            id: 'name',
            header: 'Name',
            accessorFn: (row) => `${row.firstName} ${row.lastName}`,
            cell: ({ row }) => (
                <div>
                    <p className="font-medium">
                        {row.original.firstName} {row.original.lastName}
                    </p>
                    <p className="text-xs text-muted-foreground">{row.original.email}</p>
                </div>
            ),
        },
        {
            accessorKey: 'role',
            header: 'Role',
            cell: ({ row }) => (
                <span className="text-sm">{row.original.role?.name ?? '—'}</span>
            ),
        },
        {
            accessorKey: 'status',
            header: 'Status',
            cell: ({ row }) => <StatusBadge status={row.original.status} />,
        },
        {
            id: 'record',
            header: 'Record',
            cell: ({ row }) => {
                const gaps = gapsByEmployee.get(row.original.id);
                // Nothing to say is said with nothing: a tick on every complete
                // row would drown the rows that need attention, and so would
                // flagging everybody who has not typed in a home address. Only
                // gaps that hold something up reach this column; the rest are
                // on the employee's own page.
                const blocking = gaps
                    ? gaps.counts.CRITICAL + gaps.counts.IMPORTANT
                    : 0;
                if (!gaps || blocking === 0)
                    return <span className="text-xs text-muted-foreground">—</span>;
                const critical = gaps.counts.CRITICAL > 0;
                return (
                    <Link href={`/employees/${row.original.id}`} title={gaps.topIssue?.why}>
                        <Badge
                            variant="outline"
                            className={
                                critical
                                    ? 'border-red-200 bg-red-50 text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300'
                                    : 'border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-300'
                            }
                        >
                            {critical && <AlertTriangle className="mr-1 h-3 w-3" />}
                            {critical
                                ? `${gaps.counts.CRITICAL} blocking`
                                : `${gaps.counts.IMPORTANT} missing`}
                        </Badge>
                    </Link>
                );
            },
        },
        {
            accessorKey: 'joinDate',
            header: 'Join Date',
            cell: ({ row }) => (
                <span className="text-sm text-muted-foreground">
                    {formatDate(row.original.joinDate)}
                </span>
            ),
        },
        {
            id: 'actions',
            // The label names the person, not the control. A screen reader
            // moving down this column otherwise hears "button" two dozen times
            // with nothing to tell one row from the next — and this is the
            // keyboard path to a row, now that a mouse can click the row
            // itself.
            cell: ({ row }) => (
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            aria-label={`Actions for ${row.original.firstName} ${row.original.lastName}`}
                        >
                            <MoreHorizontal className="h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuItem
                            onClick={() => router.push(`/employees/${row.original.id}`)}
                        >
                            <Eye className="mr-2 h-4 w-4" /> View
                        </DropdownMenuItem>
                        {canManage && (
                            <DropdownMenuItem
                                onClick={() => router.push(`/employees/${row.original.id}/edit`)}
                            >
                                <Pencil className="mr-2 h-4 w-4" /> Edit
                            </DropdownMenuItem>
                        )}
                        {canManage && (
                            <DropdownMenuItem
                                className="text-red-600"
                                onClick={() => setDeleteTarget(row.original)}
                            >
                                <UserX className="mr-2 h-4 w-4" /> Delete
                            </DropdownMenuItem>
                        )}
                    </DropdownMenuContent>
                </DropdownMenu>
            ),
        },
    ];

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Employees</h1>
                    <p className="text-muted-foreground">
                        Manage your staff directory
                    </p>
                </div>
                {canManage && (
                    <div className="flex gap-2">
                        {/* Import stays available even with no roles yet: it can
                            create them from the file. */}
                        <Link href="/employees/import">
                            <Button variant="outline">
                                <Upload className="mr-2 h-4 w-4" /> Import
                            </Button>
                        </Link>
                        {needsRole ? (
                            <Button
                                disabled
                                title="Create a role first"
                                className="bg-gradient-to-r from-blue-600 to-indigo-600"
                            >
                                <Plus className="mr-2 h-4 w-4" /> Add Employee
                            </Button>
                        ) : (
                            <Link href="/employees/new">
                                <Button className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700">
                                    <Plus className="mr-2 h-4 w-4" /> Add Employee
                                </Button>
                            </Link>
                        )}
                    </div>
                )}
            </div>

            {needsRole && (
                <PrerequisiteNotice
                    message="Employees must be assigned a role. Create at least one role before adding employees."
                    href="/roles"
                    actionLabel="Create a role"
                />
            )}

            <div className="flex items-center gap-3">
                <Select
                    value={statusFilter}
                    onValueChange={setStatusFilter}
                >
                    <SelectTrigger className="w-44">
                        <SelectValue placeholder="All Statuses" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Statuses</SelectItem>
                        {Object.values(EmployeeStatus).map((s) => (
                            <SelectItem key={s} value={s}>
                                {s.replace(/_/g, ' ')}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            <DataTable
                columns={columns}
                data={employees}
                loading={isLoading}
                searchPlaceholder="Search by name or email..."
                onSearchChange={setSearch}
                isError={isError}
                errorSubject="the employees"
                emptyTitle="No employees found"
                emptyDescription="Get started by adding your first employee."
                onRowClick={(employee) =>
                    router.push(`/employees/${employee.id}`)
                }
            />

            <ConfirmDialog
                open={!!deleteTarget}
                onOpenChange={(open) => !open && setDeleteTarget(null)}
                title="Delete Employee"
                description={`Are you sure you want to delete ${deleteTarget?.firstName} ${deleteTarget?.lastName}? This action cannot be undone.`}
                confirmLabel="Delete"
                variant="destructive"
                loading={deleteMutation.isPending}
                onConfirm={async () => {
                    if (!deleteTarget) return;
                    await deleteMutation.mutateAsync(deleteTarget.id);
                    setDeleteTarget(null);
                }}
            />
        </div>
    );
}
