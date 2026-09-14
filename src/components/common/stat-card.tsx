'use client';

import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { TrendingUp, TrendingDown, Minus, type LucideIcon } from 'lucide-react';

interface StatCardProps {
    title: string;
    value: string | number;
    subtitle?: string;
    icon?: LucideIcon;
    trend?: {
        value: number;
        label?: string;
    };
    className?: string;
}

export function StatCard({
    title,
    value,
    subtitle,
    icon: Icon,
    trend,
    className,
}: StatCardProps) {
    const TrendIcon =
        trend && trend.value > 0
            ? TrendingUp
            : trend && trend.value < 0
                ? TrendingDown
                : Minus;

    const trendColor =
        trend && trend.value > 0
            ? 'text-emerald-600 dark:text-emerald-400'
            : trend && trend.value < 0
                ? 'text-red-600 dark:text-red-400'
                : 'text-slate-500';

    return (
        <Card className={cn('relative overflow-hidden', className)}>
            <CardContent className="p-5 sm:p-6">
                {/*
                 * The label and the icon share the top row; the figure gets a
                 * line to itself underneath. Previously all three sat in one
                 * flex row, so the icon took width from the number and "NGN
                 * 1.5M" broke across two lines at anything under ~1200px — the
                 * one thing on the card nobody should have to reassemble.
                 *
                 * The label reserves two lines whether it needs them or not, so
                 * four cards side by side line their figures up even when one
                 * title wraps and the others do not.
                 */}
                <div className="flex items-start justify-between gap-3">
                    <p className="min-h-[2.4rem] text-sm font-medium leading-snug text-muted-foreground">
                        {title}
                    </p>
                    {Icon && (
                        <div className="shrink-0 rounded-lg bg-primary/10 p-2.5">
                            <Icon className="h-5 w-5 text-primary" />
                        </div>
                    )}
                </div>
                <p className="text-xl font-bold tracking-tight tabular-nums whitespace-nowrap sm:text-2xl">
                    {value}
                </p>
                {subtitle && (
                    <p className="mt-1 text-xs text-muted-foreground">{subtitle}</p>
                )}
                {trend && (
                    <div className={cn('flex items-center gap-1 mt-3 text-xs font-medium', trendColor)}>
                        <TrendIcon className="h-3.5 w-3.5" />
                        <span>{Math.abs(trend.value)}%</span>
                        {trend.label && (
                            <span className="text-muted-foreground font-normal">
                                {trend.label}
                            </span>
                        )}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
