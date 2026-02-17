'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import {
    Calculator,
    Calendar,
    CreditCard,
    Settings,
    Smile,
    User,
    Users,
    Briefcase,
    Building2,
    FileText,
    BarChart3,
    Receipt,
    LayoutDashboard,
} from 'lucide-react';

import {
    CommandDialog,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
    CommandSeparator,
} from '@/components/ui/command';
import { useTheme } from 'next-themes';

export function CommandMenu() {
    const [open, setOpen] = React.useState(false);
    const router = useRouter();
    const { setTheme } = useTheme();

    React.useEffect(() => {
        const down = (e: KeyboardEvent) => {
            if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                setOpen((open) => !open);
            }
        };

        document.addEventListener('keydown', down);
        return () => document.removeEventListener('keydown', down);
    }, []);

    const runCommand = React.useCallback((command: () => void) => {
        setOpen(false);
        command();
    }, []);

    return (
        <CommandDialog open={open} onOpenChange={setOpen}>
            <CommandInput placeholder="Type a command or search..." />
            <CommandList>
                <CommandEmpty>No results found.</CommandEmpty>
                <CommandGroup heading="Suggestions">
                    <CommandItem onSelect={() => runCommand(() => router.push('/'))}>
                        <LayoutDashboard className="mr-2 h-4 w-4" />
                        <span>Dashboard</span>
                    </CommandItem>
                    <CommandItem onSelect={() => runCommand(() => router.push('/payroll'))}>
                        <Calculator className="mr-2 h-4 w-4" />
                        <span>Payroll</span>
                    </CommandItem>
                    <CommandItem onSelect={() => runCommand(() => router.push('/employees'))}>
                        <Users className="mr-2 h-4 w-4" />
                        <span>Employees</span>
                    </CommandItem>
                </CommandGroup>
                <CommandSeparator />
                <CommandGroup heading="Finance">
                    <CommandItem onSelect={() => runCommand(() => router.push('/payroll'))}>
                        <Calculator className="mr-2 h-4 w-4" />
                        <span>Payroll</span>
                    </CommandItem>
                    <CommandItem onSelect={() => runCommand(() => router.push('/salary-components'))}>
                        <CreditCard className="mr-2 h-4 w-4" />
                        <span>Salary Components</span>
                    </CommandItem>
                    <CommandItem onSelect={() => runCommand(() => router.push('/loans'))}>
                        <Receipt className="mr-2 h-4 w-4" />
                        <span>Loans</span>
                    </CommandItem>
                    <CommandItem onSelect={() => runCommand(() => router.push('/tax-rules'))}>
                        <FileText className="mr-2 h-4 w-4" />
                        <span>Tax Rules</span>
                    </CommandItem>
                </CommandGroup>
                <CommandGroup heading="People">
                    <CommandItem onSelect={() => runCommand(() => router.push('/employees'))}>
                        <Users className="mr-2 h-4 w-4" />
                        <span>Employees</span>
                    </CommandItem>
                    <CommandItem onSelect={() => runCommand(() => router.push('/roles'))}>
                        <Briefcase className="mr-2 h-4 w-4" />
                        <span>Roles</span>
                    </CommandItem>
                    <CommandItem onSelect={() => runCommand(() => router.push('/departments'))}>
                        <Building2 className="mr-2 h-4 w-4" />
                        <span>Departments</span>
                    </CommandItem>
                </CommandGroup>
                <CommandGroup heading="Reporting">
                    <CommandItem onSelect={() => runCommand(() => router.push('/payslips'))}>
                        <FileText className="mr-2 h-4 w-4" />
                        <span>Payslips</span>
                    </CommandItem>
                    <CommandItem onSelect={() => runCommand(() => router.push('/reports'))}>
                        <BarChart3 className="mr-2 h-4 w-4" />
                        <span>Reports</span>
                    </CommandItem>
                </CommandGroup>
                <CommandSeparator />
                <CommandGroup heading="Settings">
                    <CommandItem onSelect={() => runCommand(() => router.push('/settings'))}>
                        <Settings className="mr-2 h-4 w-4" />
                        <span>Settings</span>
                    </CommandItem>
                </CommandGroup>
                <CommandGroup heading="Theme">
                    <CommandItem onSelect={() => runCommand(() => setTheme('light'))}>
                        <Smile className="mr-2 h-4 w-4" />
                        <span>Light Mode</span>
                    </CommandItem>
                    <CommandItem onSelect={() => runCommand(() => setTheme('dark'))}>
                        <Smile className="mr-2 h-4 w-4" />
                        <span>Dark Mode</span>
                    </CommandItem>
                    <CommandItem onSelect={() => runCommand(() => setTheme('system'))}>
                        <Smile className="mr-2 h-4 w-4" />
                        <span>System Mode</span>
                    </CommandItem>
                </CommandGroup>
            </CommandList>
        </CommandDialog>
    );
}
