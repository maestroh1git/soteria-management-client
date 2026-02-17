import { LoadingSkeleton } from '@/components/common/loading-skeleton';

export default function PayrollLoading() {
    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="h-8 w-40 rounded bg-muted animate-pulse" />
                <div className="h-10 w-36 rounded bg-muted animate-pulse" />
            </div>
            {/* Stat cards */}
            <LoadingSkeleton variant="card" />
            {/* Table */}
            <LoadingSkeleton variant="table" rows={8} />
        </div>
    );
}
