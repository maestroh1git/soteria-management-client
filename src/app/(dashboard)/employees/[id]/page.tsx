'use client';

import { use, useMemo } from 'react';
import Link from 'next/link';
import { Mail, Phone, MapPin, Calendar, Briefcase, Pencil } from 'lucide-react';
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
import { RecordCompletenessPanel } from '@/components/employees/record-completeness-panel';
import { SalaryComponentsPanel } from '@/components/employees/salary-components-panel';
import { useCan } from '@/lib/hooks/use-can';
import { useEntityHistory } from '@/lib/hooks/use-audit';
import { ActionBadge } from '@/app/(dashboard)/audit-logs/page';
import { formatDate, formatDateTime } from '@/lib/utils/dates';
import { PageHeader } from '@/components/layout/page-header';
import { useTabParam } from '@/lib/hooks/use-tab-param';

export default function EmployeeDetailPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id } = use(params);
    const can = useCan();
    // Bank details & salary components are forbidden for VIEWER (S13) — skip the
    // requests and hide the tabs entirely for roles that can't manage them.
    const canViewSensitive = can('employees.manage');
    // Changing where salary lands is the classic payroll fraud, so it is held to
    // the roles that own payroll rather than everyone who may view an employee.
    const canManageBank = can('employees.manage');
    // Salary lines are guarded by the same payroll-owning roles on the server.
    const canManageSalary = can('employees.manage');
    // PATCH /employees/:id is held to the same roles — a VIEWER may look, not edit.
    const canManageEmployee = can('employees.manage');
    const { data: employee, isLoading, isError } = useEmployee(id);
    // In the URL, so the completeness panel (and any link) can send the user to
    // the tab a gap is actually fixed on. Tabs they may not see are not tabs.
    const tabs = useMemo(
        () =>
            canViewSensitive
                ? (['overview', 'salary', 'bank', 'history'] as const)
                : (['overview', 'history'] as const),
        [canViewSensitive],
    );
    const [tab, setTab] = useTabParam<(typeof tabs)[number]>(tabs);
    const {
        data: history = [],
        isLoading: historyLoading,
        isError: historyFailed,
    } = useEntityHistory('Employee', id);

    if (isLoading) return <LoadingSkeleton variant="detail" />;
    if (!employee)
        return (
            <EmptyState
                isError={isError}
                subject="this employee"
                title="Employee not found"
            />
        );

    return (
        <div className="space-y-6">
            <PageHeader
                title={`${employee.firstName} ${employee.lastName}`}
                badge={<StatusBadge kind="employee" status={employee.status} />}
                description={`${employee.employeeNumber} · ${employee.role?.name ?? 'No position'}`}
                crumbs={[{ label: `${employee.firstName} ${employee.lastName}` }]}
                actions={
                    canManageEmployee && (
                        <Link href={`/employees/${id}/edit`}>
                            <Button variant="outline" size="sm">
                                <Pencil className="mr-2 h-4 w-4" />
                                Edit
                            </Button>
                        </Link>
                    )
                }
            />

            <Tabs value={tab} onValueChange={setTab}>
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
                    {/* Above the record, not below it: the point of keeping
                        every statutory field optional is that the gaps are
                        stated rather than discovered when a remittance is due. */}
                    <RecordCompletenessPanel
                        employeeId={id}
                        canEdit={canManageEmployee}
                        onOpenBankTab={
                            canViewSensitive ? () => setTab('bank') : undefined
                        }
                    />

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
                                <InfoRow
                                    label="Next of kin"
                                    value={
                                        employee.nextOfKinName
                                            ? `${employee.nextOfKinName}${
                                                  employee.nextOfKinRelationship
                                                      ? ` (${employee.nextOfKinRelationship})`
                                                      : ''
                                              }${
                                                  employee.nextOfKinPhone
                                                      ? ` · ${employee.nextOfKinPhone}`
                                                      : ''
                                              }`
                                            : null
                                    }
                                />
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
                                    label="Position"
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
                                            : null
                                    }
                                />

                                <InfoRow
                                    icon={<Calendar className="h-4 w-4" />}
                                    label="Join Date"
                                    value={formatDate(employee.joinDate)}
                                />
                                <InfoRow
                                    label="Employment type"
                                    value={
                                        employee.employmentType
                                            ? humanise(employee.employmentType)
                                            : employee.role
                                              ? `As the role (${humanise(employee.role.roleType)})`
                                              : null
                                    }
                                />
                                {employee.contractEndDate && (
                                    <InfoRow
                                        label="Contract ends"
                                        value={formatDate(employee.contractEndDate)}
                                    />
                                )}
                                {employee.terminationDate && (
                                    <>
                                        <InfoRow
                                            label="Termination Date"
                                            value={formatDate(employee.terminationDate)}
                                        />
                                        <InfoRow
                                            label="Reason for leaving"
                                            value={
                                                employee.terminationReason
                                                    ? humanise(employee.terminationReason)
                                                    : null
                                            }
                                        />
                                        <InfoRow
                                            label="Last working day"
                                            value={
                                                employee.lastWorkingDay
                                                    ? formatDate(employee.lastWorkingDay)
                                                    : null
                                            }
                                        />
                                    </>
                                )}
                            </CardContent>
                        </Card>

                        {/* Statutory identifiers, in one place rather than
                            scattered through the personal details: this is the
                            card somebody opens when a filing is due. Rows are
                            rendered even when empty — an em dash is what tells
                            you the number is missing, and hiding it is how it
                            stays missing. */}
                        <Card className="lg:col-span-2">
                            <CardHeader>
                                <CardTitle className="text-lg">
                                    Statutory &amp; Tax
                                </CardTitle>
                                <CardDescription>
                                    What PAYE, pension and housing remittances are filed
                                    against.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                                <InfoRow label="NIN" value={employee.nin} />
                                <InfoRow label="BVN" value={employee.bvn} />
                                <InfoRow label="TIN" value={employee.tin} />
                                <InfoRow
                                    label="State of residence"
                                    value={employee.taxState}
                                />
                                {employee.taxState === 'Lagos' && (
                                    <InfoRow label="LASRRA" value={employee.lasrraId} />
                                )}
                                <InfoRow label="RSA PIN" value={employee.rsaPin} />
                                <InfoRow label="PFA" value={employee.pfaName} />
                                <InfoRow label="NHF number" value={employee.nhfNumber} />
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
                                <EmptyState
                                    isError={historyFailed}
                                    subject="this employee’s history"
                                    title="No history"
                                    description="No audit events recorded for this employee yet."
                                />
                            ) : (
                                <ol className="relative border-l border-border ml-3 space-y-6">
                                    {history.map((log) => (
                                        <li key={log.id} className="ml-6">
                                            <span className="absolute -left-2 flex h-4 w-4 items-center justify-center rounded-full bg-muted border border-border" />
                                            <div className="flex items-center gap-2 mb-1">
                                                <ActionBadge action={log.action} />
                                                <span className="text-xs text-muted-foreground">
                                                    {formatDateTime(log.createdAt)}
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

/** Enum member → something a person reads. */
function humanise(value: string) {
    return value
        .toLowerCase()
        .split('_')
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
}

function InfoRow({
    icon,
    label,
    value,
}: {
    icon?: React.ReactNode;
    label: string;
    /** Null or empty renders as "Not provided" rather than being dropped. */
    value?: string | null;
}) {
    const empty = value === null || value === undefined || value === '';
    return (
        <div className="flex items-start gap-3">
            {icon && <span className="text-muted-foreground mt-0.5">{icon}</span>}
            <div>
                <p className="text-xs text-muted-foreground">{label}</p>
                <p
                    className={
                        empty
                            ? 'text-sm italic text-muted-foreground'
                            : 'text-sm font-medium'
                    }
                >
                    {empty ? 'Not provided' : value}
                </p>
            </div>
        </div>
    );
}
