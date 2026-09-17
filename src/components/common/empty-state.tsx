'use client';

import { cn } from '@/lib/utils';
import { type LucideIcon, AlertTriangle, FileX } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface EmptyStateProps {
    icon?: LucideIcon;
    title: string;
    description?: string;
    actionLabel?: string;
    onAction?: () => void;
    className?: string;
    /**
     * The request failed. Render that instead of the emptiness.
     *
     * A list that could not be fetched is not an empty list. "No invoices yet"
     * on a failed request tells a school something false about its own books,
     * and a signed-out session renders exactly that on every page at once —
     * which is how this was first found, on the awards feed.
     */
    isError?: boolean;
    /**
     * What could not be loaded, for the error wording: `subject="the invoices"`
     * reads as "We couldn't load the invoices". Worth setting where a page
     * shows several lists and "this" would not say which.
     */
    subject?: string;
}

export function EmptyState({
    icon: Icon = FileX,
    title,
    description,
    actionLabel,
    onAction,
    className,
    isError,
    subject,
}: EmptyStateProps) {
    if (isError) {
        Icon = AlertTriangle;
        title = `We couldn't load ${subject ?? 'this'}`;
        description =
            'Please try again in a moment. If it keeps happening, you may have been signed out.';
        // Deliberately no action. "Add the first one" is advice we cannot give
        // when we do not know whether there is a first one.
        actionLabel = undefined;
    }

    return (
        <div
            className={cn(
                'flex flex-col items-center justify-center py-12 px-4 text-center',
                className,
            )}
        >
            <div className="rounded-full bg-muted p-4 mb-4">
                <Icon className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-1">{title}</h3>
            {description && (
                <p className="text-sm text-muted-foreground mb-4 max-w-sm">
                    {description}
                </p>
            )}
            {actionLabel && onAction && (
                <Button onClick={onAction} size="sm">
                    {actionLabel}
                </Button>
            )}
        </div>
    );
}
