'use client';

import Link from 'next/link';
import { PageHeader } from '@/components/layout/page-header';
import { useSetupSections } from './use-setup-sections';

/**
 * Setup: one door to the organisation, its structure, pay rules and the
 * school year. Sections this person may not open are not shown; a section
 * with nothing left in it disappears.
 */
export function SetupScreen() {
    const sections = useSetupSections();

    return (
        <div className="space-y-8">
            <PageHeader
                title="Setup"
                description="Things you set once and change rarely: the organisation, its structure, pay rules and the school year."
            />
            {sections.map((section) => (
                <section key={section.title} aria-labelledby={`setup-${section.title}`}>
                    <h2
                        id={`setup-${section.title}`}
                        className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground"
                    >
                        {section.title}
                    </h2>
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                        {section.links.map((l) => (
                            <Link
                                key={l.href}
                                href={l.href}
                                data-setup-link
                                className="group flex gap-3 rounded-lg border bg-card p-4 transition-colors hover:border-primary/50 hover:bg-muted/40"
                            >
                                <l.icon className="mt-0.5 h-5 w-5 shrink-0 text-muted-foreground group-hover:text-primary" />
                                <span>
                                    <span className="block font-medium">{l.title}</span>
                                    <span className="mt-0.5 block text-sm text-muted-foreground">
                                        {l.description}
                                    </span>
                                </span>
                            </Link>
                        ))}
                    </div>
                </section>
            ))}
        </div>
    );
}
