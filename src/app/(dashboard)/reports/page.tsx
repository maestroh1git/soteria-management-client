'use client';

import { useState, useMemo } from 'react';
import { formatCurrency } from '@/lib/utils/currency';
import {
    BarChart3,
    DollarSign,
    Users,
    Download,
    FileSpreadsheet,
    Building,
    CreditCard,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LoadingSkeleton } from '@/components/common/loading-skeleton';
import { EmptyState } from '@/components/common/empty-state';
import { CurrencyDisplay } from '@/components/common/currency-display';
import {
    useMonthlySummary,
    useTaxSummary,
    useLoanPortfolio,
    useDepartmentCost,
} from '@/lib/hooks/use-reports';
import { useCan } from '@/lib/hooks/use-can';
import { useTabParam } from '@/lib/hooks/use-tab-param';
import { useDownloadReport } from '@/lib/hooks/use-reports';
import { EmployeeLink } from '@/components/common/entity-link';

const MONTHS = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
];

const currentYear = new Date().getFullYear();
const currentMonth = new Date().getMonth() + 1;

const REPORT_TABS = ['monthly', 'tax', 'loans', 'departments'] as const;
const MONTHLY_ONLY = ['monthly'] as const;

export default function ReportsPage() {
    const [month, setMonth] = useState(currentMonth);
    const [year, setYear] = useState(currentYear);
    const [taxYear, setTaxYear] = useState(currentYear);
    // A Viewer reads the monthly summary; tax, loans, department cost and the
    // exports are for Payroll, Finance and the office (the API's lines).
    const detail = useCan()('reports.detail');
    const download = useDownloadReport();
    const [tab, setTab] = useTabParam(detail ? REPORT_TABS : MONTHLY_ONLY);

    const {
        data: summary,
        isLoading: summaryLoading,
        isError: summaryFailed,
    } = useMonthlySummary(month, year);
    const {
        data: taxSummary,
        isLoading: taxLoading,
        isError: taxFailed,
    } = useTaxSummary(taxYear, detail);
    const {
        data: loanPortfolio,
        isLoading: loanLoading,
        isError: loanFailed,
    } = useLoanPortfolio(detail);
    const {
        data: deptCost,
        isLoading: deptLoading,
        isError: deptFailed,
    } = useDepartmentCost(month, year, detail);

    // Amounts arrive as strings — `numeric` stays exact all the way from
    // Postgres and is converted here, at the point of display, and nowhere else.

    // Tax chart data — simple bar visualization
    const maxTax = useMemo(() => {
        if (!taxSummary) return 1;
        return Math.max(...taxSummary.monthlyBreakdown.map((m) => Number(m.totalTax)), 1);
    }, [taxSummary]);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Reports</h1>
                    <p className="text-muted-foreground">Payroll analytics, tax summaries, and financial reports</p>
                </div>
                {detail && (
                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            disabled={download.isPending}
                            onClick={() =>
                                download.mutate({
                                    format: 'csv',
                                    filters: { month, year, reportType: 'monthly-summary' },
                                })
                            }
                        >
                            <Download className="mr-2 h-4 w-4" />
                            CSV
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            disabled={download.isPending}
                            onClick={() =>
                                download.mutate({
                                    format: 'excel',
                                    filters: { month, year, reportType: 'monthly-summary' },
                                })
                            }
                        >
                            <FileSpreadsheet className="mr-2 h-4 w-4" />
                            Excel
                        </Button>
                    </div>
                )}
            </div>

            <Tabs value={tab} onValueChange={setTab} className="space-y-6">
                <TabsList>
                    <TabsTrigger value="monthly">
                        <BarChart3 className="mr-2 h-4 w-4" />
                        Monthly Summary
                    </TabsTrigger>
                    {detail && (
                        <TabsTrigger value="tax">
                            <DollarSign className="mr-2 h-4 w-4" />
                            Tax Summary
                        </TabsTrigger>
                    )}
                    {detail && (
                        <TabsTrigger value="loans">
                            <CreditCard className="mr-2 h-4 w-4" />
                            Loan Portfolio
                        </TabsTrigger>
                    )}
                    {detail && (
                        <TabsTrigger value="departments">
                            <Building className="mr-2 h-4 w-4" />
                            Department Costs
                        </TabsTrigger>
                    )}
                </TabsList>

                {/* ─── Monthly Summary ───────────────────────────────── */}
                <TabsContent value="monthly" className="space-y-6">
                    <div className="flex gap-3">
                        <Select value={String(month)} onValueChange={(v) => setMonth(Number(v))}>
                            <SelectTrigger className="w-[160px]">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {MONTHS.map((m, i) => (
                                    <SelectItem key={i} value={String(i + 1)}>{m}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <Select value={String(year)} onValueChange={(v) => setYear(Number(v))}>
                            <SelectTrigger className="w-[120px]">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {Array.from({ length: 5 }, (_, i) => currentYear - i).map((y) => (
                                    <SelectItem key={y} value={String(y)}>{y}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {summaryLoading ? (
                        <LoadingSkeleton variant="card" />
                    ) : !summary ? (
                        <EmptyState
                            isError={summaryFailed}
                            subject="the payroll summary" title="No data" description="No payroll data for this period." />
                    ) : (
                        <>
                            <div className="grid gap-4 md:grid-cols-5">
                                <Card>
                                    <CardHeader className="pb-2">
                                        <CardTitle className="flex items-center gap-2 text-sm text-muted-foreground">
                                            <Users className="h-4 w-4" /> Employees
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent><p className="text-2xl font-bold">{summary.summary.totalEmployees}</p></CardContent>
                                </Card>
                                <Card>
                                    <CardHeader className="pb-2">
                                        <CardTitle className="text-sm text-muted-foreground">Gross Salary</CardTitle>
                                    </CardHeader>
                                    <CardContent><p className="text-2xl font-bold">{formatCurrency(summary.summary.totalGrossSalary)}</p></CardContent>
                                </Card>
                                <Card>
                                    <CardHeader className="pb-2">
                                        <CardTitle className="text-sm text-muted-foreground">Deductions</CardTitle>
                                    </CardHeader>
                                    <CardContent><p className="text-2xl font-bold text-red-600">{formatCurrency(summary.summary.totalDeductions)}</p></CardContent>
                                </Card>
                                <Card>
                                    <CardHeader className="pb-2">
                                        <CardTitle className="text-sm text-muted-foreground">Tax</CardTitle>
                                    </CardHeader>
                                    <CardContent><p className="text-2xl font-bold text-amber-600">{formatCurrency(summary.summary.totalTax)}</p></CardContent>
                                </Card>
                                <Card>
                                    <CardHeader className="pb-2">
                                        <CardTitle className="text-sm text-muted-foreground">Net Salary</CardTitle>
                                    </CardHeader>
                                    <CardContent><p className="text-2xl font-bold text-green-600">{formatCurrency(summary.summary.totalNetSalary)}</p></CardContent>
                                </Card>
                            </div>

                            {/* Employee Breakdown */}
                            <div className="rounded-lg border bg-card">
                                <div className="border-b px-4 py-3">
                                    <h3 className="font-semibold">Employee Breakdown</h3>
                                </div>
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b bg-muted/50">
                                            <th className="px-4 py-3 text-left font-medium">Employee</th>
                                            <th className="px-4 py-3 text-left font-medium">Number</th>
                                            <th className="px-4 py-3 text-right font-medium">Gross</th>
                                            <th className="px-4 py-3 text-right font-medium">Deductions</th>
                                            <th className="px-4 py-3 text-right font-medium">Net</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {summary.employeeBreakdown.map((emp) => (
                                            <tr key={emp.employeeId} className="border-b transition-colors hover:bg-muted/50">
                                                <td className="px-4 py-3 font-medium">
                                                    <EmployeeLink id={emp.employeeId} name={emp.employeeName} />
                                                </td>
                                                <td className="px-4 py-3 text-muted-foreground">{emp.employeeNumber}</td>
                                                <td className="px-4 py-3 text-right"><CurrencyDisplay amount={emp.grossSalary} /></td>
                                                <td className="px-4 py-3 text-right text-red-600"><CurrencyDisplay amount={emp.totalDeductions} /></td>
                                                <td className="px-4 py-3 text-right font-semibold"><CurrencyDisplay amount={emp.netSalary} /></td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </>
                    )}
                </TabsContent>

                {/* ─── Tax Summary ───────────────────────────────────── */}
                {detail && (
                    <TabsContent value="tax" className="space-y-6">
                        <div className="flex gap-3">
                            <Select value={String(taxYear)} onValueChange={(v) => setTaxYear(Number(v))}>
                                <SelectTrigger className="w-[120px]">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {Array.from({ length: 5 }, (_, i) => currentYear - i).map((y) => (
                                        <SelectItem key={y} value={String(y)}>{y}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {taxLoading ? (
                            <LoadingSkeleton variant="card" />
                        ) : !taxSummary ? (
                            <EmptyState
                                isError={taxFailed}
                                subject="the tax summary" title="No data" description="No tax data for this year." />
                        ) : (
                            <>
                                <Card>
                                    <CardHeader className="pb-2">
                                        <CardTitle className="flex items-center gap-2 text-sm text-muted-foreground">
                                            <DollarSign className="h-4 w-4" /> Total Tax Collected ({taxYear})
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <p className="text-3xl font-bold">{formatCurrency(taxSummary.totalTaxCollected)}</p>
                                    </CardContent>
                                </Card>

                                {/* Monthly bar chart */}
                                <Card>
                                    <CardHeader>
                                        <CardTitle>Monthly Tax Breakdown</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="space-y-3">
                                            {taxSummary.monthlyBreakdown.map((m) => (
                                                <div key={m.month} className="flex items-center gap-4">
                                                    <span className="w-16 text-sm text-muted-foreground">{MONTHS[m.month - 1]?.substring(0, 3)}</span>
                                                    <div className="flex-1 h-6 rounded bg-muted overflow-hidden">
                                                        <div
                                                            className="h-full rounded bg-primary transition-all"
                                                            style={{ width: `${(Number(m.totalTax) / maxTax) * 100}%` }}
                                                        />
                                                    </div>
                                                    <span className="w-32 text-sm text-right font-medium">{formatCurrency(m.totalTax)}</span>
                                                    <span className="w-20 text-sm text-right text-muted-foreground">{m.employeeCount} emp</span>
                                                </div>
                                            ))}
                                        </div>
                                    </CardContent>
                                </Card>
                            </>
                        )}
                    </TabsContent>
                )}

                {/* ─── Loan Portfolio ────────────────────────────────── */}
                {detail && (
                    <TabsContent value="loans" className="space-y-6">
                        {loanLoading ? (
                            <LoadingSkeleton variant="card" />
                        ) : !loanPortfolio ? (
                            <EmptyState
                                isError={loanFailed}
                                subject="the loan portfolio" title="No data" description="No loan data available." />
                        ) : (
                            <>
                                <div className="grid gap-4 md:grid-cols-3">
                                    <Card>
                                        <CardHeader className="pb-2">
                                            <CardTitle className="text-sm text-muted-foreground">Active Loans</CardTitle>
                                        </CardHeader>
                                        <CardContent><p className="text-2xl font-bold">{loanPortfolio.totalActiveLoans}</p></CardContent>
                                    </Card>
                                    <Card>
                                        <CardHeader className="pb-2">
                                            <CardTitle className="text-sm text-muted-foreground">Total Disbursed</CardTitle>
                                        </CardHeader>
                                        <CardContent><p className="text-2xl font-bold">{formatCurrency(loanPortfolio.totalDisbursed)}</p></CardContent>
                                    </Card>
                                    <Card>
                                        <CardHeader className="pb-2">
                                            <CardTitle className="text-sm text-muted-foreground">Outstanding Balance</CardTitle>
                                        </CardHeader>
                                        <CardContent><p className="text-2xl font-bold text-red-600">{formatCurrency(loanPortfolio.totalOutstandingBalance)}</p></CardContent>
                                    </Card>
                                </div>

                                <div className="grid gap-6 md:grid-cols-2">
                                    {/* By Type */}
                                    <Card>
                                        <CardHeader>
                                            <CardTitle>Loans by Type</CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            <div className="space-y-4">
                                                {loanPortfolio.loansByType.map((t) => (
                                                    <div key={t.loanType} className="flex items-center justify-between">
                                                        <div>
                                                            <p className="font-medium capitalize">{t.loanType.replace('_', ' ').toLowerCase()}</p>
                                                            <p className="text-sm text-muted-foreground">{t.count} loans</p>
                                                        </div>
                                                        <div className="text-right">
                                                            <p className="font-semibold">{formatCurrency(t.totalAmount)}</p>
                                                            <p className="text-xs text-muted-foreground">
                                                                {formatCurrency(t.outstandingBalance)} outstanding
                                                            </p>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </CardContent>
                                    </Card>

                                    {/* By Status */}
                                    <Card>
                                        <CardHeader>
                                            <CardTitle>Loans by Status</CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            <div className="space-y-3">
                                                {loanPortfolio.loansByStatus.map((s) => {
                                                    const total = loanPortfolio.loansByStatus.reduce((sum, x) => sum + x.count, 0) || 1;
                                                    const pct = (s.count / total) * 100;
                                                    return (
                                                        <div key={s.status} className="space-y-1">
                                                            <div className="flex justify-between text-sm">
                                                                <span className="capitalize">{s.status.replace('_', ' ').toLowerCase()}</span>
                                                                <span className="font-medium">{s.count}</span>
                                                            </div>
                                                            <div className="h-2 overflow-hidden rounded-full bg-muted">
                                                                <div className="h-full rounded-full bg-primary" style={{ width: `${pct}%` }} />
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </CardContent>
                                    </Card>
                                </div>
                            </>
                        )}
                    </TabsContent>
                )}

                {/* ─── Department Costs ──────────────────────────────── */}
                {detail && (
                    <TabsContent value="departments" className="space-y-6">
                        <div className="flex gap-3">
                            <Select value={String(month)} onValueChange={(v) => setMonth(Number(v))}>
                                <SelectTrigger className="w-[160px]">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {MONTHS.map((m, i) => (
                                        <SelectItem key={i} value={String(i + 1)}>{m}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <Select value={String(year)} onValueChange={(v) => setYear(Number(v))}>
                                <SelectTrigger className="w-[120px]">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {Array.from({ length: 5 }, (_, i) => currentYear - i).map((y) => (
                                        <SelectItem key={y} value={String(y)}>{y}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {deptLoading ? (
                            <LoadingSkeleton rows={5} />
                        ) : !deptCost?.departments.length ? (
                            <EmptyState
                                isError={deptFailed}
                                subject="the department costs" title="No data" description="No department cost data for this period." />
                        ) : (
                            <div className="rounded-lg border bg-card">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b bg-muted/50">
                                            <th className="px-4 py-3 text-left font-medium">Department</th>
                                            <th className="px-4 py-3 text-right font-medium">Employees</th>
                                            <th className="px-4 py-3 text-right font-medium">Total Gross</th>
                                            <th className="px-4 py-3 text-right font-medium">Total Net</th>
                                            <th className="px-4 py-3 text-right font-medium">Avg Salary</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {deptCost.departments.map((dept) => (
                                            <tr key={dept.department} className="border-b transition-colors hover:bg-muted/50">
                                                <td className="px-4 py-3 font-medium">{dept.department}</td>
                                                <td className="px-4 py-3 text-right">{dept.employeeCount}</td>
                                                <td className="px-4 py-3 text-right"><CurrencyDisplay amount={dept.totalGross} /></td>
                                                <td className="px-4 py-3 text-right"><CurrencyDisplay amount={dept.totalNet} /></td>
                                                <td className="px-4 py-3 text-right text-muted-foreground"><CurrencyDisplay amount={dept.avgSalary} /></td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </TabsContent>
                )}
            </Tabs>
        </div>
    );
}
