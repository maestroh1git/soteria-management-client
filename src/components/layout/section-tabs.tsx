'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/lib/hooks/use-auth';

export interface SectionTab {
    title: string;
    href: string;
    icon?: LucideIcon;
}

/**
 * The tabs across the top of a hub (Fees; later the pay run and the record
 * hubs). Each tab is its own page, so links, refresh and back all work, and
 * each admits whom its route admits: tabs this person may not open are not
 * shown. The current tab is the longest href the path starts with.
 */
export function SectionTabs({ tabs, label }: { tabs: SectionTab[]; label: string }) {
    const pathname = usePathname();
    const { mayReach } = useAuth();
    const shown = tabs.filter((t) => mayReach(t.href));
    const current = shown
        .filter((t) => pathname === t.href || pathname.startsWith(`${t.href}/`))
        .sort((a, b) => b.href.length - a.href.length)[0]?.href;

    if (shown.length < 2) return null;
    return (
        <nav aria-label={label} data-subnav className="-mx-4 overflow-x-auto border-b px-4 md:mx-0 md:px-0">
            <ul className="flex min-w-max gap-1">
                {shown.map((t) => {
                    const active = t.href === current;
                    return (
                        <li key={t.href}>
                            <Link
                                href={t.href}
                                aria-current={active ? 'page' : undefined}
                                className={cn(
                                    'flex items-center gap-2 border-b-2 px-3 py-2 text-sm font-medium transition-colors',
                                    active
                                        ? 'border-primary text-foreground'
                                        : 'border-transparent text-muted-foreground hover:text-foreground',
                                )}
                            >
                                {t.icon && <t.icon className="h-4 w-4" aria-hidden />}
                                {t.title}
                            </Link>
                        </li>
                    );
                })}
            </ul>
        </nav>
    );
}
