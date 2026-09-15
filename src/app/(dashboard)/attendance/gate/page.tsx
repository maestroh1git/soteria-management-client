'use client';

import { useState } from 'react';
import { Loader2, LogIn, LogOut, ShieldAlert } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { EmptyState } from '@/components/common/empty-state';
import { useStudents } from '@/lib/hooks/use-students';
import {
    useCollectors,
    useDepartures,
    useRecordDeparture,
    useRecordReturn,
} from '@/lib/hooks/use-attendance';
import {
    DEPARTURE_REASON_LABELS,
    type DepartureReason,
} from '@/lib/api/attendance';
import { cn } from '@/lib/utils';

const REASONS = Object.keys(DEPARTURE_REASON_LABELS) as DepartureReason[];

const time = (iso: string) =>
    new Date(iso).toLocaleTimeString('en-NG', {
        hour: '2-digit',
        minute: '2-digit',
    });

/**
 * The gate: signing children out during the day, and back in.
 *
 * Adults the school has barred from collecting a pupil are shown, disabled,
 * with the reason. Hiding them would be worse — the desk needs to know the man
 * at the gate is on file and not permitted, which is a different fact from not
 * knowing who he is. Choosing one opens the override, which is deliberately
 * uncomfortable: this is the record that gets pulled when something goes wrong.
 */
