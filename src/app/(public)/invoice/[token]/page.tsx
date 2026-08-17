'use client';

import { use, useEffect, useState } from 'react';
import { AlertCircle, CheckCircle2, Download, Loader2 } from 'lucide-react';

import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import {
    getPublicInvoice,
    publicInvoicePdfUrl,
    type PublicInvoice,
} from '@/lib/api/public-invoice';

const money = (v: string) => {
    const [whole, fraction = '00'] = (v ?? '0').split('.');
    return `${whole.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}.${fraction}`;
};

/**
 * A parent's bill, opened from a link. No account, no password.
 *
 * Deliberately not a portal — that would mean logins, invitations, password
 * resets and a support burden the school absorbs. This is the third use of a
 * pattern the codebase already gets right: payslip verification, application
 * status, and now a fee invoice.
 *
 * What matters most on the page is the amount still to pay, so it is the
 * largest thing on it and it comes first.
 */
export default function PublicInvoicePage({
    params,
}: {
    params: Promise<{ token: string }>;
}) {
    const { token } = use(params);
    const [invoice, setInvoice] = useState<PublicInvoice | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        getPublicInvoice(token)
            .then(setInvoice)
            .catch(() =>
                // One message for a bad link and for a bill that was withdrawn:
                // guessing tokens should learn nothing from the difference.
                setError(
                    'We could not find a bill for that link. Please check with the school.',
                ),
            )
            .finally(() => setLoading(false));
    }, [token]);

    if (loading) {
        return (
            <div className="flex min-h-[60vh] items-center justify-center">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
        );
    }

    if (error || !invoice) {
        return (
            <div className="mx-auto max-w-lg px-4 py-16">
                <Card>
                    <CardContent className="flex flex-col items-center gap-3 pt-6 text-center">
                        <AlertCircle className="h-8 w-8 text-muted-foreground" />
                        <p className="text-sm text-muted-foreground">{error}</p>
                    </CardContent>
                </Card>
            </div>
        );
    }

    const settled = Number(invoice.outstanding) === 0;
    const charges = invoice.lines.filter((l) => l.kind === 'CHARGE');
    const discounts = invoice.lines.filter((l) => l.kind === 'DISCOUNT');

    return (
        <div className="mx-auto max-w-2xl space-y-6 px-4 py-10">
            <div className="text-center">
                <h1 className="text-xl font-semibold">{invoice.organisationName}</h1>
                <p className="text-sm text-muted-foreground">
                    Invoice {invoice.invoiceNumber} · {invoice.termName}
                </p>
            </div>

            <Card>
                <CardContent className="pt-6 text-center">
                    {settled ? (
                        <div className="flex flex-col items-center gap-2">
                            <CheckCircle2 className="h-8 w-8 text-green-600" />
                            <p className="text-lg font-semibold text-green-700 dark:text-green-400">
                                Paid in full
                            </p>
                            <p className="text-sm text-muted-foreground">
                                Thank you. Nothing is outstanding on this bill.
                            </p>
                        </div>
                    ) : (
                        <>
                            <p className="text-sm text-muted-foreground">Still to pay</p>
                            <p className="text-4xl font-bold tabular-nums">
                                ₦{money(invoice.outstanding)}
                            </p>
                            {invoice.dueDate && (
                                <p className="mt-1 text-sm text-muted-foreground">
                                    Due {invoice.dueDate}
                                </p>
                            )}
                        </>
                    )}
                </CardContent>
            </Card>

            <Card>
                <CardHeader className="pb-3">
                    <CardTitle className="text-base">{invoice.studentName}</CardTitle>
                    <CardDescription>
                        {invoice.className} · {invoice.admissionNumber}
                    </CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                    <table className="w-full text-sm">
                        <tbody className="divide-y">
                            {charges.map((line, i) => (
                                <tr key={`c${i}`}>
                                    <td className="px-6 py-3">{line.description}</td>
                                    <td className="px-6 py-3 text-right tabular-nums">
                                        ₦{money(line.amount)}
                                    </td>
                                </tr>
                            ))}
                            {discounts.map((line, i) => (
                                <tr key={`d${i}`} className="text-green-700 dark:text-green-400">
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
                                <td className="px-6 py-3 text-right font-bold tabular-nums">
                                    ₦{money(invoice.total)}
                                </td>
                            </tr>
                            {Number(invoice.paid) > 0 && (
                                <tr className="text-muted-foreground">
                                    <td className="px-6 py-3">Paid so far</td>
                                    <td className="px-6 py-3 text-right tabular-nums">
                                        −₦{money(invoice.paid)}
                                    </td>
                                </tr>
                            )}
                        </tfoot>
                    </table>
                </CardContent>
            </Card>

            {invoice.payments.length > 0 && (
                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-base">Payments received</CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        <table className="w-full text-sm">
                            <tbody className="divide-y">
                                {invoice.payments.map((p) => (
                                    <tr key={p.receiptNumber}>
                                        <td className="px-6 py-3">
                                            <div>{p.receiptNumber}</div>
                                            <div className="text-xs text-muted-foreground">
                                                {p.paidOn}
                                            </div>
                                        </td>
                                        <td className="px-6 py-3 text-right tabular-nums">
                                            ₦{money(p.amount)}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </CardContent>
                </Card>
            )}

            <div className="text-center">
                {/* A plain link: this route is public and carries no token, so
                    there is nothing to attach and a link behaves better on a
                    phone than a scripted download. */}
                <a
                    href={publicInvoicePdfUrl(token)}
                    className="inline-flex items-center gap-2 rounded-md border px-4 py-2 text-sm hover:bg-muted"
                >
                    <Download className="h-4 w-4" />
                    Download a copy
                </a>
            </div>

            <p className="text-center text-xs text-muted-foreground">
                Questions about this bill? Please contact the school office.
            </p>
        </div>
    );
}
