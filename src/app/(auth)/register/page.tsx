'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2, Mail, Lock, User, Building2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
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
import { useAuth } from '@/lib/hooks/use-auth';

const ORGANIZATION_TYPES = [
  { value: 'OTHER', label: 'Other' },
  { value: 'SCHOOL', label: 'School' },
  { value: 'HOSPITAL', label: 'Hospital' },
  { value: 'CORPORATE', label: 'Corporate' },
  { value: 'NGO', label: 'NGO' },
  { value: 'GOVERNMENT', label: 'Government' },
  { value: 'NONPROFIT', label: 'Non-Profit' },
  { value: 'HOSPITALITY', label: 'Hospitality' },
] as const;

const registerSchema = z.object({
    organizationName: z.string().min(2, 'Organization name must be at least 2 characters'),
    organizationType: z.string().optional(),
    firstName: z.string().min(1, 'First name is required'),
    lastName: z.string().min(1, 'Last name is required'),
    email: z.string().email('Enter a valid email address'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
});

type RegisterValues = z.infer<typeof registerSchema>;

export default function RegisterPage() {
    const router = useRouter();
    const { register: registerUser } = useAuth();
    const [serverError, setServerError] = useState<string | null>(null);

    const form = useForm<RegisterValues>({
        resolver: zodResolver(registerSchema),
        defaultValues: {
            organizationName: '',
            organizationType: 'OTHER',
            firstName: '',
            lastName: '',
            email: '',
            password: '',
        },
    });

    const isSubmitting = form.formState.isSubmitting;

    async function onSubmit(values: RegisterValues) {
        setServerError(null);
        try {
            await registerUser({
                email: values.email,
                password: values.password,
                firstName: values.firstName,
                lastName: values.lastName,
                organizationName: values.organizationName,
                organizationType: values.organizationType as any,
            });
            document.cookie = `auth-token=true; path=/; max-age=${60 * 60 * 24 * 7}`;
            router.push('/');
        } catch (err: unknown) {
            const message =
                err && typeof err === 'object' && 'message' in err
                    ? String((err as { message: string | string[] }).message)
                    : 'Registration failed. Please try again.';
            setServerError(message);
        }
    }

    return (
        <Card className="shadow-xl border-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm">
            <CardContent className="pt-6">
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        {serverError && (
                            <div className="rounded-lg bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 p-3">
                                <p className="text-sm text-red-600 dark:text-red-400">
                                    {serverError}
                                </p>
                            </div>
                        )}

                        <FormField
                            control={form.control}
                            name="organizationName"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Organization Name</FormLabel>
                                    <FormControl>
                                        <div className="relative">
                                            <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                            <Input
                                                placeholder="Acme Corp"
                                                className="pl-9"
                                                {...field}
                                            />
                                        </div>
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="organizationType"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Organization Type</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select type" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {ORGANIZATION_TYPES.map((t) => (
                                                <SelectItem key={t.value} value={t.value}>
                                                    {t.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <div className="grid grid-cols-2 gap-3">
                            <FormField
                                control={form.control}
                                name="firstName"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>First Name</FormLabel>
                                        <FormControl>
                                            <div className="relative">
                                                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                                <Input placeholder="John" className="pl-9" {...field} />
                                            </div>
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
                                        <FormLabel>Last Name</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Doe" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <FormField
                            control={form.control}
                            name="email"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Email</FormLabel>
                                    <FormControl>
                                        <div className="relative">
                                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                            <Input
                                                placeholder="admin@acmecorp.com"
                                                type="email"
                                                className="pl-9"
                                                {...field}
                                            />
                                        </div>
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="password"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Password</FormLabel>
                                    <FormControl>
                                        <div className="relative">
                                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                            <Input
                                                placeholder="Min. 6 characters"
                                                type="password"
                                                className="pl-9"
                                                {...field}
                                            />
                                        </div>
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <Button
                            type="submit"
                            className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Creating your account...
                                </>
                            ) : (
                                'Create Account'
                            )}
                        </Button>
                    </form>
                </Form>
            </CardContent>
            <CardFooter className="justify-center pb-6">
                <p className="text-sm text-muted-foreground">
                    Already have an account?{' '}
                    <Link
                        href="/login"
                        className="font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400"
                    >
                        Sign in
                    </Link>
                </p>
            </CardFooter>
        </Card>
    );
}
