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

/**
 * Shift a calendar date by whole days.
 *
 * Deliberately UTC arithmetic on the string: a calendar date is a fact, not an
 * instant, and local-time arithmetic across a DST boundary silently loses or
 * repeats a day. Mirrors `SchoolCalendarService.eachDate` on the server.
 * @example shiftDate('2026-09-30', 1) → "2026-10-01"
 */
export function shiftDate(dateStr: string, days: number): string {
  return new Date(Date.parse(`${dateStr}T00:00:00Z`) + days * 86_400_000)
    .toISOString()
    .slice(0, 10);
}

/** Today as YYYY-MM-DD, the form every date input and the API use. */
export function todayIso(): string {
    return new Date().toISOString().slice(0, 10);
}

/*
 * The house styles (ROADMAP-EXECUTION.md, C3.3). Screens used to format dates
 * themselves in four locales — "Jan 5, 2026", "5 Jan 2026", "05 Jan 2026" and
 * whatever the browser liked — sometimes on one page. These are the only ones.
 *
 *   formatDate        Jan 5, 2026            a record's date
 *   formatDateTime    Jan 5, 2026, 2:30 PM   when something happened
 *   formatTime        2:30 PM                a time today
 *   formatLongDate    5 January 2026         a date worth reading (an award, an offer)
 *   formatDayOfWeek   Monday 5 January       a school day
 *   formatSpan        Jan 5 – Jan 9, 2026    leave, a term; one date when they match
 */

type DateInput = string | Date | null | undefined;

function toDate(value: DateInput): Date | null {
  if (!value) return null;
  const date = typeof value === 'string' ? parseISO(value) : value;
  return isValid(date) ? date : null;
}

export function formatDateTime(value: DateInput): string {
  const date = toDate(value);
  return date ? format(date, 'MMM d, yyyy, h:mm a') : '—';
}

export function formatTime(value: DateInput): string {
  const date = toDate(value);
  return date ? format(date, 'h:mm a') : '—';
}

export function formatLongDate(value: DateInput): string {
  const date = toDate(value);
  return date ? format(date, 'd MMMM yyyy') : '—';
}

export function formatDayOfWeek(value: DateInput): string {
  const date = toDate(value);
  return date ? format(date, 'EEEE d MMMM') : '—';
}

export function formatSpan(start: string, end: string): string {
  return start === end ? formatDate(start) : formatDateRange(start, end);
}
