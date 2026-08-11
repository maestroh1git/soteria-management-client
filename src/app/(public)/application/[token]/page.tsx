'use client';

import { use, useEffect, useState } from 'react';
import { Loader2, AlertCircle, Clock } from 'lucide-react';

import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import {
    getApplicationStatus,
    type PublicApplicationStatus,
} from '@/lib/api/public-admissions';

/**
 * What a parent is told, in words rather than status codes.
 *
 * The API returns `ASSESSMENT_SCHEDULED`; a parent needs to know somebody will
 * be in touch about a date. Every state is mapped deliberately — including the
 * ones nobody enjoys, which are said plainly rather than softened into
 * something that could be misread as still in progress.
 */
const SAY: Record<string, { title: string; detail: string; tone: string }> = {
    APPLIED: {
        title: 'Received',
        detail: 'The school has your application and will be in touch.',
        tone: 'text-blue-700 dark:text-blue-300',
    },
    ASSESSMENT_SCHEDULED: {
        title: 'Assessment arranged',
        detail: 'The school will contact you with the details.',
        tone: 'text-indigo-700 dark:text-indigo-300',
    },
    ASSESSED: {
        title: 'Assessed',
        detail: 'The school is considering your application.',
        tone: 'text-violet-700 dark:text-violet-300',
    },
    OFFERED: {
        title: 'A place has been offered',
        detail: 'Contact the school to accept. Offers do expire.',
        tone: 'text-amber-700 dark:text-amber-300',
    },
    ACCEPTED: {
        title: 'Place accepted',
        detail: 'The school is completing the paperwork.',
        tone: 'text-green-700 dark:text-green-400',
    },
    ENROLLED: {
        title: 'Enrolled',
        detail: 'Your child is on the school roll. Welcome.',
        tone: 'text-emerald-700 dark:text-emerald-400',
    },
    WAITLISTED: {
        title: 'On the waiting list',
        detail: 'The school will contact you if a place becomes free.',
        tone: 'text-slate-700 dark:text-slate-300',
    },
    REJECTED: {
        title: 'Not successful',
        detail: 'The school was unable to offer a place this time.',
        tone: 'text-muted-foreground',
    },
    OFFER_DECLINED: {
        title: 'Offer declined',
        detail: 'The place was not taken up.',
        tone: 'text-muted-foreground',
    },
    OFFER_EXPIRED: {
        title: 'Offer expired',
        detail:
            'The deadline passed before the place was accepted. Contact the school if this is a mistake.',
        tone: 'text-muted-foreground',
    },
    WITHDRAWN: {
        title: 'Withdrawn',
        detail: 'This application is no longer being considered.',
        tone: 'text-muted-foreground',
    },
};

export default function ApplicationStatusPage({
    params,
}: {
    params: Promise<{ token: string }>;
}) {
    const { token } = use(params);
    const [status, setStatus] = useState<PublicApplicationStatus | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        getApplicationStatus(token)
            .then(setStatus)
            .catch((e) => setError(e.message));
    }, [token]);

    if (error) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <AlertCircle className="h-5 w-5" />
                        We could not find that application
                    </CardTitle>
                    <CardDescription>
                        Check the link you were given after applying. It is the only way in
                        — the school can look you up by your application number if you have
                        lost it.
                    </CardDescription>
                </CardHeader>
            </Card>
        );
    }

    if (!status) {
        return (
            <div className="flex items-center gap-2 text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" /> Loading…
            </div>
        );
    }

    const say = SAY[status.status] ?? {
        title: status.status,
        detail: '',
        tone: 'text-muted-foreground',
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-semibold">{status.schoolName}</h1>
                <p className="text-muted-foreground">
                    Application for {status.childFirstName}
                </p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className={say.tone}>{say.title}</CardTitle>
                    <CardDescription>{say.detail}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div>
                        <p className="text-sm text-muted-foreground">
                            Application number
                        </p>
                        <p className="text-lg font-semibold tracking-wide">
                            {status.applicationNumber}
                        </p>
                    </div>

                    {status.offerExpiresAt && (
                        <div className="flex items-start gap-2 rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-200">
                            <Clock className="mt-0.5 h-4 w-4 shrink-0" />
                            <span>
                                This offer expires on{' '}
                                {new Date(status.offerExpiresAt).toLocaleDateString(
                                    undefined,
                                    { day: 'numeric', month: 'long', year: 'numeric' },
                                )}
                                .
                            </span>
                        </div>
                    )}

                    <p className="text-xs text-muted-foreground">
                        Submitted{' '}
                        {new Date(status.submittedAt).toLocaleDateString(undefined, {
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric',
                        })}
                    </p>
                </CardContent>
            </Card>
        </div>
    );
}
