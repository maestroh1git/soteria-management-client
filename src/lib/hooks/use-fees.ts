import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
    copyTermPrices,
    createFeeItem,
    getFeeItems,
    getFeeProjection,
    getPriceList,
    removeFeeItem,
    removeFeePrice,
    setFeePrice,
    updateFeeItem,
} from '../api/fees';

/** The catalogue changes rarely and is read by every price cell. */
const CATALOGUE_STALE = 5 * 60 * 1000;

export function useFeeItems(includeInactive = false) {
    return useQuery({
        queryKey: ['fees', 'items', includeInactive],
        queryFn: () => getFeeItems(includeInactive),
        staleTime: CATALOGUE_STALE,
    });
}

export function usePriceList(sessionId?: string) {
    return useQuery({
        queryKey: ['fees', 'structure', sessionId],
        queryFn: () => getPriceList(sessionId!),
        enabled: !!sessionId,
    });
}

export function useFeeProjection(sessionId?: string) {
    return useQuery({
        queryKey: ['fees', 'projection', sessionId],
        queryFn: () => getFeeProjection(sessionId!),
        enabled: !!sessionId,
    });
}

export function useCreateFeeItem() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: createFeeItem,
        onSuccess: (item) => {
            qc.invalidateQueries({ queryKey: ['fees'] });
            toast.success(`${item.name} added`);
        },
    });
}

export function useUpdateFeeItem() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({
            id,
            ...data
        }: { id: string } & Parameters<typeof updateFeeItem>[1]) =>
            updateFeeItem(id, data),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['fees'] });
            toast.success('Fee updated');
        },
    });
}

export function useRemoveFeeItem() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: removeFeeItem,
        onSuccess: (result) => {
            qc.invalidateQueries({ queryKey: ['fees'] });
            // Say which of the two things happened. "Deleted" when it was
            // actually kept and hidden is the kind of small lie that costs
            // somebody an afternoon later.
            toast.success(
                result.deactivated
                    ? 'Fee retired — it stays on price lists that already use it'
                    : 'Fee deleted',
            );
        },
    });
}

/**
 * Saving one cell.
 *
 * No toast: a bursar filling a grid would get one per keystroke-ish edit, and a
 * wall of notifications trains people to ignore them. The cell shows its own
 * state; failures still surface through the mutation's error.
 */
export function useSetFeePrice() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: setFeePrice,
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['fees', 'structure'] });
            qc.invalidateQueries({ queryKey: ['fees', 'projection'] });
        },
    });
}

export function useRemoveFeePrice() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: removeFeePrice,
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['fees', 'structure'] });
            qc.invalidateQueries({ queryKey: ['fees', 'projection'] });
        },
    });
}

export function useCopyTermPrices() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: copyTermPrices,
        onSuccess: (result) => {
            qc.invalidateQueries({ queryKey: ['fees'] });
            const parts = [`${result.copied} copied`];
            if (result.overwritten) parts.push(`${result.overwritten} replaced`);
            if (result.skipped) parts.push(`${result.skipped} left alone`);
            toast.success(parts.join(', '));
        },
    });
}
