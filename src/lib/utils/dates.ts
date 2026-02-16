import {
  format,
  formatDistanceToNow,
  parseISO,
  isValid,
  differenceInDays,
} from 'date-fns';

/**
 * Format a date string to a human-readable format.
 * @example formatDate('2026-01-15') → "Jan 15, 2026"
 */
export function formatDate(
  dateStr: string | Date | null | undefined,
  pattern: string = 'MMM d, yyyy',
): string {
  if (!dateStr) return '—';
  const date = typeof dateStr === 'string' ? parseISO(dateStr) : dateStr;
  if (!isValid(date)) return '—';
  return format(date, pattern);
}

/**
 * Format a date range.
 * @example formatDateRange('2026-01-01', '2026-01-31') → "Jan 1 – Jan 31, 2026"
 */
export function formatDateRange(
  startStr: string | null | undefined,
  endStr: string | null | undefined,
): string {
  if (!startStr || !endStr) return '—';
  const start = parseISO(startStr);
  const end = parseISO(endStr);
  if (!isValid(start) || !isValid(end)) return '—';

  // Same year → "Jan 1 – Jan 31, 2026"
  if (start.getFullYear() === end.getFullYear()) {
    return `${format(start, 'MMM d')} – ${format(end, 'MMM d, yyyy')}`;
  }

  return `${format(start, 'MMM d, yyyy')} – ${format(end, 'MMM d, yyyy')}`;
}

/**
 * Format a date as relative time.
 * @example relativeTime('2026-01-14T10:00:00') → "2 days ago"
 */
export function relativeTime(
  dateStr: string | Date | null | undefined,
): string {
  if (!dateStr) return '—';
  const date = typeof dateStr === 'string' ? parseISO(dateStr) : dateStr;
  if (!isValid(date)) return '—';
  return formatDistanceToNow(date, { addSuffix: true });
}

/**
 * Format a date for form inputs (YYYY-MM-DD).
 */
export function toInputDate(dateStr: string | Date | null | undefined): string {
  if (!dateStr) return '';
  const date = typeof dateStr === 'string' ? parseISO(dateStr) : dateStr;
  if (!isValid(date)) return '';
  return format(date, 'yyyy-MM-dd');
}

/**
 * Get the number of days between two dates.
 */
export function daysBetween(
  startStr: string,
  endStr: string,
): number {
  const start = parseISO(startStr);
  const end = parseISO(endStr);
  return differenceInDays(end, start);
}

/**
 * Format month/year for display.
 * @example formatMonthYear(1, 2026) → "January 2026"
 */
export function formatMonthYear(month: number, year: number): string {
  const date = new Date(year, month - 1, 1);
  return format(date, 'MMMM yyyy');
}
