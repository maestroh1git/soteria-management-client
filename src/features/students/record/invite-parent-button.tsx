'use client';

import { useState } from 'react';
import { Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { useInviteGuardian } from '@/lib/hooks/use-users';
import { InviteLinkDialog } from '@/features/access/components/invite-link-dialog';

/**
 * Giving a parent a login (decision D4, roadmap 5.9).
 *
 * On the guardian rather than in Team & access, because this is where
 * somebody is already looking at the person, and the registrar who keeps the
 * guardians may send it. The parent sets their own password; if mail is not
 * set up, the link comes back for the office to pass on by hand.
 */
export function InviteParentButton({
    guardianId,
    firstName,
    lastName,
    email,
}: {
    guardianId: string;
    firstName: string;
    lastName: string;
    email?: string | null;
}) {
    const [open, setOpen] = useState(false);
    const [address, setAddress] = useState(email ?? '');
    const [link, setLink] = useState<{ name: string; url: string } | null>(null);
    const invite = useInviteGuardian();

    const send = () =>
        invite.mutate(
            { guardianId, email: address.trim() },
            {
                onSuccess: (res) => {
                    setOpen(false);
                    if (!res.emailed && res.inviteUrl)
                        setLink({ name: `${firstName} ${lastName}`, url: res.inviteUrl });
                },
            },
        );

    return (
        <>
            <Button
                variant="outline"
                size="sm"
                onClick={() => {
                    setAddress(email ?? '');
                    setOpen(true);
                }}
            >
                <Mail className="mr-2 h-3.5 w-3.5" />
                Invite to portal
            </Button>

            <InviteLinkDialog link={link} onClose={() => setLink(null)} />

            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>
                            Invite {firstName} {lastName} to the parent portal
                        </DialogTitle>
                        <DialogDescription>
                            They get a link to set their own password, and can then see every child of
                            theirs on the roll: fees, payments and what is still owed. You never set a
                            password for them.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-2">
                        <Label htmlFor={`invite-${guardianId}`}>Email</Label>
                        <Input
                            id={`invite-${guardianId}`}
                            type="email"
                            value={address}
                            placeholder="parent@example.com"
                            onChange={(e) => setAddress(e.target.value)}
                        />
                        <p className="text-xs text-muted-foreground">
                            Where the invite goes. It does not have to match the number the school
                            rings.
                        </p>
                    </div>

                    <DialogFooter>
                        <Button variant="ghost" onClick={() => setOpen(false)}>
                            Cancel
                        </Button>
                        <Button onClick={send} disabled={invite.isPending || !address.trim()}>
                            Send invite
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
