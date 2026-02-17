'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
    CalendarDays,
    Plus,
    ChevronRight,
    Clock,
    CheckCircle2,
    AlertCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LoadingSkeleton } from '@/components/common/loading-skeleton';
import { EmptyState } from '@/components/common/empty-state';
import { usePayPeriods, useCreatePayPeriod, useCurrentPayPeriod } from '@/lib/hooks/use-payroll';
import { createPayPeriodSchema, type CreatePayPeriodValues } from '@/lib/utils/validation';
import type { PayPeriodFilters } from '@/lib/types/api';
import { PayPeriodStatus } from '@/lib/types/enums';

const STATUS_CONFIG: Record<PayPeriodStatus, { label: string; variant: 'default' | 'secondary' | 'outline'; icon: typeof Clock }> = {
    [PayPeriodStatus.OPEN]: { label: 'Open', variant: 'default', icon: Clock },
    [PayPeriodStatus.PROCESSING]: { label: 'Processing', variant: 'secondary', icon: AlertCircle },
    [PayPeriodStatus.CLOSED]: { label: 'Closed', variant: 'outline', icon: CheckCircle2 },
};

const currentYear = new Date().getFullYear();
const YEARS = Array.from({ length: 5 }, (_, i) => currentYear - 2 + i);

export default function PayrollPage() {
    const router = useRouter();
    const [filters, setFilters] = useState<PayPeriodFilters>({});
    const [showCreate, setShowCreate] = useState(false);

    const { data: periods, isLoading } = usePayPeriods(filters);
    const { data: currentPeriod } = useCurrentPayPeriod();
    const createMutation = useCreatePayPeriod();

    const form = useForm<CreatePayPeriodValues>({
        resolver: zodResolver(createPayPeriodSchema),
        defaultValues: { name: '', startDate: '', endDate: '', paymentDate: '' },
    });

    const onSubmit = (values: CreatePayPeriodValues) => {
        createMutation.mutate(values, {
            onSuccess: () => {
                setShowCreate(false);
                form.reset();
            },
        });
    };

    const formatDate = (d: string) =>
        new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Payroll</h1>
                    <p className="text-muted-foreground">Manage pay periods and process payroll</p>
                </div>
                <Button onClick={() => setShowCreate(true)}>
                    <Plus className="mr-2 h-4 w-4" />
                    Create Pay Period
                </Button>
            </div>

            {/* Current Period Card */}
            {currentPeriod && (
                <Card
                    className="cursor-pointer border-primary/30 bg-primary/5 transition-colors hover:bg-primary/10"
                    onClick={() => router.push(`/payroll/${currentPeriod.id}`)}
                >
                    <CardHeader className="pb-2">
                        <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                            <CalendarDays className="h-4 w-4" />
                            Current Pay Period
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="flex items-center justify-between">
                        <div>
                            <p className="text-lg font-semibold">{currentPeriod.name}</p>
                            <p className="text-sm text-muted-foreground">
                                {formatDate(currentPeriod.startDate)} – {formatDate(currentPeriod.endDate)}
                            </p>
                        </div>
                        <div className="flex items-center gap-3">
                            <Badge variant={STATUS_CONFIG[currentPeriod.status].variant}>
                                {STATUS_CONFIG[currentPeriod.status].label}
                            </Badge>
                            <ChevronRight className="h-5 w-5 text-muted-foreground" />
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Filters */}
            <div className="flex gap-3">
                <Select
                    value={filters.status ?? 'all'}
                    onValueChange={(v) =>
                        setFilters((p) => ({
                            ...p,
                            status: v === 'all' ? undefined : (v as PayPeriodStatus),
                        }))
                    }
                >
                    <SelectTrigger className="w-[160px]">
                        <SelectValue placeholder="All statuses" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All statuses</SelectItem>
                        {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
                            <SelectItem key={key} value={key}>{cfg.label}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>

                <Select
                    value={filters.year?.toString() ?? 'all'}
                    onValueChange={(v) =>
                        setFilters((p) => ({
                            ...p,
                            year: v === 'all' ? undefined : Number(v),
                        }))
                    }
                >
                    <SelectTrigger className="w-[120px]">
                        <SelectValue placeholder="All years" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All years</SelectItem>
                        {YEARS.map((y) => (
                            <SelectItem key={y} value={y.toString()}>{y}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            {/* Table */}
            {isLoading ? (
                <LoadingSkeleton rows={5} />
            ) : !periods?.length ? (
                <EmptyState
                    title="No pay periods"
                    description="Create a pay period to get started with payroll."
                    actionLabel="Create Pay Period"
                    onAction={() => setShowCreate(true)}
                />
            ) : (
                <div className="rounded-lg border bg-card">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b bg-muted/50">
                                <th className="px-4 py-3 text-left font-medium">Name</th>
                                <th className="px-4 py-3 text-left font-medium">Start Date</th>
                                <th className="px-4 py-3 text-left font-medium">End Date</th>
                                <th className="px-4 py-3 text-left font-medium">Payment Date</th>
                                <th className="px-4 py-3 text-left font-medium">Status</th>
                                <th className="px-4 py-3 text-right font-medium" />
                            </tr>
                        </thead>
                        <tbody>
                            {periods.map((period) => {
                                const cfg = STATUS_CONFIG[period.status];
                                const isCurrent = currentPeriod?.id === period.id;
                                return (
                                    <tr
                                        key={period.id}
                                        className={`cursor-pointer border-b transition-colors hover:bg-muted/50 ${isCurrent ? 'bg-primary/5' : ''
                                            }`}
                                        onClick={() => router.push(`/payroll/${period.id}`)}
                                    >
                                        <td className="px-4 py-3 font-medium">
                                            {period.name}
                                            {isCurrent && (
                                                <span className="ml-2 text-xs text-primary">(Current)</span>
                                            )}
                                        </td>
                                        <td className="px-4 py-3 text-muted-foreground">
                                            {formatDate(period.startDate)}
                                        </td>
                                        <td className="px-4 py-3 text-muted-foreground">
                                            {formatDate(period.endDate)}
                                        </td>
                                        <td className="px-4 py-3 text-muted-foreground">
                                            {formatDate(period.paymentDate)}
                                        </td>
                                        <td className="px-4 py-3">
                                            <Badge variant={cfg.variant}>{cfg.label}</Badge>
                                        </td>
                                        <td className="px-4 py-3 text-right">
                                            <ChevronRight className="ml-auto h-4 w-4 text-muted-foreground" />
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Create Dialog */}
            <Dialog open={showCreate} onOpenChange={setShowCreate}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Create Pay Period</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="name">Name</Label>
                            <Input
                                id="name"
                                placeholder="e.g. January 2025"
                                {...form.register('name')}
                            />
                            {form.formState.errors.name && (
                                <p className="text-xs text-destructive">{form.formState.errors.name.message}</p>
                            )}
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="startDate">Start Date</Label>
                                <Input id="startDate" type="date" {...form.register('startDate')} />
                                {form.formState.errors.startDate && (
                                    <p className="text-xs text-destructive">{form.formState.errors.startDate.message}</p>
                                )}
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="endDate">End Date</Label>
                                <Input id="endDate" type="date" {...form.register('endDate')} />
                                {form.formState.errors.endDate && (
                                    <p className="text-xs text-destructive">{form.formState.errors.endDate.message}</p>
                                )}
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="paymentDate">Payment Date</Label>
                            <Input id="paymentDate" type="date" {...form.register('paymentDate')} />
                            {form.formState.errors.paymentDate && (
                                <p className="text-xs text-destructive">{form.formState.errors.paymentDate.message}</p>
                            )}
                        </div>

                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setShowCreate(false)}>
                                Cancel
                            </Button>
                            <Button type="submit" disabled={createMutation.isPending}>
                                {createMutation.isPending ? 'Creating…' : 'Create'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}
