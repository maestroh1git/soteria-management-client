import { useQuery } from '@tanstack/react-query';
import { getBanks } from '../api/banks';

/**
 * Reference data — identical for every tenant and effectively static, so it is
 * cached hard rather than refetched on every mount of the bank form.
 */
export function useBanks() {
    return useQuery({
        queryKey: ['banks'],
        queryFn: getBanks,
        staleTime: 24 * 60 * 60 * 1000,
        gcTime: 24 * 60 * 60 * 1000,
    });
}
