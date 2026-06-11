'use client';

import Link from 'next/link';
import { CheckCircle2, Circle, ArrowRight, X, PartyPopper } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
    useOnboardingProgress,
    useDismissOnboarding,
} from '@/lib/hooks/use-onboarding';

/**
 * "Run your first payroll" onboarding checklist. Renders only for setup-capable
 * roles (OWNER/ADMIN), and only until completed or dismissed. Step completion is
 * derived from live data, so it ticks automatically as the tenant is set up.
 */
export function GettingStartedCard() {
    const progress = useOnboardingProgress();
    const dismiss = useDismissOnboarding();

    // Don't render for non-setup roles, after dismissal, or before data is known
    // (avoids flashing an all-empty checklist on first paint).
    if (!progress.canSetup || progress.dismissed || progress.isLoading) {
        return null;
    }

    const { steps, completedRequired, totalRequired, allRequiredDone } = progress;
    const pct = Math.round((completedRequired / totalRequired) * 100);

    return (
        <Card className="border-blue-200 dark:border-blue-900/60 bg-blue-50/40 dark:bg-blue-950/20">
            <CardHeader className="flex flex-row items-start justify-between space-y-0">
                <div className="space-y-1">
                    <CardTitle className="text-base flex items-center gap-2">
                        {allRequiredDone ? (
                            <>
                                <PartyPopper className="h-4 w-4 text-blue-600" />
                                You&apos;re all set
                            </>
                        ) : (
                            'Get started: run your first payroll'
                        )}
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">
                        {allRequiredDone
                            ? 'Next: approve & pay salaries, then generate and send payslips.'
                            : `${completedRequired} of ${totalRequired} steps done — finish setup to process payroll.`}
                    </p>
                </div>
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 shrink-0"
                    aria-label="Dismiss checklist"
                    disabled={dismiss.isPending}
                    onClick={() => dismiss.mutate()}
                >
                    <X className="h-4 w-4" />
                </Button>
            </CardHeader>
            <CardContent className="space-y-1">
                {/* Progress bar */}
                <div className="mb-3 h-1.5 w-full overflow-hidden rounded-full bg-blue-100 dark:bg-blue-900/40">
                    <div
                        className="h-full rounded-full bg-blue-600 transition-all"
                        style={{ width: `${pct}%` }}
                    />
                </div>

                {steps.map((step) => (
                    <div
                        key={step.key}
                        className="flex items-center gap-3 rounded-md px-2 py-2 hover:bg-blue-100/40 dark:hover:bg-blue-900/20"
                    >
                        {step.done ? (
                            <CheckCircle2 className="h-5 w-5 shrink-0 text-green-600" />
                        ) : (
                            <Circle className="h-5 w-5 shrink-0 text-muted-foreground/50" />
                        )}
                        <div className="min-w-0 flex-1">
                            <p
                                className={
                                    'text-sm font-medium ' +
                                    (step.done ? 'text-muted-foreground line-through' : '')
                                }
                            >
                                {step.label}
                                {step.optional && (
                                    <span className="ml-2 text-xs font-normal text-muted-foreground">
                                        (optional)
                                    </span>
                                )}
                            </p>
                            {!step.done && (
                                <p className="text-xs text-muted-foreground">{step.description}</p>
                            )}
                        </div>
                        {!step.done && (
                            <Link href={step.href}>
                                <Button variant="ghost" size="sm" className="shrink-0 text-blue-600">
                                    Set up <ArrowRight className="ml-1 h-3.5 w-3.5" />
                                </Button>
                            </Link>
                        )}
                    </div>
                ))}
            </CardContent>
        </Card>
    );
}
