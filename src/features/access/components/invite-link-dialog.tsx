'use client';

import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';

/** When mail is not set up, the invite link to pass on by hand. */
export function InviteLinkDialog({
    link,
    onClose,
}: {
    link: { name: string; url: string } | null;
    onClose: () => void;
}) {
    return (
        <Dialog open={!!link} onOpenChange={(o) => !o && onClose()}>
            <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle>Share this invite link</DialogTitle>
                    <DialogDescription>
                        Email isn&apos;t set up, so the invite could not be sent. Give this link to{' '}
                        {link?.name}; it lets them set their password and sign in, and expires in 7
                        days.
                    </DialogDescription>
                </DialogHeader>
                <div className="flex items-center gap-2">
                    <Input readOnly value={link?.url ?? ''} className="font-mono text-xs" aria-label="Invite link" />
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                            if (link) {
                                navigator.clipboard?.writeText(link.url);
                                toast.success('Invite link copied');
                            }
                        }}
                    >
                        Copy
                    </Button>
                </div>
                <DialogFooter>
                    <Button onClick={onClose}>Done</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
