'use client';

import { useState } from 'react';
import type { ColumnDef } from '@tanstack/react-table';
import { MoreHorizontal, Pencil, Plus, Power, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { PageHeader } from '@/components/layout/page-header';
import { DataTable } from '@/components/common/data-table';
import { StatusBadge } from '@/components/common/status-badge';
import { ConfirmDialog } from '@/components/common/confirm-dialog';
import { useCan } from '@/lib/hooks/use-can';
import type { Department } from '@/lib/types/api';
import {
    useDeleteDepartment,
    useDepartments,
    useSetDepartmentActive,
} from '../hooks';
import { DepartmentFormDialog } from '../components/department-form-dialog';

/**
 * Departments (ROADMAP-EXECUTION.md: the reference for FormDialog, feature
 * folders and DataTable filters).
 */
export function DepartmentsScreen() {
    const canManage = useCan()('departments.manage');
    const { data: departments = [], isLoading, isError } = useDepartments();
    const setActive = useSetDepartmentActive();
    const remove = useDeleteDepartment();

    const [status, setStatus] = useState<'active' | 'inactive'>();
    const [editing, setEditing] = useState<Department | null>(null);
    const [formOpen, setFormOpen] = useState(false);
    const [deleting, setDeleting] = useState<Department | null>(null);

    const shown = status
        ? departments.filter((d) => d.active === (status === 'active'))
        : departments;

    const columns: ColumnDef<Department>[] = [
        {
            id: 'name',
            header: 'Name',
            meta: { cardTitle: true },
            cell: ({ row }) => <span className="font-medium">{row.original.name}</span>,
        },
        {
            id: 'description',
            header: 'Description',
            cell: ({ row }) => (
                <span className="text-muted-foreground">{row.original.description || '—'}</span>
            ),
        },
        {
            id: 'status',
            header: 'Status',
            cell: ({ row }) => (
                <StatusBadge
                    kind="active"
                    status={row.original.active ? 'ACTIVE' : 'INACTIVE'}
                />
            ),
        },
    ];

    return (
        <div className="space-y-6">
            <PageHeader
                title="Departments"
                description="The units your staff belong to"
                actions={
                    canManage && (
                        <Button
                            onClick={() => {
                                setEditing(null);
                                setFormOpen(true);
                            }}
                        >
                            <Plus className="mr-2 h-4 w-4" /> Add department
                        </Button>
                    )
                }
            />

            <DataTable
                columns={columns}
                data={shown}
                loading={isLoading}
                isError={isError}
                errorSubject="the departments"
                searchText={(d) => `${d.name} ${d.description ?? ''}`}
                searchPlaceholder="Search departments…"
                filters={[
                    {
                        id: 'status',
                        label: 'statuses',
                        value: status,
                        options: [
                            { value: 'active', label: 'Active' },
                            { value: 'inactive', label: 'Inactive' },
                        ],
                    },
                ]}
                onFilterChange={(_, v) => setStatus(v as typeof status)}
                emptyTitle={status ? 'No departments match' : 'No departments yet'}
                emptyDescription={
                    status
                        ? 'Try another status.'
                        : 'Add the first one; positions and budgets are organised by it.'
                }
                emptyAction={
                    canManage && !status
                        ? {
                              label: 'Add department',
                              onClick: () => {
                                  setEditing(null);
                                  setFormOpen(true);
                              },
                          }
                        : undefined
                }
                rowActions={
                    canManage
                        ? (dept) => (
                              <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                      <Button
                                          variant="ghost"
                                          size="icon"
                                          className="h-8 w-8"
                                          aria-label={`Actions for ${dept.name}`}
                                      >
                                          <MoreHorizontal className="h-4 w-4" />
                                      </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                      <DropdownMenuItem
                                          onClick={() => {
                                              setEditing(dept);
                                              setFormOpen(true);
                                          }}
                                      >
                                          <Pencil className="mr-2 h-4 w-4" /> Edit
                                      </DropdownMenuItem>
                                      <DropdownMenuItem
                                          onClick={() =>
                                              setActive.mutate({ id: dept.id, active: !dept.active })
                                          }
                                      >
                                          <Power className="mr-2 h-4 w-4" />
                                          {dept.active ? 'Deactivate' : 'Reactivate'}
                                      </DropdownMenuItem>
                                      <DropdownMenuSeparator />
                                      <DropdownMenuItem
                                          className="text-destructive focus:text-destructive"
                                          onClick={() => setDeleting(dept)}
                                      >
                                          <Trash2 className="mr-2 h-4 w-4" /> Delete
                                      </DropdownMenuItem>
                                  </DropdownMenuContent>
                              </DropdownMenu>
                          )
                        : undefined
                }
            />

            <DepartmentFormDialog open={formOpen} onOpenChange={setFormOpen} department={editing} />

            <ConfirmDialog
                open={!!deleting}
                onOpenChange={(open) => !open && setDeleting(null)}
                title={`Delete ${deleting?.name ?? 'department'}?`}
                description="This cannot be undone. To stop using it but keep its history, deactivate it instead."
                confirmLabel="Delete department"
                variant="destructive"
                loading={remove.isPending}
                onConfirm={async () => {
                    if (!deleting) return;
                    // A refusal is toasted by the hook; the dialog stays open.
                    await remove.mutateAsync(deleting.id).then(
                        () => setDeleting(null),
                        () => undefined,
                    );
                }}
            />
        </div>
    );
}
