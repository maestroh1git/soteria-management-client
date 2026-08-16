'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Loader2, Upload } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { EmptyState } from '@/components/common/empty-state';
import { useStatements } from '@/lib/hooks/use-banking';
import { ImportStatementDialog } from '@/components/banking/import-statement-dialog';

const money = (v: string) => {
    const [whole, fraction = '00'] = (v ?? '0').split('.');
    const sign = whole.startsWith('-') ? '-' : '';
    return `${sign}${whole.replace('-', '').replace(/\B(?=(\d{3})+(?!\d))/g, ',')}.${fraction}`;
};

/**
 * Bank statements, and how far through reconciling each one is.
 */
export default function BankingPage() {
    const { data: statements, isLoading } = useStatements();
    const [importOpen, setImportOpen] = useState(false);

    return (
        <div className="space-y-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-semibold tracking-tight">
                        Bank reconciliation
                    </h1>
                    <p className="text-sm text-muted-foreground">
                        Check the books against what the bank actually did.
                    </p>
                </div>
                <Button onClick={() => setImportOpen(true)}>
                    <Upload className="mr-2 h-4 w-4" />
                    Import a statement
                </Button>
            </div>

            {isLoading ? (
                <div className="flex justify-center py-12">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
            ) : !statements?.length ? (
                <EmptyState
                    title="No statements yet"
                    description="Paste a month of bank lines and the system will tell you where the books and the bank disagree."
                />
            ) : (
                <Card>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="border-b bg-muted/40">
                                <tr>
                                    <th className="px-4 py-3 text-left font-medium">Period</th>
                                    <th className="px-4 py-3 text-left font-medium">Account</th>
                                    <th className="px-4 py-3 text-right font-medium">Opening</th>
                                    <th className="px-4 py-3 text-right font-medium">Closing</th>
                                    <th className="px-4 py-3 text-right font-medium">Lines</th>
                                    <th className="px-4 py-3 text-left font-medium">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {statements.map((s) => (
                                    <tr key={s.id} className="hover:bg-muted/30">
                                        <td className="px-4 py-3">
                                            <Link
                                                href={`/banking/${s.id}`}
                                                className="font-medium hover:underline"
                                            >
                                                {s.periodStart} → {s.periodEnd}
                                            </Link>
                                            {s.reference && (
                                                <div className="text-xs text-muted-foreground">
                                                    {s.reference}
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-4 py-3 text-muted-foreground">
                                            {s.accountName}
                                        </td>
                                        <td className="px-4 py-3 text-right tabular-nums">
                                            ₦{money(s.openingBalance)}
                                        </td>
                                        <td className="px-4 py-3 text-right font-medium tabular-nums">
                                            ₦{money(s.closingBalance)}
                                        </td>
                                        <td className="px-4 py-3 text-right tabular-nums">
                                            {s.unmatchedCount > 0 ? (
                                                <span>
                                                    {s.lineCount - s.unmatchedCount}/{s.lineCount}
                                                </span>
                                            ) : (
                                                <span className="text-muted-foreground">
                                                    {s.lineCount}
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-4 py-3">
                                            <Badge
                                                variant="secondary"
                                                className={
                                                    s.status === 'COMPLETED'
                                                        ? 'bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-200'
                                                        : ''
                                                }
                                            >
                                                {s.status === 'COMPLETED' ? 'Signed off' : 'Open'}
                                            </Badge>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </Card>
            )}

            <ImportStatementDialog open={importOpen} onOpenChange={setImportOpen} />
        </div>
    );
}
