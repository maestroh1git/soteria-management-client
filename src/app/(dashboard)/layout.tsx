import { Sidebar } from '@/components/layout/sidebar';
import { Topbar } from '@/components/layout/topbar';
import { MobileSidebar } from '@/components/layout/mobile-sidebar';
import { CommandMenu } from '@/components/common/command-menu';
import { BrandingHead } from '@/components/layout/branding-head';
import { UnauthorizedNotice } from '@/components/layout/unauthorized-notice';
import { Suspense } from 'react';
import { SessionSync } from '@/lib/hooks/use-session';

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="flex h-screen overflow-hidden bg-slate-50 dark:bg-slate-950">
            <SessionSync />
            {/*
              * WCAG 2.4.1, and it has to be FIRST in the DOM to mean anything:
              * the whole point is reaching it before the sidebar's seventeen
              * links, so anything rendered above it defeats it.
              *
              * Parked off-screen with `top`, not `sr-only` and not a transform.
              * `focus:not-sr-only` does not reliably win back the 1px box, and
              * the translate utilities compose through a CSS variable that the
              * focus variant updated without moving the element — verified in
              * the browser, both times. A skip link that stays invisible when
              * focused is worse than none: a sighted keyboard user loses track
              * of where focus went. `top` is a plain property and just works.
              */}
            <a
                href="#main-content"
                className="absolute left-4 -top-20 z-50 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-all focus:top-4 focus:outline-none focus:ring-2 focus:ring-ring"
            >
                Skip to main content
            </a>
            <BrandingHead />
            {/* useSearchParams needs a boundary, or every page here renders
                on the client only. */}
            <Suspense fallback={null}>
                <UnauthorizedNotice />
            </Suspense>
            <CommandMenu />
            <Sidebar />
            <MobileSidebar />
            <div className="flex-1 flex flex-col overflow-hidden">
                <Topbar />
                <main
                    id="main-content"
                    tabIndex={-1}
                    className="flex-1 overflow-y-auto p-4 md:p-6"
                >
                    {children}
                </main>
            </div>
        </div>
    );
}
