'use client';

import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, ArrowLeft } from 'lucide-react';
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
import { useCreateEmployee } from '@/lib/hooks/use-employees';
import { useQuery } from '@tanstack/react-query';
import { getRoles } from '@/lib/api/roles';
import {
    createEmployeeSchema,
    type CreateEmployeeValues,
} from '@/lib/utils/validation';
import { EmployeeGender } from '@/lib/types/enums';

export default function NewEmployeePage() {
    const router = useRouter();
    const createMutation = useCreateEmployee();
    const { data: roles = [] } = useQuery({
        queryKey: ['roles'],
        queryFn: getRoles,
    });

    const form = useForm<CreateEmployeeValues>({
        resolver: zodResolver(createEmployeeSchema),
        defaultValues: {
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
        },
    });

    async function onSubmit(values: CreateEmployeeValues) {
        // Clean optional empty strings
        const dto = {
            ...values,
            middleName: values.middleName || undefined,
            address: values.address || undefined,
            countryId: values.countryId || undefined,
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
                                                    placeholder="john@school.com"
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
                                            <FormLabel>Employee Number *</FormLabel>
                                            <FormControl>
                                                <Input placeholder="EMP001" {...field} />
                                            </FormControl>
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

                            <FormField
                                control={form.control}
                                name="roleId"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Role *</FormLabel>
                                        <Select onValueChange={field.onChange} value={field.value}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select a role" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                {roles.map((role) => (
                                                    <SelectItem key={role.id} value={role.id}>
                                                        {role.name}
                                                        {role.department
                                                            ? ` — ${role.department.name}`
                                                            : ''}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </CardContent>
                    </Card>

                    {/* Actions */}
                    <div className="flex items-center gap-3 justify-end">
                        <Link href="/employees">
                            <Button variant="outline" type="button">
                                Cancel
                            </Button>
                        </Link>
                        <Button
                            type="submit"
                            disabled={createMutation.isPending}
                            className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                        >
                            {createMutation.isPending ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Creating...
                                </>
                            ) : (
                                'Create Employee'
                            )}
                        </Button>
                    </div>
                </form>
            </Form>
        </div>
    );
}
