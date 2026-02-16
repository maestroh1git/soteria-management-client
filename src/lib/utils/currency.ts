const DEFAULT_CURRENCY = 'KES';
const DEFAULT_LOCALE = 'en-KE';

/**
 * Format a number as currency.
 * @example formatCurrency(50000) → "KES 50,000.00"
 * @example formatCurrency(50000, 'USD') → "USD 50,000.00"
 */
export function formatCurrency(
  amount: number | string,
  currencyCode: string = DEFAULT_CURRENCY,
): string {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;

  if (isNaN(num)) return `${currencyCode} 0.00`;

  const formatted = new Intl.NumberFormat(DEFAULT_LOCALE, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Math.abs(num));

  if (num < 0) {
    return `(${currencyCode} ${formatted})`;
  }

  return `${currencyCode} ${formatted}`;
}

/**
 * Check if an amount is negative (for styling purposes).
 */
export function isNegativeAmount(amount: number | string): boolean {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  return num < 0;
}

/**
 * Format a number as a compact currency display.
 * @example formatCompactCurrency(1500000) → "KES 1.5M"
 */
export function formatCompactCurrency(
  amount: number | string,
  currencyCode: string = DEFAULT_CURRENCY,
): string {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;

  if (isNaN(num)) return `${currencyCode} 0`;

  const formatted = new Intl.NumberFormat(DEFAULT_LOCALE, {
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(num);

  return `${currencyCode} ${formatted}`;
}
