'use client';

import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { KybStatus } from '@/lib/types/enums';

const KYB_STYLES: Record<KybStatus, { label: string; className: string }> = {
  [KybStatus.PENDING]: {
    label: 'Pending',
    className: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
  },
  [KybStatus.SUBMITTED]: {
    label: 'Awaiting Review',
    className: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  },
  [KybStatus.VERIFIED]: {
    label: 'Verified',
    className: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  },
  [KybStatus.REJECTED]: {
    label: 'Rejected',
    className: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  },
};

export function KybBadge({
  status,
  className,
}: {
  status: KybStatus;
  className?: string;
}) {
  const style = KYB_STYLES[status] ?? KYB_STYLES[KybStatus.PENDING];
  return (
    <Badge
      variant="secondary"
      className={cn(
        'font-medium text-xs px-2.5 py-0.5 rounded-full border-0',
        style.className,
        className,
      )}
    >
      {style.label}
    </Badge>
  );
}
