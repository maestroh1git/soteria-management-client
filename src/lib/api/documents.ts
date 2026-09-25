import api from './client';

/**
 * Papers a person uploaded about a child: on the pupil, or on their
 * application before they are one. The same endpoints hang off each owner, so
 * these take the owner's path: `/students/:id` or `/admissions/applications/:id`.
 */
export type DocumentKind =
    | 'BIRTH_CERTIFICATE'
    | 'IMMUNISATION_RECORD'
    | 'PREVIOUS_SCHOOL_REPORT'
    | 'PHOTOGRAPH'
    | 'IDENTIFICATION'
    | 'OTHER';

export interface OwnedDocument {
    id: string;
    kind: DocumentKind;
    fileName: string;
    mimeType: string;
    sizeBytes: number;
    description: string | null;
    retainUntil: string | null;
    createdAt: string;
}

export async function getDocuments(owner: string): Promise<OwnedDocument[]> {
    return (await api.get(`${owner}/documents`)) as unknown as OwnedDocument[];
}

export async function attachDocument(
    owner: string,
    file: File,
    kind: DocumentKind,
    description?: string,
): Promise<OwnedDocument> {
    const form = new FormData();
    form.append('file', file);
    form.append('kind', kind);
    if (description) form.append('description', description);
    // No explicit Content-Type: the browser must set the multipart boundary.
    return (await api.post(`${owner}/documents`, form)) as unknown as OwnedDocument;
}

export async function removeDocument(owner: string, documentId: string): Promise<void> {
    await api.delete(`${owner}/documents/${documentId}`);
}

/**
 * As a blob, not an href: the endpoint needs the bearer token, so a plain link
 * would be unauthenticated and 401. Same reason as every other download here.
 */
export async function downloadDocument(owner: string, document: OwnedDocument): Promise<void> {
    const response = await api.get(`${owner}/documents/${document.id}/download`, {
        responseType: 'blob',
    });
    const blob = new Blob([response as unknown as BlobPart], { type: document.mimeType });
    const url = URL.createObjectURL(blob);
    const link = window.document.createElement('a');
    link.href = url;
    link.download = document.fileName;
    link.click();
    URL.revokeObjectURL(url);
}
