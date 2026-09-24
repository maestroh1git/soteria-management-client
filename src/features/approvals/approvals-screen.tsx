'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useQueryClient } from '@tanstack/react-query';
import {
    ArrowRight,
    BadgePercent,
    Calculator,
    Check,
    Receipt,
    SlidersHorizontal,
    TreePalm,
    Wallet,
    X,
    type LucideIcon,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { PageHeader } from '@/components/layout/page-header';
import { EmptyState } from '@/components/common/empty-state';
import { LoadingSkeleton } from '@/components/common/loading-skeleton';
import { Money } from '@/components/common/money';
import { relativeTime } from '@/lib/utils/dates';
import { useApproveLeaveRequest, useRejectLeaveRequest } from '@/lib/hooks/use-leave';
import { useApproveAdjustment, useRejectAdjustment } from '@/lib/hooks/use-payroll-adjustments';
import { useConcessionDecision } from '@/lib/hooks/use-fees';
import { useApproveLoan, useRejectLoan } from '@/lib/hooks/use-loans';
import { useExpenseAction } from '@/lib/hooks/use-finance';
import type { ApprovalItem, ApprovalKind } from '@/lib/api/approvals';
import { APPROVALS_KEY, useApprovals } from './hooks';

const KINDS: Record<ApprovalKind, { label: string; icon: LucideIcon }> = {
    payRun: { label: 'Pay runs', icon: Calculator },
    adjustment: { label: 'Pay adjustments', icon: SlidersHorizontal },
    leave: { label: 'Leave', icon: TreePalm },
    expense: { label: 'Expenses', icon: Wallet },
    concession: { label: 'Concessions', icon: BadgePercent },
    loan: { label: 'Loans & advances', icon: Receipt },
};
const ORDER: ApprovalKind[] = ['payRun', 'adjustment', 'leave', 'loan', 'expense', 'concession'];

/**
 * Approvals (ROADMAP-EXECUTION.md, C4.9): one queue for everything waiting on
 * you, instead of six screens to check. Decide the simple ones here; a pay run
 * opens, because its salaries are approved on the run itself.
 */
export function ApprovalsScreen() {
    const { data, isLoading, isError } = useApprovals();
    const [kind, setKind] = useState<ApprovalKind>();
    const items = (data?.items ?? []).filter((i) => !kind || i.kind === kind);
    const kinds = ORDER.filter((k) => (data?.counts[k] ?? 0) > 0);

    return (
        <div className="space-y-6">
            <PageHeader
                title="Approvals"
                description="Everything waiting on your decision, oldest first. Things you asked for yourself are shown, but somebody else decides them."
            />

            {kinds.length > 1 && (
                <div className="flex flex-wrap gap-2" aria-label="Filter by kind">
                    {kinds.map((k) => (
                        <button
                            key={k}
                            type="button"
                            aria-pressed={kind === k}
                            onClick={() => setKind(kind === k ? undefined : k)}
                            className={`rounded-full border px-3 py-1 text-sm ${
                                kind === k ? 'border-primary bg-primary text-primary-foreground' : 'hover:bg-muted'
                            }`}
                        >
                            {KINDS[k].label} <span className="tabular-nums opacity-70">{data?.counts[k]}</span>
                        </button>
                    ))}
                </div>
            )}

            {isLoading ? (
                <LoadingSkeleton rows={5} />
            ) : items.length === 0 ? (
                <EmptyState
                    isError={isError}
                    subject="your approvals"
                    title="Nothing is waiting on you"
                    description="New requests appear here as soon as they are made."
                />
            ) : (
                ORDER.filter((k) => items.some((i) => i.kind === k)).map((k) => {
                    const Icon = KINDS[k].icon;
                    return (
                        <section key={k} aria-labelledby={`approvals-${k}`} className="space-y-2">
                            <h2
                                id={`approvals-${k}`}
                                className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground"
                            >
                                <Icon className="h-4 w-4" aria-hidden /> {KINDS[k].label}
                            </h2>
                            <Card>
                                <CardContent className="divide-y p-0">
                                    {items
                                        .filter((i) => i.kind === k)
                                        .map((i) => (
                                            <ApprovalRow key={`${i.kind}:${i.id}`} item={i} />
                                        ))}
                                </CardContent>
                            </Card>
                        </section>
                    );
                })
            )}
        </div>
    );
}

function ApprovalRow({ item }: { item: ApprovalItem }) {
    return (
        <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
                <p className="font-medium">{item.title}</p>
                <p className="text-sm text-muted-foreground">{item.detail}</p>
                <p className="text-xs text-muted-foreground">{relativeTime(item.since)}</p>
            </div>
            <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                {item.amount && <Money value={item.amount} className="font-semibold" />}
                {item.percent && <span className="font-semibold tabular-nums">{item.percent}% off</span>}
                {item.yours ? (
                    <span className="text-xs text-muted-foreground">You asked for this; somebody else decides</span>
                ) : item.kind === 'payRun' ? null : (
                    <Decide item={item} />
                )}
                <Button variant="ghost" size="sm" asChild>
                    <Link href={item.href}>
                        {item.kind === 'payRun' ? 'Open the run' : 'Open'}
                        <ArrowRight className="ml-1 h-4 w-4" />
                    </Link>
                </Button>
            </div>
        </div>
    );
}

/** Approve and Refuse, through each kind's own decision endpoint. */
function Decide({ item }: { item: ApprovalItem }) {
    const qc = useQueryClient();
    const refresh = { onSuccess: () => qc.invalidateQueries({ queryKey: APPROVALS_KEY }) };
    const leaveYes = useApproveLeaveRequest();
    const leaveNo = useRejectLeaveRequest();
    const adjYes = useApproveAdjustment();
    const adjNo = useRejectAdjustment();
    const concession = useConcessionDecision();
    const loanYes = useApproveLoan();
    const loanNo = useRejectLoan();
    const expense = useExpenseAction(item.id);

    const busy =
        leaveYes.isPending ||
        leaveNo.isPending ||
        adjYes.isPending ||
        adjNo.isPending ||
        concession.isPending ||
        loanYes.isPending ||
        loanNo.isPending ||
        expense.isPending;

    const decide = (approve: boolean) => {
        switch (item.kind) {
            case 'leave':
                return (approve ? leaveYes : leaveNo).mutate({ id: item.id }, refresh);
            case 'adjustment':
                return (approve ? adjYes : adjNo).mutate(item.id, refresh);
            case 'concession':
                return concession.mutate({ id: item.id, approve }, refresh);
            case 'loan':
                return approve
                    ? loanYes.mutate({ id: item.id, dto: {} }, refresh)
                    : loanNo.mutate({ id: item.id }, refresh);
            case 'expense':
                return expense.mutate({ action: approve ? 'approve' : 'reject' }, refresh);
        }
    };

    return (
        <>
            <Button size="sm" disabled={busy} onClick={() => decide(true)}>
                <Check className="mr-1 h-4 w-4" /> Approve
            </Button>
            <Button size="sm" variant="outline" disabled={busy} onClick={() => decide(false)}>
                <X className="mr-1 h-4 w-4" /> Refuse
            </Button>
        </>
    );
}
