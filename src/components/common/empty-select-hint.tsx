'use client';

import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

/**
 * What a dropdown says when there is nothing to choose.
 *
 * An empty `<SelectContent>` renders an empty box. To somebody using the
 * system that does not read as "nothing has been set up yet" — it reads as a
 * control that does not work, which is exactly how the first school to use this
 * described the Grade selector: *"To Select grade level did not click."*
 *
 * So the empty state names the thing that is missing and links to where it is
 * created. Rendered inside the dropdown rather than beside it, because that is
 * where somebody is looking at the moment they discover the problem.
 *
 * Distinct from `PrerequisiteNotice`, which belongs at the top of a form and
 * says "you cannot proceed without this". Use that when the field is required
 * and the form is a dead end; use this when the list is merely empty — an
 * optional field, or a narrower case the banner does not cover, such as a
 * department that happens to have no roles in it.
 */
export function EmptySelectHint({
    what,
    href,
    action,
}: {
    /** What is missing, in the words on the screen: "grades", "class levels". */
    what: string;
    /** Where they are created. */
    href: string;
    /** The link text — the menu item they are looking for. */
    action: string;
}) {
    return (
        <div className="px-2 py-3 text-sm">
            <p className="text-muted-foreground">No {what} yet.</p>
            <Link
                href={href}
                className="mt-1 inline-flex items-center gap-1 font-medium text-primary hover:underline"
            >
                {action}
                <ArrowRight className="h-3 w-3" />
            </Link>
        </div>
    );
}
