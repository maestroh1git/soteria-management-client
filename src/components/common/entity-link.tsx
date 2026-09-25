'use client';

import Link from 'next/link';
import type { MouseEvent, ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { listName } from '@/lib/utils/names';
import { useAuth } from '@/lib/hooks/use-auth';
import { useSession } from '@/lib/hooks/use-session';

interface EntityLinkProps {
    href: string;
    children: ReactNode;
    className?: string;
}

/**
 * A record's name that opens the record — when this person can open it
 * (ROADMAP-EXECUTION.md, C3.4).
 *
 * Names were plain text almost everywhere: a loan named its borrower and gave
 * no way to reach them. Where a person may not open the record the name stays
 * plain text rather than a link the middleware would refuse; the test is the
 * middleware's own (the route manifest), so the two cannot disagree.
 *
 * Safe inside a clickable row: the click opens the link and not the row.
 */
export function EntityLink({ href, children, className }: EntityLinkProps) {
    const { mayReach } = useAuth();
    if (!mayReach(href)) return <span className={className}>{children}</span>;
    return (
        <Link
            href={href}
            onClick={(e: MouseEvent) => e.stopPropagation()}
            className={cn('font-medium hover:underline underline-offset-2', className)}
        >
            {children}
        </Link>
    );
}

type Named = { firstName?: string | null; lastName?: string | null } | null | undefined;
// People are linked from lists, so the embedded record reads as a list does:
// "Adeyemi, Tobi" (lib/utils/names). Pass `name` to write it otherwise.
const nameOf = (p: Named, fallback = '—') => listName(p, fallback);

/** A member of staff. `employee` may be the embedded record or just a name. */
export function EmployeeLink({
    id,
    employee,
    name,
    className,
}: {
    id: string;
    employee?: Named;
    name?: string;
    className?: string;
}) {
    return (
        <EntityLink href={`/employees/${id}`} className={className}>
            {name ?? nameOf(employee, id.slice(0, 8))}
        </EntityLink>
    );
}

/** A pupil. */
export function StudentLink({
    id,
    student,
    name,
    className,
}: {
    id: string;
    student?: Named;
    name?: string;
    className?: string;
}) {
    return (
        <EntityLink href={`/students/${id}`} className={className}>
            {name ?? nameOf(student)}
        </EntityLink>
    );
}

/** A fee invoice, by its number. */
export function InvoiceLink({
    id,
    number,
    className,
}: {
    id: string;
    number: string;
    className?: string;
}) {
    return (
        <EntityLink href={`/fees/invoices/${id}`} className={className}>
            {number}
        </EntityLink>
    );
}

/**
 * A class arm. The office opens it under Classes; the class's own form
 * teacher, who may hold no office role at all, opens it under My Classes.
 */
export function ClassLink({
    armId,
    name,
    className,
}: {
    armId: string;
    name: string;
    className?: string;
}) {
    const { mayReach } = useAuth();
    const { data: session } = useSession();
    const office = `/classes/${armId}`;
    const own = session?.identity.formTeacherOf.includes(armId)
        ? `/me/classes/${armId}`
        : null;
    return (
        <EntityLink href={mayReach(office) || !own ? office : own} className={className}>
            {name}
        </EntityLink>
    );
}
