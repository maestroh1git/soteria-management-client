'use client';

import { useRef, useState } from 'react';
import { Download, FileText, Loader2, Upload, X } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { EmptyState } from '@/components/common/empty-state';
import {
    useAttachStudentDocument,
    useRemoveStudentDocument,
    useStudentDocuments,
} from '@/lib/hooks/use-students';
import {
    downloadStudentDocument,
    type DocumentKind,
} from '@/lib/api/students';

const KINDS: Array<{ value: DocumentKind; label: string }> = [
    { value: 'BIRTH_CERTIFICATE', label: 'Birth certificate' },
    { value: 'IMMUNISATION_RECORD', label: 'Immunisation record' },
    { value: 'PREVIOUS_SCHOOL_REPORT', label: 'Previous school report' },
    { value: 'PHOTOGRAPH', label: 'Photograph' },
    { value: 'IDENTIFICATION', label: 'Identification' },
    { value: 'OTHER', label: 'Something else' },
];

const LABEL = Object.fromEntries(KINDS.map((k) => [k.value, k.label]));

/**
 * A child's documents.
 *
 * Read by anyone who can see the child — including a form teacher, which is the
 * same decision Soteria made about medical data: a teacher who may know a child
 * has asthma may see the letter that says so. Only the registrar side can
 * attach or remove, and the server enforces that regardless of what this
 * renders.
 */
export function StudentDocuments({
    studentId,
    canEdit,
}: {
    studentId: string;
    canEdit: boolean;
}) {
    const { data: documents, isLoading } = useStudentDocuments(studentId);
    const attach = useAttachStudentDocument(studentId);
    const remove = useRemoveStudentDocument(studentId);
    const fileInput = useRef<HTMLInputElement>(null);
    const [kind, setKind] = useState<DocumentKind>('BIRTH_CERTIFICATE');

    if (isLoading) {
        return (
            <div className="flex justify-center py-10">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {canEdit && (
                <div className="flex flex-wrap items-end gap-3 rounded-lg border p-3">
                    <div className="space-y-1.5">
                        <Label>What is it?</Label>
                        <Select
                            value={kind}
                            onValueChange={(v) => setKind(v as DocumentKind)}
                        >
                            <SelectTrigger className="w-56">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {KINDS.map((k) => (
                                    <SelectItem key={k.value} value={k.value}>
                                        {k.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <Button
                        variant="outline"
                        disabled={attach.isPending}
                        onClick={() => fileInput.current?.click()}
                    >
                        {attach.isPending ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                            <Upload className="mr-2 h-4 w-4" />
                        )}
                        Choose a file
                    </Button>
                    <input
                        ref={fileInput}
                        type="file"
                        hidden
                        // A hint to the picker, not a control: the server reads
                        // the first bytes and refuses anything else.
                        accept="application/pdf,image/jpeg,image/png,image/webp"
                        onChange={async (e) => {
                            const file = e.target.files?.[0];
                            e.target.value = '';
                            if (!file) return;
                            await attach.mutateAsync({ file, kind });
                        }}
                    />

                    <p className="text-xs text-muted-foreground">
                        PDF or image, up to 5 MB.
                    </p>
                </div>
            )}

            {!documents?.length ? (
                <EmptyState
                    title="No documents"
                    description="Birth certificate, immunisation record, previous school report."
                />
            ) : (
                <div className="divide-y rounded-lg border">
                    {documents.map((document) => (
                        <div
                            key={document.id}
                            className="flex items-center gap-3 px-4 py-3"
                        >
                            <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
                            <div className="min-w-0 flex-1">
                                <button
                                    type="button"
                                    className="truncate text-sm font-medium hover:underline"
                                    onClick={() =>
                                        downloadStudentDocument(
                                            studentId,
                                            document.id,
                                            document.fileName,
                                            document.mimeType,
                                        )
                                    }
                                >
                                    {document.fileName}
                                </button>
                                <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                                    <Badge variant="outline" className="text-[10px]">
                                        {LABEL[document.kind] ?? document.kind}
                                    </Badge>
                                    <span>{(document.sizeBytes / 1024).toFixed(0)} KB</span>
                                    {document.description && (
                                        <span>· {document.description}</span>
                                    )}
                                    {document.retainUntil && (
                                        // Only ever set on papers inherited from an
                                        // application. Said out loud rather than
                                        // left to be discovered when they vanish.
                                        <span className="text-amber-600">
                                            · deletable after {document.retainUntil}
                                        </span>
                                    )}
                                </div>
                            </div>

                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() =>
                                    downloadStudentDocument(
                                        studentId,
                                        document.id,
                                        document.fileName,
                                        document.mimeType,
                                    )
                                }
                            >
                                <Download className="h-4 w-4" />
                            </Button>

                            {canEdit && (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    disabled={remove.isPending}
                                    onClick={() => remove.mutate(document.id)}
                                >
                                    <X className="h-4 w-4" />
                                </Button>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
