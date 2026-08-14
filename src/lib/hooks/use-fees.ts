import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
    approveConcession,
    cancelInvoice,
    copyTermPrices,
    createConcession,
    createFeeItem,
    generateInvoices,
    getConcessions,
    getFeeItems,
    getFeeProjection,
    getInvoice,
    getInvoiceRunPreview,
    getInvoices,
    getPriceList,
    getSubscriptions,
    issueInvoice,
    issueTermInvoices,
    rejectConcession,
    removeFeeItem,
    removeFeePrice,
    setFeePrice,
    subscribeStudentFee,
    updateFeeItem,
    type InvoiceStatus,
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

// ── S2: invoicing ────────────────────────────────────────────────────────

/**
 * The preview is not cached beyond the moment it is asked for.
 *
 * It is a statement about what a run would do right now, and a stale one shown
 * next to a "Generate" button is a bursar approving numbers that have since
 * changed.
 */
export function useInvoiceRunPreview(termId?: string) {
    return useQuery({
        queryKey: ['fees', 'invoices', 'preview', termId],
        queryFn: () => getInvoiceRunPreview(termId!),
        enabled: !!termId,
        staleTime: 0,
        gcTime: 0,
    });
}

export function useInvoices(filters?: {
    termId?: string;
    studentId?: string;
    status?: InvoiceStatus;
}) {
    return useQuery({
        queryKey: ['fees', 'invoices', filters],
        queryFn: () => getInvoices(filters),
    });
}

export function useInvoice(id?: string) {
    return useQuery({
        queryKey: ['fees', 'invoices', 'detail', id],
        queryFn: () => getInvoice(id!),
        enabled: !!id,
    });
}

export function useGenerateInvoices() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: generateInvoices,
        onSuccess: (result) => {
            qc.invalidateQueries({ queryKey: ['fees', 'invoices'] });
            toast.success(
                `${result.created} draft${result.created === 1 ? '' : 's'} created` +
                    (result.skipped ? `, ${result.skipped} skipped` : ''),
            );
        },
    });
}

export function useIssueTermInvoices() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: issueTermInvoices,
        onSuccess: (result) => {
            qc.invalidateQueries({ queryKey: ['fees'] });
            // Failures are named, not swallowed into a success message.
            if (result.failed.length) {
                toast.warning(
                    `${result.issued} issued, ${result.failed.length} could not be`,
                );
            } else {
                toast.success(`${result.issued} invoices issued`);
            }
        },
    });
}

export function useIssueInvoice() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: issueInvoice,
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['fees'] });
            toast.success('Invoice issued');
        },
    });
}

export function useCancelInvoice() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ id, reason }: { id: string; reason: string }) =>
            cancelInvoice(id, reason),
        onSuccess: (result) => {
            qc.invalidateQueries({ queryKey: ['fees'] });
            toast.success(
                result.deleted
                    ? 'Draft deleted'
                    : 'Invoice cancelled and the posting reversed',
            );
        },
    });
}

export function useConcessions(filters?: {
    studentId?: string;
    sessionId?: string;
    status?: string;
}) {
    return useQuery({
        queryKey: ['fees', 'concessions', filters],
        queryFn: () => getConcessions(filters),
    });
}

export function useCreateConcession() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: createConcession,
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['fees', 'concessions'] });
            toast.success('Concession recorded — somebody else must approve it');
        },
    });
}

export function useConcessionDecision() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ id, approve }: { id: string; approve: boolean }) =>
            approve ? approveConcession(id) : rejectConcession(id),
        onSuccess: (_result, variables) => {
            qc.invalidateQueries({ queryKey: ['fees'] });
            toast.success(variables.approve ? 'Concession approved' : 'Concession refused');
        },
    });
}

export function useStudentFeeSubscriptions(filters?: {
    studentId?: string;
    sessionId?: string;
}) {
    return useQuery({
        queryKey: ['fees', 'subscriptions', filters],
        queryFn: () => getSubscriptions(filters),
    });
}

export function useSubscribeStudentFee() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: subscribeStudentFee,
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['fees'] });
            toast.success('Added');
        },
    });
}
