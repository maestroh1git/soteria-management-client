/**
 * Money, written one way everywhere (ROADMAP-EXECUTION.md, C3.3).
 *
 * Sixteen screens each carried their own `money()` and put a `₦` in front of
 * it by hand, in three different styles: some grouped the digits exactly from
 * the API's decimal string, some went through a float, one forgot the sign.
 * These are the one copy, and they keep the careful version: amounts arrive as
 * decimal strings ("1250000.50") and are grouped as text, never parsed into a
 * float, so a kobo is never lost to rounding.
 *
 * Screens use `<Money value={…} />` (components/common/money), which reads the
 * tenant's currency. These functions are for text that is not JSX — a toast, a
 * CSV cell, an aria-label.
 */

export const DEFAULT_CURRENCY = 'NGN';

const SYMBOLS: Record<string, string> = { NGN: '₦', USD: '$', GBP: '£', EUR: '€' };

/** The symbol a currency is written with; its code when it has none here. */
export function currencySymbol(code: string = DEFAULT_CURRENCY): string {
  return SYMBOLS[code] ?? `${code} `;
}

function toDecimalString(v: string | number | null | undefined): string {
  if (v === null || v === undefined || v === '') return '0.00';
  if (typeof v === 'number') return Number.isFinite(v) ? v.toFixed(2) : '0.00';
  return v.trim();
}

/**
 * The digits, grouped: "1250000.5" → "1,250,000.50". A leading minus is kept.
 */
export function formatAmount(v: string | number | null | undefined): string {
  const s = toDecimalString(v);
  const negative = s.startsWith('-');
  const [whole, fraction = ''] = s.replace(/^[-+]/, '').split('.');
  const digits = (whole || '0').replace(/^0+(?=\d)/, '');
  const cents = (fraction + '00').slice(0, 2);
  const grouped = digits.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  const zero = /^0*$/.test(digits + cents);
  return `${negative && !zero ? '-' : ''}${grouped}.${cents}`;
}

/**
 * An amount in a currency: "₦1,250,000.50", and "-₦1,000.00" when negative —
 * the sign outside the symbol, never "₦-1,000.00".
 */
export function formatMoney(
  v: string | number | null | undefined,
  currency: string = DEFAULT_CURRENCY,
): string {
  const amount = formatAmount(v);
  const negative = amount.startsWith('-');
  return `${negative ? '-' : ''}${currencySymbol(currency)}${negative ? amount.slice(1) : amount}`;
}

/**
 * A movement: "+₦5,000.00" in, "−₦5,000.00" out (a true minus sign, which
 * lines up with the plus in a column of figures). Zero has no sign.
 */
export function formatSignedMoney(
  v: string | number | null | undefined,
  currency: string = DEFAULT_CURRENCY,
): string {
  const amount = formatAmount(v);
  const negative = amount.startsWith('-');
  const digits = negative ? amount.slice(1) : amount;
  const zero = /^[0,.]*$/.test(digits);
  const sign = zero ? '' : negative ? '−' : '+';
  return `${sign}${currencySymbol(currency)}${digits}`;
}

/** Whole kobo (or cents) from a decimal string, for exact arithmetic. */
export function toMinorUnits(v: string | number | null | undefined): number {
  return Math.round(Number(v || 0) * 100);
}

/** A decimal string from whole kobo: 150050 → "1500.50". */
export function fromMinorUnits(minor: number): string {
  return (minor / 100).toFixed(2);
}
