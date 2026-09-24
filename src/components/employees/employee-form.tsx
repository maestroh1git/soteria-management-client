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
import { useTaxStates } from '@/lib/hooks/use-employees';
import { PrerequisiteNotice } from '@/components/onboarding/prerequisite-notice';
import { EmptySelectHint } from '@/components/common/empty-select-hint';
import {
    createEmployeeSchema,
    type CreateEmployeeValues,
} from '@/lib/utils/validation';
import {
    EMPLOYMENT_TYPES,
    FIXED_TERM_EMPLOYMENT_TYPES,
    TERMINATION_REASONS,
    EmployeeGender,
    EmployeeStatus,
    RoleType,
} from '@/lib/types/enums';

/** Enum member → something a person reads. */
const humanise = (value: string) =>
    value
        .toLowerCase()
        .split('_')
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');

const LAGOS = 'Lagos';

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
    nin: '',
    bvn: '',
    tin: '',
    taxState: '',
    lasrraId: '',
    rsaPin: '',
    pfaName: '',
    nhfNumber: '',
    employmentType: '',
    contractEndDate: '',
    nextOfKinName: '',
    nextOfKinPhone: '',
    nextOfKinRelationship: '',
    terminationDate: '',
    terminationReason: '',
    lastWorkingDay: '',
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

    // Served rather than hard-coded, so the dropdown can never offer a state
    // the server would reject.
    const { data: taxStates = [] } = useTaxStates();

    // Three fields only make sense in the light of another, and showing them
    // unconditionally is how a form teaches people to skim past it: LASRRA is
    // a Lagos register, a contract end date belongs to a fixed term, and there
    // is nothing to say about an exit until somebody has left.
    const taxState = form.watch('taxState');
    const employmentType = form.watch('employmentType');
    const roleId = form.watch('roleId');
    const terminationDate = form.watch('terminationDate');

    const selectedRole = roles.find((role) => role.id === roleId);
    const fixedTerm = employmentType
        ? FIXED_TERM_EMPLOYMENT_TYPES.includes(employmentType)
        : selectedRole?.roleType === RoleType.CONTRACTOR;

    if (noRoles) {
        return (
            <PrerequisiteNotice
                message="Add at least one position first — everyone on the staff list holds one."
                href="/setup/positions"
                actionLabel="Add a position"
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

                {/* Statutory identifiers — optional, and never silent. Each
                    description says what the empty field actually costs, which
                    is the same sentence the employee's profile will show back
                    if it is left blank. */}
                <Card>
                    <CardHeader>
                        <CardTitle>Statutory &amp; Tax</CardTitle>
                        <CardDescription>
                            All optional — add them as the paperwork arrives. Whatever is
                            left blank is listed on the employee’s profile, with what it
                            holds up.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="nin"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>NIN</FormLabel>
                                        <FormControl>
                                            <Input
                                                inputMode="numeric"
                                                maxLength={11}
                                                placeholder="11 digits"
                                                {...field}
                                            />
                                        </FormControl>
                                        <FormDescription>
                                            What a TIN is issued against.
                                        </FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="bvn"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>BVN</FormLabel>
                                        <FormControl>
                                            <Input
                                                inputMode="numeric"
                                                maxLength={11}
                                                placeholder="11 digits"
                                                {...field}
                                            />
                                        </FormControl>
                                        <FormDescription>
                                            Confirms the salary account belongs to this person.
                                        </FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="tin"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>TIN</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Tax Identification Number" {...field} />
                                        </FormControl>
                                        <FormDescription>
                                            Identifies this employee on the PAYE schedule filed with
                                            the state revenue service.
                                        </FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="taxState"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>State of residence</FormLabel>
                                        <Select
                                            onValueChange={field.onChange}
                                            value={field.value ?? ''}
                                        >
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select a state" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                {taxStates.map((state) => (
                                                    <SelectItem key={state.name} value={state.name}>
                                                        {state.name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <FormDescription>
                                            PAYE is remitted to the state the employee lives in —
                                            not the state the organisation sits in.
                                        </FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        {/* Lagos runs the one residents register a revenue
                            service leans on; for anyone else this field is
                            noise, so it is not shown. */}
                        {taxState === LAGOS && (
                            <FormField
                                control={form.control}
                                name="lasrraId"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>LASRRA number</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Lagos residents registration number" {...field} />
                                        </FormControl>
                                        <FormDescription>
                                            Lagos treats LASRRA registration as proof of residency,
                                            and asks for the number alongside the TIN.
                                        </FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        )}
                    </CardContent>
                </Card>

                <Separator />

                {/* Pension & housing */}
                <Card>
                    <CardHeader>
                        <CardTitle>Pension &amp; Housing</CardTitle>
                        <CardDescription>
                            Where the pension and NHF deductions on this employee’s payslip
                            are actually remitted.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="rsaPin"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>RSA PIN</FormLabel>
                                        <FormControl>
                                            <Input placeholder="PEN100200300400" {...field} />
                                        </FormControl>
                                        <FormDescription>
                                            A pension deduction with no RSA PIN leaves the payslip
                                            with nowhere to go.
                                        </FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="pfaName"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Pension Fund Administrator</FormLabel>
                                        <FormControl>
                                            <Input placeholder="e.g. Stanbic IBTC Pension Managers" {...field} />
                                        </FormControl>
                                        <FormDescription>
                                            The PIN names the account; the PFA is who it is sent to.
                                        </FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <FormField
                            control={form.control}
                            name="nhfNumber"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>NHF number</FormLabel>
                                    <FormControl>
                                        <Input placeholder="National Housing Fund number" {...field} />
                                    </FormControl>
                                    <FormDescription>
                                        Only for staff enrolled in the scheme — it is what credits
                                        the contribution to them at the Federal Mortgage Bank.
                                    </FormDescription>
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
                                <Label htmlFor="employees-employee-form-department">Department *</Label>
                                <Select
                                    value={departmentFilter}
                                    onValueChange={(value) => {
                                        setDepartmentFilter(value);
                                        // The current role may not belong to the new
                                        // department — clear it.
                                        form.setValue('roleId', '');
                                    }}
                                >
                                    <SelectTrigger id="employees-employee-form-department">
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
                                        <FormLabel>Position *</FormLabel>
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
                                                                ? 'Select a position'
                                                                : 'Select a department first'
                                                        }
                                                    />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                {filteredRoles.length === 0 && (
                                                    <EmptySelectHint
                                                        what="roles in that department"
                                                        href="/setup/positions"
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
                                                    href="/setup/grades"
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

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="employmentType"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Employment type</FormLabel>
                                        <Select
                                            onValueChange={field.onChange}
                                            value={field.value ?? ''}
                                        >
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue
                                                        placeholder={
                                                            selectedRole
                                                                ? `Same as the role (${humanise(selectedRole.roleType)})`
                                                                : 'Same as the role'
                                                        }
                                                    />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                {EMPLOYMENT_TYPES.map((type) => (
                                                    <SelectItem key={type} value={type}>
                                                        {humanise(type)}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <FormDescription>
                                            How this person is engaged. Leave it unset to follow the
                                            role — set it when their own terms differ.
                                        </FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            {/* Only a fixed term has an end. Shown when the
                                person's type says so, or when the role does. */}
                            {fixedTerm && (
                                <FormField
                                    control={form.control}
                                    name="contractEndDate"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Contract end date</FormLabel>
                                            <FormControl>
                                                <Input type="date" {...field} />
                                            </FormControl>
                                            <FormDescription>
                                                Nothing stops a payroll run on its own — a lapsed
                                                contract with no end date keeps being paid.
                                            </FormDescription>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            )}
                        </div>
                    </CardContent>
                </Card>

                <Separator />

                {/* Next of kin */}
                <Card>
                    <CardHeader>
                        <CardTitle>Next of Kin</CardTitle>
                        <CardDescription>
                            Who to call if something happens to this employee at work.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <FormField
                                control={form.control}
                                name="nextOfKinName"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Full name</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Full name" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="nextOfKinPhone"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Phone</FormLabel>
                                        <FormControl>
                                            <Input placeholder="08031234567" {...field} />
                                        </FormControl>
                                        <FormDescription>
                                            A name without a number is nobody to call.
                                        </FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="nextOfKinRelationship"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Relationship</FormLabel>
                                        <FormControl>
                                            <Input placeholder="e.g. Spouse" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>
                    </CardContent>
                </Card>

                {/* Exit — edit only. Nobody is hired and terminated in the same
                    form, and offering the fields on create invites a
                    contradictory record. */}
                {isEdit && (
                    <>
                        <Separator />
                        <Card>
                            <CardHeader>
                                <CardTitle>Employment Status</CardTitle>
                                <CardDescription>
                                    Recording an exit here is what stops the payroll and what a
                                    final settlement is worked out from.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <FormField
                                        control={form.control}
                                        name="status"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Status</FormLabel>
                                                <Select
                                                    onValueChange={field.onChange}
                                                    value={field.value ?? EmployeeStatus.ACTIVE}
                                                >
                                                    <FormControl>
                                                        <SelectTrigger>
                                                            <SelectValue />
                                                        </SelectTrigger>
                                                    </FormControl>
                                                    <SelectContent>
                                                        {Object.values(EmployeeStatus).map((value) => (
                                                            <SelectItem key={value} value={value}>
                                                                {humanise(value)}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="terminationDate"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Termination date</FormLabel>
                                                <FormControl>
                                                    <Input
                                                        type="date"
                                                        {...field}
                                                        onChange={(event) => {
                                                            field.onChange(event);
                                                            // A leaving date and an ACTIVE status
                                                            // describe two different employees. The
                                                            // server resolves this the same way; doing
                                                            // it here means the user sees it happen
                                                            // rather than discovering it afterwards.
                                                            if (
                                                                event.target.value &&
                                                                form.getValues('status') ===
                                                                    EmployeeStatus.ACTIVE
                                                            ) {
                                                                form.setValue(
                                                                    'status',
                                                                    EmployeeStatus.TERMINATED,
                                                                );
                                                            }
                                                        }}
                                                    />
                                                </FormControl>
                                                <FormDescription>
                                                    Leave blank for current staff.
                                                </FormDescription>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>

                                {terminationDate && (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <FormField
                                            control={form.control}
                                            name="terminationReason"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Reason for leaving</FormLabel>
                                                    <Select
                                                        onValueChange={field.onChange}
                                                        value={field.value ?? ''}
                                                    >
                                                        <FormControl>
                                                            <SelectTrigger>
                                                                <SelectValue placeholder="Select a reason" />
                                                            </SelectTrigger>
                                                        </FormControl>
                                                        <SelectContent>
                                                            {TERMINATION_REASONS.map((reason) => (
                                                                <SelectItem key={reason} value={reason}>
                                                                    {humanise(reason)}
                                                                </SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                    <FormDescription>
                                                        A date says when the payroll stopped; the reason
                                                        is what a final settlement and any rehire
                                                        decision rest on.
                                                    </FormDescription>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={form.control}
                                            name="lastWorkingDay"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Last working day</FormLabel>
                                                    <FormControl>
                                                        <Input type="date" {...field} />
                                                    </FormControl>
                                                    <FormDescription>
                                                        Differs from the termination date when notice is
                                                        paid in lieu; leave accrues to this day.
                                                    </FormDescription>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </>
                )}

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
