'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ColumnDef } from '@tanstack/react-table';
import { MoreHorizontal, Plus, Eye, Pencil, UserX } from 'lucide-react';
import { Button } from '@/components/ui/button';
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
import { useEmployees, useDeleteEmployee } from '@/lib/hooks/use-employees';
import { ConfirmDialog } from '@/components/common/confirm-dialog';
import { EmployeeStatus } from '@/lib/types/enums';
import { formatDate } from '@/lib/utils/dates';
import type { Employee } from '@/lib/types/api';

export default function EmployeesPage() {
    const router = useRouter();
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [search, setSearch] = useState('');
    const [deleteTarget, setDeleteTarget] = useState<Employee | null>(null);

    const { data: employees = [], isLoading } = useEmployees({
        status: statusFilter !== 'all' ? statusFilter : undefined,
        search: search || undefined,
    });

    const deleteMutation = useDeleteEmployee();

    const columns: ColumnDef<Employee>[] = [
        {
            accessorKey: 'employeeNumber',
            header: 'Emp #',
            cell: ({ row }) => (
                <span className="font-medium text-blue-600 dark:text-blue-400">
                    {row.original.employeeNumber}
                </span>
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
            cell: ({ row }) => (
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuItem
                            onClick={() => router.push(`/employees/${row.original.id}`)}
                        >
                            <Eye className="mr-2 h-4 w-4" /> View
                        </DropdownMenuItem>
                        <DropdownMenuItem
                            onClick={() => router.push(`/employees/${row.original.id}?edit=true`)}
                        >
                            <Pencil className="mr-2 h-4 w-4" /> Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                            className="text-red-600"
                            onClick={() => setDeleteTarget(row.original)}
                        >
                            <UserX className="mr-2 h-4 w-4" /> Delete
                        </DropdownMenuItem>
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
                        Manage your school&apos;s staff directory
                    </p>
                </div>
                <Link href="/employees/new">
                    <Button className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700">
                        <Plus className="mr-2 h-4 w-4" /> Add Employee
                    </Button>
                </Link>
            </div>

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
                emptyTitle="No employees found"
                emptyDescription="Get started by adding your first employee."
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
