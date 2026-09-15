import type { ReactNode } from 'react';

/**
 * The shell for pages a parent sees.
 *
 * No sidebar, no auth guard, no tenant context — none of which exist for
 * somebody who has never logged in. Narrow by default because the primary
 * device here is a phone, which is the opposite of the dashboard's assumption.
 */
export default function PublicLayout({ children }: { children: ReactNode }) {
    return (
        <div className="min-h-screen bg-muted/30">
            <main className="mx-auto w-full max-w-2xl px-4 py-8 sm:py-12">
                {children}
            </main>
            {/* A policy nobody can find is not a policy. These pages are the
                first place a parent looks before handing over a child's
                medical details. */}
            <footer className="mx-auto w-full max-w-2xl px-4 pb-10">
                <nav
                    aria-label="Legal"
                    className="flex flex-wrap gap-x-4 gap-y-1 border-t pt-4 text-xs text-muted-foreground"
                >
                    <a
                        href="/privacy"
                        className="-my-1 inline-flex min-h-[24px] items-center py-1 hover:underline"
                    >
                        Privacy policy
                    </a>
                    <a
                        href="/terms"
                        className="-my-1 inline-flex min-h-[24px] items-center py-1 hover:underline"
                    >
                        Terms of service
                    </a>
                </nav>
            </footer>
        </div>
    );
}
