'use client';

import { useQuery } from '@tanstack/react-query';
import { getHome } from '@/lib/api/home';

/** What is waiting on me; refreshed when the window regains focus. */
export function useHome() {
    return useQuery({
        queryKey: ['home'],
        queryFn: getHome,
        staleTime: 30 * 1000,
        refetchOnWindowFocus: true,
    });
}
