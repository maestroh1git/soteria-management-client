'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronRight } from 'lucide-react';
import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { sectionFor } from './nav-config';

export interface Crumb {
    label: string;
    href?: string;
}

interface PageHeaderProps {
    title: ReactNode;
    description?: ReactNode;
    /** Beside the title: a status, a count. */
    badge?: ReactNode;
    /** The page's own buttons, right-aligned (stacked under 640px). */
    actions?: ReactNode;
    /**
     * The trail between the section and this page, for records and nested
     * screens: `[{ label: 'Loans', href: '/loans' }]` is implied by the path;
     * pass what comes after it. Omit on a section's own page.
     */
    crumbs?: Crumb[];
    className?: string;
}

/**
 * The top of every screen (ROADMAP-EXECUTION.md, C3.1): where you are, what
 * this is, and what you can do here.
 *
 * Replaces seven heading styles across 66 headings and the ad hoc back arrows.
 * On a nested page the trail starts from the sidebar's own name for the
 * section, so the way back reads the same as the way in.
 */
export function PageHeader({
    title,
    description,
    badge,
    actions,
    crumbs,
    className,
}: PageHeaderProps) {
    const pathname = usePathname();
    const section = sectionFor(pathname);
    const nested = !!section && pathname !== section.href;
    // Inside the app, the trail starts from the sidebar's section. Outside it
    // (the parent portal, the platform console), the page's own crumbs are
    // the whole trail.
    const trail: Crumb[] =
        nested && section
            ? [{ label: section.title, href: section.href }, ...(crumbs ?? [])]
            : !section
              ? (crumbs ?? [])
              : [];

    return (
        <div className={cn('space-y-2', className)}>
            {trail.length > 0 && <Breadcrumbs trail={trail} />}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-3">
                        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
                            {title}
                        </h1>
                        {badge}
                    </div>
                    {description && (
                        <p className="mt-1 text-muted-foreground">{description}</p>
                    )}
                </div>
                {actions && (
                    <div className="flex flex-wrap items-center gap-2">{actions}</div>
                )}
            </div>
        </div>
    );
}

export function Breadcrumbs({ trail }: { trail: Crumb[] }) {
    return (
        <nav aria-label="Breadcrumb">
            <ol className="flex flex-wrap items-center gap-1 text-sm text-muted-foreground">
                {trail.map((c, i) => (
                    <li key={`${c.label}-${i}`} className="flex items-center gap-1">
                        {i > 0 && <ChevronRight className="h-3.5 w-3.5" aria-hidden />}
                        {c.href ? (
                            <Link href={c.href} className="hover:text-foreground hover:underline">
                                {c.label}
                            </Link>
                        ) : (
                            <span>{c.label}</span>
                        )}
                    </li>
                ))}
            </ol>
        </nav>
    );
}
