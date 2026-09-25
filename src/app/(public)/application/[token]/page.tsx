'use client';

import { use } from 'react';
import {
    Loader2,
    AlertCircle,
    Clock,
    CalendarClock,
    MapPin,
    Video,
} from 'lucide-react';

import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import type { PublicAppointment } from '@/lib/api/public-admissions';
import { useApplicationStatus } from '@/lib/hooks/use-public';
import { formatDate, formatLongDate, formatTime } from '@/lib/utils/dates';
import { OfferAnswer } from '@/features/public/offer-answer';
import { FamilyDocuments } from '@/features/public/family-documents';

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
        // Replaced below when the date is actually known — which, now that
        // booking a sitting is what sets this status, it very nearly always is.
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
        detail: 'Accept or decline below. Offers do expire.',
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

const APPOINTMENT_LABEL: Record<PublicAppointment['kind'], string> = {
    ENTRANCE_EXAM: 'Entrance exam',
    INTERVIEW: 'Interview',
};

/**
 * When to turn up, said the way somebody would say it aloud.
 *
 * The parent's half of the booking the registrar made. It shows only what they
 * have to act on: a parent who needs to know the mark can ask the school, and
 * a page anybody with a link can open is not where that belongs.
 */
function Appointment({ appointment }: { appointment: PublicAppointment }) {
    const when = new Date(appointment.scheduledFor);
    const online = appointment.mode === 'ONLINE';

    return (
        <div className="rounded-md border border-indigo-200 bg-indigo-50 p-4 dark:border-indigo-900/50 dark:bg-indigo-950/30">
            <div className="flex items-center gap-2 text-sm font-medium text-indigo-900 dark:text-indigo-200">
                <CalendarClock className="h-4 w-4 shrink-0" />
                {APPOINTMENT_LABEL[appointment.kind]}
                {online && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-indigo-100 px-2 py-0.5 text-xs dark:bg-indigo-900/60">
                        <Video className="h-3 w-3" />
                        online
                    </span>
                )}
            </div>

            <p className="mt-2 text-lg font-semibold text-indigo-950 dark:text-indigo-100">
                {formatDate(when, 'EEEE d MMMM yyyy')}
            </p>
            <p className="text-indigo-900 dark:text-indigo-200">
                {formatTime(when)}
            </p>

            {/* A room, a joining link, or an honest admission of neither —
                rather than a blank space the parent has to interpret. */}
            {online ? (
                appointment.location ? (
                    <a
                        href={appointment.location}
                        className="mt-2 inline-flex items-center gap-1 text-sm text-indigo-700 underline dark:text-indigo-300"
                    >
                        <Video className="h-3.5 w-3.5" />
                        Joining link
                    </a>
                ) : (
                    <p className="mt-2 text-sm text-indigo-800 dark:text-indigo-300">
                        The school will send the joining details.
                    </p>
                )
            ) : appointment.location ? (
                <p className="mt-2 inline-flex items-center gap-1 text-sm text-indigo-800 dark:text-indigo-300">
                    <MapPin className="h-3.5 w-3.5" />
                    {appointment.location}
                </p>
            ) : (
                <p className="mt-2 text-sm text-indigo-800 dark:text-indigo-300">
                    The school will confirm where.
                </p>
            )}
        </div>
    );
}

export default function ApplicationStatusPage({
    params,
}: {
    params: Promise<{ token: string }>;
}) {
    const { token } = use(params);
    const { data: status, error } = useApplicationStatus(token);

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

    // Once there is a date on the page, promising to be in touch about it reads
    // as though the school has not got round to it yet.
    const detail =
        status.nextAppointment && status.status === 'ASSESSMENT_SCHEDULED'
            ? 'The details are below. Contact the school if the date does not suit.'
            : say.detail;

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
                    <CardDescription>{detail}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {status.nextAppointment && (
                        <Appointment appointment={status.nextAppointment} />
                    )}

                    <div>
                        <p className="text-sm text-muted-foreground">
                            Application number
                        </p>
                        <p className="text-lg font-semibold tracking-wide">
                            {status.applicationNumber}
                        </p>
                    </div>

                    {status.canRespondToOffer ? (
                        <OfferAnswer
                            token={token}
                            childFirstName={status.childFirstName}
                            expiresAt={status.offerExpiresAt}
                        />
                    ) : (
                        status.offerExpiresAt && (
                            <div className="flex items-start gap-2 rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-200">
                                <Clock className="mt-0.5 h-4 w-4 shrink-0" />
                                <span>
                                    This offer expired on {formatLongDate(status.offerExpiresAt)}. Contact the
                                    school if this is a mistake.
                                </span>
                            </div>
                        )
                    )}

                    <FamilyDocuments
                        token={token}
                        documents={status.documents ?? []}
                        canUpload={status.canUpload ?? false}
                    />

                    <p className="text-xs text-muted-foreground">
                        Submitted{' '}
                        {formatLongDate(status.submittedAt)}
                    </p>
                </CardContent>
            </Card>
        </div>
    );
}
