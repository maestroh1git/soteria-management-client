import {
    LayoutDashboard,
    Users,
    GraduationCap,
    ClipboardList,
    School,
    BadgeDollarSign,
    ReceiptText,
    HandCoins,
    TrendingDown,
    Landmark,
    Scale,
    PiggyBank,
    Briefcase,
    Building2,
    Layers,
    CalendarDays,
    Wallet,
    Calculator,
    CreditCard,
    Receipt,
    FileText,
    BarChart3,
    Settings,
    Shield,
    UserCircle,
    type LucideIcon,
} from 'lucide-react';

export interface NavItem {
    title: string;
    href: string;
    icon: LucideIcon;
    badge?: string;
    roles?: string[];
    /**
     * Organisation types this belongs to. Absent means every tenant.
     *
     * Students and Admissions do not apply to a hospital, and showing them
     * there would tell a hospital administrator the product was not built for
     * them.
     */
    orgTypes?: string[];
}

export interface NavGroup {
    label: string;
    items: NavItem[];
}

/**
 * The single source of truth for the sidebar, used by both the desktop rail and
 * the mobile drawer. It used to be defined twice — the mobile copy drifted, lost
 * "My Account" entirely, and so a plain employee (who matches none of the admin
 * roles) opened the menu to nothing but Dashboard. One list, filtered the same
 * way in both places, is what stops that happening again.
 */
export const navigation: NavGroup[] = [
    {
        // Deliberately unrestricted. Everyone with an account is also an
        // employee, including administrators, and the API resolves the subject
        // from the token — there is nothing here to gate.
        label: 'My Account',
        items: [
            { title: 'My Pay', href: '/me', icon: Wallet },
            { title: 'My Leave', href: '/me/leave', icon: CalendarDays },
            { title: 'My Profile', href: '/me/profile', icon: UserCircle },
        ],
    },
    {
        label: 'Overview',
        items: [{ title: 'Dashboard', href: '/', icon: LayoutDashboard }],
    },
    {
        label: 'School',
        items: [
            { title: 'Students', href: '/students', icon: GraduationCap, orgTypes: ['SCHOOL'], roles: ['tenant_owner', 'ADMIN', 'admissions.registrar', 'admissions.officer', 'academic.teacher'] },
            { title: 'Admissions', href: '/admissions', icon: ClipboardList, orgTypes: ['SCHOOL'], roles: ['tenant_owner', 'ADMIN', 'admissions.registrar', 'admissions.officer'] },
            { title: 'Classes', href: '/classes', icon: School, orgTypes: ['SCHOOL'], roles: ['tenant_owner', 'ADMIN', 'admissions.registrar', 'academic.teacher'] },
            { title: 'Fees', href: '/fees', icon: BadgeDollarSign, orgTypes: ['SCHOOL'], roles: ['tenant_owner', 'ADMIN', 'FINANCE_ADMIN', 'admissions.registrar'] },
            { title: 'Invoices', href: '/fees/invoices', icon: ReceiptText, orgTypes: ['SCHOOL'], roles: ['tenant_owner', 'ADMIN', 'FINANCE_ADMIN', 'admissions.registrar'] },
            { title: 'Receipts', href: '/fees/payments', icon: HandCoins, orgTypes: ['SCHOOL'], roles: ['tenant_owner', 'ADMIN', 'FINANCE_ADMIN', 'admissions.registrar'] },
            { title: 'Arrears', href: '/fees/arrears', icon: TrendingDown, orgTypes: ['SCHOOL'], roles: ['tenant_owner', 'ADMIN', 'FINANCE_ADMIN'] },
        ],
    },
    {
        label: 'Staff',
        items: [
            { title: 'Employees', href: '/employees', icon: Users, roles: ['tenant_owner', 'ADMIN', 'PAYROLL_OFFICER', 'VIEWER'] },
            { title: 'Roles', href: '/roles', icon: Briefcase, roles: ['tenant_owner', 'ADMIN'] },
            { title: 'Departments', href: '/departments', icon: Building2, roles: ['tenant_owner', 'ADMIN'] },
            { title: 'Grades', href: '/grades', icon: Layers, roles: ['tenant_owner', 'ADMIN'] },
            { title: 'Leave', href: '/leave', icon: CalendarDays, roles: ['tenant_owner', 'ADMIN', 'PAYROLL_OFFICER', 'APPROVER'] },
            { title: 'Salary Components', href: '/salary-components', icon: CreditCard, roles: ['tenant_owner', 'ADMIN', 'PAYROLL_OFFICER'] },
            { title: 'Banks', href: '/banks', icon: Landmark, roles: ['tenant_owner', 'ADMIN', 'PAYROLL_OFFICER'] },
        ],
    },
    {
        label: 'Finance',
        items: [
            { title: 'Payroll', href: '/payroll', icon: Calculator, roles: ['tenant_owner', 'ADMIN', 'PAYROLL_OFFICER', 'FINANCE_ADMIN', 'APPROVER'] },
            { title: 'Ledger', href: '/ledger', icon: Scale, roles: ['tenant_owner', 'ADMIN', 'FINANCE_ADMIN'] },
            { title: 'Expenses', href: '/expenses', icon: Wallet, roles: ['tenant_owner', 'ADMIN', 'FINANCE_ADMIN', 'APPROVER'] },
            { title: 'Budgets', href: '/budgets', icon: PiggyBank, roles: ['tenant_owner', 'ADMIN', 'FINANCE_ADMIN', 'APPROVER'] },
            { title: 'Bank', href: '/banking', icon: Landmark, roles: ['tenant_owner', 'ADMIN', 'FINANCE_ADMIN'] },
            { title: 'Loans', href: '/loans', icon: Receipt, roles: ['tenant_owner', 'ADMIN', 'PAYROLL_OFFICER', 'FINANCE_ADMIN', 'APPROVER'] },
            { title: 'Tax Rules', href: '/tax-rules', icon: FileText, roles: ['tenant_owner', 'ADMIN', 'FINANCE_ADMIN'] },
        ],
    },
    {
        label: 'Reporting',
        items: [
            { title: 'Payslips', href: '/payslips', icon: FileText, roles: ['tenant_owner', 'ADMIN', 'PAYROLL_OFFICER'] },
            { title: 'Reports', href: '/reports', icon: BarChart3, roles: ['tenant_owner', 'ADMIN', 'FINANCE_ADMIN', 'VIEWER'] },
        ],
    },
    {
        label: 'System',
        items: [
            { title: 'Settings', href: '/settings', icon: Settings, roles: ['tenant_owner', 'ADMIN'] },
            { title: 'Audit Logs', href: '/audit-logs', icon: Shield, roles: ['tenant_owner', 'ADMIN', 'FINANCE_ADMIN'] },
        ],
    },
];

/** The filter both sidebars share: role gate, then org-type gate (fail closed). */
export function filterNavigation(
    hasRole: (roles: string[]) => boolean,
    tenantOrgType: string | null,
): NavGroup[] {
    return navigation
        .map((group) => ({
            ...group,
            items: group.items.filter(
                (item) =>
                    (!item.roles || hasRole(item.roles)) &&
                    (!item.orgTypes ||
                        (tenantOrgType !== null &&
                            item.orgTypes.includes(tenantOrgType))),
            ),
        }))
        .filter((group) => group.items.length > 0);
}
