import type { ReactNode } from 'react';

/**
 * Shared chrome for the policy pages.
 *
 * Deliberately plain: these are read on a phone, often in a hurry, sometimes by
 * somebody deciding whether to trust the school with their child's medical
 * record. Prose width, real headings, no cards.
 */
export function LegalDocument({
    title,
    updated,
    intro,
    children,
}: {
    title: string;
    updated: string;
    intro: string;
    children: ReactNode;
}) {
    return (
        <article className="space-y-8">
            <header className="space-y-3">
                <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
                <p className="text-sm text-muted-foreground">
                    Last updated {updated}
                </p>
                <p className="text-base leading-relaxed">{intro}</p>
            </header>
            <div className="space-y-8">{children}</div>
        </article>
    );
}

export function Section({
    title,
    children,
}: {
    title: string;
    children: ReactNode;
}) {
    return (
        <section className="space-y-3">
            <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
            <div className="space-y-3 text-sm leading-relaxed text-muted-foreground [&_li]:ml-4 [&_li]:list-disc [&_strong]:text-foreground [&_ul]:space-y-1.5">
                {children}
            </div>
        </section>
    );
}

/**
 * Something only the operator can supply, left visible on the page on purpose.
 *
 * A policy that is obviously unfinished is safer than one that reads as
 * complete and is wrong about who the data controller is or where the data
 * lives. These must all be filled in, and the document reviewed by a
 * practitioner, before the service is offered to a school.
 */
export function Placeholder({ children }: { children: ReactNode }) {
    return (
        <mark className="rounded bg-amber-200 px-1 py-0.5 font-medium text-amber-950 dark:bg-amber-500/25 dark:text-amber-200">
            [{children}]
        </mark>
    );
}
