'use client';

import { useAuth } from '@/lib/hooks/use-auth';
import { StatCard } from '@/components/common/stat-card';
import {
    Users,
    Calculator,
    Receipt,
    TrendingUp,
} from 'lucide-react';

export default function DashboardPage() {
    const { fullName, tenantName } = useAuth();

    return (
        <div className="space-y-8">
            {/* Welcome header */}
            <div>
                <h1 className="text-3xl font-bold tracking-tight">
                    Welcome back, {fullName.split(' ')[0] || 'Admin'}
                </h1>
                <p className="text-muted-foreground mt-1">
                    Here&apos;s an overview of {tenantName}&apos;s payroll status
                </p>
            </div>

            {/* KPI Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                    title="Total Employees"
                    value="—"
                    subtitle="Active employees"
                    icon={Users}
                />
                <StatCard
                    title="Monthly Payroll"
                    value="—"
                    subtitle="Current period"
                    icon={Calculator}
                />
                <StatCard
                    title="Active Loans"
                    value="—"
                    subtitle="Outstanding"
                    icon={Receipt}
                />
                <StatCard
                    title="Net Salary"
                    value="—"
                    subtitle="Last period average"
                    icon={TrendingUp}
                />
            </div>

            {/* Placeholder content */}
            <div className="rounded-lg border border-dashed border-slate-300 dark:border-slate-700 p-12 text-center">
                <p className="text-muted-foreground">
                    Dashboard charts and recent activity will be populated in Phase 5.
                </p>
            </div>
        </div>
    );
}
