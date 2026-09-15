import { Sidebar } from '@/components/layout/sidebar';
import { Topbar } from '@/components/layout/topbar';
import { MobileSidebar } from '@/components/layout/mobile-sidebar';
import { CommandMenu } from '@/components/common/command-menu';
import { BrandingHead } from '@/components/layout/branding-head';

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="flex h-screen overflow-hidden bg-slate-50 dark:bg-slate-950">
            <BrandingHead />
            <CommandMenu />
            <Sidebar />
            <MobileSidebar />
            {/*
              * WCAG 2.4.1. The sidebar is seventeen links, and without this a
              * keyboard or screen-reader user tabs through every one of them to
              * reach the page content — on every page, every time. Invisible
              * until focused, which is the first thing Tab reaches.
              */}
            <a
                href="#main-content"
                className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-primary focus:px-4 focus:py-2 focus:text-primary-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            >
                Skip to main content
            </a>
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
