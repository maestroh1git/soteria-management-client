import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
    getBanks,
    createBank,
    updateBank,
    deleteBank,
    type CustomBankDto,
} from '../api/banks';

/**
 * The bank list — the standard NIBSS list plus this tenant's additions. Cached
 * hard because it changes rarely; a tenant editing its own banks invalidates it
 * so the dropdown everywhere picks the change up.
 */
export function useBanks() {
    return useQuery({
        queryKey: ['banks'],
        queryFn: getBanks,
        staleTime: 24 * 60 * 60 * 1000,
        gcTime: 24 * 60 * 60 * 1000,
    });
}

export function useCreateBank() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (dto: CustomBankDto) => createBank(dto),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['banks'] });
            toast.success('Bank added');
        },
        onError: (e: Error) => toast.error(e.message || 'Failed to add bank'),
    });
}

export function useUpdateBank() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ id, dto }: { id: string; dto: Partial<CustomBankDto> }) =>
            updateBank(id, dto),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['banks'] });
            toast.success('Bank updated');
        },
        onError: (e: Error) => toast.error(e.message || 'Failed to update bank'),
    });
}

export function useDeleteBank() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (id: string) => deleteBank(id),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['banks'] });
            toast.success('Bank removed');
        },
        onError: (e: Error) => toast.error(e.message || 'Failed to remove bank'),
    });
}
