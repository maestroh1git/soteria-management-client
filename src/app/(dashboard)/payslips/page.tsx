'use client';

import { useState, useMemo } from 'react';
import {
    Send,
    FileDown,
    Mail,
    Search,
    FileText,
    CheckCircle2,
    Eye,
    AlertCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    DialogDescription,
} from '@/components/ui/dialog';
import { LoadingSkeleton } from '@/components/common/loading-skeleton';
import { EmptyState } from '@/components/common/empty-state';
import { usePayPeriods } from '@/lib/hooks/use-payroll';
import {
    usePayslipsByPayPeriod,
    useGenerateBulkPayslips,
    useSendPayslipEmail,
    useSendBulkEmails,
} from '@/lib/hooks/use-reports';
import { getPayslipDownloadUrl } from '@/lib/api/payslips';
import type { Payslip } from '@/lib/types/api';
import { PayslipStatus, PayPeriodStatus } from '@/lib/types/enums';

const STATUS_CONFIG: Record<PayslipStatus, { label: string; variant: 'default' | 'secondary' | 'outline' | 'destructive'; icon: typeof FileText }> = {
    [PayslipStatus.GENERATED]: { label: 'Generated', variant: 'secondary', icon: FileText },
    [PayslipStatus.SENT]: { label: 'Sent', variant: 'default', icon: CheckCircle2 },
    [PayslipStatus.VIEWED]: { label: 'Viewed', variant: 'outline', icon: Eye },
    [PayslipStatus.FAILED]: { label: 'Failed', variant: 'destructive', icon: AlertCircle },
};

