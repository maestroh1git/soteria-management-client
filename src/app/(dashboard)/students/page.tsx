'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ColumnDef } from '@tanstack/react-table';
import { Eye, Upload, Plus } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { DataTable } from '@/components/common/data-table';
import { StatusBadge } from '@/components/common/status-badge';
import { useStudents } from '@/lib/hooks/use-students';
import { useAuth } from '@/lib/hooks/use-auth';
import { formatDate } from '@/lib/utils/dates';
import type { Student } from '@/lib/api/students';

/**
 * The pupil roster.
 *
 * The thing Soteria does not have today, and the reason Stage 1 was worth
 * shipping before the admissions pipeline above it.
 */
export default function StudentsPage() {
    const router = useRouter();
    const { hasRole } = useAuth();
    const canManage = hasRole([
        'tenant_owner',
        'ADMIN',
        'admissions.registrar',
    ]);

    const [status, setStatus] = useState('all');
    const [search, setSearch] = useState('');
    const { data: students = [], isLoading } = useStudents({ status, search });

    const columns: ColumnDef<Student>[] = [
        {
            accessorKey: 'admissionNumber',
            header: 'Adm. No.',
            cell: ({ row }) => (
                <span className="font-medium text-blue-600 dark:text-blue-400">
                    {row.original.admissionNumber}
                </span>
            ),
        },
        {
            id: 'name',
            header: 'Name',
            accessorFn: (r) => `${r.firstName} ${r.lastName}`,
            cell: ({ row }) => (
                <div>
                    <p className="font-medium">
                        {row.original.firstName} {row.original.lastName}
                    </p>
                    <p className="text-xs text-muted-foreground">
                        {row.original.gender === 'FEMALE' ? 'Female' : 'Male'} ·{' '}
                        {formatDate(row.original.dateOfBirth)}
                    </p>
                </div>
            ),
        },
        {
            id: 'class',
            header: 'Class',
            cell: ({ row }) => {
                const arm = row.original.currentClassArm;
                return (
                    <span className="text-sm">
                        {arm ? `${arm.level?.name ?? ''} ${arm.name}`.trim() : '—'}
                    </span>
                );
            },
        },
        {
            accessorKey: 'status',
            header: 'Status',
            cell: ({ row }) => <StatusBadge status={row.original.status} />,
        },
        {
            accessorKey: 'admissionDate',
            header: 'Admitted',
            cell: ({ row }) => (
                <span className="text-sm text-muted-foreground">
                    {formatDate(row.original.admissionDate)}
                </span>
            ),
        },
        {
            id: 'actions',
            cell: ({ row }) => (
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => router.push(`/students/${row.original.id}`)}
                    aria-label="View student"
                >
                    <Eye className="h-4 w-4" />
                </Button>
            ),
        },
    ];

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Students</h1>
                    <p className="text-muted-foreground">The school roll</p>
                </div>
                {canManage && (
                    <div className="flex gap-2">
                        <Link href="/students/import">
                            <Button variant="outline">
                                <Upload className="mr-2 h-4 w-4" /> Import
                            </Button>
                        </Link>
                        <Link href="/students/new">
                            <Button className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700">
                                <Plus className="mr-2 h-4 w-4" /> Admit student
                            </Button>
                        </Link>
                    </div>
                )}
            </div>

            <div className="flex items-center gap-3">
                <Input
                    placeholder="Search by name or admission number…"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="max-w-sm"
                />
                <Select value={status} onValueChange={setStatus}>
                    <SelectTrigger className="w-44">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All statuses</SelectItem>
                        <SelectItem value="ACTIVE">Active</SelectItem>
                        <SelectItem value="GRADUATED">Graduated</SelectItem>
                        <SelectItem value="TRANSFERRED">Transferred</SelectItem>
                        <SelectItem value="WITHDRAWN">Withdrawn</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            <DataTable columns={columns} data={students} loading={isLoading} />
        </div>
    );
}
