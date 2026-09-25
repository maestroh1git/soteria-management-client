'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
    Archive,
    Clock,
    Link2,
    TimerOff,
    BellRing,
    Loader2,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { CopyButton } from '@/components/common/copy-button';
import { Badge } from '@/components/ui/badge';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import {
    useApplications,
    useExpireOffers,
    useRemindOffers,
    useRetentionDue,
} from '@/lib/hooks/use-admissions';
import { useAuth } from '@/lib/hooks/use-auth';
import { useCan } from '@/lib/hooks/use-can';
import { formatDate } from '@/lib/utils/dates';
import type { AdmissionApplication, ApplicationStatus } from '@/lib/api/admissions';
import { StatusBadge } from '@/components/common/status-badge';
import { statusOptions } from '@/lib/status/registry';
import { PageHeader } from '@/components/layout/page-header';
import { DataTable } from '@/components/common/data-table';
import type { ColumnDef } from '@tanstack/react-table';
import { bySurname, listName } from '@/lib/utils/names';


/**
 * The registrar's queue.
 *
 * Ordered by what needs doing rather than by date: an intake is a backlog of
 * decisions, and the question on opening this screen is "what is waiting on
 * me", not "what arrived most recently".
 */
export default function AdmissionsPage() {
    const { tenantSlug } = useAuth();
    const can = useCan();
    const canDecide = can('admissions.decide');

    const [status, setStatus] = useState<string>();
    const [levelId, setLevelId] = useState<string>();
    const [session, setSession] = useState<string>();
    // The whole intake, filtered here: the counts above the table are of the
    // intake, and asking the server for one status made every other count 0.
    const {
        data: applications = [],
        isLoading,
        isError,
    } = useApplications({ status: 'all' });
    const { data: retentionDue = [] } = useRetentionDue(canDecide);
    const expire = useExpireOffers();
    const remind = useRemindOffers();

    const count = (s: ApplicationStatus) =>
        applications.filter((a) => a.status === s).length;

    /** Offers whose deadline has passed but which nobody has swept yet. */
    const lapsed = applications.filter(
        (a) =>
            a.status === 'OFFERED' &&
            a.offerExpiresAt &&
            new Date(a.offerExpiresAt).getTime() < Date.now(),
    ).length;

    const isLapsed = (a: AdmissionApplication) =>
        a.status === 'OFFERED' &&
        !!a.offerExpiresAt &&
        new Date(a.offerExpiresAt).getTime() < Date.now();

    const unique = (pairs: Array<{ id: string; name: string } | undefined>) =>
        [...new Map(pairs.filter(Boolean).map((p) => [p!.id, p!.name])).entries()].map(
            ([value, label]) => ({ value, label }),
        );
    const levels = unique(applications.map((a) => a.classLevel));
    const sessions = unique(applications.map((a) => a.session));

    const byLevelName = (a?: { name: string }, b?: { name: string }) =>
        (a?.name ?? '').localeCompare(b?.name ?? '', undefined, { numeric: true });
    // Everything but the class filter: what each class's count is taken from.
    const inStage = applications.filter(
        (a) =>
            (!status ||
                (status === 'LAPSED' ? isLapsed(a) : a.status === status)) &&
            (!session || a.session?.id === session),
    );
    // Grouped by the class applied for, then surname: an intake is decided
    // class by class, against that class's seats.
    const shown = inStage
        .filter((a) => !levelId || a.classLevel?.id === levelId)
        .sort((a, b) => byLevelName(a.classLevel, b.classLevel) || bySurname(a, b));
    const levelCounts = [...levels]
        .sort((a, b) => a.label.localeCompare(b.label, undefined, { numeric: true }))
        .map((l) => ({ ...l, n: inStage.filter((a) => a.classLevel?.id === l.value).length }));
    const filtered = !!(status || levelId || session);

    const columns: ColumnDef<AdmissionApplication>[] = [
        {
            id: 'number',
            header: 'No.',
            cell: ({ row }) => (
                <span className="text-muted-foreground">{row.original.applicationNumber}</span>
            ),
        },
        {
            id: 'child',
            header: 'Child',
            meta: { cardTitle: true },
            cell: ({ row }) => (
                <Link
                    href={`/admissions/${row.original.id}`}
                    className="font-medium hover:underline underline-offset-2"
                >
                    {listName(row.original)}
                </Link>
            ),
        },
        {
            id: 'level',
            header: 'Applying to',
            cell: ({ row }) => row.original.classLevel?.name ?? '—',
        },
        {
            id: 'guardian',
            header: 'Guardian',
            cell: ({ row }) => (
                <span className="text-muted-foreground">
                    {row.original.guardianFirstName} {row.original.guardianLastName}
                </span>
            ),
        },
        {
            id: 'status',
            header: 'Status',
            cell: ({ row }) => (
                <span className="inline-flex items-center gap-2">
                    <StatusBadge kind="application" status={row.original.status} />
                    {isLapsed(row.original) && (
                        <span
                            className="inline-flex items-center gap-1 text-xs text-destructive"
                            title="The deadline has passed — sweep to free the place"
                        >
                            <Clock className="h-3 w-3" /> lapsed
                        </span>
                    )}
                </span>
            ),
        },
        {
            id: 'applied',
            header: 'Applied',
            cell: ({ row }) => (
                <span className="text-muted-foreground">{formatDate(row.original.createdAt)}</span>
            ),
        },
    ];

    const publicLink =
        typeof window !== 'undefined' && tenantSlug
            ? `${window.location.origin}/apply/${tenantSlug}`
            : null;

    return (
        <div className="space-y-6">
            <PageHeader
                title="Admissions"
                description="Applications, from enquiry to a child on the roll."
                actions={
                    <>
                        {canDecide && (
                            <Button
                                variant="outline"
                                onClick={() => remind.mutate()}
                                disabled={remind.isPending}
                                title="Email the families whose offers lapse within three days. Runs nightly too; nobody is warned twice about the same offer."
                            >
                                {remind.isPending ? (
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                ) : (
                                    <BellRing className="mr-2 h-4 w-4" />
                                )}
                                Chase pending offers
                            </Button>
                        )}
                        {canDecide && (
                            <Button
                                variant="outline"
                                onClick={() => expire.mutate()}
                                disabled={expire.isPending}
                                title="Move offers past their deadline to expired, freeing their places"
                            >
                                {expire.isPending ? (
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                ) : (
                                    <TimerOff className="mr-2 h-4 w-4" />
                                )}
                                Sweep lapsed offers
                                {lapsed > 0 && (
                                    <Badge variant="destructive" className="ml-2">
                                        {lapsed}
                                    </Badge>
                                )}
                            </Button>
                        )}
                    </>
                }
            />

            {publicLink && (
                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="flex items-center gap-2 text-base">
                            <Link2 className="h-4 w-4" /> Your application form
                        </CardTitle>
                        <CardDescription>
                            Parents apply here. No account needed.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="flex items-center gap-2">
                        <code className="flex-1 truncate rounded bg-muted px-3 py-2 text-sm">
                            {publicLink}
                        </code>
                        <CopyButton text={publicLink} />
                    </CardContent>
                </Card>
            )}

            {canDecide && retentionDue.length > 0 && (
                <Card className="border-amber-200 bg-amber-50/60 dark:border-amber-900/50 dark:bg-amber-950/20">
                    <CardContent className="flex flex-wrap items-center justify-between gap-3 py-4">
                        <p className="flex items-center gap-2 text-sm">
                            <Archive className="h-4 w-4 flex-none text-amber-700 dark:text-amber-400" aria-hidden />
                            {retentionDue.length} unsuccessful{' '}
                            {retentionDue.length === 1 ? 'application is' : 'applications are'} past the date
                            the school keeps them to.
                        </p>
                        <Button asChild variant="outline" size="sm">
                            <Link href="/admissions/retention">Review and delete</Link>
                        </Button>
                    </CardContent>
                </Card>
            )}

            <div className="grid gap-3 sm:grid-cols-4">
                {(
                    [
                        ['APPLIED', 'Awaiting you'],
                        ['ASSESSED', 'Assessed, undecided'],
                        ['OFFERED', 'Offers out'],
                        ['ACCEPTED', 'Ready to enrol'],
                    ] as Array<[ApplicationStatus, string]>
                ).map(([s, title]) => (
                    <Card
                        key={s}
                        className={`cursor-pointer transition hover:border-primary/50 ${status === s ? 'border-primary' : ''}`}
                        onClick={() => setStatus(status === s ? undefined : s)}
                    >
                        <CardContent className="pt-6">
                            <p className="text-2xl font-semibold">{count(s)}</p>
                            <p className="text-sm text-muted-foreground">{title}</p>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {levelCounts.length > 1 && (
                <nav aria-label="Applications by class" className="flex flex-wrap gap-2">
                    <Button
                        size="sm"
                        variant={levelId ? 'outline' : 'default'}
                        onClick={() => setLevelId(undefined)}
                    >
                        All classes ({inStage.length})
                    </Button>
                    {levelCounts.map((l) => (
                        <Button
                            key={l.value}
                            size="sm"
                            variant={levelId === l.value ? 'default' : 'outline'}
                            aria-pressed={levelId === l.value}
                            onClick={() => setLevelId(levelId === l.value ? undefined : l.value)}
                        >
                            {l.label} ({l.n})
                        </Button>
                    ))}
                </nav>
            )}

            <DataTable
                columns={columns}
                data={shown}
                loading={isLoading}
                isError={isError}
                errorSubject="the applications"
                rowHref={(a) => `/admissions/${a.id}`}
                searchText={(a) =>
                    [
                        a.applicationNumber,
                        a.firstName,
                        a.middleName,
                        a.lastName,
                        a.guardianFirstName,
                        a.guardianLastName,
                        a.guardianPhone,
                        a.guardianEmail,
                    ]
                        .filter(Boolean)
                        .join(' ')
                }
                searchPlaceholder="Search by child, guardian, phone or number…"
                filters={[
                    {
                        id: 'status',
                        label: 'stages',
                        value: status,
                        options: [
                            ...statusOptions('application'),
                            { value: 'LAPSED', label: 'Offer lapsed' },
                        ],
                    },
                    { id: 'level', label: 'classes', value: levelId, options: levels },
                    ...(sessions.length > 1
                        ? [{ id: 'session', label: 'sessions', value: session, options: sessions }]
                        : []),
                ]}
                onFilterChange={(id, value) =>
                    id === 'status'
                        ? setStatus(value)
                        : id === 'level'
                          ? setLevelId(value)
                          : setSession(value)
                }
                emptyTitle={filtered ? 'No applications match' : 'No applications'}
                emptyDescription={
                    filtered
                        ? 'Try another stage or class.'
                        : 'They will appear here as parents apply, or when you take one in the office.'
                }
            />
        </div>
    );
}
