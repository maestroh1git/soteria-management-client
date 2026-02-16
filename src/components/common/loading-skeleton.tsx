'use client';

import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

interface LoadingSkeletonProps {
    variant?: 'table' | 'card' | 'form' | 'detail';
    rows?: number;
    className?: string;
}

export function LoadingSkeleton({
    variant = 'table',
    rows = 5,
    className,
}: LoadingSkeletonProps) {
    if (variant === 'card') {
        return (
            <div className={cn('grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4', className)}>
                {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="rounded-lg border p-6 space-y-3">
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-8 w-32" />
                        <Skeleton className="h-3 w-20" />
                    </div>
                ))}
            </div>
        );
    }

    if (variant === 'form') {
        return (
            <div className={cn('space-y-6', className)}>
                {Array.from({ length: rows }).map((_, i) => (
                    <div key={i} className="space-y-2">
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-10 w-full" />
                    </div>
                ))}
            </div>
        );
    }

    if (variant === 'detail') {
        return (
            <div className={cn('space-y-6', className)}>
                <div className="flex items-center gap-4">
                    <Skeleton className="h-12 w-12 rounded-full" />
                    <div className="space-y-2">
                        <Skeleton className="h-5 w-48" />
                        <Skeleton className="h-4 w-32" />
                    </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                    {Array.from({ length: 6 }).map((_, i) => (
                        <div key={i} className="space-y-2">
                            <Skeleton className="h-4 w-20" />
                            <Skeleton className="h-5 w-36" />
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    // Table variant (default)
    return (
        <div className={cn('space-y-3', className)}>
            {/* Header row */}
            <div className="flex items-center gap-4 pb-2 border-b">
                {Array.from({ length: 5 }).map((_, i) => (
                    <Skeleton key={i} className="h-4 flex-1" />
                ))}
            </div>
            {/* Data rows */}
            {Array.from({ length: rows }).map((_, i) => (
                <div key={i} className="flex items-center gap-4 py-2">
                    {Array.from({ length: 5 }).map((_, j) => (
                        <Skeleton key={j} className="h-5 flex-1" />
                    ))}
                </div>
            ))}
        </div>
    );
}
