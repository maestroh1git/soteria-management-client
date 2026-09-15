'use client';

import { useEffect, useMemo, useState } from 'react';
import { Plus, Check, X, Ban, Loader2, CalendarDays } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
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
    useCreateLeaveType,
    useUpdateLeaveType,
} from '@/lib/hooks/use-leave';
import { useEmployees } from '@/lib/hooks/use-employees';
import { useAuthStore } from '@/stores/auth-store';
import type { LeaveRequest, LeaveStatus, LeaveType } from '@/lib/types/api';

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

            <LeaveTypesCard />

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
                            <Label htmlFor="leave-page-from">From *</Label>
                            <Input id="leave-page-from"
                                type="date"
                                value={startDate}
                                onChange={(e) => {
                                    setStartDate(e.target.value);
                                    setDays('');
                                }}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="leave-page-to">To *</Label>
                            <Input id="leave-page-to"
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
                        <Label htmlFor="leave-page-days-claimed">Days claimed *</Label>
                        <Input id="leave-page-days-claimed"
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
                        <Label htmlFor="leave-page-reason">Reason</Label>
                        <Input id="leave-page-reason"
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


/**
 * Managing the categories themselves.
 *
 * A tenant is provisioned with a starter set, but a school that wants Study
 * Leave had nowhere to add one: the create and update hooks existed and were
 * wired to no screen, so the only way in was the API.
 */
function LeaveTypesCard() {
    const { data: types = [] } = useLeaveTypes(true);
    const [open, setOpen] = useState(false);
    const [editing, setEditing] = useState<LeaveType | null>(null);

    const openAdd = () => {
        setEditing(null);
        setOpen(true);
    };
    const openEdit = (t: LeaveType) => {
        setEditing(t);
        setOpen(true);
    };

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
                <div>
                    <CardTitle className="text-lg">Leave types</CardTitle>
                    <p className="mt-1 text-sm text-muted-foreground">
                        What staff can ask for. Unpaid types reduce pay for the days
                        taken; paid ones do not.
                    </p>
                </div>
                <Button variant="outline" size="sm" onClick={openAdd}>
                    <Plus className="mr-2 h-4 w-4" /> Add type
                </Button>
            </CardHeader>
            <CardContent>
                {types.length === 0 ? (
                    <p className="py-6 text-center text-sm text-muted-foreground">
                        No leave types yet. Add one so staff can request leave.
                    </p>
                ) : (
                    <div className="divide-y">
                        {types.map((t) => (
                            <div
                                key={t.id}
                                className="flex items-center justify-between py-3"
                            >
                                <div>
                                    <div className="flex items-center gap-2">
                                        <span className="font-medium">{t.name}</span>
                                        {!t.paid && (
                                            <Badge
                                                variant="outline"
                                                className="text-amber-600 dark:text-amber-500"
                                            >
                                                Unpaid
                                            </Badge>
                                        )}
                                        {!t.active && (
                                            <Badge variant="secondary">Retired</Badge>
                                        )}
                                    </div>
                                    <p className="text-xs text-muted-foreground">
                                        {Number(t.daysPerYear) === 0
                                            ? 'Uncapped'
                                            : `${Number(t.daysPerYear)} days a year`}
                                        {t.carriesOver ? ' · carries over' : ''}
                                        {t.description ? ` · ${t.description}` : ''}
                                    </p>
                                </div>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => openEdit(t)}
                                >
                                    Edit
                                </Button>
                            </div>
                        ))}
                    </div>
                )}
            </CardContent>

            <LeaveTypeDialog
                open={open}
                onOpenChange={setOpen}
                editing={editing}
            />
        </Card>
    );
}

function LeaveTypeDialog({
    open,
    onOpenChange,
    editing,
}: {
    open: boolean;
    onOpenChange: (v: boolean) => void;
    editing: LeaveType | null;
}) {
    const create = useCreateLeaveType();
    const update = useUpdateLeaveType();

    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [daysPerYear, setDaysPerYear] = useState('0');
    const [paid, setPaid] = useState(true);
    const [carriesOver, setCarriesOver] = useState(false);
    const [active, setActive] = useState(true);

    useEffect(() => {
        if (!open) return;
        setName(editing?.name ?? '');
        setDescription(editing?.description ?? '');
        setDaysPerYear(editing ? String(Number(editing.daysPerYear)) : '0');
        setPaid(editing?.paid ?? true);
        setCarriesOver(editing?.carriesOver ?? false);
        setActive(editing?.active ?? true);
    }, [open, editing]);

    const busy = create.isPending || update.isPending;

    const submit = () => {
        const dto = {
            name: name.trim(),
            description: description.trim() || undefined,
            daysPerYear: Number(daysPerYear) || 0,
            paid,
            carriesOver,
            active,
        };
        const done = () => onOpenChange(false);
        if (editing) update.mutate({ id: editing.id, dto }, { onSuccess: done });
        else create.mutate(dto, { onSuccess: done });
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>
                        {editing ? 'Edit leave type' : 'Add a leave type'}
                    </DialogTitle>
                    <DialogDescription>
                        Whether it is paid is the only part payroll reads.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="leave-page-name">Name *</Label>
                        <Input id="leave-page-name"
                            value={name}
                            placeholder="Study Leave"
                            onChange={(e) => setName(e.target.value)}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="leave-page-description">Description</Label>
                        <Input id="leave-page-description"
                            value={description}
                            placeholder="What this covers"
                            onChange={(e) => setDescription(e.target.value)}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="leave-page-days-a-year">Days a year</Label>
                        <Input id="leave-page-days-a-year"
                            type="number"
                            min={0}
                            value={daysPerYear}
                            onChange={(e) => setDaysPerYear(e.target.value)}
                        />
                        <p className="text-xs text-muted-foreground">
                            Zero means uncapped, which is what unpaid leave usually is.
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        <Checkbox
                            id="lt-paid"
                            checked={paid}
                            onCheckedChange={(v) => setPaid(v === true)}
                        />
                        <Label htmlFor="lt-paid" className="font-normal">
                            Paid — days taken do not reduce pay
                        </Label>
                    </div>
                    <div className="flex items-center gap-2">
                        <Checkbox
                            id="lt-carries"
                            checked={carriesOver}
                            onCheckedChange={(v) => setCarriesOver(v === true)}
                        />
                        <Label htmlFor="lt-carries" className="font-normal">
                            Unused days carry into the next leave year
                        </Label>
                    </div>
                    {editing && (
                        <div className="flex items-center gap-2">
                            <Checkbox
                                id="lt-active"
                                checked={active}
                                onCheckedChange={(v) => setActive(v === true)}
                            />
                            <Label htmlFor="lt-active" className="font-normal">
                                Available to request
                            </Label>
                        </div>
                    )}
                </div>

                <DialogFooter>
                    <Button variant="ghost" onClick={() => onOpenChange(false)}>
                        Cancel
                    </Button>
                    <Button onClick={submit} disabled={busy || !name.trim()}>
                        {editing ? 'Save changes' : 'Add type'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
