'use client';

import Link from 'next/link';
import { ChevronRight, Loader2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/common/empty-state';
import { useMyChildren } from '@/lib/hooks/use-portal';

const money = (v: string | number) =>
    Number(v).toLocaleString('en-NG', { minimumFractionDigits: 2 });

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
            <div>
                <h1 className="text-2xl font-semibold">Your children</h1>
                <p className="mt-1 text-sm text-muted-foreground">
                    Fees, payments and what is still owed.
                </p>
            </div>

            {children.length === 0 ? (
                <EmptyState
                    title="No children on your account yet"
                    description="If this looks wrong, ask the school office to link your children to your account."
                />
            ) : (
                <>
                    {owed > 0 && (
                        <Card className="border-amber-200 bg-amber-50 dark:border-amber-900/50 dark:bg-amber-950/30">
                            <CardContent className="py-4">
                                <p className="text-sm text-amber-900 dark:text-amber-200">
                                    <span className="font-semibold">
                                        ₦{money(owed)}
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
                                <Link key={child.id} href={`/portal/${child.id}`}>
                                    <Card className="transition-colors hover:bg-muted/40">
                                        <CardContent className="flex items-center justify-between py-4">
                                            <div>
                                                <p className="font-medium">
                                                    {child.name}
                                                </p>
                                                <p className="text-xs text-muted-foreground">
                                                    {child.admissionNumber}
                                                    {child.className
                                                        ? ` · ${child.className}`
                                                        : ''}
                                                </p>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                {settled ? (
                                                    <Badge
                                                        variant="secondary"
                                                        className="bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-200"
                                                    >
                                                        Nothing owed
                                                    </Badge>
                                                ) : (
                                                    <span className="font-semibold tabular-nums">
                                                        ₦{money(child.outstanding)}
                                                    </span>
                                                )}
                                                <ChevronRight className="h-4 w-4 text-muted-foreground" />
                                            </div>
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
