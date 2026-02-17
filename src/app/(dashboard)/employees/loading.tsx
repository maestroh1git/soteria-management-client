import { LoadingSkeleton } from '@/components/common/loading-skeleton';

export default function EmployeesLoading() {
    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="h-8 w-40 rounded bg-muted animate-pulse" />
                <div className="h-10 w-36 rounded bg-muted animate-pulse" />
            </div>
            {/* Filter bar */}
            <div className="flex gap-3">
                <div className="h-10 w-64 rounded bg-muted animate-pulse" />
                <div className="h-10 w-36 rounded bg-muted animate-pulse" />
                <div className="h-10 w-36 rounded bg-muted animate-pulse" />
            </div>
            {/* Table */}
            <LoadingSkeleton variant="table" rows={8} />
        </div>
    );
}
