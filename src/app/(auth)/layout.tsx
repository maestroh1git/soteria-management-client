import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Soteria Payroll',
    description: 'Manage your payroll, employees, and finances',
};

export default function AuthLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 p-4">
            <div className="w-full max-w-md">
                {/* Logo / Brand */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 shadow-lg mb-4">
                        <span className="text-2xl text-white font-bold">S</span>
                    </div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                        Soteria Payroll
                    </h1>
                    <p className="text-sm text-muted-foreground mt-1">
                        Manage your payroll with ease
                    </p>
                </div>
                {children}
                {/* Reachable from the page everyone starts on. */}
                <nav
                    aria-label="Legal"
                    className="mt-8 flex justify-center gap-4 text-xs text-muted-foreground"
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
                        Terms
                    </a>
                </nav>
            </div>
        </div>
    );
}
