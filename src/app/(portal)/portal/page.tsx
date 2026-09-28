'use client';

import Link from 'next/link';
import { ChevronRight, Loader2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { StatusBadge } from '@/components/common/status-badge';
import { PageHeader } from '@/components/layout/page-header';
import { EmptyState } from '@/components/common/empty-state';
import { useMyChildren } from '@/lib/hooks/use-portal';
import { Money } from '@/components/common/money';

export default function PortalHomePage() {
    const { data: children = [], isLoading, isError } = useMyChildren();

    if (isLoading) {
        return (
            <div className="flex justify-center py-16">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
        );
    }

    if (isError) {
        return (
            <EmptyState
                title="We couldn't load your children"
                description="Please try again in a moment. If it keeps happening, contact the school office."
            />
        );
    }

    const owed = children.reduce((sum, c) => sum + Number(c.outstanding), 0);

    return (
        <div className="space-y-6">
            <PageHeader
                title="Your children"
                description="Attendance, fees, payments and what is still owed."
            />

            {children.length === 0 ? (
                <EmptyState
                    title="No children on your account yet"
                    description="If this looks wrong, ask the school office to link your children to your account."
                />
            ) : (
                <>
                    {owed > 0 && (
                        <Card className="border-amber-200 bg-amber-50 dark:border-amber-900/50 dark:bg-amber-950/30">
                            <CardContent>
                                <p className="text-sm text-amber-900 dark:text-amber-200">
                                    <span className="font-semibold">
                                        <Money value={owed} />
                                    </span>{' '}
                                    outstanding across{' '}
                                    {children.filter((c) => Number(c.outstanding) > 0)
                                        .length}{' '}
                                    of your {children.length}{' '}
                                    {children.length === 1 ? 'child' : 'children'}.
                                </p>
                            </CardContent>
                        </Card>
                    )}

                    <div className="space-y-3">
                        {children.map((child) => {
                            const settled = Number(child.outstanding) <= 0;
                            return (
                                <Link key={child.id} href={`/portal/${child.id}`} className="block">
                                    <Card className="transition-colors hover:bg-muted/40">
                                        {/* What is owed shares a line with the name only,
                                            so the admission number and class underneath
                                            get the card's full width. */}
                                        <CardContent className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3">
                                            <p className="font-medium">{child.name}</p>
                                            <div className="flex items-center gap-2">
                                                {settled ? (
                                                    <StatusBadge kind="balance" status="SETTLED" />
                                                ) : (
                                                    <span className="font-semibold tabular-nums">
                                                        <Money value={child.outstanding} />
                                                    </span>
                                                )}
                                                <ChevronRight className="h-4 w-4 text-muted-foreground" />
                                            </div>
                                            <p className="col-span-2 text-xs text-muted-foreground">
                                                {child.admissionNumber}
                                                {child.className ? ` · ${child.className}` : ''}
                                                {child.formTeacher ? ` · taken by ${child.formTeacher}` : ''}
                                            </p>
                                        </CardContent>
                                    </Card>
                                </Link>
                            );
                        })}
                    </div>
                </>
            )}
        </div>
    );
}
