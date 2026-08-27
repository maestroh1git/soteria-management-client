'use client';

import { useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2 } from 'lucide-react';
import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/form';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Label } from '@/components/ui/label';
import { useRolesList } from '@/lib/hooks/use-onboarding';
import { useGrades } from '@/lib/hooks/use-grades';
import { PrerequisiteNotice } from '@/components/onboarding/prerequisite-notice';
import { EmptySelectHint } from '@/components/common/empty-select-hint';
import {
    createEmployeeSchema,
    type CreateEmployeeValues,
} from '@/lib/utils/validation';
import { EmployeeGender } from '@/lib/types/enums';

const UNASSIGNED = '__unassigned__';

const EMPTY: Partial<CreateEmployeeValues> = {
    employeeNumber: '',
    firstName: '',
    lastName: '',
    middleName: '',
    email: '',
    phone: '',
    dateOfBirth: '',
    address: '',
    joinDate: new Date().toISOString().split('T')[0],
    roleId: '',
};

interface Props {
    mode: 'create' | 'edit';
    /** Prefilled values in edit mode; partial merges over the empty defaults. */
    initialValues?: Partial<CreateEmployeeValues>;
    /** Which department to pre-select so the role list is populated (edit). */
    initialDepartmentId?: string;
    submitting: boolean;
    onSubmit: (values: CreateEmployeeValues) => void | Promise<void>;
    cancelHref: string;
}

/**
 * The one place an employee's own details are entered or corrected. Create and
 * edit share it so the two never drift — a field added here reaches both, and
 * the role/department cascade behaves the same whether hiring or amending.
 *
 * Department is a UI-only filter over the (potentially long) role list; the
 * employee stores only roleId, and its department is reached via role → dept.
 */
