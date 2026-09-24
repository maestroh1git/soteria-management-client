'use client';

import { useState } from 'react';
import type { ColumnDef } from '@tanstack/react-table';
import { Check, MoreHorizontal, Plus, Undo2, Users, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
import { PageHeader } from '@/components/layout/page-header';
import { DataTable } from '@/components/common/data-table';
import { Money } from '@/components/common/money';
import { StatusBadge } from '@/components/common/status-badge';
import { StudentLink } from '@/components/common/entity-link';
import type { PickedStudent } from '@/components/common/student-picker';
import { useAuth } from '@/lib/hooks/use-auth';
import { useCan } from '@/lib/hooks/use-can';
import { useSessions } from '@/lib/hooks/use-academics';
import {
    useConcessionDecision,
    useConcessions,
    useSiblingCandidates,
    useWithdrawConcession,
} from '@/lib/hooks/use-fees';
import { statusOptions } from '@/lib/status/registry';
import type { Concession } from '@/lib/api/fees';
import { RaiseConcessionDialog } from './raise-concession-dialog';

/**
 * Concessions (ROADMAP-EXECUTION.md, 5.1): discounts on one pupil's fees.
 * Raised by the finance office or the registrar, decided by the owner, an
 * admin or an Approver, never by the person who raised it (decision D3).
 */
export function ConcessionsScreen() {
    const { user: me } = useAuth();
    const can = useCan();
    const canRaise = can('fees.concessions.raise');
    const canDecide = can('fees.concessions.decide');

    const { data: sessions = [] } = useSessions();
    const [sessionPick, setSessionPick] = useState<string>();
    const sessionId = sessionPick ?? (sessions.find((s) => s.isCurrent) ?? sessions[0])?.id;
    const [status, setStatus] = useState<string>();

    const { data: concessions = [], isLoading, isError } = useConcessions({ sessionId });
    const decide = useConcessionDecision();
    const withdraw = useWithdrawConcession();
    const { data: families = [] } = useSiblingCandidates(canRaise);

    const [raising, setRaising] = useState(false);
    const [forStudent, setForStudent] = useState<PickedStudent | null>(null);
    const [showFamilies, setShowFamilies] = useState(false);

    const shown = concessions.filter((c) => !status || c.status === status);
    const waiting = concessions.filter((c) => c.status === 'PENDING').length;
    const raise = (student: PickedStudent | null) => {
        setForStudent(student);
        setRaising(true);
    };

    const columns: ColumnDef<Concession>[] = [
        {
            id: 'pupil',
            header: 'Pupil',
            meta: { cardTitle: true },
            cell: ({ row }) => (
                <span>
                    <StudentLink id={row.original.studentId} name={row.original.studentName} className="font-medium" />
                    <span className="block text-xs text-muted-foreground">{row.original.admissionNumber}</span>
                </span>
            ),
        },
        {
            id: 'on',
            header: 'On',
            cell: ({ row }) => (
                <span>
                    {row.original.feeName ?? 'The whole bill'}
                    <span className="block text-xs text-muted-foreground">
                        {row.original.termName ?? 'Every term'}
                    </span>
                </span>
            ),
        },
        {
            id: 'discount',
            header: 'Discount',
            meta: { align: 'right' },
            cell: ({ row }) =>
                row.original.kind === 'PERCENTAGE' ? (
                    <span className="tabular-nums">{Number(row.original.value)}%</span>
                ) : (
                    <Money value={row.original.value} />
                ),
        },
        {
            id: 'reason',
            header: 'Reason',
            cell: ({ row }) => <span className="text-muted-foreground">{row.original.reason}</span>,
        },
        {
            id: 'status',
            header: 'Status',
            cell: ({ row }) => <StatusBadge kind="concession" status={row.original.status} />,
        },
    ];

    return (
        <div className="space-y-6">
            <PageHeader
                title="Concessions"
                description="Discounts on one pupil’s fees. Each is raised by one person and approved by another before it reaches a bill."
                actions={
                    canRaise && (
                        <>
                            {families.length > 0 && (
                                <Button variant="outline" onClick={() => setShowFamilies((v) => !v)}>
                                    <Users className="mr-2 h-4 w-4" /> Families with siblings ({families.length})
                                </Button>
                            )}
                            <Button onClick={() => raise(null)}>
                                <Plus className="mr-2 h-4 w-4" /> Raise a concession
                            </Button>
                        </>
                    )
                }
            />

            {showFamilies && (
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">Families with more than one child here</CardTitle>
                        <CardDescription>
                            A suggestion, never applied by itself: decide who counts as a sibling, then
                            raise a concession for each child it applies to.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <ul className="divide-y">
                            {families.map((f) => (
                                <li key={f.guardianId} className="py-3">
                                    <p className="text-sm font-medium">{f.guardianName}</p>
                                    <ul className="mt-1 flex flex-wrap gap-2">
                                        {f.children.map((c) => (
                                            <li key={c.id}>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() =>
                                                        raise({ id: c.id, name: c.name, admissionNumber: c.admissionNumber })
                                                    }
                                                >
                                                    <Plus className="mr-1 h-3.5 w-3.5" /> {c.name}
                                                </Button>
                                            </li>
                                        ))}
                                    </ul>
                                </li>
                            ))}
                        </ul>
                    </CardContent>
                </Card>
            )}

            <div className="flex flex-wrap items-center gap-2">
                <Select value={sessionId} onValueChange={setSessionPick}>
                    <SelectTrigger className="w-44" aria-label="Session">
                        <SelectValue placeholder="Session" />
                    </SelectTrigger>
                    <SelectContent>
                        {sessions.map((s) => (
                            <SelectItem key={s.id} value={s.id}>
                                {s.name}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                {waiting > 0 && (
                    <Button
                        variant={status === 'PENDING' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setStatus(status === 'PENDING' ? undefined : 'PENDING')}
                    >
                        Awaiting approval ({waiting})
                    </Button>
                )}
            </div>

            <DataTable
                columns={columns}
                data={shown}
                loading={isLoading}
                isError={isError}
                errorSubject="the concessions"
                searchText={(c) => `${c.studentName} ${c.admissionNumber} ${c.reason} ${c.feeName ?? ''}`}
                searchPlaceholder="Pupil, admission no. or reason"
                filters={[{ id: 'status', label: 'statuses', value: status, options: statusOptions('concession') }]}
                onFilterChange={(_, v) => setStatus(v)}
                emptyTitle={status ? 'No concessions match' : 'No concessions this session'}
                emptyDescription={
                    status
                        ? 'Try another status.'
                        : canRaise
                          ? 'Raise one for a staff child, a sibling or a family in hardship.'
                          : 'None have been raised this session.'
                }
                rowActions={(c) => {
                    if (c.status !== 'PENDING') return null;
                    const mine = !!me && c.requestedBy === me.id;
                    const decidable = canDecide && !mine;
                    const withdrawable = canRaise;
                    if (!decidable && !withdrawable) return null;
                    return (
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8" aria-label={`Actions for ${c.studentName}`}>
                                    <MoreHorizontal className="h-4 w-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                {decidable && (
                                    <>
                                        <DropdownMenuItem onClick={() => decide.mutate({ id: c.id, approve: true })}>
                                            <Check className="mr-2 h-4 w-4" /> Approve
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => decide.mutate({ id: c.id, approve: false })}>
                                            <X className="mr-2 h-4 w-4" /> Refuse
                                        </DropdownMenuItem>
                                    </>
                                )}
                                {canDecide && mine && (
                                    <DropdownMenuItem disabled>
                                        You raised this; somebody else must decide it
                                    </DropdownMenuItem>
                                )}
                                {withdrawable && (
                                    <DropdownMenuItem onClick={() => withdraw.mutate(c.id)}>
                                        <Undo2 className="mr-2 h-4 w-4" /> Withdraw
                                    </DropdownMenuItem>
                                )}
                            </DropdownMenuContent>
                        </DropdownMenu>
                    );
                }}
            />

            <RaiseConcessionDialog
                open={raising}
                onOpenChange={setRaising}
                sessionId={sessionId}
                student={forStudent}
            />
        </div>
    );
}
