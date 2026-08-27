'use client';

import { use } from 'react';
import Link from 'next/link';
import { ArrowLeft, Mail, Phone, MapPin, Calendar, Briefcase, Pencil } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { StatusBadge } from '@/components/common/status-badge';
import { LoadingSkeleton } from '@/components/common/loading-skeleton';
import { EmptyState } from '@/components/common/empty-state';
import { useEmployee } from '@/lib/hooks/use-employees';
import { BankAccountsPanel } from '@/components/employees/bank-accounts-panel';
import { SalaryComponentsPanel } from '@/components/employees/salary-components-panel';
import { useAuth } from '@/lib/hooks/use-auth';
import { useEntityHistory } from '@/lib/hooks/use-audit';
import { ActionBadge } from '@/app/(dashboard)/audit-logs/page';
import { formatDate } from '@/lib/utils/dates';

export default function EmployeeDetailPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id } = use(params);
    const { hasRole } = useAuth();
    // Bank details & salary components are forbidden for VIEWER (S13) — skip the
    // requests and hide the tabs entirely for roles that can't manage them.
    const canViewSensitive = hasRole(['tenant_owner', 'ADMIN', 'PAYROLL_OFFICER']);
    // Changing where salary lands is the classic payroll fraud, so it is held to
    // the roles that own payroll rather than everyone who may view an employee.
    const canManageBank = hasRole(['tenant_owner', 'ADMIN', 'PAYROLL_OFFICER']);
    // Salary lines are guarded by the same payroll-owning roles on the server.
    const canManageSalary = hasRole(['tenant_owner', 'ADMIN', 'PAYROLL_OFFICER']);
    // PATCH /employees/:id is held to the same roles — a VIEWER may look, not edit.
    const canManageEmployee = hasRole(['tenant_owner', 'ADMIN', 'PAYROLL_OFFICER']);
    const { data: employee, isLoading } = useEmployee(id);
    const { data: history = [], isLoading: historyLoading } = useEntityHistory('Employee', id);

    if (isLoading) return <LoadingSkeleton variant="detail" />;
    if (!employee) return <EmptyState title="Employee not found" />;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Link href="/employees">
                    <Button variant="ghost" size="icon">
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                </Link>
                <div className="flex-1">
                    <div className="flex items-center gap-3">
                        <h1 className="text-3xl font-bold tracking-tight">
                            {employee.firstName} {employee.lastName}
                        </h1>
                        <StatusBadge status={employee.status} />
                    </div>
                    <p className="text-muted-foreground">
                        {employee.employeeNumber} · {employee.role?.name ?? 'No role'}
                    </p>
                </div>
                {canManageEmployee && (
                    <Link href={`/employees/${id}/edit`}>
                        <Button variant="outline" size="sm">
                            <Pencil className="mr-2 h-4 w-4" />
                            Edit
                        </Button>
                    </Link>
                )}
            </div>

            <Tabs defaultValue="overview">
                <TabsList>
                    <TabsTrigger value="overview">Overview</TabsTrigger>
                    {canViewSensitive && (
                        <TabsTrigger value="salary">Salary Components</TabsTrigger>
                    )}
                    {canViewSensitive && (
                        <TabsTrigger value="bank">Bank Details</TabsTrigger>
                    )}
                    <TabsTrigger value="history">History</TabsTrigger>
                </TabsList>

                {/* ── Overview Tab ── */}
                <TabsContent value="overview" className="space-y-6">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg">Personal Information</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <InfoRow icon={<Mail className="h-4 w-4" />} label="Email" value={employee.email} />
                                <InfoRow icon={<Phone className="h-4 w-4" />} label="Phone" value={employee.phone} />
                                <InfoRow
                                    icon={<Calendar className="h-4 w-4" />}
                                    label="Date of Birth"
                                    value={formatDate(employee.dateOfBirth)}
                                />
                                <InfoRow label="Gender" value={employee.gender} />
                                {employee.address && (
                                    <InfoRow icon={<MapPin className="h-4 w-4" />} label="Address" value={employee.address} />
                                )}
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg">Employment Details</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <InfoRow label="Employee #" value={employee.employeeNumber} />
                                <InfoRow
                                    icon={<Briefcase className="h-4 w-4" />}
                                    label="Role"
                                    value={employee.role?.name ?? '—'}
                                />
                                {employee.role?.department && (
                                    <InfoRow label="Department" value={employee.role.department.name} />
                                )}
                                <InfoRow
                                    label="Grade"
                                    value={
                                        employee.grade
                                            ? `${employee.grade.code} — ${employee.grade.name}`
                                            : '—'
                                    }
                                />

                                <InfoRow
                                    icon={<Calendar className="h-4 w-4" />}
                                    label="Join Date"
                                    value={formatDate(employee.joinDate)}
                                />
                                {employee.terminationDate && (
                                    <InfoRow
                                        label="Termination Date"
                                        value={formatDate(employee.terminationDate)}
                                    />
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                {/* ── Salary Components Tab ── */}
                {canViewSensitive && (
                <TabsContent value="salary" className="space-y-4">
                    <SalaryComponentsPanel employeeId={id} canEdit={canManageSalary} />
                </TabsContent>
                )}

                {/* ── Bank Details Tab ── */}
                {canViewSensitive && (
                <TabsContent value="bank" className="space-y-4">
                    <BankAccountsPanel
                        employeeId={id}
                        employeeName={`${employee.firstName} ${employee.lastName}`}
                        canEdit={canManageBank}
                    />
                </TabsContent>
                )}

                {/* ── History Tab ── */}
                <TabsContent value="history" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">Change History</CardTitle>
                            <CardDescription>All recorded actions on this employee record</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {historyLoading ? (
                                <LoadingSkeleton rows={5} />
                            ) : history.length === 0 ? (
                                <EmptyState title="No history" description="No audit events recorded for this employee yet." />
                            ) : (
                                <ol className="relative border-l border-border ml-3 space-y-6">
                                    {history.map((log) => (
                                        <li key={log.id} className="ml-6">
                                            <span className="absolute -left-2 flex h-4 w-4 items-center justify-center rounded-full bg-muted border border-border" />
                                            <div className="flex items-center gap-2 mb-1">
                                                <ActionBadge action={log.action} />
                                                <span className="text-xs text-muted-foreground">
                                                    {new Date(log.createdAt).toLocaleString('en-US', {
                                                        month: 'short', day: 'numeric', year: 'numeric',
                                                        hour: '2-digit', minute: '2-digit',
                                                    })}
                                                </span>
                                                {log.userName && (
                                                    <span className="text-xs text-muted-foreground">· by {log.userName}</span>
                                                )}
                                            </div>
                                            {(log.oldValues || log.newValues) && (
                                                <div className="mt-1.5 rounded-md border bg-muted/40 px-3 py-2 text-xs space-y-1">
                                                    {Object.keys({ ...log.oldValues, ...log.newValues }).map((key) => {
                                                        const oldVal = log.oldValues?.[key];
                                                        const newVal = log.newValues?.[key];
                                                        if (oldVal === newVal) return null;
                                                        return (
                                                            <div key={key} className="flex items-center gap-2">
                                                                <span className="font-mono text-muted-foreground w-28 truncate">{key}</span>
                                                                {oldVal !== undefined && (
                                                                    <span className="line-through text-muted-foreground">{String(oldVal)}</span>
                                                                )}
                                                                {oldVal !== undefined && newVal !== undefined && <span className="text-muted-foreground">→</span>}
                                                                {newVal !== undefined && (
                                                                    <span className="font-medium">{String(newVal)}</span>
                                                                )}
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            )}
                                        </li>
                                    ))}
                                </ol>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}

function InfoRow({
    icon,
    label,
    value,
}: {
    icon?: React.ReactNode;
    label: string;
    value: string;
}) {
    return (
        <div className="flex items-start gap-3">
            {icon && <span className="text-muted-foreground mt-0.5">{icon}</span>}
            <div>
                <p className="text-xs text-muted-foreground">{label}</p>
                <p className="text-sm font-medium">{value}</p>
            </div>
        </div>
    );
}
