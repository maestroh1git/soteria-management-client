'use client';

import { useMemo, useState } from 'react';
import { Plus, Check, X, Ban, Loader2, CalendarDays } from 'lucide-react';

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
    useLeaveRequests,
    useLeaveTypes,
    useCreateLeaveRequest,
    useApproveLeaveRequest,
    useRejectLeaveRequest,
    useCancelLeaveRequest,
} from '@/lib/hooks/use-leave';
import { useEmployees } from '@/lib/hooks/use-employees';
import { useAuthStore } from '@/stores/auth-store';
import type { LeaveRequest, LeaveStatus } from '@/lib/types/api';

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

export default function LeavePage() {
    const { data: requests = [], isLoading } = useLeaveRequests();
    const [dialogOpen, setDialogOpen] = useState(false);

    const user = useAuthStore((s) => s.user);
    // Raising leave and authorising it are deliberately separate rights.
    const canApprove = (user?.systemRoles ?? []).some((r) =>
        ['tenant_owner', 'ADMIN', 'APPROVER'].includes(r),
    );

    const approveMutation = useApproveLeaveRequest();
    const rejectMutation = useRejectLeaveRequest();
    const cancelMutation = useCancelLeaveRequest();
    const busy =
        approveMutation.isPending ||
        rejectMutation.isPending ||
        cancelMutation.isPending;

    // Pending first — this screen exists to be acted on, and a decision queue
    // buried under history is a decision queue nobody works through.
    const { pending, decided } = useMemo(
        () => ({
            pending: requests.filter((r) => r.status === 'PENDING'),
            decided: requests.filter((r) => r.status !== 'PENDING'),
        }),
        [requests],
    );

    if (isLoading) return <LoadingSkeleton variant="table" />;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Leave</h1>
                    <p className="text-muted-foreground">
                        Absence requests and approvals. Approved unpaid leave is
                        deducted automatically on the next payroll run.
                    </p>
                </div>
                <Button
                    onClick={() => setDialogOpen(true)}
                    className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                >
                    <Plus className="mr-2 h-4 w-4" /> Request Leave
                </Button>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="text-lg">
                        Awaiting decision
                        {pending.length > 0 && (
                            <Badge variant="secondary" className="ml-2">
                                {pending.length}
                            </Badge>
                        )}
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {pending.length === 0 ? (
                        <p className="py-6 text-center text-sm text-muted-foreground">
                            Nothing awaiting a decision.
                        </p>
                    ) : (
                        <RequestTable
                            requests={pending}
                            canApprove={canApprove}
                            busy={busy}
                            onApprove={(id) => approveMutation.mutate({ id })}
                            onReject={(id) => rejectMutation.mutate({ id })}
                            onCancel={(id) => cancelMutation.mutate({ id })}
                        />
                    )}
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="text-lg">History</CardTitle>
                </CardHeader>
                <CardContent>
                    {decided.length === 0 ? (
                        <p className="py-6 text-center text-sm text-muted-foreground">
                            No decided requests yet.
                        </p>
                    ) : (
                        <RequestTable
                            requests={decided}
                            canApprove={false}
                            busy={busy}
                            onApprove={() => undefined}
                            onReject={() => undefined}
                            onCancel={(id) => cancelMutation.mutate({ id })}
                        />
                    )}
                </CardContent>
            </Card>

            <RequestLeaveDialog open={dialogOpen} onOpenChange={setDialogOpen} />
        </div>
    );
}

