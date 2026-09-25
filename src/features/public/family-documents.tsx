'use client';

import { useRef, useState } from 'react';
import { FileText, Loader2, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { useSendApplicationDocument } from '@/lib/hooks/use-public';
import {
    FAMILY_DOCUMENT_KINDS,
    type FamilyDocumentKind,
    type PublicApplicationStatus,
} from '@/lib/api/public-admissions';
import { formatDate } from '@/lib/utils/dates';

const MAX_MB = 5;

/**
 * The papers the school asks for, sent from the family's link
 * (ROADMAP-EXECUTION.md, 5.11). What was sent is listed by name only: the
 * link can send papers, never fetch them back.
 */
export function FamilyDocuments({
    token,
    documents,
    canUpload,
}: {
    token: string;
    documents: PublicApplicationStatus['documents'];
    canUpload: boolean;
}) {
    const send = useSendApplicationDocument(token);
    const [kind, setKind] = useState<FamilyDocumentKind>('BIRTH_CERTIFICATE');
    const [file, setFile] = useState<File | null>(null);
    const [tooBig, setTooBig] = useState(false);
    const input = useRef<HTMLInputElement>(null);

    if (!canUpload && documents.length === 0) return null;

    return (
        <div className="space-y-3">
            <div>
                <p className="font-medium">Documents</p>
                <p className="text-sm text-muted-foreground">
                    Send the school your child&apos;s papers here: a PDF or a photo, up to {MAX_MB} MB each.
                </p>
            </div>

            {documents.length > 0 && (
                <ul className="list-none space-y-1.5 p-0 text-sm">
                    {documents.map((d, i) => (
                        <li key={`${d.fileName}-${i}`} className="flex items-center gap-2">
                            <FileText className="h-4 w-4 flex-none text-muted-foreground" aria-hidden />
                            <span className="font-medium">
                                {FAMILY_DOCUMENT_KINDS[d.kind as FamilyDocumentKind] ?? d.kind}
                            </span>
                            <span className="truncate text-muted-foreground">
                                {d.fileName} · {formatDate(d.uploadedAt)}
                            </span>
                        </li>
                    ))}
                </ul>
            )}

            {canUpload && (
                <form
                    className="flex flex-wrap items-end gap-3"
                    onSubmit={(e) => {
                        e.preventDefault();
                        if (!file) return;
                        send.mutate(
                            { file, kind },
                            {
                                onSuccess: () => {
                                    setFile(null);
                                    if (input.current) input.current.value = '';
                                },
                            },
                        );
                    }}
                >
                    <div className="space-y-1.5">
                        <Label htmlFor="doc-kind">What is it?</Label>
                        <Select value={kind} onValueChange={(v) => setKind(v as FamilyDocumentKind)}>
                            <SelectTrigger id="doc-kind" className="w-60">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {(Object.keys(FAMILY_DOCUMENT_KINDS) as FamilyDocumentKind[]).map((k) => (
                                    <SelectItem key={k} value={k}>
                                        {FAMILY_DOCUMENT_KINDS[k]}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-1.5">
                        <Label htmlFor="doc-file">File</Label>
                        <input
                            id="doc-file"
                            ref={input}
                            type="file"
                            accept="application/pdf,image/jpeg,image/png,image/webp"
                            className="block text-sm file:mr-3 file:rounded-md file:border file:bg-background file:px-3 file:py-1.5 file:text-sm"
                            onChange={(e) => {
                                const f = e.target.files?.[0] ?? null;
                                setTooBig(!!f && f.size > MAX_MB * 1024 * 1024);
                                setFile(f);
                            }}
                        />
                    </div>
                    <Button type="submit" disabled={!file || tooBig || send.isPending}>
                        {send.isPending ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                            <Upload className="mr-2 h-4 w-4" />
                        )}
                        Send
                    </Button>
                </form>
            )}
            {tooBig && (
                <p role="alert" className="text-sm text-destructive">
                    That file is over {MAX_MB} MB. Try a smaller photo or a PDF.
                </p>
            )}
            {send.isError && (
                <p role="alert" className="text-sm text-destructive">
                    {send.error.message}
                </p>
            )}
            {send.isSuccess && !send.isPending && (
                <p role="status" className="text-sm text-green-700 dark:text-green-400">
                    Sent. The school can see it now.
                </p>
            )}
        </div>
    );
}
