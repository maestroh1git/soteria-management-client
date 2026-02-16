'use client';

import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import {
    EmployeeStatus,
    SalaryStatus,
    PayPeriodStatus,
    LoanStatus,
    PayslipStatus,
} from '@/lib/types/enums';

type StatusValue =
    | EmployeeStatus
    | SalaryStatus
    | PayPeriodStatus
    | LoanStatus
    | PayslipStatus
    | string;

const statusColorMap: Record<string, string> = {
    // Gray — drafts, pending, generated, inactive
    DRAFT: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
    PENDING: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
    GENERATED: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
    INACTIVE: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
    SCHEDULED: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
    CANCELLED: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',

    // Blue — open, approved, sent, processing
    OPEN: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    APPROVED: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    SENT: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',

    // Green — active, paid, fully_paid, viewed, closed
    ACTIVE: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
    PAID: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
    FULLY_PAID: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
    VIEWED: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
    CLOSED: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',

    // Red — rejected, failed, defaulted, terminated
    REJECTED: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    FAILED: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    DEFAULTED: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    TERMINATED: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',

    // Yellow — processing payroll
    PROCESSING: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
};

interface StatusBadgeProps {
    status: StatusValue;
    className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
    const colorClass =
        statusColorMap[status] ??
        'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300';

    const label = status
        .replace(/_/g, ' ')
        .replace(/\b\w/g, (c) => c.toUpperCase());

    return (
        <Badge
            variant="secondary"
            className={cn(
                'font-medium text-xs px-2.5 py-0.5 rounded-full border-0',
                colorClass,
                className,
            )}
        >
            {label}
        </Badge>
    );
}
