'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Monitor, Moon, Sun } from 'lucide-react';

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
import { useAuth } from '@/lib/hooks/use-auth';
import { filterNavigation } from '@/components/layout/nav-config';
import { useLearnerTerm } from '@/lib/hooks/use-learner-term';

/**
 * ⌘K. Built from the sidebar's own list and filter, so it offers exactly the
 * pages the sidebar does for this person.
 *
 * It used to be a hand-written list of twelve payroll-era pages, shown to
 * everyone: no school, finance or self-service pages, and a teacher who used it
 * landed on "unauthorized" (system map, finding A7).
 */
export function CommandMenu() {
    const [open, setOpen] = React.useState(false);
    const router = useRouter();
    const { setTheme } = useTheme();
    const { mayReach, tenantOrgType } = useAuth();
    const { word: learnerWord } = useLearnerTerm();
    const groups = filterNavigation(mayReach, tenantOrgType, learnerWord({ plural: true, capital: true }));

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
            <CommandInput placeholder="Go to a page…" />
            <CommandList>
                <CommandEmpty>No page by that name.</CommandEmpty>
                {groups.map((group) => (
                    <CommandGroup key={group.label} heading={group.label}>
                        {group.items.map((item) => (
                            <CommandItem
                                key={item.href}
                                value={`${group.label} ${item.title}`}
                                onSelect={() => runCommand(() => router.push(item.href))}
                            >
                                <item.icon className="mr-2 h-4 w-4" />
                                <span>{item.title}</span>
                            </CommandItem>
                        ))}
                    </CommandGroup>
                ))}
                <CommandSeparator />
                <CommandGroup heading="Theme">
                    <CommandItem onSelect={() => runCommand(() => setTheme('light'))}>
                        <Sun className="mr-2 h-4 w-4" />
                        <span>Light mode</span>
                    </CommandItem>
                    <CommandItem onSelect={() => runCommand(() => setTheme('dark'))}>
                        <Moon className="mr-2 h-4 w-4" />
                        <span>Dark mode</span>
                    </CommandItem>
                    <CommandItem onSelect={() => runCommand(() => setTheme('system'))}>
                        <Monitor className="mr-2 h-4 w-4" />
                        <span>Match my system</span>
                    </CommandItem>
                </CommandGroup>
            </CommandList>
        </CommandDialog>
    );
}
