'use client';

import { useAuth } from '@/lib/hooks/use-auth';
import { useCan } from '@/lib/hooks/use-can';
import { StatCard } from '@/components/common/stat-card';
import { LoadingSkeleton } from '@/components/common/loading-skeleton';
import { EmptyState } from '@/components/common/empty-state';
import { StatusBadge } from '@/components/common/status-badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    useMonthlySummary,
    useLoanPortfolio,
    useDepartmentCost,
    useYearEndReport,
    useRecentSalaries,
} from '@/lib/hooks/use-reports';
import { EventsWidget } from '@/components/dashboard/events-widget';
import { EmployeeDashboard } from '@/components/dashboard/employee-dashboard';
import { SchoolWidget } from '@/components/dashboard/school-widget';
import { StaffRecordsWidget } from '@/components/dashboard/staff-records-widget';
import { AttendanceTile } from '@/components/dashboard/attendance-tile';
import { FeesWidget } from '@/components/dashboard/fees-widget';
import { GettingStartedCard } from '@/components/onboarding/getting-started-card';
import { formatCurrency, formatCompactCurrency } from '@/lib/utils/currency';
import {
    Users,
    Calculator,
    Receipt,
    Landmark,
    BarChart3,
} from 'lucide-react';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
    Cell,
} from 'recharts';

const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const DEPT_COLORS = [
    '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6',
    '#ec4899', '#06b6d4', '#84cc16', '#f97316', '#6366f1',
];

