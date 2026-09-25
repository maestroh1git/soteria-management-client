'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Activity, KeyRound, Lock, Send, UserPlus } from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LoadingSkeleton } from '@/components/common/loading-skeleton';
import { EmptyState } from '@/components/common/empty-state';
import { StatusBadge } from '@/components/common/status-badge';
import { useAuth } from '@/lib/hooks/use-auth';
import { useCan } from '@/lib/hooks/use-can';
import type { Employee, User } from '@/lib/types/api';
import { useResendInvite, useTeam } from '@/features/access/hooks';
import {
    ACCESS_DESCRIPTIONS,
    ACCESS_LABELS,
    accessOf,
    accountStatus,
    grantableAccess,
    inheritedOf,
} from '@/features/access/roles';
import { AccessDialog } from '@/features/access/components/access-dialog';
import { ActivitySheet } from '@/features/access/components/activity-sheet';
import { InviteDialog } from '@/features/access/components/invite-dialog';
import { InviteLinkDialog } from '@/features/access/components/invite-link-dialog';

/**
 * Whether this person can sign in, and what they may do once they have. The
 * same actions as Team & access, for one person, beside the rest of their
 * record.
 */
export function AccessTab({ employee }: { employee: Employee }) {
    const { tenantOrgType } = useAuth();
    const can = useCan();
    const accessOptions = grantableAccess(tenantOrgType, can('users.grantOwnership'));
    const { data: team = [], isLoading, isError } = useTeam();
    const resend = useResendInvite();
    const login = team.find((u) => u.employeeId === employee.id) ?? null;
    const inherited = login ? inheritedOf(login) : null;

    const [inviting, setInviting] = useState(false);
    const [link, setLink] = useState<{ name: string; url: string } | null>(null);
    const [editing, setEditing] = useState<User | null>(null);
    const [watching, setWatching] = useState<User | null>(null);

    if (isLoading) return <LoadingSkeleton rows={3} />;
    if (isError) return <EmptyState isError subject="this person’s access" title="Access" />;

    return (
        <>
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg">Sign-in and access</CardTitle>
                    <CardDescription>
                        Their position is their job; this is what they may do in Soteria.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {!login ? (
                        <div className="flex flex-wrap items-center justify-between gap-3">
                            <p className="text-sm text-muted-foreground">
                                {employee.firstName} cannot sign in yet.
                            </p>
                            <Button onClick={() => setInviting(true)}>
                                <UserPlus className="mr-2 h-4 w-4" /> Invite to sign in
                            </Button>
                        </div>
                    ) : (
                        <>
                            <div className="flex flex-wrap items-center gap-2">
                                <span className="text-sm">{login.email}</span>
                                <StatusBadge kind="account" status={accountStatus(login)} />
                            </div>
                            <ul className="space-y-2">
                                {accessOf(login).map((r) => (
                                    <li key={r} className="flex items-start gap-2">
                                        <Badge variant="outline">{ACCESS_LABELS[r] ?? r}</Badge>
                                        <span className="text-sm text-muted-foreground">
                                            {ACCESS_DESCRIPTIONS[r]}
                                        </span>
                                    </li>
                                ))}
                                {inherited?.roles
                                    .filter((r) => !accessOf(login).includes(r))
                                    .map((r) => (
                                        <li key={`p-${r}`} className="flex items-start gap-2">
                                            <Badge variant="outline" className="gap-1 border-dashed">
                                                <Lock className="h-3 w-3" aria-hidden />
                                                {ACCESS_LABELS[r] ?? r}
                                            </Badge>
                                            <span className="text-sm text-muted-foreground">
                                                From their position, {inherited.from}. Change it on the
                                                position.
                                            </span>
                                        </li>
                                    ))}
                            </ul>
                            <div className="flex flex-wrap gap-2">
                                <Button variant="outline" size="sm" onClick={() => setEditing(login)}>
                                    <KeyRound className="mr-2 h-4 w-4" /> Change access
                                </Button>
                                {accountStatus(login) === 'INVITED' && (
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        disabled={resend.isPending}
                                        onClick={() =>
                                            resend.mutate(login.id, {
                                                onSuccess: (res) => {
                                                    if (res.emailed) toast.success(`Invite sent again to ${login.email}`);
                                                    else if (res.inviteUrl)
                                                        setLink({
                                                            name: `${login.firstName} ${login.lastName}`,
                                                            url: res.inviteUrl,
                                                        });
                                                },
                                            })
                                        }
                                    >
                                        <Send className="mr-2 h-4 w-4" /> Send the invite again
                                    </Button>
                                )}
                                <Button variant="outline" size="sm" onClick={() => setWatching(login)}>
                                    <Activity className="mr-2 h-4 w-4" /> Activity
                                </Button>
                            </div>
                            <p className="text-xs text-muted-foreground">
                                To switch a login off, use{' '}
                                <Link href="/setup/team" className="underline">
                                    Team &amp; access
                                </Link>
                                ; their records stay.
                            </p>
                        </>
                    )}
                </CardContent>
            </Card>

            <InviteDialog
                open={inviting}
                onOpenChange={setInviting}
                staff={[employee]}
                accessOptions={accessOptions}
                onLink={setLink}
            />
            <InviteLinkDialog link={link} onClose={() => setLink(null)} />
            <AccessDialog
                user={editing}
                onOpenChange={(o) => !o && setEditing(null)}
                accessOptions={accessOptions}
            />
            <ActivitySheet user={watching} onClose={() => setWatching(null)} />
        </>
    );
}
