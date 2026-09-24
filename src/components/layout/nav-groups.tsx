'use client';

import { useEffect, useSyncExternalStore } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useUIStore } from '@/stores/ui-store';
import { Separator } from '@/components/ui/separator';
import type { NavGroup } from './nav-config';

/**
 * The one link the current page belongs to: the longest href the path starts
 * with. Matching any prefix lit two links at once — Fees and Invoices on
 * /fees/invoices, My Pay (/me) and My Classes on /me/classes.
 */
export function activeHrefFor(pathname: string, groups: NavGroup[]): string | null {
    let best: string | null = null;
    for (const g of groups) {
        for (const { href } of g.items) {
            const match =
                pathname === href || (href !== '/' && pathname.startsWith(`${href}/`));
            if (match && (!best || href.length > best.length)) best = href;
        }
    }
    return best;
}

/**
 * The sidebar's sections, for the desktop rail and the mobile drawer alike.
 *
 * Each section heading folds its section away; the browser remembers which
 * (ui-store `collapsedNavGroups`). Arriving on a page opens the section it is
 * in, so the way you came is never hidden — fold it again if you like.
 *
 * `rail`: the collapsed desktop rail, icons only. There is no room for
 * headings, so sections are separated by a rule and always open.
 */
export function NavGroups({
    groups,
    rail = false,
    onNavigate,
}: {
    groups: NavGroup[];
    rail?: boolean;
    onNavigate?: () => void;
}) {
    const pathname = usePathname();
    const { collapsedNavGroups, toggleNavGroup, expandNavGroup } = useUIStore();
    const activeHref = activeHrefFor(pathname, groups);
    const activeGroup = groups.find((g) => g.items.some((i) => i.href === activeHref))?.label;

    // Wait for the saved folds to load (the store rehydrates after the first
    // render), or they would fold the section we just opened for this page.
    const restored = useSyncExternalStore(
        (notify) => useUIStore.persist.onFinishHydration(notify),
        () => useUIStore.persist.hasHydrated(),
        () => false,
    );

    useEffect(() => {
        if (restored && activeGroup) expandNavGroup(activeGroup);
    }, [restored, activeGroup, expandNavGroup]);

    return (
        <nav className={rail ? 'space-y-2' : 'space-y-4'} aria-label="Main">
            {groups.map((group) => {
                const id = `nav-group-${group.label.toLowerCase().replace(/\W+/g, '-')}`;
                const open = rail || !collapsedNavGroups.includes(group.label);
                const holdsActive = group.label === activeGroup;
                return (
                    <div key={group.label}>
                        {rail ? (
                            <Separator className="mb-2" />
                        ) : (
                            <button
                                type="button"
                                onClick={() => toggleNavGroup(group.label)}
                                aria-expanded={open}
                                aria-controls={id}
                                className="mb-1 flex w-full items-center justify-between rounded-md px-3 py-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground hover:bg-slate-100 hover:text-foreground dark:hover:bg-slate-900"
                            >
                                <span className="flex items-center gap-2">
                                    {group.label}
                                    {/* Folded with the current page inside: say so. */}
                                    {!open && holdsActive && (
                                        <span
                                            className="h-1.5 w-1.5 rounded-full bg-blue-600"
                                            aria-label="(current page)"
                                        />
                                    )}
                                </span>
                                <ChevronDown
                                    className={cn(
                                        'h-3.5 w-3.5 transition-transform',
                                        !open && '-rotate-90',
                                    )}
                                    aria-hidden
                                />
                            </button>
                        )}
                        <div id={id} hidden={!open} className="space-y-1">
                            {group.items.map((item) => {
                                const isActive = item.href === activeHref;
                                return (
                                    <Link
                                        key={item.href}
                                        href={item.href}
                                        onClick={onNavigate}
                                        aria-current={isActive ? 'page' : undefined}
                                        title={rail ? item.title : undefined}
                                        className={cn(
                                            'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                                            isActive
                                                ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-400'
                                                : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-900',
                                            rail && 'justify-center px-2',
                                        )}
                                    >
                                        <item.icon className="h-4 w-4 flex-shrink-0" />
                                        {rail ? (
                                            <span className="sr-only">{item.title}</span>
                                        ) : (
                                            <span>{item.title}</span>
                                        )}
                                    </Link>
                                );
                            })}
                        </div>
                    </div>
                );
            })}
        </nav>
    );
}
