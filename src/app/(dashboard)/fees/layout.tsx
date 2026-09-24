import { FeesTabs } from '@/features/fees/fees-tabs';

/**
 * The Fees hub (ROADMAP-EXECUTION.md, C4.7): one sidebar entry, and every
 * part of the fee cycle a tab away — the prices, the bills, the money in,
 * the discounts, the extras, and who is behind.
 */
export default function FeesLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="space-y-6">
            <FeesTabs />
            {children}
        </div>
    );
}
