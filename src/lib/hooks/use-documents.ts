import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
    attachDocument,
    getDocuments,
    removeDocument,
    type DocumentKind,
} from '../api/documents';

/** The documents on one owner: `/students/:id` or `/admissions/applications/:id`. */
export function useDocuments(owner?: string) {
    return useQuery({
        queryKey: ['documents', owner],
        queryFn: () => getDocuments(owner!),
        enabled: !!owner,
    });
}

export function useAttachDocument(owner: string) {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ file, kind, description }: { file: File; kind: DocumentKind; description?: string }) =>
            attachDocument(owner, file, kind, description),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['documents', owner] });
            toast.success('Document attached');
        },
        // The server refuses anything that is not really a PDF or an image, by
        // reading the file rather than believing it. Worth showing verbatim.
        onError: (e: Error) => toast.error(e.message || 'Could not attach that'),
    });
}

export function useRemoveDocument(owner: string) {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (documentId: string) => removeDocument(owner, documentId),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['documents', owner] });
            toast.success('Document removed');
        },
    });
}
