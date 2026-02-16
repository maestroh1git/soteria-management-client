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
            <CardContent className="p-6">
                <div className="flex items-center justify-between">
                    <div className="space-y-1">
                        <p className="text-sm font-medium text-muted-foreground">{title}</p>
                        <p className="text-2xl font-bold tracking-tight">{value}</p>
                        {subtitle && (
                            <p className="text-xs text-muted-foreground">{subtitle}</p>
                        )}
                    </div>
                    {Icon && (
                        <div className="rounded-lg bg-primary/10 p-3">
                            <Icon className="h-5 w-5 text-primary" />
                        </div>
                    )}
                </div>
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
