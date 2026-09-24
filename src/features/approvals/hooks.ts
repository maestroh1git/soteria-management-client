'use client';

import { useQuery } from '@tanstack/react-query';
import { getApprovals } from '@/lib/api/approvals';

export const APPROVALS_KEY = ['approvals'] as const;

/**
 * What waits on you. Read by the inbox and the sidebar's count, so it is one
 * cached request; refreshed every minute and when the window regains focus.
 */
export function useApprovals(enabled = true) {
    return useQuery({
        queryKey: APPROVALS_KEY,
        queryFn: getApprovals,
        enabled,
        refetchInterval: 60_000,
        refetchOnWindowFocus: true,
    });
}
