'use client';

import { useState } from 'react';
import { MessageSquarePlus, Phone } from 'lucide-react';
import type { ColumnDef } from '@tanstack/react-table';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { PageHeader } from '@/components/layout/page-header';
import { DataTable } from '@/components/common/data-table';
import { StatusBadge } from '@/components/common/status-badge';
import { StudentLink } from '@/components/common/entity-link';
import { LogContactDialog } from '@/features/students/record/log-contact-dialog';
import { useCurrentSession, useTerms } from '@/lib/hooks/use-academics';
import { useAtRisk } from '@/lib/hooks/use-attendance';
import { useCan } from '@/lib/hooks/use-can';
import type { AtRiskPupil } from '@/lib/api/attendance';
import { formatDate } from '@/lib/utils/dates';

/**
 * Pupils whose attendance has fallen.
 *
 * The most operationally valuable screen in the phase: falling attendance
 * precedes a withdrawal by weeks, and a withdrawal precedes unpaid fees. Every
 * row carries the primary guardian's name and number, because the action is
 * always to contact someone and a report that needs a second screen to act on
 * does not get acted on.
 */
export default function AtRiskPage() {
    const can = useCan();
    const { data: session } = useCurrentSession();
    const { data: terms = [] } = useTerms(session?.id);
    const [termId, setTermId] = useState<string | null>(null);
    const [threshold, setThreshold] = useState(85);
    const [page, setPage] = useState(1);
    const activeTerm = termId ?? terms.find((t) => t.isCurrent)?.id ?? terms[0]?.id;

    const { data, isLoading, isError } = useAtRisk({ termId: activeTerm, threshold, page });
    const [className, setClassName] = useState<string>();
    const [logging, setLogging] = useState<AtRiskPupil | null>(null);
    const classes = [...new Set((data?.items ?? []).map((p) => p.className))]
        .sort()
        .map((c) => ({ value: c, label: c }));
    const pupils = (data?.items ?? []).filter((p) => !className || p.className === className);

    const columns: ColumnDef<AtRiskPupil>[] = [
        {
            id: 'pupil',
            header: 'Pupil',
            meta: { cardTitle: true },
            cell: ({ row }) => (
                <div>
                    <StudentLink
                        id={row.original.studentId}
                        name={`${row.original.lastName}, ${row.original.firstName}`}
                        className="font-medium"
                    />
                    <span className="block text-xs tabular-nums text-muted-foreground">
                        {row.original.admissionNumber}
                    </span>
                </div>
            ),
        },
        {
            id: 'class',
            header: 'Class',
            cell: ({ row }) => <span className="text-muted-foreground">{row.original.className}</span>,
        },
        {
            id: 'inSchool',
            header: 'In school',
            cell: ({ row }) => (
                <span className="tabular-nums">
                    {row.original.inSchool} of {row.original.teachingDays}
                </span>
            ),
        },
        {
            id: 'rate',
            header: 'Attendance',
            cell: ({ row }) => (
                <span className="rounded bg-red-50 px-2 py-0.5 text-xs font-semibold tabular-nums text-red-700 dark:bg-red-950/50 dark:text-red-300">
                    {row.original.attendanceRate}%
                </span>
            ),
        },
        {
            id: 'guardian',
            header: 'Who to call',
            cell: ({ row }) =>
                row.original.guardianPhone ? (
                    <a
                        href={`tel:${row.original.guardianPhone}`}
                        className="inline-flex items-center gap-1.5 hover:underline"
                    >
                        <Phone className="h-3.5 w-3.5" aria-hidden="true" />
                        <span>
                            {row.original.guardianName}
                            <span className="block text-xs tabular-nums text-muted-foreground">
                                {row.original.guardianPhone}
                            </span>
                        </span>
                    </a>
                ) : (
                    <span className="text-xs text-muted-foreground">No guardian on file</span>
                ),
        },
        {
            id: 'lastContact',
            header: 'Last contact',
            cell: ({ row }) => {
                const c = row.original.lastContact;
                if (!c) return <span className="text-xs text-muted-foreground">None yet</span>;
                return (
                    <div className="space-y-1">
                        <StatusBadge kind="contactOutcome" status={c.reached ? 'REACHED' : 'NOT_REACHED'} />
                        <span className="block text-xs text-muted-foreground">
                            {formatDate(c.at)}
                            {c.by ? ` · ${c.by}` : ''}
                        </span>
                    </div>
                );
            },
        },
    ];

    return (
        <div className="space-y-6">
            <PageHeader
                title="Pupils to follow up"
                description="Attendance below your threshold this term, worst first. A child who stops coming usually stops weeks before anyone notices."
            />

            <div className="flex flex-wrap items-end gap-4">
                <div className="space-y-1.5">
                    <Label htmlFor="risk-term">Term</Label>
                    <Select
                        value={activeTerm}
                        onValueChange={(v) => {
                            setTermId(v);
                            setPage(1);
                        }}
                    >
                        <SelectTrigger id="risk-term" className="w-52">
                            <SelectValue placeholder="Choose a term" />
                        </SelectTrigger>
                        <SelectContent>
                            {terms.map((t) => (
                                <SelectItem key={t.id} value={t.id}>
                                    {t.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                <div className="space-y-1.5">
                    <Label htmlFor="risk-threshold">Below (%)</Label>
                    <Input
                        id="risk-threshold"
                        type="number"
                        min={1}
                        max={100}
                        value={threshold}
                        onChange={(e) => {
                            setThreshold(Number(e.target.value) || 85);
                            setPage(1);
                        }}
                        className="w-24"
                    />
                </div>
                {data && data.total > 0 && (
                    <p className="pb-2 text-sm tabular-nums text-muted-foreground">
                        {data.total} {data.total === 1 ? 'pupil' : 'pupils'} of {data.teachingDays} teaching
                        days so far.
                    </p>
                )}
            </div>

            <DataTable
                columns={columns}
                data={pupils}
                loading={isLoading}
                isError={isError}
                errorSubject="the attendance figures"
                searchText={(p) =>
                    [p.firstName, p.lastName, p.admissionNumber, p.guardianName, p.guardianPhone]
                        .filter(Boolean)
                        .join(' ')
                }
                searchPlaceholder="Pupil, admission no. or guardian…"
                filters={[{ id: 'class', label: 'classes', value: className, options: classes }]}
                onFilterChange={(_, value) => setClassName(value)}
                pagination={
                    data && data.totalPages > 1
                        ? { page: data.page, limit: data.limit, total: data.total, totalPages: data.totalPages }
                        : undefined
                }
                onPageChange={setPage}
                rowActions={
                    can('contacts.log')
                        ? (p) => (
                              <Button variant="ghost" size="sm" onClick={() => setLogging(p)}>
                                  <MessageSquarePlus className="mr-1.5 h-4 w-4" />
                                  Log contact
                              </Button>
                          )
                        : undefined
                }
                emptyTitle={className ? 'Nobody in this class matches' : 'Nobody is below this threshold'}
                emptyDescription={
                    className
                        ? 'Try another class or search.'
                        : 'Every pupil with a register this term is attending above the level you set.'
                }
            />

            {logging && (
                <LogContactDialog
                    open={!!logging}
                    onOpenChange={(open) => !open && setLogging(null)}
                    studentId={logging.studentId}
                    pupilName={`${logging.firstName} ${logging.lastName}`}
                    guardianName={logging.guardianName}
                />
            )}
        </div>
    );
}
