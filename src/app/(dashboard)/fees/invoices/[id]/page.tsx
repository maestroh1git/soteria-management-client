'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Download, Loader2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    useCancelInvoice,
    useInvoice,
    useIssueInvoice,
} from '@/lib/hooks/use-fees';
import { downloadInvoicePdf } from '@/lib/api/fees';

const money = (v: string) => {
    const [whole, fraction = '00'] = (v ?? '0').split('.');
    const sign = whole.startsWith('-') ? '-' : '';
    return `${sign}${whole.replace('-', '').replace(/\B(?=(\d{3})+(?!\d))/g, ',')}.${fraction}`;
};

/**
 * One child's bill.
 *
 * The actions come from `allowedTransitions` on the server rather than from a
 * copy of the rules kept here — the same treatment as expenses and admissions.
 * A screen that decides for itself what may happen next drifts from the server
 * the first time a rule changes, and the user finds out through a refusal.
 */
export default function InvoiceDetailPage() {
    const params = useParams<{ id: string }>();
    const router = useRouter();
    const { data: invoice, isLoading } = useInvoice(params.id);
    const issue = useIssueInvoice();
    const cancel = useCancelInvoice();
    const [cancelOpen, setCancelOpen] = useState(false);
    const [reason, setReason] = useState('');

    if (isLoading || !invoice) {
        return (
            <div className="flex justify-center py-16">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
        );
    }

    const can = (status: string) => invoice.allowedTransitions?.includes(status as any);
    const charges = invoice.lines.filter((l) => l.kind === 'CHARGE');
    const discounts = invoice.lines.filter((l) => l.kind === 'DISCOUNT');

    return (
        <div className="space-y-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="space-y-1">
                    <Link
                        href="/fees/invoices"
                        className="inline-flex items-center text-sm text-muted-foreground hover:underline"
                    >
                        <ArrowLeft className="mr-1 h-3.5 w-3.5" />
                        Invoices
                    </Link>
                    <h1 className="text-2xl font-semibold tracking-tight">
                        {invoice.invoiceNumber ?? 'Draft invoice'}
                    </h1>
                    <p className="text-sm text-muted-foreground">
                        {invoice.student
                            ? `${invoice.student.firstName} ${invoice.student.lastName} · ${invoice.student.admissionNumber}`
                            : ''}
                        {invoice.classLevel ? ` · ${invoice.classLevel.name}` : ''}
                        {invoice.term ? ` · ${invoice.term.name}` : ''}
                    </p>
                </div>

                <div className="flex items-center gap-2">
                    <Badge variant="secondary">{invoice.status}</Badge>
                    {invoice.status !== 'DRAFT' && (
                        // Only for a real document. A draft has been sent to
                        // nobody, and handing somebody a PDF of one invites it
                        // being treated as a bill.
                        <Button
                            variant="outline"
                            onClick={() =>
                                downloadInvoicePdf(invoice.id, invoice.invoiceNumber)
                            }
                        >
                            <Download className="mr-2 h-4 w-4" />
                            PDF
                        </Button>
                    )}
                    {can('ISSUED') && (
                        <Button
                            onClick={() => issue.mutate(invoice.id)}
                            disabled={issue.isPending}
                        >
                            {issue.isPending && (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            )}
                            Issue
                        </Button>
                    )}
                    {can('CANCELLED') && (
                        <Button variant="outline" onClick={() => setCancelOpen(true)}>
                            {invoice.status === 'DRAFT' ? 'Delete draft' : 'Cancel'}
                        </Button>
                    )}
                </div>
            </div>

            {invoice.status === 'CANCELLED' && invoice.cancellationReason && (
                <Card className="border-red-300 bg-red-50 dark:bg-red-950/30">
                    <CardContent className="pt-6 text-sm">
                        <span className="font-medium">Cancelled.</span>{' '}
                        {invoice.cancellationReason} The posting was reversed; the
                        original entry is still in the ledger.
                    </CardContent>
                </Card>
            )}

            <Card>
                <CardHeader>
                    <CardTitle className="text-base">What is charged</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    <table className="w-full text-sm">
                        <tbody className="divide-y">
                            {charges.map((line) => (
                                <tr key={line.id}>
                                    <td className="px-6 py-3">{line.description}</td>
                                    <td className="px-6 py-3 text-right tabular-nums">
                                        ₦{money(line.amount)}
                                    </td>
                                </tr>
                            ))}
                            {discounts.map((line) => (
                                <tr key={line.id} className="text-muted-foreground">
                                    <td className="px-6 py-3">{line.description}</td>
                                    <td className="px-6 py-3 text-right tabular-nums">
                                        −₦{money(line.amount)}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                        <tfoot className="border-t-2">
                            <tr>
                                <td className="px-6 py-3 font-medium">Total</td>
                                <td className="px-6 py-3 text-right text-lg font-bold tabular-nums">
                                    ₦{money(invoice.total)}
                                </td>
                            </tr>
                        </tfoot>
                    </table>
                </CardContent>
            </Card>

            <div className="grid gap-4 sm:grid-cols-3 text-sm">
                <div>
                    <p className="text-muted-foreground">Issued</p>
                    <p className="font-medium">{invoice.issueDate ?? 'Not yet'}</p>
                </div>
                <div>
                    <p className="text-muted-foreground">Due</p>
                    <p className="font-medium">{invoice.dueDate ?? '—'}</p>
                </div>
                <div>
                    <p className="text-muted-foreground">Concessions</p>
                    <p className="font-medium tabular-nums">
                        ₦{money(invoice.discounts)}
                    </p>
                </div>
            </div>

            <Dialog open={cancelOpen} onOpenChange={setCancelOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>
                            {invoice.status === 'DRAFT'
                                ? 'Delete this draft?'
                                : 'Cancel this invoice?'}
                        </DialogTitle>
                        <DialogDescription>
                            {invoice.status === 'DRAFT'
                                ? 'Nothing has been posted, so it simply goes away.'
                                : 'The posting is reversed, not edited — the original entry stays in the ledger so what was believed at the time remains answerable.'}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-1.5">
                        <Label htmlFor="reason">Reason</Label>
                        <Textarea
                            id="reason"
                            value={reason}
                            placeholder="Billed at the wrong class level"
                            onChange={(e) => setReason(e.target.value)}
                        />
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setCancelOpen(false)}>
                            Keep it
                        </Button>
                        <Button
                            variant="destructive"
                            disabled={reason.trim().length < 3 || cancel.isPending}
                            onClick={async () => {
                                const result = await cancel.mutateAsync({
                                    id: invoice.id,
                                    reason: reason.trim(),
                                });
                                setCancelOpen(false);
                                if (result.deleted) router.push('/fees/invoices');
                            }}
                        >
                            {cancel.isPending && (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            )}
                            {invoice.status === 'DRAFT' ? 'Delete' : 'Cancel invoice'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