function RequestTable({
    requests,
    canApprove,
    busy,
    onApprove,
    onReject,
    onCancel,
}: {
    requests: LeaveRequest[];
    canApprove: boolean;
    busy: boolean;
    onApprove: (id: string) => void;
    onReject: (id: string) => void;
    onCancel: (id: string) => void;
}) {
    return (
        <div className="overflow-x-auto">
            <table className="w-full text-sm">
                <thead>
                    <tr className="border-b bg-muted/50">
                        <th className="px-3 py-2 text-left font-medium">Employee</th>
                        <th className="px-3 py-2 text-left font-medium">Type</th>
                        <th className="px-3 py-2 text-left font-medium">Dates</th>
                        <th className="px-3 py-2 text-right font-medium">Days</th>
                        <th className="px-3 py-2 text-left font-medium">Status</th>
                        <th className="px-3 py-2 text-right font-medium">Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {requests.map((request) => (
                        <tr key={request.id} className="border-b">
                            <td className="px-3 py-2">
                                {request.employee
                                    ? `${request.employee.firstName} ${request.employee.lastName}`
                                    : '—'}
                            </td>
                            <td className="px-3 py-2">
                                {request.leaveType?.name ?? '—'}
                                {/* Unpaid is the distinction that reaches payroll, so it
                                    is called out rather than left to the type name. */}
                                {request.leaveType && !request.leaveType.paid && (
                                    <Badge variant="outline" className="ml-2 text-amber-600">
                                        Unpaid
                                    </Badge>
                                )}
                            </td>
                            <td className="px-3 py-2 text-muted-foreground">
                                {formatRange(request.startDate, request.endDate)}
                            </td>
                            <td className="px-3 py-2 text-right">
                                {Number(request.days)}
                            </td>
                            <td className="px-3 py-2">
                                <Badge variant={STATUS_VARIANT[request.status]}>
                                    {request.status}
                                </Badge>
                                {request.decisionNote && (
                                    <span className="block text-xs text-muted-foreground">
                                        {request.decisionNote}
                                    </span>
                                )}
                            </td>
                            <td className="px-3 py-2">
                                <div className="flex items-center justify-end gap-1">
                                    {request.status === 'PENDING' && canApprove && (
                                        <>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 text-green-600"
                                                title="Approve"
                                                disabled={busy}
                                                onClick={() => onApprove(request.id)}
                                            >
                                                <Check className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 text-amber-600"
                                                title="Reject"
                                                disabled={busy}
                                                onClick={() => onReject(request.id)}
                                            >
                                                <X className="h-4 w-4" />
                                            </Button>
                                        </>
                                    )}
                                    {request.status !== 'CANCELLED' &&
                                        request.status !== 'REJECTED' && (
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 text-red-600"
                                                title="Cancel"
                                                disabled={busy}
                                                onClick={() => onCancel(request.id)}
                                            >
                                                <Ban className="h-4 w-4" />
                                            </Button>
                                        )}
                                </div>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

function RequestLeaveDialog({
    open,
    onOpenChange,
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}) {
    const { data: employees = [] } = useEmployees({ status: 'ACTIVE' });
    const { data: types = [] } = useLeaveTypes();
    const createMutation = useCreateLeaveRequest();

    const [employeeId, setEmployeeId] = useState('');
    const [leaveTypeId, setLeaveTypeId] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [days, setDays] = useState('');
    const [reason, setReason] = useState('');

    const selectedType = types.find((t) => t.id === leaveTypeId);

    // Suggest the calendar span, but leave it editable — half-days exist, and
    // what counts as a working day is the school's call, not ours.
    const suggestedDays = useMemo(() => {
        if (!startDate || !endDate) return null;
        const start = new Date(startDate);
        const end = new Date(endDate);
        if (end < start) return null;
        return Math.round((end.getTime() - start.getTime()) / 86_400_000) + 1;
    }, [startDate, endDate]);

    const canSubmit =
        !!employeeId && !!leaveTypeId && !!startDate && !!endDate && Number(days) > 0;

    function reset() {
        setEmployeeId('');
        setLeaveTypeId('');
        setStartDate('');
        setEndDate('');
        setDays('');
        setReason('');
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Request Leave</DialogTitle>
                    <DialogDescription>
                        Raised as pending. It takes effect once approved.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                    <div className="space-y-2">
                        <Label>Employee *</Label>
                        <Select value={employeeId} onValueChange={setEmployeeId}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select an employee" />
                            </SelectTrigger>
                            <SelectContent>
                                {employees.map((e) => (
                                    <SelectItem key={e.id} value={e.id}>
                                        {e.firstName} {e.lastName} ({e.employeeNumber})
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

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
                                Unpaid — these days will be deducted from pay once
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
                        <Label>Days claimed *</Label>
                        <Input
                            type="number"
                            min={0.5}
                            step={0.5}
                            value={days}
                            placeholder={
                                suggestedDays ? String(suggestedDays) : 'e.g. 5'
                            }
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
                        disabled={!canSubmit || createMutation.isPending}
                        onClick={() =>
                            createMutation.mutate(
                                {
                                    employeeId,
                                    leaveTypeId,
                                    startDate,
                                    endDate,
                                    days: Number(days),
                                    ...(reason.trim() ? { reason: reason.trim() } : {}),
                                },
                                {
                                    onSuccess: () => {
                                        reset();
                                        onOpenChange(false);
                                    },
                                },
                            )
                        }
                    >
                        {createMutation.isPending ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                            <CalendarDays className="mr-2 h-4 w-4" />
                        )}
                        Submit request
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
