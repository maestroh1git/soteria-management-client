'use client';

import { KybStatus } from '@/lib/types/enums';
import { StatusBadge } from '@/components/common/status-badge';

export function KybBadge({
  status,
  className,
}: {
  status: KybStatus;
  className?: string;
}) {
  return <StatusBadge kind="kyb" status={status} className={className} />;
}