export default function DashboardPage() {
    const { fullName, tenantName, hasRole } = useAuth();

    /**
     * Who is looking.
     *
     * This screen used to ask for everything regardless, and the server —
     * correctly — refused the parts a teacher or a registrar may not see. They
     * landed on a row of zeros, which reads as an empty or broken system rather
     * than as a screen that is not for them. The roles below match the ones the
     * reports endpoints actually accept, so nothing is requested that would come
     * back 403.
     */
    const can = useCan();
    const seesPayroll = can('reports.monthly');
    // Each block below asks for its own report, and each report has its own
    // audience on the API. One shared flag asked for all five and got three
    // 403s for a Viewer, one for a Payroll Officer and one for Finance.
    const canYearEnd = can('reports.yearEnd');
    const canDetail = can('reports.detail');
    const canSalaries = can('payroll.readSalaries');

    // A plain member of staff — the EMPLOYEE role and nothing that runs the
    // school or the payroll. The admin dashboard below is not theirs to read;
    // they get their own pay-first landing instead.
    const isPlainEmployee =
        hasRole(['EMPLOYEE']) &&
        !seesPayroll &&
        !hasRole([
            'APPROVER',
            'admissions.registrar',
            'admissions.officer',
            'academic.teacher',
        ]);

    // What the page is actually showing this person. Telling a form teacher
    // they are looking at payroll status, above a screen with no payroll on it,
    // is the kind of small wrongness that makes people distrust the rest.
    const subtitle = seesPayroll
        ? `Here's an overview of ${tenantName}'s payroll status`
        : `Here's what's happening at ${tenantName}`;

    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();

    const {
        data: yearEnd,
        isLoading: loadingYearEnd,
        isError: yearEndFailed,
    } = useYearEndReport(currentYear, canYearEnd);

    /**
     * Which month this dashboard is reporting on.
     *
     * It used to ask only about today's calendar month and, finding nothing,
     * declare "No payroll data yet" — on a school with two months of approved
     * payroll already on the books. The monthly summary counts cost, so it
     * excludes DRAFT salaries; a month whose run is calculated but not yet
     * approved reads as empty, and the year's real figures were fetched and
     * then thrown away by an early return.
     *
     * So: today's month when it has anything, otherwise the most recent month
     * that does — and the header says which, because a total with no date on it
     * is worse than no total.
     */
    const monthsWithData =
        yearEnd?.monthlySummaries?.filter((ms) => ms.summary.totalEmployees > 0) ?? [];
    const currentMonthHasData = monthsWithData.some(
        (ms) => ms.period.month === currentMonth,
    );
    const latestMonthWithData = monthsWithData.length
        ? monthsWithData[monthsWithData.length - 1].period.month
        : null;
    const displayMonth =
        currentMonthHasData || latestMonthWithData === null
            ? currentMonth
            : latestMonthWithData;
    const showingEarlierMonth = displayMonth !== currentMonth;

    const {
        data: monthlySummary,
        isLoading: loadingSummary,
        isError: summaryFailed,
    } = useMonthlySummary(displayMonth, currentYear, seesPayroll);
    const {
        data: loanPortfolio,
        isLoading: loadingLoans,
        isError: loansFailed,
    } = useLoanPortfolio(canDetail);
    const {
        data: departmentCost,
        isLoading: loadingDept,
        isError: deptFailed,
    } = useDepartmentCost(displayMonth, currentYear, canDetail);
    const {
        data: recentSalaries,
        isLoading: loadingRecent,
        isError: recentFailed,
    } = useRecentSalaries(5, canSalaries);

    const isLoading =
        seesPayroll &&
        (loadingSummary || loadingLoans || loadingDept || loadingYearEnd || loadingRecent);

    // Charts plot numbers, so amounts are converted here and only here — this
    // is the display boundary the string rule allows for.
    const payrollTrendData = yearEnd?.monthlySummaries
        ?.map((ms) => ({
            month: MONTH_LABELS[ms.period.month - 1],
            gross: Number(ms.summary.totalGrossSalary),
            net: Number(ms.summary.totalNetSalary),
        }))
        .slice(-6) ?? [];

    // Build department cost data
    const deptCostData = departmentCost?.departments?.map((d) => ({
        department: d.department,
        cost: Number(d.totalGross),
        employees: d.employeeCount,
    })) ?? [];

    // Genuinely nothing to show: no month this year has any approved payroll.
    // Only meaningful to somebody who can see payroll at all. For a teacher the
    // query never runs, so this stays false and the school section shows instead.
    const hasNoData =
        seesPayroll &&
        !loadingYearEnd &&
        !loadingSummary &&
        latestMonthWithData === null &&
        monthlySummary?.summary?.totalEmployees === 0;

    // Rendered after the hooks above so their order never changes; those queries
    // are disabled for this person anyway (seesPayroll is false), so nothing is
    // fetched that they could not see.
    if (isPlainEmployee) {
        return <EmployeeDashboard />;
    }

    if (isLoading) {
        return (
            <div className="space-y-8">
                <div className="space-y-2">
                    <div className="h-8 w-64 rounded bg-muted animate-pulse" />
                    <div className="h-4 w-80 rounded bg-muted animate-pulse" />
                </div>
                <LoadingSkeleton variant="card" />
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="rounded-lg border p-6 space-y-4">
                        <div className="h-5 w-40 rounded bg-muted animate-pulse" />
                        <div className="h-64 rounded bg-muted animate-pulse" />
                    </div>
                    <div className="rounded-lg border p-6 space-y-4">
                        <div className="h-5 w-40 rounded bg-muted animate-pulse" />
                        <div className="h-64 rounded bg-muted animate-pulse" />
                    </div>
                </div>
                <LoadingSkeleton variant="table" rows={5} />
            </div>
        );
    }

    if (hasNoData) {
        return (
            <div className="space-y-8">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">
                        Welcome back, {fullName.split(' ')[0] || 'Admin'}
                    </h1>
                    <p className="text-muted-foreground mt-1">{subtitle}</p>
                </div>
                <GettingStartedCard />
                {/* Also here, not only on the populated dashboard below: a
                    tenant still setting up is exactly who is adding staff, and
                    exactly who would otherwise not hear that half those records
                    cannot be paid until the first payroll run fails. It renders
                    nothing when there is nothing to act on. */}
                <StaffRecordsWidget />
                <EmptyState
                    icon={BarChart3}
                    title="No approved payroll yet"
                    description="These figures count approved payroll. Once a pay period is processed and its salaries approved, the metrics and charts appear here — a run that is still in draft will not show."
                />
            </div>
        );
    }

    const summary = monthlySummary?.summary;

    return (
        <div className="space-y-8">
            {/* Welcome header */}
            <div>
                <h1 className="text-3xl font-bold tracking-tight">
                    Welcome back, {fullName.split(' ')[0] || 'Admin'}
                </h1>
                <p className="text-muted-foreground mt-1">{subtitle}</p>
                {seesPayroll && showingEarlierMonth && (
                    <p className="mt-2 text-sm text-muted-foreground">
                        Showing <span className="font-medium text-foreground">
                            {MONTH_LABELS[displayMonth - 1]} {currentYear}
                        </span>
                        {' '}— the most recent month with approved payroll.{' '}
                        {MONTH_LABELS[currentMonth - 1]} has nothing approved yet.
                    </p>
                )}
            </div>

            {/* Onboarding checklist (self-hides once complete/dismissed) */}
            <GettingStartedCard />

            {/* Payroll and loans — only for the roles the reports allow.

                When the figures cannot be fetched we say so rather than
                printing them. `?? 0` below turns a failed request into
                "Total Employees: 0", which is a school being told something
                false about itself — and `hasNoData` above cannot catch it,
                because it tests `totalEmployees === 0` on data that is
                undefined when the request failed. */}
            {seesPayroll &&
            ((summaryFailed && !monthlySummary) ||
                (loansFailed && !loanPortfolio)) ? (
                <EmptyState
                    isError
                    subject="your payroll figures"
                    icon={BarChart3}
                    title="No approved payroll yet"
                />
            ) : seesPayroll ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                    title="Total Employees"
                    value={summary?.totalEmployees ?? 0}
                    subtitle="Active employees"
                    icon={Users}
                />
                <StatCard
                    title="Monthly Payroll"
                    value={summary ? formatCompactCurrency(summary.totalGrossSalary) : '—'}
                    subtitle={`${MONTH_LABELS[displayMonth - 1]} ${currentYear} gross`}
                    icon={Calculator}
                />
                {canDetail && (
                    <>
                        <StatCard
                            title="Active Loans"
                            value={loanPortfolio?.totalActiveLoans ?? 0}
                            subtitle="Outstanding loans"
                            icon={Receipt}
                        />
                        <StatCard
                            title="Outstanding Balance"
                            value={loanPortfolio ? formatCompactCurrency(loanPortfolio.totalOutstandingBalance) : '—'}
                            subtitle="Total loan balance"
                            icon={Landmark}
                        />
                    </>
                )}
            </div>

            ) : null}

            {/* Staff whose records cannot carry a payment or a filing. Above
                the rest because it is the one tile with a deadline attached,
                and it hides itself when there is nothing to do. */}
            <StaffRecordsWidget />

            {/* Today's attendance, and — louder — the registers nobody has
                taken. Hides itself for a tenant with no classes. */}
            <AttendanceTile />

            {/* The school, for the people who run it. Self-gates on org type
                and role, and stays hidden until there is a roll. */}
            <SchoolWidget />

            {/* Fees in against costs out — both sides from the ledger. Hides
                itself for a tenant that has never billed anything. */}
            <FeesWidget />

            {/* Upcoming events. This was a three-column grid holding a single
                one-column card — the birthdays widget that used to sit beside it
                is gone — so two thirds of the row was empty. Full width, like
                the cards above it. */}
            <EventsWidget />

            {seesPayroll && (
            <>
            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Payroll Trend Chart */}
                {canYearEnd && (
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base">Payroll Trend (Last 6 Months)</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {payrollTrendData.length > 0 ? (
                                <ResponsiveContainer width="100%" height={300}>
                                    <BarChart data={payrollTrendData}>
                                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                                        <XAxis dataKey="month" className="text-xs" />
                                        <YAxis
                                            className="text-xs"
                                            tickFormatter={(v: number) => formatCompactCurrency(v).replace('NGN ', '')}
                                        />
                                        <Tooltip
                                            formatter={(value) => formatCurrency(value as number)}
                                            contentStyle={{ borderRadius: '8px', fontSize: '12px' }}
                                        />
                                        {/* Recharts colours the legend text with the
                                            series colour, which on this background
                                            measures 3.7:1 and 2.5:1 — under the 4.5:1
                                            WCAG 1.4.3 needs. The swatch still carries
                                            the colour; the words are readable. */}
                                        <Legend
                                            formatter={(value) => (
                                                <span className="text-foreground">{value}</span>
                                            )}
                                        />
                                        <Bar dataKey="gross" name="Gross Salary" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                                        <Bar dataKey="net" name="Net Salary" fill="#10b981" radius={[4, 4, 0, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="flex items-center justify-center h-[300px] text-sm text-muted-foreground">
                                    {yearEndFailed
                                        ? "We couldn't load the payroll trend"
                                        : 'No payroll trend data available'}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                )}

                {/* Department Cost Chart */}
                {canDetail && (
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base">Department Salary Cost</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {deptCostData.length > 0 ? (
                                <ResponsiveContainer width="100%" height={300}>
                                    <BarChart data={deptCostData} layout="vertical">
                                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                                        <XAxis
                                            type="number"
                                            className="text-xs"
                                            tickFormatter={(v: number) => formatCompactCurrency(v).replace('NGN ', '')}
                                        />
                                        <YAxis
                                            dataKey="department"
                                            type="category"
                                            className="text-xs"
                                            width={120}
                                        />
                                        <Tooltip
                                            formatter={(value) => formatCurrency(value as number)}
                                            contentStyle={{ borderRadius: '8px', fontSize: '12px' }}
                                        />
                                        <Bar dataKey="cost" name="Gross Cost" radius={[0, 4, 4, 0]}>
                                            {deptCostData.map((_, index) => (
                                                <Cell key={index} fill={DEPT_COLORS[index % DEPT_COLORS.length]} />
                                            ))}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="flex items-center justify-center h-[300px] text-sm text-muted-foreground">
                                    {deptFailed
                                        ? "We couldn't load the department costs"
                                        : 'No department cost data available'}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                )}
            </div>

            {/* Loan Portfolio Summary */}
            {loanPortfolio && loanPortfolio.loansByType.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">Loan Portfolio by Type</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            {loanPortfolio.loansByType.map((lt) => (
                                <div key={lt.loanType} className="rounded-lg border p-4 space-y-1">
                                    <p className="text-sm font-medium text-muted-foreground">
                                        {lt.loanType.replace(/_/g, ' ')}
                                    </p>
                                    <p className="text-lg font-semibold">{lt.count} loans</p>
                                    <p className="text-xs text-muted-foreground">
                                        Outstanding: {formatCurrency(lt.outstandingBalance)}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Recent Payroll Activity */}
            {canSalaries && (
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">Recent Payroll Activity</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {recentSalaries && recentSalaries.items.length > 0 ? (
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Employee</TableHead>
                                        <TableHead>Pay Period</TableHead>
                                        <TableHead className="text-right">Gross</TableHead>
                                        <TableHead className="text-right">Net</TableHead>
                                        <TableHead>Status</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {recentSalaries.items.map((salary) => (
                                        <TableRow key={salary.id}>
                                            <TableCell className="font-medium">
                                                {salary.employee
                                                    ? `${salary.employee.firstName} ${salary.employee.lastName}`
                                                    : salary.employeeId}
                                            </TableCell>
                                            <TableCell>
                                                {salary.payPeriod?.name ?? salary.payPeriodId}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                {formatCurrency(salary.grossSalary)}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                {formatCurrency(salary.netSalary)}
                                            </TableCell>
                                            <TableCell>
                                                <StatusBadge status={salary.status} />
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        ) : (
                            <div className="text-center py-8 text-sm text-muted-foreground">
                                {recentFailed
                                    ? "We couldn't load recent payroll activity"
                                    : 'No recent payroll activity'}
                            </div>
                        )}
                    </CardContent>
                </Card>
            )}
            </>
            )}
        </div>
    );
}
