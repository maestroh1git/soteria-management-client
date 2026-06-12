'use client';

import { useState } from 'react';
import { Loader2 } from 'lucide-react';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

/**
 * Reject a tenant's KYB with a required reason. The backend rejects the request
 * if the reason is empty (status REJECTED → reason mandatory).
 */
export function RejectKybDialog({
  open,
  onOpenChange,
  tenantName,
  loading,
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tenantName: string | undefined;
  loading: boolean;
  onConfirm: (reason: string) => void | Promise<void>;
}) {
  const [reason, setReason] = useState('');
  const trimmed = reason.trim();

  // Clear the field on close so the next tenant starts blank (avoids a
  // reset-in-effect, which the React Compiler lint disallows).
  function handleOpenChange(next: boolean) {
    if (!next) setReason('');
    onOpenChange(next);
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Reject KYB</DialogTitle>
          <DialogDescription>
            {tenantName
              ? `Reject KYB for "${tenantName}". They'll see this reason and need to resubmit.`
              : 'Provide a reason for rejection.'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2">
          <Label htmlFor="kyb-rejection-reason">Reason</Label>
          <Textarea
            id="kyb-rejection-reason"
            placeholder="e.g. CAC number could not be verified against the registry."
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={4}
            maxLength={1000}
            autoFocus
          />
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => handleOpenChange(false)}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            disabled={!trimmed || loading}
            onClick={async () => {
              // Clears only on success; a failed mutation keeps the text for retry.
              await onConfirm(trimmed);
              setReason('');
            }}
          >
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Reject KYB
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