export default function PayslipsPage() {
    const [selectedPeriod, setSelectedPeriod] = useState<string>('');
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [showBulkGenerate, setShowBulkGenerate] = useState(false);
    const [showBulkSend, setShowBulkSend] = useState(false);

    const { data: periods } = usePayPeriods();
    const { data: payslips, isLoading } = usePayslipsByPayPeriod(selectedPeriod);

    const generateBulkMutation = useGenerateBulkPayslips();
    const sendEmailMutation = useSendPayslipEmail();
    const sendBulkMutation = useSendBulkEmails();

    const formatDate = (d: string | null) =>
        d ? new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—';

    // Filter payslips
    const filtered = useMemo(() => {
        if (!payslips) return [];
        return payslips.filter((p) => {
            if (statusFilter !== 'all' && p.status !== statusFilter) return false;
            if (search) {
                const name = p.employee
                    ? `${p.employee.firstName} ${p.employee.lastName}`.toLowerCase()
                    : '';
                if (!name.includes(search.toLowerCase())) return false;
            }
            return true;
        });
    }, [payslips, statusFilter, search]);

    // Summary counts
    const counts = useMemo(() => {
        if (!payslips) return { total: 0, sent: 0, viewed: 0, failed: 0 };
        return {
            total: payslips.length,
            sent: payslips.filter((p) => p.status === PayslipStatus.SENT).length,
            viewed: payslips.filter((p) => p.status === PayslipStatus.VIEWED).length,
            failed: payslips.filter((p) => p.status === PayslipStatus.FAILED).length,
        };
    }, [payslips]);

    const handleBulkGenerate = () => {
        generateBulkMutation.mutate(selectedPeriod, {
            onSuccess: () => setShowBulkGenerate(false),
        });
    };

    const handleBulkSend = () => {
        sendBulkMutation.mutate(selectedPeriod, {
            onSuccess: () => setShowBulkSend(false),
        });
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Payslips</h1>
                    <p className="text-muted-foreground">Generate, download, and email employee payslips</p>
                </div>
                <div className="flex gap-2">
                    <Button
                        variant="outline"
                        disabled={!selectedPeriod}
                        onClick={() => setShowBulkSend(true)}
                    >
                        <Mail className="mr-2 h-4 w-4" />
                        Send All
                    </Button>
                    <Button disabled={!selectedPeriod} onClick={() => setShowBulkGenerate(true)}>
                        <FileText className="mr-2 h-4 w-4" />
                        Generate All
                    </Button>
                </div>
            </div>

            {/* Period selector */}
            <div className="flex gap-3">
                <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                    <SelectTrigger className="w-[300px]">
                        <SelectValue placeholder="Select a pay period" />
                    </SelectTrigger>
                    <SelectContent>
                        {periods?.map((p) => (
                            <SelectItem key={p.id} value={p.id}>
                                {p.name} ({p.status})
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            {!selectedPeriod ? (
                <EmptyState
                    title="Select a pay period"
                    description="Choose a pay period above to view and manage payslips."
                />
            ) : (
                <>
                    {/* Summary */}
                    <div className="grid gap-4 md:grid-cols-4">
                        <Card>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm text-muted-foreground">Total</CardTitle>
                            </CardHeader>
                            <CardContent><p className="text-2xl font-bold">{counts.total}</p></CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm text-muted-foreground">Sent</CardTitle>
                            </CardHeader>
                            <CardContent><p className="text-2xl font-bold text-blue-600">{counts.sent}</p></CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm text-muted-foreground">Viewed</CardTitle>
                            </CardHeader>
                            <CardContent><p className="text-2xl font-bold text-green-600">{counts.viewed}</p></CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm text-muted-foreground">Failed</CardTitle>
                            </CardHeader>
                            <CardContent><p className="text-2xl font-bold text-red-600">{counts.failed}</p></CardContent>
                        </Card>
                    </div>

                    {/* Filters */}
                    <div className="flex gap-3">
                        <div className="relative flex-1 max-w-sm">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search employee…"
                                className="pl-9"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                        </div>
                        <Select
                            value={statusFilter}
                            onValueChange={setStatusFilter}
                        >
                            <SelectTrigger className="w-[160px]">
                                <SelectValue placeholder="All statuses" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All statuses</SelectItem>
                                {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
                                    <SelectItem key={key} value={key}>{cfg.label}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Table */}
                    {isLoading ? (
                        <LoadingSkeleton rows={5} />
                    ) : !filtered.length ? (
                        <EmptyState
                            title="No payslips"
                            description="Generate payslips for this pay period to see them here."
                            actionLabel="Generate All"
                            onAction={() => setShowBulkGenerate(true)}
                        />
                    ) : (
                        <div className="rounded-lg border bg-card">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b bg-muted/50">
                                        <th className="px-4 py-3 text-left font-medium">Employee</th>
                                        <th className="hidden md:table-cell px-4 py-3 text-left font-medium">File</th>
                                        <th className="px-4 py-3 text-left font-medium">Status</th>
                                        <th className="hidden lg:table-cell px-4 py-3 text-left font-medium">Generated</th>
                                        <th className="hidden lg:table-cell px-4 py-3 text-left font-medium">Sent</th>
                                        <th className="px-4 py-3 text-right font-medium">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filtered.map((payslip) => {
                                        const cfg = STATUS_CONFIG[payslip.status];
                                        return (
                                            <tr key={payslip.id} className="border-b transition-colors hover:bg-muted/50">
                                                <td className="px-4 py-3 font-medium">
                                                    {payslip.employee
                                                        ? `${payslip.employee.firstName} ${payslip.employee.lastName}`
                                                        : payslip.employeeId.substring(0, 8)}
                                                </td>
                                                <td className="hidden md:table-cell px-4 py-3 text-muted-foreground">
                                                    {payslip.fileName || '—'}
                                                </td>
                                                <td className="px-4 py-3">
                                                    <Badge variant={cfg.variant}>{cfg.label}</Badge>
                                                </td>
                                                <td className="hidden lg:table-cell px-4 py-3 text-muted-foreground">
                                                    {formatDate(payslip.generatedAt)}
                                                </td>
                                                <td className="hidden lg:table-cell px-4 py-3 text-muted-foreground">
                                                    {formatDate(payslip.sentAt)}
                                                </td>
                                                <td className="px-4 py-3 text-right">
                                                    <div className="flex justify-end gap-1">
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => window.open(getPayslipDownloadUrl(payslip.accessToken), '_blank')}
                                                        >
                                                            <FileDown className="h-4 w-4" />
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            disabled={sendEmailMutation.isPending}
                                                            onClick={() => sendEmailMutation.mutate(payslip.id)}
                                                        >
                                                            <Send className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </>
            )}

            {/* Bulk Generate Dialog */}
            <Dialog open={showBulkGenerate} onOpenChange={setShowBulkGenerate}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Generate All Payslips</DialogTitle>
                        <DialogDescription>Generate payslips for all paid salaries in this pay period.</DialogDescription>
                    </DialogHeader>
                    <p className="text-sm text-muted-foreground">
                        This will create PDF payslips for all employees with paid salaries in the selected period.
                    </p>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowBulkGenerate(false)}>Cancel</Button>
                        <Button onClick={handleBulkGenerate} disabled={generateBulkMutation.isPending}>
                            {generateBulkMutation.isPending ? 'Generating…' : 'Generate'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Bulk Send Dialog */}
            <Dialog open={showBulkSend} onOpenChange={setShowBulkSend}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Send All Payslips</DialogTitle>
                        <DialogDescription>Email payslips to all employees in this pay period.</DialogDescription>
                    </DialogHeader>
                    <p className="text-sm text-muted-foreground">
                        This will send payslip emails to all employees who have generated payslips.
                    </p>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowBulkSend(false)}>Cancel</Button>
                        <Button onClick={handleBulkSend} disabled={sendBulkMutation.isPending}>
                            {sendBulkMutation.isPending ? 'Sending…' : 'Send All'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
