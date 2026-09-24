'use client';

import { useRouter } from 'next/navigation';

import { EmployeeForm } from '@/components/employees/employee-form';
import { useCreateEmployee } from '@/lib/hooks/use-employees';
import { toCreateEmployeeDto } from '@/lib/utils/employee-dto';
import { type CreateEmployeeValues } from '@/lib/utils/validation';
import { PageHeader } from '@/components/layout/page-header';

export default function NewEmployeePage() {
    const router = useRouter();
    const createMutation = useCreateEmployee();

    async function onSubmit(values: CreateEmployeeValues) {
        // Shared with the edit page: a field added to the form has to reach
        // both, and building the payload twice is how one of them silently
        // stops sending it.
        await createMutation.mutateAsync(toCreateEmployeeDto(values));
        router.push('/employees');
    }

    return (
        <div className="space-y-6 max-w-3xl">
            <PageHeader
                title="New employee"
                description="Add a new staff member"
                crumbs={[{ label: 'New employee' }]}
            />

            <EmployeeForm
                mode="create"
                submitting={createMutation.isPending}
                onSubmit={onSubmit}
                cancelHref="/employees"
            />
        </div>
    );
}
