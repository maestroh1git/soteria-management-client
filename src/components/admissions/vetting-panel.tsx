'use client';

import { useState } from 'react';
import { Check, Flag, Loader2, X } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    useClearFlag,
    useCriteriaVerdict,
    useFlags,
    useRaiseFlag,
} from '@/lib/hooks/use-admissions';
import type { FlagKind } from '@/lib/api/admissions';

const FLAG_LABEL: Record<FlagKind, string> = {
    SPECIAL_NEEDS: 'Support need',
    TALENT: 'Talent',
    SIBLING: 'Sibling here',
    STAFF_CHILD: 'Staff child',
};

/** The two that change what the school must do have to say what. */
const NEEDS_DETAIL: FlagKind[] = ['SPECIAL_NEEDS', 'TALENT'];

const CHECK_LABEL: Record<string, string> = {
    AGE: 'Age',
    EXAM_SCORE: 'Entrance exam',
    INTERVIEW: 'Interview',
    CAPACITY: 'Places',
};

/**
 * What vetting turned up, and how the candidate measures against the standard.
 *
 * The criteria strip is advisory and says so. Nothing here blocks a decision —
 * the server does not either, deliberately, because a school that cannot
 * override its own criteria stops recording them.
 */
export function VettingPanel({
    applicationId,
    canEdit,
}: {
    applicationId: string;
    canEdit: boolean;
}) {
    const { data: flags } = useFlags(applicationId);
    const { data: verdict } = useCriteriaVerdict(applicationId);
    const raise = useRaiseFlag(applicationId);
    const clear = useClearFlag(applicationId);

    const [open, setOpen] = useState(false);
    const [kind, setKind] = useState<FlagKind>('SPECIAL_NEEDS');
    const [detail, setDetail] = useState('');

    const alreadyRaised = new Set((flags ?? []).map((f) => f.kind));
    const detailRequired = NEEDS_DETAIL.includes(kind);

    return (
        <Card>
            <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0">
                <div>
                    <CardTitle className="text-lg">Vetting</CardTitle>
                    <CardDescription>
                        What the school should know, and how this candidate
                        measures up
                    </CardDescription>
                </div>
                {canEdit && (
                    <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setOpen(true)}
                        disabled={alreadyRaised.size >= 4}
                        title={
                            alreadyRaised.size >= 4
                                ? 'Everything that can be raised already has been'
                                : undefined
                        }
                    >
                        <Flag className="mr-2 h-4 w-4" />
                        Raise
                    </Button>
                )}
            </CardHeader>

            <CardContent className="space-y-4">
                <div>
                    {(flags ?? []).length === 0 ? (
                        <p className="text-sm text-muted-foreground">
                            Nothing raised.
                        </p>
                    ) : (
                        <div className="space-y-2">
                            {(flags ?? []).map((flag) => (
                                <div
                                    key={flag.id}
                                    className="flex items-start gap-2 text-sm"
                                >
                                    <Badge variant="secondary">
                                        {FLAG_LABEL[flag.kind]}
                                    </Badge>
                                    {flag.detail && (
                                        <span className="flex-1">
                                            {flag.detail}
                                        </span>
                                    )}
                                    {canEdit && (
                                        <Button
                                            size="icon"
                                            variant="ghost"
                                            className="h-6 w-6 shrink-0"
                                            aria-label={`Clear ${FLAG_LABEL[flag.kind]}`}
                                            onClick={() => clear.mutate(flag.id)}
                                        >
                                            <X className="h-3.5 w-3.5" />
                                        </Button>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {verdict && (
                    <div className="rounded-lg border p-3">
                        <p className="text-sm font-medium">
                            {verdict.metCount} of {verdict.total} criteria met
                            <span className="ml-2 font-normal text-muted-foreground">
                                — for guidance; it decides nothing
                            </span>
                        </p>
                        <div className="mt-2 space-y-1">
                            {verdict.checks.map((check) => (
                                <div
                                    key={check.code}
                                    className="flex items-center gap-2 text-sm"
                                >
                                    {check.met ? (
                                        <Check className="h-3.5 w-3.5 shrink-0 text-green-600" />
                                    ) : (
                                        <X className="h-3.5 w-3.5 shrink-0 text-amber-600" />
                                    )}
                                    <span className="w-28 shrink-0 text-muted-foreground">
                                        {CHECK_LABEL[check.code] ?? check.code}
                                    </span>
                                    <span>
                                        {check.actual}
                                        <span className="text-muted-foreground">
                                            {' '}
                                            · wanted {check.expected}
                                        </span>
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </CardContent>

            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Raise something</DialogTitle>
                        <DialogDescription>
                            A support need follows the child onto their record
                            when they enrol.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label>What</Label>
                            <Select
                                value={kind}
                                onValueChange={(v) => setKind(v as FlagKind)}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {(
                                        Object.keys(FLAG_LABEL) as FlagKind[]
                                    ).map((k) => (
                                        <SelectItem
                                            key={k}
                                            value={k}
                                            disabled={alreadyRaised.has(k)}
                                        >
                                            {FLAG_LABEL[k]}
                                            {alreadyRaised.has(k) &&
                                                ' — already raised'}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="flag-detail">
                                Detail
                                {!detailRequired && (
                                    <span className="ml-1 font-normal text-muted-foreground">
                                        (optional)
                                    </span>
                                )}
                            </Label>
                            <Textarea
                                id="flag-detail"
                                value={detail}
                                onChange={(e) => setDetail(e.target.value)}
                                placeholder={
                                    detailRequired
                                        ? 'Say what, so the next person knows'
                                        : 'Anything worth adding'
                                }
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setOpen(false)}
                        >
                            Cancel
                        </Button>
                        <Button
                            disabled={
                                raise.isPending ||
                                (detailRequired && !detail.trim())
                            }
                            title={
                                detailRequired && !detail.trim()
                                    ? 'A box ticked with nothing beside it tells the next person nothing'
                                    : undefined
                            }
                            onClick={async () => {
                                await raise.mutateAsync({
                                    kind,
                                    detail: detail.trim() || undefined,
                                });
                                setOpen(false);
                                setDetail('');
                            }}
                        >
                            {raise.isPending && (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            )}
                            Raise
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </Card>
    );
}
