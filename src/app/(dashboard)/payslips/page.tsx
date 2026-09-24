'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { LoadingSkeleton } from '@/components/common/loading-skeleton';
import { EmptyState } from '@/components/common/empty-state';
import { usePayPeriods } from '@/lib/hooks/use-payroll';
import { PayPeriodStatus } from '@/lib/types/enums';

/**
 * Payslips live on their pay run now (C4.6). Old links and bookmarks land on
 * the latest run that has them: the most recent closed one, else the most
 * recent of any status.
 */
export default function PayslipsPage() {
    const router = useRouter();
    const { data: periods, isLoading, isError } = usePayPeriods();

    const byRecent = [...(periods ?? [])].sort((a, b) => b.startDate.localeCompare(a.startDate));
    const closed = byRecent.filter((p) => p.status === PayPeriodStatus.CLOSED);
    const target = (closed.length ? closed : byRecent)[0];

    useEffect(() => {
        if (target) router.replace(`/payroll/${target.id}?tab=payslips`);
    }, [target, router]);

    if (isLoading || target) return <LoadingSkeleton rows={4} />;
    return (
        <EmptyState
            isError={isError}
            subject="the pay runs"
            title="No pay runs yet"
            description="Payslips are made from a pay run. Create and process one under Pay runs."
            actionLabel="Go to pay runs"
            onAction={() => router.push('/payroll')}
        />
    );
}
