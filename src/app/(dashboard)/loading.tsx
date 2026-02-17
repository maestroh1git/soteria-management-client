import { LoadingSkeleton } from '@/components/common/loading-skeleton';

export default function DashboardLoading() {
    return (
        <div className="space-y-6">
            <div className="space-y-2">
                <div className="h-8 w-48 rounded bg-muted animate-pulse" />
                <div className="h-4 w-72 rounded bg-muted animate-pulse" />
            </div>
            <div className="grid gap-4 md:grid-cols-4">
                {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="rounded-lg border bg-card p-6 space-y-2">
                        <div className="h-4 w-24 rounded bg-muted animate-pulse" />
                        <div className="h-7 w-16 rounded bg-muted animate-pulse" />
                    </div>
                ))}
            </div>
            <LoadingSkeleton rows={6} />
        </div>
    );
}
