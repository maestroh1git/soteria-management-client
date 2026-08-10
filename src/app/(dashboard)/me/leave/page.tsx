'use client';

import { useMemo, useState } from 'react';
import { CalendarDays, Loader2, AlertCircle } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { LoadingSkeleton } from '@/components/common/loading-skeleton';
import {
    useMyLeaveBalances,
    useMyLeaveRequests,
    useRequestOwnLeave,
} from '@/lib/hooks/use-self-service';
import { useLeaveTypes } from '@/lib/hooks/use-leave';
import type { ApiError, LeaveStatus } from '@/lib/types/api';

const STATUS_VARIANT: Record<
    LeaveStatus,
    'default' | 'secondary' | 'destructive' | 'outline'
> = {
    APPROVED: 'default',
    PENDING: 'secondary',
    REJECTED: 'destructive',
    CANCELLED: 'outline',
};

function formatRange(start: string, end: string): string {
    const fmt = (d: string) =>
        new Date(d).toLocaleDateString('en-GB', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
        });
    return start === end ? fmt(start) : `${fmt(start)} — ${fmt(end)}`;
}

export default function MyLeavePage() {
    const balancesQuery = useMyLeaveBalances();
    const { data: requests = [] } = useMyLeaveRequests();
    const [dialogOpen, setDialogOpen] = useState(false);

    if (balancesQuery.isLoading) return <LoadingSkeleton variant="table" />;

    if (balancesQuery.isError) {
        const message = (balancesQuery.error as unknown as ApiError)?.message;
        return (
            <Card className="max-w-2xl">
                <CardContent className="flex gap-3 py-8">
                    <AlertCircle className="h-5 w-5 flex-shrink-0 text-amber-600" />
                    <div>
                        <p className="font-medium">No leave record</p>
                        <p className="mt-1 text-sm text-muted-foreground">
                            {Array.isArray(message) ? message.join(', ') : message}
                        </p>
                    </div>
                </CardContent>
            </Card>
        );
    }

    const balances = balancesQuery.data ?? [];

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">My Leave</h1>
                    <p className="text-muted-foreground">
                        Your balances and requests.
                    </p>
                </div>
                <Button
                    onClick={() => setDialogOpen(true)}
                    className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                >
                    <CalendarDays className="mr-2 h-4 w-4" /> Request Leave
                </Button>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {balances.map((balance) => (
                    <Card key={balance.leaveTypeId}>
                        <CardContent className="pt-6">
                            <p className="text-sm font-medium">
                                {balance.leaveTypeName}
                            </p>
                            <p className="mt-2 text-3xl font-bold">
                                {/* Null remaining means uncapped, not exhausted —
                                    unpaid leave is limited by approval. */}
                                {balance.remainingDays ?? '—'}
                                {balance.remainingDays !== null && (
                                    <span className="ml-1 text-sm font-normal text-muted-foreground">
                                        / {balance.entitlementDays} days left
                                    </span>
                                )}
                            </p>
                            <p className="mt-1 text-xs text-muted-foreground">
                                {balance.takenDays} taken
                                {balance.pendingDays > 0 &&
                                    ` · ${balance.pendingDays} awaiting approval`}
                                {balance.remainingDays === null && ' · no annual cap'}
                            </p>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="text-lg">My requests</CardTitle>
                </CardHeader>
                <CardContent>
                    {requests.length === 0 ? (
                        <p className="py-6 text-center text-sm text-muted-foreground">
                            You have not requested any leave yet.
                        </p>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b bg-muted/50">
                                        <th className="px-3 py-2 text-left font-medium">
                                            Type
                                        </th>
                                        <th className="px-3 py-2 text-left font-medium">
                                            Dates
                                        </th>
                                        <th className="px-3 py-2 text-right font-medium">
                                            Days
                                        </th>
                                        <th className="px-3 py-2 text-left font-medium">
                                            Status
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {requests.map((request) => (
                                        <tr key={request.id} className="border-b">
                                            <td className="px-3 py-2">
                                                {request.leaveType?.name ?? '—'}
                                                {request.leaveType &&
                                                    !request.leaveType.paid && (
                                                        <Badge
                                                            variant="outline"
                                                            className="ml-2 text-amber-600"
                                                        >
                                                            Unpaid
                                                        </Badge>
                                                    )}
                                            </td>
                                            <td className="px-3 py-2 text-muted-foreground">
                                                {formatRange(
                                                    request.startDate,
                                                    request.endDate,
                                                )}
                                            </td>
                                            <td className="px-3 py-2 text-right">
                                                {Number(request.days)}
                                            </td>
                                            <td className="px-3 py-2">
                                                <Badge
                                                    variant={
                                                        STATUS_VARIANT[request.status]
                                                    }
                                                >
                                                    {request.status}
                                                </Badge>
                                                {request.decisionNote && (
                                                    <span className="block text-xs text-muted-foreground">
                                                        {request.decisionNote}
                                                    </span>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </CardContent>
            </Card>

            <RequestOwnLeaveDialog
                open={dialogOpen}
                onOpenChange={setDialogOpen}
            />
        </div>
    );
}

function RequestOwnLeaveDialog({
    open,
    onOpenChange,
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}) {
    const { data: types = [] } = useLeaveTypes();
    const request = useRequestOwnLeave();

    const [leaveTypeId, setLeaveTypeId] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [days, setDays] = useState('');
    const [reason, setReason] = useState('');

    const selectedType = types.find((t) => t.id === leaveTypeId);

    const suggestedDays = useMemo(() => {
        if (!startDate || !endDate) return null;
        const start = new Date(startDate);
        const end = new Date(endDate);
        if (end < start) return null;
        return Math.round((end.getTime() - start.getTime()) / 86_400_000) + 1;
    }, [startDate, endDate]);

    const canSubmit =
        !!leaveTypeId && !!startDate && !!endDate && Number(days) > 0;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Request Leave</DialogTitle>
                    <DialogDescription>
                        {/* There is no employee selector: the API takes the
                            employee from the token, so this can only ever be a
                            request for yourself. */}
                        Submitted for approval. You will see the decision here.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                    <div className="space-y-2">
                        <Label>Leave type *</Label>
                        <Select value={leaveTypeId} onValueChange={setLeaveTypeId}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select a type" />
                            </SelectTrigger>
                            <SelectContent>
                                {types.map((t) => (
                                    <SelectItem key={t.id} value={t.id}>
                                        {t.name}
                                        {!t.paid ? ' (unpaid)' : ''}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        {selectedType && !selectedType.paid && (
                            <p className="text-xs text-amber-600">
                                Unpaid — these days will be deducted from your pay if
                                approved.
                            </p>
                        )}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>From *</Label>
                            <Input
                                type="date"
                                value={startDate}
                                onChange={(e) => {
                                    setStartDate(e.target.value);
                                    setDays('');
                                }}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>To *</Label>
                            <Input
                                type="date"
                                value={endDate}
                                min={startDate || undefined}
                                onChange={(e) => {
                                    setEndDate(e.target.value);
                                    setDays('');
                                }}
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label>Days *</Label>
                        <Input
                            type="number"
                            min={0.5}
                            step={0.5}
                            value={days}
                            placeholder={suggestedDays ? String(suggestedDays) : 'e.g. 5'}
                            onChange={(e) => setDays(e.target.value)}
                        />
                        <p className="text-xs text-muted-foreground">
                            {suggestedDays
                                ? `${suggestedDays} calendar day(s) selected. Adjust for half-days or non-working days.`
                                : 'Half-days are allowed.'}
                        </p>
                    </div>

                    <div className="space-y-2">
                        <Label>Reason</Label>
                        <Input
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            placeholder="Optional"
                        />
                    </div>
                </div>

                <DialogFooter>
                    <Button
                        variant="outline"
                        type="button"
                        onClick={() => onOpenChange(false)}
                    >
                        Cancel
                    </Button>
                    <Button
                        disabled={!canSubmit || request.isPending}
                        onClick={() =>
                            request.mutate(
                                {
                                    leaveTypeId,
                                    startDate,
                                    endDate,
                                    days: Number(days),
                                    ...(reason.trim() ? { reason: reason.trim() } : {}),
                                },
                                {
                                    onSuccess: () => {
                                        setLeaveTypeId('');
                                        setStartDate('');
                                        setEndDate('');
                                        setDays('');
                                        setReason('');
                                        onOpenChange(false);
                                    },
                                },
                            )
                        }
                    >
                        {request.isPending ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : null}
                        Submit
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
