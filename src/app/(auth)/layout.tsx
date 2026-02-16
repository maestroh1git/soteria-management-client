import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'School Payroll System',
    description: 'Manage your school payroll, employees, and finances',
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
                        School Payroll
                    </h1>
                    <p className="text-sm text-muted-foreground mt-1">
                        Manage your school&apos;s payroll with ease
                    </p>
                </div>
                {children}
            </div>
        </div>
    );
}
