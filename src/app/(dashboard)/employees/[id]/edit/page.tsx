'use client';

import { use } from 'react';
import { useRouter } from 'next/navigation';

import { LoadingSkeleton } from '@/components/common/loading-skeleton';
import { EmptyState } from '@/components/common/empty-state';
import { EmployeeForm } from '@/components/employees/employee-form';
import { useEmployee, useUpdateEmployee } from '@/lib/hooks/use-employees';
import { toUpdateEmployeeDto } from '@/lib/utils/employee-dto';
import { type CreateEmployeeValues } from '@/lib/utils/validation';
import { PageHeader } from '@/components/layout/page-header';

export default function EditEmployeePage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id } = use(params);
    const router = useRouter();
    const { data: employee, isLoading, isError } = useEmployee(id);
    const updateMutation = useUpdateEmployee();

    if (isLoading) return <LoadingSkeleton variant="detail" />;
    if (!employee)
        return (
            <EmptyState
                isError={isError}
                subject="this employee"
                title="Employee not found"
            />
        );

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
        nin: employee.nin ?? '',
        bvn: employee.bvn ?? '',
        tin: employee.tin ?? '',
        taxState: employee.taxState ?? '',
        lasrraId: employee.lasrraId ?? '',
        rsaPin: employee.rsaPin ?? '',
        pfaName: employee.pfaName ?? '',
        nhfNumber: employee.nhfNumber ?? '',
        employmentType: employee.employmentType ?? '',
        contractEndDate: employee.contractEndDate?.slice(0, 10) ?? '',
        nextOfKinName: employee.nextOfKinName ?? '',
        nextOfKinPhone: employee.nextOfKinPhone ?? '',
        nextOfKinRelationship: employee.nextOfKinRelationship ?? '',
        joinDate: employee.joinDate?.slice(0, 10) ?? '',
        roleId: employee.roleId,
        gradeId: employee.gradeId ?? undefined,
        status: employee.status,
        terminationDate: employee.terminationDate?.slice(0, 10) ?? '',
        terminationReason: employee.terminationReason ?? '',
        lastWorkingDay: employee.lastWorkingDay?.slice(0, 10) ?? '',
    };

    async function onSubmit(values: CreateEmployeeValues) {
        // Shared with the create page. This branch differs in one way that
        // matters: a field the user has emptied is sent as null so it is
        // actually cleared, where omitting it would mean "leave as it was".
        await updateMutation.mutateAsync({ id, dto: toUpdateEmployeeDto(values) });
        router.push(`/employees/${id}`);
    }

    return (
        <div className="space-y-6 max-w-3xl">
            <PageHeader
                title={`Edit ${employee.firstName} ${employee.lastName}`}
                description={`${employee.employeeNumber} · update this staff member's details`}
                crumbs={[
                    { label: `${employee.firstName} ${employee.lastName}`, href: `/employees/${id}` },
                    { label: 'Edit' },
                ]}
            />

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
