'use client';

import { useEffect } from 'react';
import { AlertCircle, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function ReportsError({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        console.error('Reports error:', error);
    }, [error]);

    return (
        <div className="flex flex-col items-center justify-center gap-4 py-20">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
                <AlertCircle className="h-8 w-8 text-destructive" />
            </div>
            <div className="text-center space-y-2">
                <h2 className="text-xl font-semibold">Failed to load reports</h2>
                <p className="text-sm text-muted-foreground max-w-md">
                    {error.message || 'An unexpected error occurred. Please try again.'}
                </p>
            </div>
            <Button onClick={reset} variant="outline">
                <RotateCcw className="mr-2 h-4 w-4" />
                Try again
            </Button>
        </div>
    );
}
