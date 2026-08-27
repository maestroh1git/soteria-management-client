'use client';

import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { EmployeeForm } from '@/components/employees/employee-form';
import { useCreateEmployee } from '@/lib/hooks/use-employees';
import { type CreateEmployeeValues } from '@/lib/utils/validation';

export default function NewEmployeePage() {
    const router = useRouter();
    const createMutation = useCreateEmployee();

    async function onSubmit(values: CreateEmployeeValues) {
        // Clean optional empty strings. employeeNumber in particular must be
        // omitted rather than sent as '' — the server treats absence as "assign
        // the next number from the tenant sequence".
        const dto = {
            ...values,
            employeeNumber: values.employeeNumber?.trim() || undefined,
            middleName: values.middleName || undefined,
            address: values.address || undefined,
            countryId: values.countryId || undefined,
            gradeId: values.gradeId || undefined,
        };
        await createMutation.mutateAsync(dto);
        router.push('/employees');
    }

    return (
        <div className="space-y-6 max-w-3xl">
            <div className="flex items-center gap-4">
                <Link href="/employees">
                    <Button variant="ghost" size="icon">
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                </Link>
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">New Employee</h1>
                    <p className="text-muted-foreground">Add a new staff member</p>
                </div>
            </div>

            <EmployeeForm
                mode="create"
                submitting={createMutation.isPending}
                onSubmit={onSubmit}
                cancelHref="/employees"
            />
        </div>
    );
}
