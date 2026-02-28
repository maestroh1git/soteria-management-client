'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useAuth } from '@/lib/hooks/use-auth';
import { useUIStore } from '@/stores/ui-store';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
    LayoutDashboard,
    Users,
    Briefcase,
    Building2,
    Calculator,
    CreditCard,
    Receipt,
    FileText,
    BarChart3,
    Settings,
    ChevronLeft,
    ChevronRight,
    type LucideIcon,
} from 'lucide-react';

interface NavItem {
    title: string;
    href: string;
    icon: LucideIcon;
    badge?: string;
    roles?: string[];
}

interface NavGroup {
    label: string;
    items: NavItem[];
}

const navigation: NavGroup[] = [
    {
        label: 'Overview',
        items: [
            { title: 'Dashboard', href: '/', icon: LayoutDashboard },
        ],
    },
    {
        label: 'People',
        items: [
            { title: 'Employees', href: '/employees', icon: Users, roles: ['tenant_owner', 'ADMIN', 'PAYROLL_OFFICER', 'VIEWER'] },
            { title: 'Roles', href: '/roles', icon: Briefcase, roles: ['tenant_owner', 'ADMIN'] },
            { title: 'Departments', href: '/departments', icon: Building2, roles: ['tenant_owner', 'ADMIN'] },
        ],
    },
    {
        label: 'Finance',
        items: [
            { title: 'Payroll', href: '/payroll', icon: Calculator, roles: ['tenant_owner', 'ADMIN', 'PAYROLL_OFFICER', 'FINANCE_ADMIN', 'APPROVER'] },
            { title: 'Salary Components', href: '/salary-components', icon: CreditCard, roles: ['tenant_owner', 'ADMIN', 'PAYROLL_OFFICER'] },
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
        ],
    },
];

const ORG_TYPE_LABEL: Record<string, string> = {
    SCHOOL: 'School Payroll',
    HOSPITAL: 'Hospital Payroll',
    CORPORATE: 'Corporate Payroll',
    NGO: 'NGO Payroll',
    GOVERNMENT: 'Government Payroll',
    NONPROFIT: 'Nonprofit Payroll',
    HOSPITALITY: 'Hospitality Payroll',
    OTHER: 'Payroll System',
};

export function Sidebar() {
    const pathname = usePathname();
    const { tenantName, tenantOrgType, hasRole } = useAuth();
    const { sidebarCollapsed, toggleSidebar } = useUIStore();

    const orgSubtitle = tenantOrgType ? (ORG_TYPE_LABEL[tenantOrgType] ?? 'Payroll System') : 'Payroll System';

    // Filter navigation items based on user roles
    const filteredNavigation = navigation
        .map((group) => ({
            ...group,
            items: group.items.filter(
                (item) => !item.roles || hasRole(item.roles),
            ),
        }))
        .filter((group) => group.items.length > 0);

    return (
        <aside
            className={cn(
                'hidden lg:flex flex-col border-r bg-white dark:bg-slate-950 transition-all duration-300 ease-in-out',
                sidebarCollapsed ? 'w-[68px]' : 'w-64',
            )}
        >
            {/* Logo area */}
            <div
                className={cn(
                    'flex items-center h-16 px-4 border-b',
                    sidebarCollapsed ? 'justify-center' : 'gap-3',
                )}
            >
                <div className="flex-shrink-0 w-9 h-9 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center">
                    <span className="text-white font-bold text-sm">S</span>
                </div>
                {!sidebarCollapsed && (
                    <div className="min-w-0">
                        <p className="text-sm font-semibold truncate">{tenantName}</p>
                        <p className="text-xs text-muted-foreground">{orgSubtitle}</p>
                    </div>
                )}
            </div>

            {/* Navigation */}
            <ScrollArea className="flex-1 px-3 py-4">
                <nav className="space-y-6">
                    {filteredNavigation.map((group) => (
                        <div key={group.label}>
                            {!sidebarCollapsed && (
                                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 px-3">
                                    {group.label}
                                </p>
                            )}
                            {sidebarCollapsed && <Separator className="mb-2" />}
                            <div className="space-y-1">
                                {group.items.map((item) => {
                                    const isActive =
                                        pathname === item.href ||
                                        (item.href !== '/' && pathname.startsWith(item.href));

                                    return (
                                        <Link
                                            key={item.href}
                                            href={item.href}
                                            className={cn(
                                                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                                                isActive
                                                    ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-400'
                                                    : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-900',
                                                sidebarCollapsed && 'justify-center px-2',
                                            )}
                                            title={sidebarCollapsed ? item.title : undefined}
                                        >
                                            <item.icon className="h-4 w-4 flex-shrink-0" />
                                            {!sidebarCollapsed && <span>{item.title}</span>}
                                        </Link>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </nav>
            </ScrollArea>

            {/* Collapse toggle */}
            <div className="border-t p-3">
                <button
                    onClick={toggleSidebar}
                    className="flex items-center justify-center w-full rounded-lg py-2 text-sm text-muted-foreground hover:bg-slate-100 dark:hover:bg-slate-900 transition-colors"
                >
                    {sidebarCollapsed ? (
                        <ChevronRight className="h-4 w-4" />
                    ) : (
                        <>
                            <ChevronLeft className="h-4 w-4 mr-2" />
                            <span>Collapse</span>
                        </>
                    )}
                </button>
            </div>
        </aside>
    );
}
