'use client';

import { use } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { LoadingSkeleton } from '@/components/common/loading-skeleton';
import { EmptyState } from '@/components/common/empty-state';
import { EmployeeForm } from '@/components/employees/employee-form';
import { useEmployee, useUpdateEmployee } from '@/lib/hooks/use-employees';
import { type CreateEmployeeValues } from '@/lib/utils/validation';

export default function EditEmployeePage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id } = use(params);
    const router = useRouter();
    const { data: employee, isLoading } = useEmployee(id);
    const updateMutation = useUpdateEmployee();

    if (isLoading) return <LoadingSkeleton variant="detail" />;
    if (!employee) return <EmptyState title="Employee not found" />;

    const initialValues: Partial<CreateEmployeeValues> = {
        employeeNumber: employee.employeeNumber,
        firstName: employee.firstName,
        lastName: employee.lastName,
        middleName: employee.middleName ?? '',
        email: employee.email ?? '',
        phone: employee.phone ?? '',
        dateOfBirth: employee.dateOfBirth?.slice(0, 10) ?? '',
        gender: employee.gender,
        address: employee.address ?? '',
        joinDate: employee.joinDate?.slice(0, 10) ?? '',
        roleId: employee.roleId,
        gradeId: employee.gradeId ?? undefined,
    };

    async function onSubmit(values: CreateEmployeeValues) {
        // employeeNumber is fixed once assigned and is omitted by the update
        // DTO; empty optionals are sent as undefined, not ''.
        const dto = {
            firstName: values.firstName,
            lastName: values.lastName,
            middleName: values.middleName || undefined,
            email: values.email,
            phone: values.phone,
            dateOfBirth: values.dateOfBirth,
            gender: values.gender,
            address: values.address || undefined,
            joinDate: values.joinDate,
            roleId: values.roleId,
            gradeId: values.gradeId || undefined,
        };
        await updateMutation.mutateAsync({ id, dto });
        router.push(`/employees/${id}`);
    }

    return (
        <div className="space-y-6 max-w-3xl">
            <div className="flex items-center gap-4">
                <Link href={`/employees/${id}`}>
                    <Button variant="ghost" size="icon">
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                </Link>
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">
                        Edit {employee.firstName} {employee.lastName}
                    </h1>
                    <p className="text-muted-foreground">
                        {employee.employeeNumber} · update this staff member&apos;s details
                    </p>
                </div>
            </div>

            <EmployeeForm
                mode="edit"
                initialValues={initialValues}
                initialDepartmentId={employee.role?.departmentId ?? ''}
                submitting={updateMutation.isPending}
                onSubmit={onSubmit}
                cancelHref={`/employees/${id}`}
            />
        </div>
    );
}