export function EmployeeForm({
    mode,
    initialValues,
    initialDepartmentId,
    submitting,
    onSubmit,
    cancelHref,
}: Props) {
    const rolesQuery = useRolesList();
    const roles = useMemo(() => rolesQuery.data ?? [], [rolesQuery.data]);
    // Grade is optional — an employee without one simply falls outside any
    // grade-specific payroll rule.
    const { data: grades = [] } = useGrades();
    // An employee can't be created without a role (required, FK-checked on the
    // server). If none exist, guard the form rather than leaving a dead-end.
    const noRoles = mode === 'create' && rolesQuery.data !== undefined && roles.length === 0;

    const [departmentFilter, setDepartmentFilter] = useState(
        initialDepartmentId ?? '',
    );

    const departmentOptions = useMemo(() => {
        const byId = new Map<string, string>();
        let hasUnassigned = false;
        for (const role of roles) {
            if (role.departmentId) {
                byId.set(role.departmentId, role.department?.name ?? 'Department');
            } else {
                hasUnassigned = true;
            }
        }
        const list = Array.from(byId, ([id, name]) => ({ id, name })).sort(
            (a, b) => a.name.localeCompare(b.name),
        );
        return { list, hasUnassigned };
    }, [roles]);

    const filteredRoles = useMemo(() => {
        if (!departmentFilter) return [];
        return roles.filter((role) =>
            departmentFilter === UNASSIGNED
                ? !role.departmentId
                : role.departmentId === departmentFilter,
        );
    }, [roles, departmentFilter]);

    const form = useForm<CreateEmployeeValues>({
        resolver: zodResolver(createEmployeeSchema),
        defaultValues: { ...EMPTY, ...initialValues },
    });

    const isEdit = mode === 'edit';

    if (noRoles) {
        return (
            <PrerequisiteNotice
                message="You need at least one role before adding employees — every employee must be assigned one."
                href="/roles"
                actionLabel="Create a role"
            />
        );
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                {/* Personal Information */}
                <Card>
                    <CardHeader>
                        <CardTitle>Personal Information</CardTitle>
                        <CardDescription>
                            Basic personal details for the employee
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <FormField
                                control={form.control}
                                name="firstName"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>First Name *</FormLabel>
                                        <FormControl>
                                            <Input placeholder="John" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="middleName"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Middle Name</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Optional" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="lastName"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Last Name *</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Doe" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="email"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Email *</FormLabel>
                                        <FormControl>
                                            <Input
                                                type="email"
                                                placeholder="john@company.com"
                                                {...field}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="phone"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Phone *</FormLabel>
                                        <FormControl>
                                            <Input placeholder="080 1234 5678" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="dateOfBirth"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Date of Birth *</FormLabel>
                                        <FormControl>
                                            <Input type="date" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="gender"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Gender *</FormLabel>
                                        <Select
                                            onValueChange={field.onChange}
                                            value={field.value}
                                        >
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select gender" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                {Object.values(EmployeeGender).map((g) => (
                                                    <SelectItem key={g} value={g}>
                                                        {g.charAt(0) + g.slice(1).toLowerCase()}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <FormField
                            control={form.control}
                            name="address"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Address</FormLabel>
                                    <FormControl>
                                        <Input placeholder="123 Main Street" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </CardContent>
                </Card>

                <Separator />

                {/* Employment Information */}
                <Card>
                    <CardHeader>
                        <CardTitle>Employment Information</CardTitle>
                        <CardDescription>
                            Role and organizational details
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="employeeNumber"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Employee Number</FormLabel>
                                        <FormControl>
                                            <Input
                                                placeholder="Auto-generated"
                                                disabled={isEdit}
                                                {...field}
                                            />
                                        </FormControl>
                                        <FormDescription>
                                            {isEdit
                                                ? 'The employee number is fixed once assigned.'
                                                : 'Leave blank to generate the next number automatically. Only set one when importing a record that already has it.'}
                                        </FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="joinDate"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Join Date *</FormLabel>
                                        <FormControl>
                                            <Input type="date" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Department *</Label>
                                <Select
                                    value={departmentFilter}
                                    onValueChange={(value) => {
                                        setDepartmentFilter(value);
                                        // The current role may not belong to the new
                                        // department — clear it.
                                        form.setValue('roleId', '');
                                    }}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select a department" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {departmentOptions.list.map((dept) => (
                                            <SelectItem key={dept.id} value={dept.id}>
                                                {dept.name}
                                            </SelectItem>
                                        ))}
                                        {departmentOptions.hasUnassigned && (
                                            <SelectItem value={UNASSIGNED}>
                                                Unassigned
                                            </SelectItem>
                                        )}
                                    </SelectContent>
                                </Select>
                                <p className="text-xs text-muted-foreground">
                                    Narrows the roles to choose from.
                                </p>
                            </div>

                            <FormField
                                control={form.control}
                                name="roleId"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Role *</FormLabel>
                                        <Select
                                            onValueChange={field.onChange}
                                            value={field.value}
                                            disabled={!departmentFilter}
                                        >
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue
                                                        placeholder={
                                                            departmentFilter
                                                                ? 'Select a role'
                                                                : 'Select a department first'
                                                        }
                                                    />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                {filteredRoles.length === 0 && (
                                                    <EmptySelectHint
                                                        what="roles in that department"
                                                        href="/roles"
                                                        action="Add one under Staff → Roles"
                                                    />
                                                )}
                                                {filteredRoles.map((role) => (
                                                    <SelectItem key={role.id} value={role.id}>
                                                        {role.name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <FormField
                            control={form.control}
                            name="gradeId"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Grade</FormLabel>
                                    <Select
                                        onValueChange={field.onChange}
                                        value={field.value ?? ''}
                                    >
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select a grade" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {grades.length === 0 ? (
                                                <EmptySelectHint
                                                    what="grades"
                                                    href="/grades"
                                                    action="Add one under Staff → Grades"
                                                />
                                            ) : (
                                                grades.map((grade) => (
                                                    <SelectItem key={grade.id} value={grade.id}>
                                                        {grade.code} — {grade.name}
                                                    </SelectItem>
                                                ))
                                            )}
                                        </SelectContent>
                                    </Select>
                                    <FormDescription>
                                        Determines which payroll rules and exemptions apply.
                                    </FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </CardContent>
                </Card>

                {/* Actions */}
                <div className="flex items-center gap-3 justify-end">
                    <Link href={cancelHref}>
                        <Button variant="outline" type="button">
                            Cancel
                        </Button>
                    </Link>
                    <Button
                        type="submit"
                        disabled={submitting}
                        className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                    >
                        {submitting ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                {isEdit ? 'Saving...' : 'Creating...'}
                            </>
                        ) : isEdit ? (
                            'Save changes'
                        ) : (
                            'Create Employee'
                        )}
                    </Button>
                </div>
            </form>
        </Form>
    );
}
