'use client';

import { cn } from '@/lib/utils';
import { useTenantCurrency } from '@/lib/hooks/use-tenant-currency';
import { formatMoney, formatSignedMoney } from '@/lib/utils/money';

interface MoneyProps {
  value: string | number | null | undefined;
  /** Show "+" or "−": a movement rather than a balance. */
  signed?: boolean;
  /**
   * A deduction shown as one: the value is a positive amount taken off
   * ("−₦5,000.00" for a discount of 5000).
   */
  deduction?: boolean;
  /** Colour negatives red. Balances only; off for deductions. */
  tone?: boolean;
  /** A currency other than the organisation's (rare: a bank statement). */
  currency?: string;
  className?: string;
}

/**
 * An amount of money, in the organisation's currency, written the same way on
 * every screen. Tabular figures, so columns line up.
 */
export function Money({
  value,
  signed,
  deduction,
  tone,
  currency,
  className,
}: MoneyProps) {
  const tenantCurrency = useTenantCurrency();
  const code = currency ?? tenantCurrency;
  const text = deduction
    ? `−${formatMoney(value, code).replace(/^-/, '')}`
    : signed
      ? formatSignedMoney(value, code)
      : formatMoney(value, code);
  const negative = !deduction && text.startsWith('-');
  return (
    <span
      className={cn(
        'tabular-nums',
        tone && negative && 'text-red-600 dark:text-red-400',
        className,
      )}
    >
      {text}
    </span>
  );
}
