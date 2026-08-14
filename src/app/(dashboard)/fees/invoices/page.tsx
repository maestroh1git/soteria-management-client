'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { AlertTriangle, Loader2, Play, Info } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { EmptyState } from '@/components/common/empty-state';
import { useSessions, useTerms } from '@/lib/hooks/use-academics';
import {
    useGenerateInvoices,
    useInvoiceRunPreview,
    useInvoices,
    useIssueTermInvoices,
} from '@/lib/hooks/use-fees';
import type { InvoiceStatus } from '@/lib/api/fees';

const money = (v: string) => {
    const [whole, fraction = '00'] = (v ?? '0').split('.');
    const sign = whole.startsWith('-') ? '-' : '';
    return `${sign}${whole.replace('-', '').replace(/\B(?=(\d{3})+(?!\d))/g, ',')}.${fraction}`;
};

const STATUS_STYLES: Record<InvoiceStatus, string> = {
    DRAFT: 'bg-muted text-muted-foreground',
    ISSUED: 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-200',
    CANCELLED: 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-200',
};

/**
 * Billing a term.
 *
 * Three steps, and the order is the point: see what would happen, create drafts
 * that owe nobody anything, then issue. An unwanted draft is deleted; an
 * unwanted posting needs a reversal per invoice and stays in the books for ever.
 */
