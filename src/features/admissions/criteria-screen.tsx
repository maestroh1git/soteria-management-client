'use client';

import { useState } from 'react';
import { Pencil, Trash2 } from 'lucide-react';
import type { ColumnDef } from '@tanstack/react-table';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { PageHeader } from '@/components/layout/page-header';
import { DataTable } from '@/components/common/data-table';
import { ConfirmDialog } from '@/components/common/confirm-dialog';
import { useClassLevels, useSessions } from '@/lib/hooks/use-academics';
import { useCriteria, useRemoveCriteria } from '@/lib/hooks/use-admissions';
import { useCan } from '@/lib/hooks/use-can';
import type { AdmissionCriteria } from '@/lib/api/admissions';
import type { ClassLevel } from '@/lib/api/academics';
import { CriteriaDialog } from './criteria-dialog';

type Row = { level: ClassLevel; criteria?: AdmissionCriteria };

/** "5", "5½": ages in whole and half years, as a registrar says them. */
function age(months: number | null): string | null {
    if (months == null) return null;
    const years = Math.floor(months / 12);
    const rest = months % 12;
    return rest === 0 ? `${years}` : rest === 6 ? `${years}½` : `${years}y ${rest}m`;
}

function ageRange(c?: AdmissionCriteria): string {
    const lo = age(c?.minAgeMonths ?? null);
    const hi = age(c?.maxAgeMonths ?? null);
    if (lo && hi) return `${lo} to ${hi} years`;
    if (lo) return `${lo} years or older`;
    if (hi) return `Up to ${hi} years`;
    return 'Any age';
}

/**
 * What the school asks of each class it admits into, one session at a time
 * (ROADMAP-EXECUTION.md, 5.10): an age range, a lowest exam score, whether an
 * interview is needed. Each application shows how the candidate measures up;
 * nothing here refuses anyone.
 */
export function CriteriaScreen() {
    const can = useCan();
    const canEdit = can('admissions.setQuestions');
    const { data: sessions = [] } = useSessions();
    const { data: levels = [], isLoading: levelsLoading } = useClassLevels();
    const [picked, setPicked] = useState<string>();
    const sessionId = picked ?? sessions.find((s) => s.isCurrent)?.id ?? sessions[0]?.id;
    const { data: criteria = [], isLoading, isError } = useCriteria(sessionId);
    const remove = useRemoveCriteria();

    const [editing, setEditing] = useState<Row | null>(null);
    const [removing, setRemoving] = useState<Row | null>(null);

    const rows: Row[] = [...levels]
        .filter((l) => l.active !== false)
        .sort((a, b) => a.sortOrder - b.sortOrder)
        .map((level) => ({ level, criteria: criteria.find((c) => c.classLevelId === level.id) }));

    const columns: ColumnDef<Row>[] = [
        {
            id: 'level',
            header: 'Class',
            meta: { cardTitle: true },
            cell: ({ row }) => <span className="font-medium">{row.original.level.name}</span>,
        },
        {
            id: 'age',
            header: 'Age',
            cell: ({ row }) =>
                row.original.criteria ? (
                    ageRange(row.original.criteria)
                ) : (
                    <span className="text-muted-foreground">None set</span>
                ),
        },
        {
            id: 'score',
            header: 'Lowest exam score',
            cell: ({ row }) =>
                row.original.criteria?.minExamScore ? (
                    `${Number(row.original.criteria.minExamScore)}%`
                ) : (
                    <span className="text-muted-foreground">—</span>
                ),
        },
        {
            id: 'interview',
            header: 'Interview',
            cell: ({ row }) =>
                row.original.criteria ? (
                    row.original.criteria.requiresInterview ? 'Required' : 'Not required'
                ) : (
                    <span className="text-muted-foreground">—</span>
                ),
        },
        {
            id: 'notes',
            header: 'Notes',
            meta: { hideOnCard: true },
            cell: ({ row }) => (
                <span className="line-clamp-2 text-muted-foreground">{row.original.criteria?.notes ?? ''}</span>
            ),
        },
    ];

    return (
        <div className="space-y-6">
            <PageHeader
                title="Admission criteria"
                description="What the school asks of each class, per session. Applications show how a candidate measures up; nothing is refused automatically."
            />

            <div className="space-y-1.5">
                <Label htmlFor="criteria-session">Session</Label>
                <Select value={sessionId} onValueChange={setPicked}>
                    <SelectTrigger id="criteria-session" className="w-56">
                        <SelectValue placeholder="Choose a session" />
                    </SelectTrigger>
                    <SelectContent>
                        {sessions.map((s) => (
                            <SelectItem key={s.id} value={s.id}>
                                {s.name}
                                {s.isCurrent ? ' (current)' : ''}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            <DataTable
                columns={columns}
                data={rows}
                loading={levelsLoading || isLoading}
                isError={isError}
                errorSubject="the criteria"
                rowActions={
                    canEdit && sessionId
                        ? (r) => (
                              <div className="flex justify-end gap-1">
                                  <Button variant="ghost" size="sm" onClick={() => setEditing(r)}>
                                      <Pencil className="mr-1.5 h-4 w-4" />
                                      {r.criteria ? 'Edit' : 'Set criteria'}
                                  </Button>
                                  {r.criteria && (
                                      <Button
                                          variant="ghost"
                                          size="sm"
                                          aria-label={`Remove the criteria for ${r.level.name}`}
                                          onClick={() => setRemoving(r)}
                                      >
                                          <Trash2 className="h-4 w-4" />
                                      </Button>
                                  )}
                              </div>
                          )
                        : undefined
                }
                emptyTitle="No classes yet"
                emptyDescription="Add class levels under Classes first; criteria are set per class."
            />

            {sessionId && (
                <CriteriaDialog
                    open={!!editing}
                    onOpenChange={(o) => !o && setEditing(null)}
                    sessionId={sessionId}
                    level={editing?.level ?? null}
                    current={editing?.criteria}
                />
            )}

            <ConfirmDialog
                open={!!removing}
                onOpenChange={(o) => !o && setRemoving(null)}
                title={`Stop asking for this in ${removing?.level.name ?? ''}?`}
                description="Applications to this class will no longer be measured against these criteria. Nothing already decided changes."
                confirmLabel="Remove criteria"
                variant="destructive"
                loading={remove.isPending}
                onConfirm={async () => {
                    if (!removing?.criteria) return;
                    await remove.mutateAsync(removing.criteria.id);
                    setRemoving(null);
                }}
            />
        </div>
    );
}
