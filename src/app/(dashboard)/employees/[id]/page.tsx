'use client';

import { use } from 'react';
import Link from 'next/link';
import { ArrowLeft, Mail, Phone, MapPin, Calendar, Briefcase } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { StatusBadge } from '@/components/common/status-badge';
import { LoadingSkeleton } from '@/components/common/loading-skeleton';
import { EmptyState } from '@/components/common/empty-state';
import { CurrencyDisplay } from '@/components/common/currency-display';
import { useEmployee, useBankDetails, useEmployeeSalaryComponents } from '@/lib/hooks/use-employees';
import { formatDate } from '@/lib/utils/dates';
import type { EmployeeBankDetails, EmployeeSalaryComponent } from '@/lib/types/api';

export default function EmployeeDetailPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id } = use(params);
    const { data: employee, isLoading } = useEmployee(id);
    const { data: bankDetails = [] } = useBankDetails(id);
    const { data: salaryComponents = [] } = useEmployeeSalaryComponents(id);

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
            </div>

            <Tabs defaultValue="overview">
                <TabsList>
                    <TabsTrigger value="overview">Overview</TabsTrigger>
                    <TabsTrigger value="salary">Salary Components</TabsTrigger>
                    <TabsTrigger value="bank">Bank Details</TabsTrigger>
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
                <TabsContent value="salary" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">Assigned Salary Components</CardTitle>
                            <CardDescription>
                                Earnings and deductions linked to this employee
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {salaryComponents.length === 0 ? (
                                <EmptyState
                                    title="No salary components"
                                    description="No salary components have been assigned yet."
                                />
                            ) : (
                                <div className="rounded-md border">
                                    <table className="w-full text-sm">
                                        <thead>
                                            <tr className="border-b bg-muted/50">
                                                <th className="px-4 py-3 text-left font-medium">Component</th>
                                                <th className="px-4 py-3 text-left font-medium">Type</th>
                                                <th className="px-4 py-3 text-right font-medium">Value</th>
                                                <th className="px-4 py-3 text-left font-medium">Effective From</th>
                                                <th className="px-4 py-3 text-left font-medium">Status</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {salaryComponents.map((sc: EmployeeSalaryComponent) => (
                                                <tr key={sc.id} className="border-b">
                                                    <td className="px-4 py-3 font-medium">
                                                        {sc.salaryComponent?.name ?? '—'}
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <Badge variant="outline">
                                                            {sc.salaryComponent?.componentType}
                                                        </Badge>
                                                    </td>
                                                    <td className="px-4 py-3 text-right">
                                                        <CurrencyDisplay amount={sc.value} />
                                                    </td>
                                                    <td className="px-4 py-3 text-muted-foreground">
                                                        {formatDate(sc.effectiveFrom)}
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <Badge variant={sc.isActive ? 'default' : 'secondary'}>
                                                            {sc.isActive ? 'Active' : 'Inactive'}
                                                        </Badge>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* ── Bank Details Tab ── */}
                <TabsContent value="bank" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">Bank Accounts</CardTitle>
                            <CardDescription>
                                Payment destinations for this employee
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {bankDetails.length === 0 ? (
                                <EmptyState
                                    title="No bank details"
                                    description="No bank accounts have been added yet."
                                />
                            ) : (
                                <div className="grid gap-4">
                                    {bankDetails.map((bd: EmployeeBankDetails) => (
                                        <div
                                            key={bd.id}
                                            className="flex items-center justify-between p-4 rounded-lg border"
                                        >
                                            <div>
                                                <p className="font-medium">{bd.bankName}</p>
                                                <p className="text-sm text-muted-foreground">
                                                    {bd.accountNumber} · {bd.accountName}
                                                </p>
                                                {bd.branchCode && (
                                                    <p className="text-xs text-muted-foreground">
                                                        Branch: {bd.branchCode}
                                                    </p>
                                                )}
                                            </div>
                                            {bd.isDefault && (
                                                <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                                                    Default
                                                </Badge>
                                            )}
                                        </div>
                                    ))}
                                </div>
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
