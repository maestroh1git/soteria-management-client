import { LoadingSkeleton } from '@/components/common/loading-skeleton';

export default function SettingsLoading() {
    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="h-8 w-36 rounded bg-muted animate-pulse" />
            {/* Tab bar */}
            <div className="flex gap-2 border-b pb-2">
                {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="h-9 w-28 rounded bg-muted animate-pulse" />
                ))}
            </div>
            {/* Card grid */}
            <LoadingSkeleton variant="card" />
        </div>
    );
}
