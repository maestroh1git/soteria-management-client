'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { useAuth } from '@/lib/hooks/use-auth';
import { useUIStore } from '@/stores/ui-store';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
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
    type LucideIcon,
} from 'lucide-react';

interface NavItem {
    title: string;
    href: string;
    icon: LucideIcon;
    roles?: string[];
}

interface NavGroup {
    label: string;
    items: NavItem[];
}

const navigation: NavGroup[] = [
    {
        label: 'Overview',
        items: [{ title: 'Dashboard', href: '/', icon: LayoutDashboard }],
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
        items: [{ title: 'Settings', href: '/settings', icon: Settings, roles: ['tenant_owner', 'ADMIN'] }],
    },
];

export function MobileSidebar() {
    const pathname = usePathname();
    const { hasRole } = useAuth();
    const { mobileSidebarOpen, setMobileSidebarOpen } = useUIStore();

    const filteredNavigation = navigation
        .map((group) => ({
            ...group,
            items: group.items.filter(
                (item) => !item.roles || hasRole(item.roles),
            ),
        }))
        .filter((group) => group.items.length > 0);

    return (
        <Sheet open={mobileSidebarOpen} onOpenChange={setMobileSidebarOpen}>
            <SheetContent side="left" className="p-0 w-72">
                <SheetHeader className="px-4 pt-4 pb-2">
                    <SheetTitle className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center">
                            <span className="text-white font-bold text-sm">S</span>
                        </div>
                        <span>School Payroll</span>
                    </SheetTitle>
                </SheetHeader>
                <ScrollArea className="flex-1 px-3 py-4">
                    <nav className="space-y-6">
                        {filteredNavigation.map((group) => (
                            <div key={group.label}>
                                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 px-3">
                                    {group.label}
                                </p>
                                <div className="space-y-1">
                                    {group.items.map((item) => {
                                        const isActive =
                                            pathname === item.href ||
                                            (item.href !== '/' && pathname.startsWith(item.href));
                                        return (
                                            <Link
                                                key={item.href}
                                                href={item.href}
                                                onClick={() => setMobileSidebarOpen(false)}
                                                className={cn(
                                                    'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                                                    isActive
                                                        ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-400'
                                                        : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-900',
                                                )}
                                            >
                                                <item.icon className="h-4 w-4 flex-shrink-0" />
                                                <span>{item.title}</span>
                                            </Link>
                                        );
                                    })}
                                </div>
                                <Separator className="mt-4" />
                            </div>
                        ))}
                    </nav>
                </ScrollArea>
            </SheetContent>
        </Sheet>
    );
}
