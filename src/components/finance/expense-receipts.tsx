'use client';

import { useRef, useState } from 'react';
import { Paperclip, Loader2, X, Download } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
    useAttachReceipt,
    useExpenseReceipts,
    useRemoveReceipt,
} from '@/lib/hooks/use-finance';
import { downloadExpenseReceipt } from '@/lib/api/finance';

/**
 * The receipts on one expense.
 *
 * Collapsed to a single line until somebody wants it — a list of expenses is
 * read for its amounts, and a file list under every row would bury them. The
 * count is on the row because it is what gates sending for approval.
 *
 * The metadata is fetched only when opened. Receipts are the one thing here
 * that could be megabytes, and the list endpoint deliberately does not carry
 * them.
 */
export function ExpenseReceipts({
    expenseId,
    count,
    editable,
}: {
    expenseId: string;
    count: number;
    editable: boolean;
}) {
    const [open, setOpen] = useState(false);
    const fileInput = useRef<HTMLInputElement>(null);
    const { data: receipts, isLoading } = useExpenseReceipts(
        open ? expenseId : undefined,
    );
    const attach = useAttachReceipt(expenseId);
    const remove = useRemoveReceipt(expenseId);

    return (
        <div className="mt-2">
            <div className="flex items-center gap-2">
                <button
                    type="button"
                    onClick={() => setOpen((v) => !v)}
                    className={`inline-flex items-center gap-1.5 text-xs hover:underline ${
                        count === 0 ? 'text-amber-600' : 'text-muted-foreground'
                    }`}
                >
                    <Paperclip className="h-3 w-3" />
                    {count === 0
                        ? 'No receipt'
                        : `${count} receipt${count === 1 ? '' : 's'}`}
                </button>

                {editable && (
                    <>
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 px-2 text-xs"
                            disabled={attach.isPending}
                            onClick={() => fileInput.current?.click()}
                        >
                            {attach.isPending ? (
                                <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                                'Attach'
                            )}
                        </Button>
                        <input
                            ref={fileInput}
                            type="file"
                            hidden
                            // A hint to the file picker, not a control. The server
                            // reads the first bytes and refuses anything else —
                            // an accept list is trivially bypassed.
                            accept="application/pdf,image/jpeg,image/png,image/webp"
                            onChange={async (e) => {
                                const file = e.target.files?.[0];
                                e.target.value = '';
                                if (!file) return;
                                await attach.mutateAsync({ file });
                                setOpen(true);
                            }}
                        />
                    </>
                )}
            </div>

            {open && (
                <div className="mt-2 space-y-1 border-l-2 pl-3">
                    {isLoading ? (
                        <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />
                    ) : !receipts?.length ? (
                        <p className="text-xs text-muted-foreground">
                            Nothing attached yet.
                        </p>
                    ) : (
                        receipts.map((r) => (
                            <div
                                key={r.id}
                                className="flex items-center gap-2 text-xs"
                            >
                                <button
                                    type="button"
                                    className="inline-flex items-center gap-1 hover:underline"
                                    onClick={() =>
                                        downloadExpenseReceipt(
                                            expenseId,
                                            r.id,
                                            r.fileName,
                                            r.mimeType,
                                        )
                                    }
                                >
                                    <Download className="h-3 w-3" />
                                    {r.fileName}
                                </button>
                                <span className="text-muted-foreground">
                                    {(r.sizeBytes / 1024).toFixed(0)} KB
                                </span>
                                {editable && (
                                    <button
                                        type="button"
                                        className="text-muted-foreground hover:text-destructive"
                                        disabled={remove.isPending}
                                        onClick={() => remove.mutate(r.id)}
                                    >
                                        <X className="h-3 w-3" />
                                    </button>
                                )}
                            </div>
                        ))
                    )}
                </div>
            )}
        </div>
    );
}
