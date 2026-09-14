const DEFAULT_CURRENCY = 'NGN';
const DEFAULT_LOCALE = 'en-NG';

/**
 * The fee, invoice and portal screens all write naira as ₦. These helpers wrote
 * it as "NGN", so the dashboard showed "NGN 1.5M" in a stat card directly above
 * "₦1,770,000.00" in the fees panel — one currency spelled two ways on one
 * screen. Currencies with no symbol here keep their code.
 */
const CURRENCY_SYMBOLS: Record<string, string> = { NGN: '₦' };

const prefixFor = (currencyCode: string) =>
  CURRENCY_SYMBOLS[currencyCode] ?? `${currencyCode} `;

/**
 * Format a number as currency.
 * @example formatCurrency(50000) → "₦50,000.00"
 * @example formatCurrency(50000, 'USD') → "USD 50,000.00"
 */
export function formatCurrency(
  amount: number | string,
  currencyCode: string = DEFAULT_CURRENCY,
): string {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;

  if (isNaN(num)) return `${prefixFor(currencyCode)}0.00`;

  const formatted = new Intl.NumberFormat(DEFAULT_LOCALE, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Math.abs(num));

  if (num < 0) {
    return `(${prefixFor(currencyCode)}${formatted})`;
  }

  return `${prefixFor(currencyCode)}${formatted}`;
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
 * @example formatCompactCurrency(1500000) → "₦1.5M"
 */
export function formatCompactCurrency(
  amount: number | string,
  currencyCode: string = DEFAULT_CURRENCY,
): string {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;

  if (isNaN(num)) return `${prefixFor(currencyCode)}0`;

  const formatted = new Intl.NumberFormat(DEFAULT_LOCALE, {
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(num);

  return `${prefixFor(currencyCode)}${formatted}`;
}
