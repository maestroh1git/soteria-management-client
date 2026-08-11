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
        </div>
    );
}
