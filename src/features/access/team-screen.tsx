'use client';

import { useState } from 'react';
import type { ColumnDef } from '@tanstack/react-table';
import { toast } from 'sonner';
import {
    Activity,
    KeyRound,
    MoreHorizontal,
    Power,
    Send,
    UserPlus,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { PageHeader } from '@/components/layout/page-header';
import { DataTable } from '@/components/common/data-table';
import { StatusBadge } from '@/components/common/status-badge';
import { ConfirmDialog } from '@/components/common/confirm-dialog';
import { EmployeeLink } from '@/components/common/entity-link';
import { useAuth } from '@/lib/hooks/use-auth';
import { useCan } from '@/lib/hooks/use-can';
import { useEmployees } from '@/lib/hooks/use-employees';
import { statusOptions } from '@/lib/status/registry';
import type { User } from '@/lib/types/api';
import { useDeactivate, useReactivate, useResendInvite, useTeam } from './hooks';
import { ACCESS_LABELS, accessOf, accountStatus, grantableAccess } from './roles';
import { InviteDialog } from './components/invite-dialog';
import { InviteLinkDialog } from './components/invite-link-dialog';
import { AccessDialog } from './components/access-dialog';
import { ActivitySheet } from './components/activity-sheet';

/**
 * Team & access (ROADMAP-EXECUTION.md, C4.3): everyone who can sign in, what
 * they may do, and their staff record beside it. Invites that are still
 * waiting can be sent again; a login can be switched off without touching the
 * person's records.
 */
export function TeamScreen() {
    const { user: me, tenantOrgType } = useAuth();
    const can = useCan();
    const accessOptions = grantableAccess(tenantOrgType, can('users.grantOwnership'));

    const { data: users = [], isLoading, isError } = useTeam();
    const { data: employees = [] } = useEmployees({ status: 'ACTIVE' });
    const resend = useResendInvite();
    const deactivate = useDeactivate();
    const reactivate = useReactivate();

    const [access, setAccess] = useState<string>();
    const [status, setStatus] = useState<string>();
    const [inviting, setInviting] = useState(false);
    const [link, setLink] = useState<{ name: string; url: string } | null>(null);
    const [editing, setEditing] = useState<User | null>(null);
    const [watching, setWatching] = useState<User | null>(null);
    const [switchingOff, setSwitchingOff] = useState<User | null>(null);

    const withoutLogin = employees.filter((e) => !users.some((u) => u.employeeId === e.id));
    const shown = users.filter(
        (u) => (!access || accessOf(u).includes(access)) && (!status || accountStatus(u) === status),
    );

    // How many hold each kind of access: the view by access, one click away.
    const counts = new Map<string, number>();
    for (const u of users) for (const r of accessOf(u)) counts.set(r, (counts.get(r) ?? 0) + 1);
    const waiting = users.filter((u) => accountStatus(u) === 'INVITED').length;

    const columns: ColumnDef<User>[] = [
        {
            id: 'name',
            header: 'Name',
            meta: { cardTitle: true },
            cell: ({ row }) => {
                const u = row.original;
                const name = `${u.firstName} ${u.lastName}`;
                return (
                    <span>
                        {u.employeeId ? (
                            <EmployeeLink id={u.employeeId} name={name} />
                        ) : (
                            <span className="font-medium">{name}</span>
                        )}
                        {u.id === me?.id && (
                            <span className="ml-2 text-xs text-muted-foreground">(you)</span>
                        )}
                    </span>
                );
            },
        },
        {
            id: 'email',
            header: 'Email',
            cell: ({ row }) => <span className="text-muted-foreground">{row.original.email}</span>,
        },
        {
            id: 'access',
            header: 'Access',
            cell: ({ row }) => (
                <span className="flex flex-wrap gap-1">
                    {accessOf(row.original).map((r) => (
                        <Badge key={r} variant="outline" className="text-xs">
                            {ACCESS_LABELS[r] ?? r}
                        </Badge>
                    ))}
                </span>
            ),
        },
        {
            id: 'status',
            header: 'Status',
            cell: ({ row }) => <StatusBadge kind="account" status={accountStatus(row.original)} />,
        },
    ];

    return (
        <div className="space-y-6">
            <PageHeader
                title="Team & access"
                description="Everyone who can sign in, and what each may do. Someone’s job is their position; this is their access."
                actions={
                    <Button onClick={() => setInviting(true)}>
                        <UserPlus className="mr-2 h-4 w-4" /> Invite someone
                    </Button>
                }
            />

            {users.length > 0 && (
                <div className="flex flex-wrap gap-2" aria-label="Filter by access">
                    {[...counts.entries()]
                        .sort((a, b) => b[1] - a[1])
                        .map(([r, n]) => (
                            <button
                                key={r}
                                type="button"
                                onClick={() => setAccess(access === r ? undefined : r)}
                                aria-pressed={access === r}
                                className={`rounded-full border px-3 py-1 text-sm transition-colors ${
                                    access === r
                                        ? 'border-primary bg-primary text-primary-foreground'
                                        : 'hover:bg-muted'
                                }`}
                            >
                                {ACCESS_LABELS[r] ?? r} <span className="tabular-nums opacity-70">{n}</span>
                            </button>
                        ))}
                    {waiting > 0 && (
                        <button
                            type="button"
                            onClick={() => setStatus(status === 'INVITED' ? undefined : 'INVITED')}
                            aria-pressed={status === 'INVITED'}
                            className={`rounded-full border border-amber-300 px-3 py-1 text-sm ${
                                status === 'INVITED' ? 'bg-amber-100 dark:bg-amber-900/30' : 'hover:bg-amber-50'
                            }`}
                        >
                            Invites waiting <span className="tabular-nums opacity-70">{waiting}</span>
                        </button>
                    )}
                </div>
            )}

            <DataTable
                columns={columns}
                data={shown}
                loading={isLoading}
                isError={isError}
                errorSubject="the team"
                searchText={(u) =>
                    `${u.firstName} ${u.lastName} ${u.email} ${u.employee?.employeeNumber ?? ''}`
                }
                searchPlaceholder="Name, email or staff number"
                filters={[
                    {
                        id: 'access',
                        label: 'access',
                        value: access,
                        options: [...counts.keys()].map((r) => ({ value: r, label: ACCESS_LABELS[r] ?? r })),
                    },
                    { id: 'status', label: 'statuses', value: status, options: statusOptions('account') },
                ]}
                onFilterChange={(id, v) => (id === 'access' ? setAccess(v) : setStatus(v))}
                emptyTitle={access || status ? 'Nobody matches' : 'Nobody can sign in yet'}
                emptyDescription={
                    access || status
                        ? 'Try another kind of access or status.'
                        : 'Invite your staff so they can see their payslips, request leave and do their part.'
                }
                emptyAction={
                    access || status ? undefined : { label: 'Invite someone', onClick: () => setInviting(true) }
                }
                rowActions={(u) => {
                    const state = accountStatus(u);
                    const self = u.id === me?.id;
                    return (
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8"
                                    aria-label={`Actions for ${u.firstName} ${u.lastName}`}
                                >
                                    <MoreHorizontal className="h-4 w-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => setEditing(u)}>
                                    <KeyRound className="mr-2 h-4 w-4" /> Change access
                                </DropdownMenuItem>
                                {can('audit.read') && (
                                    <DropdownMenuItem onClick={() => setWatching(u)}>
                                        <Activity className="mr-2 h-4 w-4" /> Activity
                                    </DropdownMenuItem>
                                )}
                                {state === 'INVITED' && (
                                    <DropdownMenuItem
                                        onClick={() =>
                                            resend.mutate(u.id, {
                                                onSuccess: (res) => {
                                                    if (res.emailed) toast.success(`Invite sent again to ${u.email}`);
                                                    else if (res.inviteUrl)
                                                        setLink({ name: `${u.firstName} ${u.lastName}`, url: res.inviteUrl });
                                                },
                                            })
                                        }
                                    >
                                        <Send className="mr-2 h-4 w-4" /> Send invite again
                                    </DropdownMenuItem>
                                )}
                                {!self && (
                                    <>
                                        <DropdownMenuSeparator />
                                        {state === 'INACTIVE' ? (
                                            <DropdownMenuItem onClick={() => reactivate.mutate(u.id)}>
                                                <Power className="mr-2 h-4 w-4" /> Reactivate
                                            </DropdownMenuItem>
                                        ) : (
                                            <DropdownMenuItem
                                                className="text-destructive focus:text-destructive"
                                                onClick={() => setSwitchingOff(u)}
                                            >
                                                <Power className="mr-2 h-4 w-4" /> Deactivate
                                            </DropdownMenuItem>
                                        )}
                                    </>
                                )}
                            </DropdownMenuContent>
                        </DropdownMenu>
                    );
                }}
            />

            <InviteDialog
                open={inviting}
                onOpenChange={setInviting}
                staff={withoutLogin}
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
            <ConfirmDialog
                open={!!switchingOff}
                onOpenChange={(o) => !o && setSwitchingOff(null)}
                title={`Deactivate ${switchingOff?.firstName ?? ''} ${switchingOff?.lastName ?? ''}?`}
                description="They will no longer be able to sign in. Their staff record, payslips and history stay; you can reactivate them later."
                confirmLabel="Deactivate"
                variant="destructive"
                loading={deactivate.isPending}
                onConfirm={async () => {
                    if (!switchingOff) return;
                    await deactivate.mutateAsync(switchingOff.id).then(
                        () => setSwitchingOff(null),
                        () => undefined,
                    );
                }}
            />
        </div>
    );
}
