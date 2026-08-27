'use client';

import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2, Lock, KeyRound } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription,
} from '@/components/ui/card';
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/form';
import { authApi } from '@/lib/api/auth';
import { useAuthStore } from '@/stores/auth-store';
import { getApiErrorMessage } from '@/lib/utils/api-error';
import { passwordSchema, PASSWORD_POLICY_HINT } from '@/lib/utils/validation';

const schema = z
    .object({
        password: passwordSchema,
        confirmPassword: z.string().min(1, 'Please confirm your password'),
    })
    .refine((d) => d.password === d.confirmPassword, {
        message: 'Passwords do not match',
        path: ['confirmPassword'],
    });

type Values = z.infer<typeof schema>;

function AcceptInviteForm() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const token = searchParams.get('token') ?? '';
    const [serverError, setServerError] = useState<string | null>(null);

    const form = useForm<Values>({
        resolver: zodResolver(schema),
        defaultValues: { password: '', confirmPassword: '' },
    });

    const isSubmitting = form.formState.isSubmitting;

    async function onSubmit(values: Values) {
        setServerError(null);
        try {
            const res = await authApi.acceptInvite({
                token,
                password: values.password,
            });

            // Accepting activates the account and signs them in — apply the
            // session exactly as login does, then land them inside.
            localStorage.setItem('auth-token', res.token);
            useAuthStore.setState({
                user: res.user,
                token: res.token,
                isAuthenticated: true,
            });

            const maxAge = 60 * 60 * 24 * 7;
            document.cookie = `auth-token=true; path=/; max-age=${maxAge}`;
            if (res.user?.systemRoles) {
                document.cookie = `user-roles=${encodeURIComponent(
                    JSON.stringify(res.user.systemRoles),
                )}; path=/; max-age=${maxAge}`;
            }

            router.push('/');
        } catch (err) {
            setServerError(
                getApiErrorMessage(err, 'This invite link is invalid or has expired.'),
            );
        }
    }

    if (!token) {
        return (
            <Card className="w-full max-w-md">
                <CardHeader className="text-center">
                    <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-950/50">
                        <KeyRound className="h-6 w-6 text-amber-600 dark:text-amber-400" />
                    </div>
                    <CardTitle>Invalid invite link</CardTitle>
                    <CardDescription>
                        This link is missing its token. Ask your administrator to send the
                        invitation again.
                    </CardDescription>
                </CardHeader>
                <CardContent className="text-center">
                    <Link href="/login" className="text-sm font-medium text-blue-600 hover:underline dark:text-blue-400">
                        Back to sign in
                    </Link>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="w-full max-w-md">
            <CardHeader className="text-center">
                <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-950/50">
                    <KeyRound className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
                <CardTitle>Set your password</CardTitle>
                <CardDescription>
                    Choose a password to activate your account and sign in.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="password"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>New password</FormLabel>
                                    <FormControl>
                                        <div className="relative">
                                            <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                            <Input type="password" className="pl-9" placeholder="Enter a password" {...field} />
                                        </div>
                                    </FormControl>
                                    <p className="text-xs text-muted-foreground">
                                        {PASSWORD_POLICY_HINT}
                                    </p>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="confirmPassword"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Confirm password</FormLabel>
                                    <FormControl>
                                        <div className="relative">
                                            <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                            <Input type="password" className="pl-9" placeholder="Re-enter the password" {...field} />
                                        </div>
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {serverError && (
                            <p className="text-sm text-destructive">{serverError}</p>
                        )}

                        <Button type="submit" className="w-full" disabled={isSubmitting}>
                            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Set password & sign in
                        </Button>
                    </form>
                </Form>
            </CardContent>
        </Card>
    );
}

export default function AcceptInvitePage() {
    return (
        <Suspense
            fallback={
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" /> Loading…
                </div>
            }
        >
            <AcceptInviteForm />
        </Suspense>
    );
}
