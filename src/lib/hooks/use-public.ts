import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
    getApplicationStatus,
    getPublicSchool,
    respondToOffer,
    sendApplicationDocument,
    submitApplication,
    type ApplyPayload,
    type FamilyDocumentKind,
} from '../api/public-admissions';
import { getPublicInvoice, publicInvoicePdfUrl } from '../api/public-invoice';

/*
    The pages anyone can open from a link: no session, no retries. A bad or
    withdrawn link fails the same way every time, and retrying it only makes a
    parent wait longer for the same answer.
*/

export { publicInvoicePdfUrl };

/** The school a family is applying to, and the classes it takes. */
export function usePublicSchool(slug: string) {
    return useQuery({
        queryKey: ['public', 'school', slug],
        queryFn: () => getPublicSchool(slug),
        retry: false,
    });
}

export function useSubmitApplication(slug: string) {
    return useMutation({
        mutationFn: (payload: ApplyPayload) => submitApplication(slug, payload),
    });
}

/** Where an application has got to, from the link the family keeps. */
export function useApplicationStatus(token: string) {
    return useQuery({
        queryKey: ['public', 'application', token],
        queryFn: () => getApplicationStatus(token),
        retry: false,
    });
}

/** A bill opened from its link. */
export function usePublicInvoice(token: string) {
    return useQuery({
        queryKey: ['public', 'invoice', token],
        queryFn: () => getPublicInvoice(token),
        retry: false,
    });
}

/** Accept or decline the offer on this application (5.11). */
export function useRespondToOffer(token: string) {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (decision: 'ACCEPT' | 'DECLINE') => respondToOffer(token, decision),
        onSuccess: () => qc.invalidateQueries({ queryKey: ['public', 'application', token] }),
    });
}

/** Send the school a document for this application (5.11). */
export function useSendApplicationDocument(token: string) {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ file, kind }: { file: File; kind: FamilyDocumentKind }) =>
            sendApplicationDocument(token, file, kind),
        onSuccess: () => qc.invalidateQueries({ queryKey: ['public', 'application', token] }),
    });
}
