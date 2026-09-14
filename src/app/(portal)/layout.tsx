'use client';

import type { ReactNode } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { GraduationCap, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useBranding } from '@/lib/hooks/use-branding';
import { brandingImageUrl } from '@/lib/api/branding';
import { useAuth } from '@/lib/hooks/use-auth';
import { clearSession } from '@/lib/utils/session';

/**
 * The shell a parent sees.
 *
 * Deliberately not the staff sidebar: a parent has no school to administer, and
 * a nav full of payroll and admissions would be both confusing and a list of
 * doors that are locked anyway.
 */
export default function PortalLayout({ children }: { children: ReactNode }) {
    const router = useRouter();
    const { data: branding } = useBranding();
    const { fullName, tenantName } = useAuth();
    const logoUrl = brandingImageUrl(branding?.logoUrl);

    function signOut() {
        clearSession();
        router.push('/login');
    }

    return (
        <div className="min-h-screen bg-muted/30">
            <header className="border-b bg-background">
                <div className="mx-auto flex w-full max-w-3xl items-center justify-between px-4 py-3">
                    <Link href="/portal" className="flex items-center gap-2">
                        {logoUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                                src={logoUrl}
                                alt={tenantName ?? 'School'}
                                className="h-8 w-8 rounded-lg object-contain"
                            />
                        ) : (
                            <GraduationCap className="h-6 w-6 text-primary" />
                        )}
                        <div className="leading-tight">
                            <p className="text-sm font-semibold">
                                {tenantName ?? 'Parent portal'}
                            </p>
                            <p className="text-xs text-muted-foreground">
                                {fullName}
                            </p>
                        </div>
                    </Link>
                    <Button variant="ghost" size="sm" onClick={signOut}>
                        <LogOut className="mr-2 h-4 w-4" />
                        Sign out
                    </Button>
                </div>
            </header>
            <main className="mx-auto w-full max-w-3xl px-4 py-6 sm:py-10">
                {children}
            </main>
        </div>
    );
}
