'use client';

import { cn } from '@/lib/utils';
import { formatCurrency, isNegativeAmount } from '@/lib/utils/currency';

interface CurrencyDisplayProps {
    amount: number | string;
    currencyCode?: string;
    className?: string;
    size?: 'sm' | 'md' | 'lg';
}

const sizeClasses = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-2xl font-bold',
};

export function CurrencyDisplay({
    amount,
    currencyCode,
    className,
    size = 'md',
}: CurrencyDisplayProps) {
    const negative = isNegativeAmount(
        typeof amount === 'string' ? parseFloat(amount) : amount,
    );

    return (
        <span
            className={cn(
                'tabular-nums',
                sizeClasses[size],
                negative && 'text-red-600 dark:text-red-400',
                className,
            )}
        >
            {formatCurrency(amount, currencyCode)}
        </span>
    );
}