export default function GatePage() {
    const [search, setSearch] = useState('');
    const [studentId, setStudentId] = useState<string | null>(null);
    const [reason, setReason] = useState<DepartureReason>('APPOINTMENT');
    const [collectorId, setCollectorId] = useState<string | null>(null);
    const [overrideOpen, setOverrideOpen] = useState(false);
    const [overrideReason, setOverrideReason] = useState('');

    const { data: students } = useStudents({ search: search || undefined, limit: 10 });
    const { data: collectors = [], isLoading: loadingCollectors } =
        useCollectors(studentId ?? undefined);
    const { data: departures = [] } = useDepartures();
    const record = useRecordDeparture();
    const recordBack = useRecordReturn();

    const pupils = students?.items ?? [];
    const chosen = collectors.find((c) => c.guardianId === collectorId);

    const signOut = (override?: string) => {
        if (!studentId || !collectorId) return;
        record.mutate(
            {
                studentId,
                reasonCode: reason,
                collectedByGuardianId: collectorId,
                overrideReason: override,
            },
            {
                onSuccess: () => {
                    setStudentId(null);
                    setCollectorId(null);
                    setOverrideOpen(false);
                    setOverrideReason('');
                    setSearch('');
                },
            },
        );
    };

    const pupilName = pupils.find((p) => p.id === studentId);

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-semibold">The gate</h1>
                <p className="mt-1 text-sm text-muted-foreground">
                    Sign a pupil out during the day, and back in when they return.
                </p>
            </div>

            <Card>
                <CardContent className="space-y-4 py-5">
                    <div className="space-y-1.5">
                        <Label htmlFor="gate-search">Find a pupil</Label>
                        <Input
                            id="gate-search"
                            value={search}
                            onChange={(e) => {
                                setSearch(e.target.value);
                                setStudentId(null);
                                setCollectorId(null);
                            }}
                            placeholder="Name or admission number"
                            className="h-11"
                            autoFocus
                        />
                    </div>

                    {search && !studentId && (
                        <ul className="list-none divide-y rounded-lg border p-0">
                            {pupils.length === 0 && (
                                <li className="px-3 py-4 text-sm text-muted-foreground">
                                    No pupil found.
                                </li>
                            )}
                            {pupils.map((p) => (
                                <li key={p.id}>
                                    <button
                                        type="button"
                                        onClick={() => setStudentId(p.id)}
                                        className="flex w-full items-center justify-between gap-3 px-3 py-3 text-left hover:bg-accent"
                                    >
                                        <span className="text-sm font-medium">
                                            {p.lastName}, {p.firstName}
                                        </span>
                                        <span className="text-xs tabular-nums text-muted-foreground">
                                            {p.admissionNumber}
                                        </span>
                                    </button>
                                </li>
                            ))}
                        </ul>
                    )}

                    {studentId && (
                        <div className="space-y-4">
                            <div>
                                <h2 className="text-base font-semibold">
                                    {pupilName
                                        ? `${pupilName.lastName}, ${pupilName.firstName}`
                                        : 'Selected pupil'}
                                </h2>
                            </div>

                            <div className="space-y-1.5">
                                <Label htmlFor="gate-reason">Why are they leaving?</Label>
                                <Select
                                    value={reason}
                                    onValueChange={(v) => setReason(v as DepartureReason)}
                                >
                                    <SelectTrigger id="gate-reason" className="w-full sm:w-64">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {REASONS.map((r) => (
                                            <SelectItem key={r} value={r}>
                                                {DEPARTURE_REASON_LABELS[r]}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <fieldset>
                                <legend className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                                    Who is collecting them?
                                </legend>
                                {loadingCollectors ? (
                                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                                ) : collectors.length === 0 ? (
                                    <p className="rounded-lg bg-muted px-3 py-3 text-sm text-muted-foreground">
                                        No adult is recorded on this pupil&apos;s file. The
                                        school office must add a guardian before they can be
                                        signed out.
                                    </p>
                                ) : (
                                    <ul className="list-none divide-y rounded-lg border p-0">
                                        {collectors.map((c) => {
                                            const id = `collector-${c.guardianId}`;
                                            return (
                                                <li
                                                    key={c.guardianId}
                                                    className={cn(
                                                        'flex items-center gap-3 px-3 py-3',
                                                        !c.canCollect && 'bg-muted/60',
                                                    )}
                                                >
                                                    <input
                                                        type="radio"
                                                        id={id}
                                                        name="collector"
                                                        className="h-4 w-4 flex-none"
                                                        checked={collectorId === c.guardianId}
                                                        onChange={() => setCollectorId(c.guardianId)}
                                                    />
                                                    <label htmlFor={id} className="min-w-0 flex-1">
                                                        <span
                                                            className={cn(
                                                                'block text-sm font-medium',
                                                                !c.canCollect && 'text-muted-foreground',
                                                            )}
                                                        >
                                                            {c.name}
                                                        </span>
                                                        {c.canCollect ? (
                                                            <span className="block text-xs text-muted-foreground">
                                                                {c.relationship.toLowerCase()}
                                                                {c.isPrimary ? ' · primary contact' : ''}
                                                            </span>
                                                        ) : (
                                                            <span className="block text-xs font-medium text-red-600 dark:text-red-400">
                                                                Not permitted to collect this pupil
                                                            </span>
                                                        )}
                                                    </label>
                                                </li>
                                            );
                                        })}
                                    </ul>
                                )}
                            </fieldset>

                            <Button
                                className="h-11 w-full sm:w-auto"
                                disabled={!collectorId || record.isPending}
                                variant={chosen && !chosen.canCollect ? 'destructive' : 'default'}
                                onClick={() => {
                                    if (chosen && !chosen.canCollect) setOverrideOpen(true);
                                    else signOut();
                                }}
                            >
                                <LogOut className="mr-2 h-4 w-4" />
                                {chosen && !chosen.canCollect
                                    ? `Release to ${chosen.name}…`
                                    : 'Sign out'}
                            </Button>
                        </div>
                    )}
                </CardContent>
            </Card>

            <div>
                <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                    Today&apos;s movements
                </h2>
                {departures.length === 0 ? (
                    <EmptyState
                        title="Nobody has left today"
                        description="Sign-outs and returns appear here as they happen."
                    />
                ) : (
                    <ul className="list-none divide-y rounded-lg border p-0">
                        {departures.map((d) => (
                            <li
                                key={d.id}
                                className="flex flex-wrap items-center justify-between gap-3 px-3 py-3"
                            >
                                <div className="min-w-0">
                                    <p className="flex items-center gap-2 truncate text-sm font-medium">
                                        {d.pupilName}
                                        {d.wasOverride && (
                                            <span className="inline-flex items-center gap-1 rounded bg-red-50 px-1.5 py-0.5 text-[10px] font-semibold text-red-700 dark:bg-red-950/50 dark:text-red-300">
                                                <ShieldAlert
                                                    className="h-3 w-3"
                                                    aria-hidden="true"
                                                />
                                                Override
                                            </span>
                                        )}
                                    </p>
                                    <p className="truncate text-xs text-muted-foreground">
                                        Left {time(d.departedAt)}
                                        {d.collectedBy ? ` with ${d.collectedBy}` : ''}
                                        {d.returnedAt ? ` · back ${time(d.returnedAt)}` : ''}
                                    </p>
                                </div>
                                {!d.returnedAt && (
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => recordBack.mutate(d.id)}
                                        disabled={recordBack.isPending}
                                    >
                                        <LogIn className="mr-1.5 h-3.5 w-3.5" />
                                        Returned
                                    </Button>
                                )}
                            </li>
                        ))}
                    </ul>
                )}
            </div>

            <Dialog open={overrideOpen} onOpenChange={setOverrideOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle className="text-red-600 dark:text-red-400">
                            This adult is not permitted to collect this pupil
                        </DialogTitle>
                        <DialogDescription>
                            {chosen?.name} is on the pupil&apos;s file, and the school has
                            recorded that they may not collect them. Releasing the pupil now
                            will be recorded permanently and reviewed.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-2">
                        <Label htmlFor="override-reason">
                            Why is this being overridden?
                        </Label>
                        <Textarea
                            id="override-reason"
                            value={overrideReason}
                            onChange={(e) => setOverrideReason(e.target.value)}
                            placeholder="The school office will be asked about this"
                            rows={3}
                        />
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setOverrideOpen(false)}>
                            Cancel
                        </Button>
                        <Button
                            variant="destructive"
                            disabled={!overrideReason.trim() || record.isPending}
                            onClick={() => signOut(overrideReason.trim())}
                        >
                            Release {chosen?.name}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
