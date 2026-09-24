'use client';

import { useState } from 'react';
import type { ColumnDef } from '@tanstack/react-table';
import { Plus, UserMinus } from 'lucide-react';
import { Button } from '@/components/ui/button';
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
import { ConfirmDialog } from '@/components/common/confirm-dialog';
import { StudentLink } from '@/components/common/entity-link';
import { useCan } from '@/lib/hooks/use-can';
import { useSessions } from '@/lib/hooks/use-academics';
import {
    useFeeItems,
    useStudentFeeSubscriptions,
    useUnsubscribeStudentFee,
} from '@/lib/hooks/use-fees';
import type { Subscription } from '@/lib/api/fees';
import { AddToFeeDialog } from './add-to-fee-dialog';

/**
 * Optional fees (ROADMAP-EXECUTION.md, 5.2): who takes the bus, lunch or a
 * club. Only fees marked optional on the catalogue appear; everyone else's
 * fees come from their class on the price list.
 */
export function OptionalFeesScreen() {
    const canWrite = useCan()('fees.write');
    const { data: sessions = [] } = useSessions();
    const [sessionPick, setSessionPick] = useState<string>();
    const sessionId = sessionPick ?? (sessions.find((s) => s.isCurrent) ?? sessions[0])?.id;

    const { data: items = [] } = useFeeItems();
    const optional = items.filter((i) => i.isOptional && i.active);
    const { data: subs = [], isLoading, isError } = useStudentFeeSubscriptions({ sessionId });
    const remove = useUnsubscribeStudentFee();

    const [fee, setFee] = useState<string>();
    const [adding, setAdding] = useState(false);
    const [removing, setRemoving] = useState<Subscription | null>(null);

    const active = subs.filter((s) => s.active);
    const shown = active.filter((s) => !fee || s.feeItemId === fee);
    const countFor = (id: string) => active.filter((s) => s.feeItemId === id).length;

    const columns: ColumnDef<Subscription>[] = [
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
        { id: 'fee', header: 'Fee', cell: ({ row }) => row.original.feeName },
        {
            id: 'price',
            header: 'Their price',
            meta: { align: 'right' },
            cell: ({ row }) =>
                row.original.amount ? (
                    <Money value={row.original.amount} />
                ) : (
                    <span className="text-muted-foreground">Price list</span>
                ),
        },
        {
            id: 'notes',
            header: 'Note',
            cell: ({ row }) => <span className="text-muted-foreground">{row.original.notes ?? '—'}</span>,
        },
    ];

    return (
        <div className="space-y-6">
            <PageHeader
                title="Optional fees"
                description="Who takes the extras: transport, lunch, clubs. Billed on the next invoice run."
                actions={
                    canWrite &&
                    optional.length > 0 && (
                        <Button onClick={() => setAdding(true)}>
                            <Plus className="mr-2 h-4 w-4" /> Add a pupil
                        </Button>
                    )
                }
            />

            {optional.length > 0 && (
                <div className="flex flex-wrap gap-2" aria-label="Filter by fee">
                    {optional.map((i) => (
                        <button
                            key={i.id}
                            type="button"
                            aria-pressed={fee === i.id}
                            onClick={() => setFee(fee === i.id ? undefined : i.id)}
                            className={`rounded-full border px-3 py-1 text-sm ${
                                fee === i.id ? 'border-primary bg-primary text-primary-foreground' : 'hover:bg-muted'
                            }`}
                        >
                            {i.name} <span className="tabular-nums opacity-70">{countFor(i.id)}</span>
                        </button>
                    ))}
                </div>
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
            </div>

            <DataTable
                columns={columns}
                data={shown}
                loading={isLoading}
                isError={isError}
                errorSubject="the optional fees"
                searchText={(s) => `${s.studentName} ${s.admissionNumber} ${s.notes ?? ''}`}
                searchPlaceholder="Pupil, admission no. or note"
                filters={[
                    {
                        id: 'fee',
                        label: 'fees',
                        value: fee,
                        options: optional.map((i) => ({ value: i.id, label: i.name })),
                    },
                ]}
                onFilterChange={(_, v) => setFee(v)}
                emptyTitle={
                    optional.length === 0
                        ? 'No optional fees yet'
                        : fee
                          ? 'Nobody takes this fee'
                          : 'Nobody takes an optional fee'
                }
                emptyDescription={
                    optional.length === 0
                        ? 'Mark a fee as optional on the price list’s catalogue (transport, lunch), then add the pupils who take it.'
                        : 'Add the pupils who take it; they are billed from the next invoice run.'
                }
                emptyAction={
                    canWrite && optional.length > 0
                        ? { label: 'Add a pupil', onClick: () => setAdding(true) }
                        : undefined
                }
                rowActions={
                    canWrite
                        ? (s) => (
                              <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8"
                                  aria-label={`Take ${s.studentName} off ${s.feeName}`}
                                  onClick={() => setRemoving(s)}
                              >
                                  <UserMinus className="h-4 w-4" />
                              </Button>
                          )
                        : undefined
                }
            />

            <AddToFeeDialog
                open={adding}
                onOpenChange={setAdding}
                sessionId={sessionId}
                fees={optional}
                feeItemId={fee}
            />
            <ConfirmDialog
                open={!!removing}
                onOpenChange={(o) => !o && setRemoving(null)}
                title={`Take ${removing?.studentName ?? ''} off ${removing?.feeName ?? ''}?`}
                description="They stop being billed for it from the next invoice run. Invoices already issued are not changed."
                confirmLabel="Take off the fee"
                loading={remove.isPending}
                onConfirm={async () => {
                    if (!removing) return;
                    await remove.mutateAsync(removing.id).then(
                        () => setRemoving(null),
                        () => undefined,
                    );
                }}
            />
        </div>
    );
}
