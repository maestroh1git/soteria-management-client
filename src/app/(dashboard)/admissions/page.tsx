'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Clock, Eye, Link2, Check, TimerOff, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { EmptyState } from '@/components/common/empty-state';
import { useApplications, useExpireOffers } from '@/lib/hooks/use-admissions';
import { useAuth } from '@/lib/hooks/use-auth';
import { formatDate } from '@/lib/utils/dates';
import type { ApplicationStatus } from '@/lib/api/admissions';

const STATUS_STYLE: Record<string, string> = {
    APPLIED: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
    ASSESSMENT_SCHEDULED:
        'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300',
    ASSESSED:
        'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300',
    OFFERED:
        'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300',
    ACCEPTED:
        'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
    ENROLLED:
        'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
    WAITLISTED:
        'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
};

const label = (s: string) => s.replace(/_/g, ' ').toLowerCase();

/**
 * The registrar's queue.
 *
 * Ordered by what needs doing rather than by date: an intake is a backlog of
 * decisions, and the question on opening this screen is "what is waiting on
 * me", not "what arrived most recently".
 */
export default function AdmissionsPage() {
    const router = useRouter();
    const { hasRole, tenantSlug } = useAuth();
    const canDecide = hasRole(['tenant_owner', 'ADMIN', 'admissions.registrar']);

    const [status, setStatus] = useState('all');
    const { data: applications = [], isLoading } = useApplications({ status });
    const expire = useExpireOffers();

    const count = (s: ApplicationStatus) =>
        applications.filter((a) => a.status === s).length;

    /** Offers whose deadline has passed but which nobody has swept yet. */
    const lapsed = applications.filter(
        (a) =>
            a.status === 'OFFERED' &&
            a.offerExpiresAt &&
            new Date(a.offerExpiresAt).getTime() < Date.now(),
    ).length;

    const publicLink =
        typeof window !== 'undefined' && tenantSlug
            ? `${window.location.origin}/apply/${tenantSlug}`
            : null;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Admissions</h1>
                    <p className="text-muted-foreground">
                        Applications, from enquiry to a child on the roll.
                    </p>
                </div>
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
            </div>

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
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                                navigator.clipboard.writeText(publicLink);
                                toast.success('Link copied');
                            }}
                        >
                            Copy
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
                        className="cursor-pointer transition hover:border-primary/50"
                        onClick={() => setStatus(s)}
                    >
                        <CardContent className="pt-6">
                            <p className="text-2xl font-semibold">{count(s)}</p>
                            <p className="text-sm text-muted-foreground">{title}</p>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <div className="flex items-center gap-3">
                <Select value={status} onValueChange={setStatus}>
                    <SelectTrigger className="w-56">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All applications</SelectItem>
                        {[
                            'APPLIED',
                            'ASSESSMENT_SCHEDULED',
                            'ASSESSED',
                            'OFFERED',
                            'ACCEPTED',
                            'ENROLLED',
                            'WAITLISTED',
                            'REJECTED',
                            'OFFER_DECLINED',
                            'OFFER_EXPIRED',
                        ].map((s) => (
                            <SelectItem key={s} value={s}>
                                {label(s)}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            {isLoading ? (
                <p className="text-sm text-muted-foreground">Loading…</p>
            ) : applications.length === 0 ? (
                <EmptyState
                    title="No applications"
                    description="They will appear here as parents apply, or when you take one in the office."
                />
            ) : (
                <div className="overflow-x-auto rounded-md border">
                    <table className="w-full text-sm">
                        <thead className="bg-muted/50">
                            <tr>
                                <th className="px-3 py-2 text-left font-medium">No.</th>
                                <th className="px-3 py-2 text-left font-medium">Child</th>
                                <th className="px-3 py-2 text-left font-medium">Applying to</th>
                                <th className="px-3 py-2 text-left font-medium">Guardian</th>
                                <th className="px-3 py-2 text-left font-medium">Status</th>
                                <th className="px-3 py-2 text-left font-medium">Applied</th>
                                <th className="px-3 py-2"></th>
                            </tr>
                        </thead>
                        <tbody>
                            {applications.map((a) => {
                                const isLapsed =
                                    a.status === 'OFFERED' &&
                                    a.offerExpiresAt &&
                                    new Date(a.offerExpiresAt).getTime() < Date.now();
                                return (
                                    <tr
                                        key={a.id}
                                        className="cursor-pointer border-t hover:bg-muted/40"
                                        onClick={() => router.push(`/admissions/${a.id}`)}
                                    >
                                        <td className="px-3 py-2 text-muted-foreground">
                                            {a.applicationNumber}
                                        </td>
                                        <td className="px-3 py-2 font-medium">
                                            {a.firstName} {a.lastName}
                                        </td>
                                        <td className="px-3 py-2">
                                            {a.classLevel?.name ?? '—'}
                                        </td>
                                        <td className="px-3 py-2 text-muted-foreground">
                                            {a.guardianFirstName} {a.guardianLastName}
                                        </td>
                                        <td className="px-3 py-2">
                                            <span
                                                className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
                                                    STATUS_STYLE[a.status] ??
                                                    'bg-muted text-muted-foreground'
                                                }`}
                                            >
                                                {label(a.status)}
                                            </span>
                                            {isLapsed && (
                                                <span
                                                    className="ml-2 inline-flex items-center gap-1 text-xs text-destructive"
                                                    title="The deadline has passed — sweep to free the place"
                                                >
                                                    <Clock className="h-3 w-3" /> lapsed
                                                </span>
                                            )}
                                            {a.status === 'ENROLLED' && (
                                                <Check className="ml-2 inline h-3 w-3 text-emerald-600" />
                                            )}
                                        </td>
                                        <td className="px-3 py-2 text-muted-foreground">
                                            {formatDate(a.createdAt)}
                                        </td>
                                        <td className="px-3 py-2 text-right">
                                            <Link
                                                href={`/admissions/${a.id}`}
                                                onClick={(e) => e.stopPropagation()}
                                            >
                                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                                    <Eye className="h-4 w-4" />
                                                </Button>
                                            </Link>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
