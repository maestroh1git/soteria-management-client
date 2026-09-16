'use client';

import { useState } from 'react';
import { Award as AwardIcon, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { useAwards, useCreateAward } from '@/lib/hooks/use-attendance';
import {
    AWARD_CATEGORY_LABELS,
    type AwardCategory,
} from '@/lib/api/attendance';

const CATEGORIES = Object.keys(AWARD_CATEGORY_LABELS) as AwardCategory[];

/**
 * Record an award.
 *
 * Two things this has to say out loud, because the data model already decided
 * them and nothing has ever surfaced either:
 *
 *   - whether the parent sees it. `visibleToParent` exists precisely so a school
 *     can keep an internal commendation internal, and it defaults to shared.
 *   - what it does next. Awards drive the "Recognised" badges, so granting one
 *     changes what a parent is shown — the running count says so rather than
 *     letting it be a surprise.
 */
export function AwardDialog({
    open,
    onOpenChange,
    studentId,
    pupilName,
    termId,
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    studentId: string;
    pupilName: string;
    termId?: string | null;
}) {
    const today = new Date().toISOString().slice(0, 10);
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [category, setCategory] = useState<AwardCategory>('ACADEMIC');
    const [awardedOn, setAwardedOn] = useState(today);
    const [visibleToParent, setVisibleToParent] = useState(true);

    const { data: existing = [] } = useAwards(open ? studentId : undefined);
    const create = useCreateAward(studentId);

    const nth = existing.length + 1;
    const suffix =
        nth % 10 === 1 && nth !== 11
            ? 'st'
            : nth % 10 === 2 && nth !== 12
              ? 'nd'
              : nth % 10 === 3 && nth !== 13
                ? 'rd'
                : 'th';
    const first = pupilName.split(/[,\s]+/).filter(Boolean).pop() ?? pupilName;

    const reset = () => {
        setTitle('');
        setDescription('');
        setCategory('ACADEMIC');
        setAwardedOn(today);
        setVisibleToParent(true);
    };

    return (
        <Dialog
            open={open}
            onOpenChange={(o) => {
                onOpenChange(o);
                if (!o) reset();
            }}
        >
            <DialogContent>
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <AwardIcon className="h-4 w-4" aria-hidden="true" />
                        Recognise {pupilName}
                    </DialogTitle>
                    <DialogDescription>
                        This will be {first}&apos;s{' '}
                        <strong>
                            {nth}
                            {suffix}
                        </strong>{' '}
                        award.
                        {nth === 3
                            ? ' Their parent will see the “Recognised three times” badge.'
                            : nth === 1
                              ? ' Their parent will see the “Recognised” badge.'
                              : ''}
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="award-title">What is it for?</Label>
                        <Input
                            id="award-title"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="Reading Prize"
                            autoFocus
                        />
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-2">
                            <Label htmlFor="award-category">Kind</Label>
                            <Select
                                value={category}
                                onValueChange={(v) => setCategory(v as AwardCategory)}
                            >
                                <SelectTrigger id="award-category">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {CATEGORIES.map((c) => (
                                        <SelectItem key={c} value={c}>
                                            {AWARD_CATEGORY_LABELS[c]}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="award-date">Given on</Label>
                            <Input
                                id="award-date"
                                type="date"
                                max={today}
                                value={awardedOn}
                                onChange={(e) => setAwardedOn(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="award-description">
                            A note (optional)
                        </Label>
                        <Textarea
                            id="award-description"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="What they did"
                            rows={2}
                        />
                    </div>

                    <div className="flex items-start gap-2">
                        <Checkbox
                            id="award-visible"
                            checked={visibleToParent}
                            onCheckedChange={(v) => setVisibleToParent(v === true)}
                        />
                        <div>
                            <Label htmlFor="award-visible" className="font-normal">
                                Share with {first}&apos;s parents
                            </Label>
                            <p className="text-xs text-muted-foreground">
                                Unchecked, it stays an internal record and never
                                reaches the portal.
                            </p>
                        </div>
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                        Cancel
                    </Button>
                    <Button
                        disabled={!title.trim() || create.isPending}
                        onClick={() =>
                            create.mutate(
                                {
                                    title: title.trim(),
                                    description: description.trim() || undefined,
                                    category,
                                    awardedOn,
                                    termId: termId ?? undefined,
                                    visibleToParent,
                                },
                                {
                                    onSuccess: () => {
                                        onOpenChange(false);
                                        reset();
                                    },
                                },
                            )
                        }
                    >
                        {create.isPending && (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        )}
                        Record award
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
