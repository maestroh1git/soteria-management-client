'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2, Mail, MailCheck, ArrowLeft } from 'lucide-react';

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

const schema = z.object({
    email: z.string().email('Enter a valid email'),
});
type Values = z.infer<typeof schema>;

export default function ForgotPasswordPage() {
    const [sent, setSent] = useState(false);
    const [email, setEmail] = useState('');

    const form = useForm<Values>({
        resolver: zodResolver(schema),
        defaultValues: { email: '' },
    });

    async function onSubmit(values: Values) {
        setEmail(values.email);
        // The endpoint answers the same whether or not the email matched, so a
        // failure here is a network problem, not a wrong address — either way we
        // show the same confirmation and never reveal whether an account exists.
        try {
            await authApi.requestReset(values.email);
        } catch {
            // swallow — do not leak the outcome
        }
        setSent(true);
    }

    if (sent) {
        return (
            <Card className="w-full max-w-md">
                <CardHeader className="text-center">
                    <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-green-100 dark:bg-green-950/50">
                        <MailCheck className="h-6 w-6 text-green-600 dark:text-green-400" />
                    </div>
                    <CardTitle>Check your email</CardTitle>
                    <CardDescription>
                        If an account exists for <strong>{email}</strong>, a link to reset the
                        password is on its way. The link expires in an hour.
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
                <CardTitle>Reset your password</CardTitle>
                <CardDescription>
                    Enter your email and we&apos;ll send you a link to set a new password.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="email"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Email</FormLabel>
                                    <FormControl>
                                        <div className="relative">
                                            <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                            <Input type="email" className="pl-9" placeholder="you@example.com" {...field} />
                                        </div>
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
                            {form.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Send reset link
                        </Button>
                        <Link
                            href="/login"
                            className="flex items-center justify-center gap-1 text-sm text-muted-foreground hover:text-foreground"
                        >
                            <ArrowLeft className="h-3.5 w-3.5" /> Back to sign in
                        </Link>
                    </form>
                </Form>
            </CardContent>
        </Card>
    );
}