export default function InvoicesPage() {
    const { data: sessions } = useSessions();
    const [sessionId, setSessionId] = useState<string>();
    const [termId, setTermId] = useState<string>();
    const [statusFilter, setStatusFilter] = useState<InvoiceStatus | 'ALL'>('ALL');
    const [runOpen, setRunOpen] = useState(false);

    const { data: terms } = useTerms(sessionId);
    const { data: invoices, isLoading } = useInvoices({
        termId,
        status: statusFilter === 'ALL' ? undefined : statusFilter,
    });
    const issueTerm = useIssueTermInvoices();

    useEffect(() => {
        if (!sessionId && sessions?.length) {
            setSessionId((sessions.find((s) => s.isCurrent) ?? sessions[0]).id);
        }
    }, [sessions, sessionId]);

    useEffect(() => {
        if (terms?.length && !terms.some((t) => t.id === termId)) {
            setTermId((terms.find((t) => t.isCurrent) ?? terms[0]).id);
        }
    }, [terms, termId]);

    const drafts = (invoices ?? []).filter((i) => i.status === 'DRAFT');

    return (
        <div className="space-y-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-semibold tracking-tight">Invoices</h1>
                    <p className="text-sm text-muted-foreground">
                        What each child owes for the term.
                    </p>
                </div>
                <Button onClick={() => setRunOpen(true)} disabled={!termId}>
                    <Play className="mr-2 h-4 w-4" />
                    Bill the term
                </Button>
            </div>

            <div className="flex flex-wrap items-center gap-2">
                <Select value={sessionId} onValueChange={setSessionId}>
                    <SelectTrigger className="w-44">
                        <SelectValue placeholder="Session" />
                    </SelectTrigger>
                    <SelectContent>
                        {(sessions ?? []).map((s) => (
                            <SelectItem key={s.id} value={s.id}>
                                {s.name}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>

                <Select value={termId} onValueChange={setTermId}>
                    <SelectTrigger className="w-44">
                        <SelectValue placeholder="Term" />
                    </SelectTrigger>
                    <SelectContent>
                        {(terms ?? []).map((t) => (
                            <SelectItem key={t.id} value={t.id}>
                                {t.name}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>

                <Select
                    value={statusFilter}
                    onValueChange={(v) => setStatusFilter(v as InvoiceStatus | 'ALL')}
                >
                    <SelectTrigger className="w-40">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="ALL">All statuses</SelectItem>
                        <SelectItem value="DRAFT">Draft</SelectItem>
                        <SelectItem value="ISSUED">Issued</SelectItem>
                        <SelectItem value="CANCELLED">Cancelled</SelectItem>
                    </SelectContent>
                </Select>

                {drafts.length > 0 && (
                    <Button
                        variant="outline"
                        onClick={() => termId && issueTerm.mutate(termId)}
                        disabled={issueTerm.isPending}
                    >
                        {issueTerm.isPending && (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        )}
                        Issue {drafts.length} draft{drafts.length === 1 ? '' : 's'}
                    </Button>
                )}
            </div>

            {isLoading ? (
                <div className="flex justify-center py-12">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
            ) : !invoices?.length ? (
                <EmptyState
                    title="Nothing billed yet"
                    description="Run the term to create drafts. Nothing is owed until you issue them."
                />
            ) : (
                <Card>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="border-b bg-muted/40">
                                <tr>
                                    <th className="px-4 py-3 text-left font-medium">Invoice</th>
                                    <th className="px-4 py-3 text-left font-medium">Child</th>
                                    <th className="px-4 py-3 text-left font-medium">Class</th>
                                    <th className="px-4 py-3 text-right font-medium">Charges</th>
                                    <th className="px-4 py-3 text-right font-medium">Concessions</th>
                                    <th className="px-4 py-3 text-right font-medium">Owed</th>
                                    <th className="px-4 py-3 text-left font-medium">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {invoices.map((invoice) => (
                                    <tr key={invoice.id} className="hover:bg-muted/30">
                                        <td className="px-4 py-3">
                                            <Link
                                                href={`/fees/invoices/${invoice.id}`}
                                                className="font-medium hover:underline"
                                            >
                                                {invoice.invoiceNumber ?? 'Draft'}
                                            </Link>
                                        </td>
                                        <td className="px-4 py-3">
                                            <div>{invoice.studentName}</div>
                                            <div className="text-xs text-muted-foreground">
                                                {invoice.admissionNumber}
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 text-muted-foreground">
                                            {invoice.classLevel}
                                        </td>
                                        <td className="px-4 py-3 text-right tabular-nums">
                                            ₦{money(invoice.charges)}
                                        </td>
                                        <td className="px-4 py-3 text-right tabular-nums text-muted-foreground">
                                            {Number(invoice.discounts) > 0
                                                ? `−₦${money(invoice.discounts)}`
                                                : '—'}
                                        </td>
                                        <td className="px-4 py-3 text-right font-semibold tabular-nums">
                                            ₦{money(invoice.total)}
                                        </td>
                                        <td className="px-4 py-3">
                                            <Badge
                                                variant="secondary"
                                                className={STATUS_STYLES[invoice.status]}
                                            >
                                                {invoice.status}
                                            </Badge>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </Card>
            )}

            <RunDialog
                open={runOpen}
                onOpenChange={setRunOpen}
                termId={termId}
                termName={terms?.find((t) => t.id === termId)?.name}
            />
        </div>
    );
}

/**
 * The preview, then the drafts.
 *
 * The preview is the same code path the run uses, so what is on screen is what
 * will happen — not an estimate of it. Everybody who will be MISSED is shown as
 * prominently as everybody who will be billed, because that is the half a
 * bursar cannot otherwise discover until a parent rings.
 */
function RunDialog({
    open,
    onOpenChange,
    termId,
    termName,
}: {
    open: boolean;
    onOpenChange: (v: boolean) => void;
    termId?: string;
    termName?: string;
}) {
    const { data: preview, isFetching } = useInvoiceRunPreview(
        open ? termId : undefined,
    );
    const generate = useGenerateInvoices();
    const [dueDate, setDueDate] = useState('');

    const submit = async () => {
        if (!termId) return;
        await generate.mutateAsync({ termId, dueDate: dueDate || undefined });
        onOpenChange(false);
    };

    const warnings = (preview?.willBill ?? []).filter((r) => r.warnings.length);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-3xl">
                <DialogHeader>
                    <DialogTitle>Bill {termName}</DialogTitle>
                    <DialogDescription>
                        This creates drafts. Nobody owes anything until they are issued.
                    </DialogDescription>
                </DialogHeader>

                {isFetching ? (
                    <div className="flex justify-center py-10">
                        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    </div>
                ) : !preview ? null : (
                    <div className="max-h-[55vh] space-y-4 overflow-y-auto pr-1">
                        <div className="grid grid-cols-3 gap-3">
                            <Card>
                                <CardContent className="pt-6">
                                    <p className="text-xs text-muted-foreground">
                                        Will be billed
                                    </p>
                                    <p className="text-2xl font-bold">
                                        {preview.willBill.length}
                                    </p>
                                </CardContent>
                            </Card>
                            <Card>
                                <CardContent className="pt-6">
                                    <p className="text-xs text-muted-foreground">Total</p>
                                    <p className="text-2xl font-bold tabular-nums">
                                        ₦{money(preview.total)}
                                    </p>
                                </CardContent>
                            </Card>
                            <Card>
                                <CardContent className="pt-6">
                                    <p className="text-xs text-muted-foreground">Skipped</p>
                                    <p className="text-2xl font-bold">
                                        {preview.skipped.length}
                                    </p>
                                </CardContent>
                            </Card>
                        </div>

                        {preview.pendingConcessions.length > 0 && (
                            <Card className="border-amber-300 bg-amber-50 dark:bg-amber-950/30">
                                <CardHeader className="pb-2">
                                    <CardTitle className="flex items-center gap-2 text-sm">
                                        <AlertTriangle className="h-4 w-4" />
                                        Concessions waiting for approval
                                    </CardTitle>
                                    <CardDescription>
                                        These are not in the figures above. Approve them first
                                        or these children will be billed the full amount.
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-1 text-sm">
                                    {preview.pendingConcessions.map((c, i) => (
                                        <p key={i}>
                                            <span className="font-medium">{c.studentName}</span>{' '}
                                            — {c.reason}
                                        </p>
                                    ))}
                                </CardContent>
                            </Card>
                        )}

                        {warnings.length > 0 && (
                            <Card className="border-amber-300">
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-sm">Worth checking</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-1 text-sm">
                                    {warnings.map((row) =>
                                        row.warnings.map((w, i) => (
                                            <p key={`${row.studentId}-${i}`}>
                                                <span className="font-medium">
                                                    {row.studentName}
                                                </span>{' '}
                                                — {w}
                                            </p>
                                        )),
                                    )}
                                </CardContent>
                            </Card>
                        )}

                        {preview.skipped.length > 0 && (
                            <Card>
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-sm">
                                        Who will not be billed
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-1 text-sm">
                                    {preview.skipped.map((row) => (
                                        <p key={row.studentId}>
                                            <span className="font-medium">{row.studentName}</span>{' '}
                                            <span className="text-muted-foreground">
                                                ({row.admissionNumber}) — {row.reason}
                                            </span>
                                        </p>
                                    ))}
                                </CardContent>
                            </Card>
                        )}

                        <div className="space-y-1.5">
                            <Label htmlFor="due-date">Due date (optional)</Label>
                            <Input
                                id="due-date"
                                type="date"
                                value={dueDate}
                                onChange={(e) => setDueDate(e.target.value)}
                                className="w-48"
                            />
                        </div>

                        <p className="flex items-start gap-2 text-xs text-muted-foreground">
                            <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                            Running this again is safe — a child already invoiced for this
                            term is skipped.
                        </p>
                    </div>
                )}

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                        Cancel
                    </Button>
                    <Button
                        onClick={submit}
                        disabled={
                            !preview?.willBill.length || generate.isPending || isFetching
                        }
                    >
                        {generate.isPending && (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        )}
                        Create {preview?.willBill.length ?? 0} draft
                        {preview?.willBill.length === 1 ? '' : 's'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
