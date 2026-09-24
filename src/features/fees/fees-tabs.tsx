'use client';

import {
    BadgeDollarSign,
    BadgePercent,
    Bus,
    HandCoins,
    ReceiptText,
    TrendingDown,
} from 'lucide-react';
import { SectionTabs } from '@/components/layout/section-tabs';

export const FEES_TABS = [
    { title: 'Price list', href: '/fees', icon: BadgeDollarSign },
    { title: 'Invoices', href: '/fees/invoices', icon: ReceiptText },
    { title: 'Receipts', href: '/fees/payments', icon: HandCoins },
    { title: 'Concessions', href: '/fees/concessions', icon: BadgePercent },
    { title: 'Optional fees', href: '/fees/optional', icon: Bus },
    { title: 'Arrears', href: '/fees/arrears', icon: TrendingDown },
];

export function FeesTabs() {
    return <SectionTabs tabs={FEES_TABS} label="Fees" />;
}
