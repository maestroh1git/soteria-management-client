'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ColumnDef } from '@tanstack/react-table';
import { Eye, Upload, Plus } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/common/data-table';
import { StatusBadge } from '@/components/common/status-badge';
import { useStudents } from '@/lib/hooks/use-students';
import { useCan } from '@/lib/hooks/use-can';
import { formatDate } from '@/lib/utils/dates';
import type { Student } from '@/lib/api/students';
import { ClassLink } from '@/components/common/entity-link';
import { statusOptions } from '@/lib/status/registry';
import { useClassArms } from '@/lib/hooks/use-academics';
import { PageHeader } from '@/components/layout/page-header';
import { useLearnerTerm } from '@/lib/hooks/use-learner-term';

/**
 * The pupil roster.
 *
 * The thing Soteria does not have today, and the reason Stage 1 was worth
 * shipping before the admissions pipeline above it.
 */
export default function StudentsPage() {
    const router = useRouter();
    const can = useCan();
    const canManage = can('students.manage');
    const { word: learner } = useLearnerTerm();

    const [status, setStatus] = useState('all');
    const [classArmId, setClassArmId] = useState<string>();
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const {
        data: rollPage,
        isLoading,
        isError,
    } = useStudents({ status, classArmId, search, page });
    // Every class, for the filter: arms are readable by anyone signed in.
    const { data: arms = [] } = useClassArms();
    const students = rollPage?.items ?? [];

    // A filter or search change with the reader on page 5 shows an empty table
    // that reads as "no pupils".
    useEffect(() => {
        setPage(1);
    }, [status, classArmId, search]);

    const columns: ColumnDef<Student>[] = [
        {
            accessorKey: 'admissionNumber',
            header: 'Adm. No.',
            cell: ({ row }) => (
                // On a phone this is the only way into a pupil's record, and it
                // was a 36x17 target in a 53px row — under the 24x24 WCAG 2.5.8
                // minimum, surrounded by dead space. The negative margin keeps
                // the row's height unchanged while the tap area fills it.
                <Link
                    href={`/students/${row.original.id}`}
                    className="-my-2 inline-flex min-h-[44px] items-center py-2 font-medium text-blue-600 hover:underline dark:text-blue-400"
                >
                    {row.original.admissionNumber}
                </Link>
            ),
        },
        {
            id: 'name',
            header: 'Name',
            meta: { cardTitle: true },
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
                        {arm ? (
                            <ClassLink
                                armId={arm.id}
                                name={`${arm.level?.name ?? ''} ${arm.name}`.trim()}
                            />
                        ) : (
                            '—'
                        )}
                    </span>
                );
            },
        },
        {
            accessorKey: 'status',
            header: 'Status',
            cell: ({ row }) => <StatusBadge kind="student" status={row.original.status} />,
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
                    aria-label={`View ${row.original.firstName} ${row.original.lastName}`}
                >
                    <Eye className="h-4 w-4" />
                </Button>
            ),
        },
    ];

    return (
        <div className="space-y-6">
            <PageHeader
                title={learner({ plural: true, capital: true })}
                description="The school roll"
                actions={
                    canManage && (
                        <>
                            <Link href="/students/import">
                                <Button variant="outline">
                                    <Upload className="mr-2 h-4 w-4" /> Import
                                </Button>
                            </Link>
                            <Link href="/students/new">
                                <Button>
                                    <Plus className="mr-2 h-4 w-4" /> Admit a {learner()}
                                </Button>
                            </Link>
                        </>
                    )
                }
            />

            <DataTable
                columns={columns}
                data={students}
                loading={isLoading}
                isError={isError}
                errorSubject="the roll"
                searchPlaceholder="Name or admission number"
                onSearchChange={setSearch}
                filters={[
                    {
                        id: 'status',
                        label: 'statuses',
                        value: status === 'all' ? undefined : status,
                        options: statusOptions('student'),
                    },
                    {
                        id: 'class',
                        label: 'classes',
                        value: classArmId,
                        options: arms.map((arm) => ({
                            value: arm.id,
                            label: `${arm.level?.name ?? ''} ${arm.name}`.trim(),
                        })),
                    },
                ]}
                onFilterChange={(id, value) =>
                    id === 'status' ? setStatus(value ?? 'all') : setClassArmId(value)
                }
                pagination={
                    rollPage && rollPage.totalPages > 1
                        ? {
                              page,
                              limit: rollPage.limit,
                              total: rollPage.total,
                              totalPages: rollPage.totalPages,
                          }
                        : undefined
                }
                onPageChange={setPage}
                onRowClick={(pupil) => router.push(`/students/${pupil.id}`)}
            />

        </div>
    );
}
