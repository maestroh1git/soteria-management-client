'use client';

import { useState } from 'react';
import { Loader2, UserCheck, UserPlus, AlertCircle } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
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
    useCreateGuardian,
    useFindDuplicateGuardians,
    useLinkGuardian,
} from '@/lib/hooks/use-students';
import type { Guardian, GuardianRelationship } from '@/lib/api/students';

const RELATIONSHIPS: GuardianRelationship[] = [
    'MOTHER',
    'FATHER',
    'GUARDIAN',
    'SPONSOR',
    'OTHER',
];

interface Props {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    studentId: string;
    studentName: string;
    /** True when this child has no guardians yet — the first is primary. */
    isFirst: boolean;
}

/**
 * Attaching a guardian to a child.
 *
 * Built AROUND the duplicate check rather than offering it as a button nobody
 * presses. The phone number is asked first and the search runs before a name is
 * typed, because the failure it prevents is invisible: two siblings entered in
 * successive years become two copies of one parent, nothing looks wrong, and
 * sibling discounts then silently never apply — surfacing much later as a
 * parent disputing a bill.
 *
 * A match is never merged automatically. A household can share a number, and a
 * system that joined two families on that basis would be worse than the
 * duplicate it was avoiding. The registrar decides; the system only asks.
 */
export function AddGuardianDialog({
    open,
    onOpenChange,
    studentId,
    studentName,
    isFirst,
}: Props) {
    const [step, setStep] = useState<'phone' | 'choose' | 'details'>('phone');
    const [phone, setPhone] = useState('');
    const [matches, setMatches] = useState<Guardian[]>([]);
    const [chosen, setChosen] = useState<Guardian | null>(null);
    const [form, setForm] = useState({
        firstName: '',
        lastName: '',
        email: '',
        occupation: '',
    });
    const [relationship, setRelationship] =
        useState<GuardianRelationship>('MOTHER');
    const [isPrimary, setIsPrimary] = useState(isFirst);
    const [canCollect, setCanCollect] = useState(true);

    const search = useFindDuplicateGuardians();
    const createGuardian = useCreateGuardian();
    const link = useLinkGuardian(studentId);

    const reset = () => {
        setStep('phone');
        setPhone('');
        setMatches([]);
        setChosen(null);
        setForm({ firstName: '', lastName: '', email: '', occupation: '' });
        setRelationship('MOTHER');
        setIsPrimary(isFirst);
        setCanCollect(true);
    };

    const close = (v: boolean) => {
        if (!v) reset();
        onOpenChange(v);
    };

    const lookUp = async () => {
        const found = await search.mutateAsync(phone);
        setMatches(found);
        // Going straight past an empty result is fine — the check still ran.
        setStep(found.length ? 'choose' : 'details');
    };

    const submit = async () => {
        const guardian =
            chosen ??
            (await createGuardian.mutateAsync({
                firstName: form.firstName,
                lastName: form.lastName,
                phone,
                email: form.email || undefined,
                occupation: form.occupation || undefined,
            }));

        await link.mutateAsync({
            guardianId: guardian.id,
            relationship,
            isPrimary,
            // Passed explicitly. "May not collect this child" is a safeguarding
            // setting, and a control that silently does nothing is worse than
            // not offering one.
            canCollect,
        });
        close(false);
    };

    const canSubmit =
        chosen !== null ||
        (form.firstName.trim().length > 0 && form.lastName.trim().length > 0);
    const busy = createGuardian.isPending || link.isPending;
    const firstName = studentName.split(' ')[0];

    return (
        <Dialog open={open} onOpenChange={close}>
            <DialogContent className="max-w-lg">
                <DialogHeader>
                    <DialogTitle>Add a guardian for {studentName}</DialogTitle>
                    <DialogDescription>
                        {step === 'phone' &&
                            'Start with the phone number — it is how we tell whether this person is already on file.'}
                        {step === 'choose' &&
                            'Somebody with this number is already on file.'}
                        {step === 'details' && 'Their details.'}
                    </DialogDescription>
                </DialogHeader>

                {step === 'phone' && (
                    <div className="space-y-2">
                        <Label>Phone number</Label>
                        <Input
                            autoFocus
                            inputMode="tel"
                            placeholder="08031234567"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && phone.trim().length >= 7) lookUp();
                            }}
                        />
                        <p className="text-xs text-muted-foreground">
                            0803…, +234803… and 234 803… are treated as the same number.
                        </p>
                    </div>
                )}

                {step === 'choose' && (
                    <div className="space-y-3">
                        <div className="flex items-start gap-2 rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-200">
                            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                            <span>
                                If this is the same person, link them rather than adding a
                                second copy — otherwise the two children will not be seen as
                                siblings.
                            </span>
                        </div>

                        {matches.map((g) => (
                            <button
                                key={g.id}
                                type="button"
                                onClick={() => {
                                    setChosen(g);
                                    setStep('details');
                                }}
                                className="flex w-full items-center justify-between rounded-lg border p-3 text-left hover:bg-muted/50"
                            >
                                <div>
                                    <p className="font-medium">
                                        {g.firstName} {g.lastName}
                                    </p>
                                    <p className="text-sm text-muted-foreground">{g.phone}</p>
                                </div>
                                <Badge variant="secondary" className="gap-1">
                                    <UserCheck className="h-3 w-3" /> Use this person
                                </Badge>
                            </button>
                        ))}

                        <Button
                            variant="outline"
                            className="w-full"
                            onClick={() => {
                                setChosen(null);
                                setStep('details');
                            }}
                        >
                            <UserPlus className="mr-2 h-4 w-4" />
                            None of these — this is someone different
                        </Button>
                    </div>
                )}

                {step === 'details' && (
                    <div className="space-y-4">
                        {chosen ? (
                            <div className="rounded-lg border bg-muted/40 p-3">
                                <p className="font-medium">
                                    {chosen.firstName} {chosen.lastName}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                    {chosen.phone} · already on file
                                </p>
                            </div>
                        ) : (
                            <div className="grid gap-3 sm:grid-cols-2">
                                <div className="space-y-2">
                                    <Label>First name</Label>
                                    <Input
                                        autoFocus
                                        value={form.firstName}
                                        onChange={(e) =>
                                            setForm({ ...form, firstName: e.target.value })
                                        }
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Last name</Label>
                                    <Input
                                        value={form.lastName}
                                        onChange={(e) =>
                                            setForm({ ...form, lastName: e.target.value })
                                        }
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Email (optional)</Label>
                                    <Input
                                        type="email"
                                        value={form.email}
                                        onChange={(e) =>
                                            setForm({ ...form, email: e.target.value })
                                        }
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Occupation (optional)</Label>
                                    <Input
                                        value={form.occupation}
                                        onChange={(e) =>
                                            setForm({ ...form, occupation: e.target.value })
                                        }
                                    />
                                </div>
                            </div>
                        )}

                        <div className="space-y-2">
                            <Label>Relationship to {firstName}</Label>
                            <Select
                                value={relationship}
                                onValueChange={(v) =>
                                    setRelationship(v as GuardianRelationship)
                                }
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {RELATIONSHIPS.map((r) => (
                                        <SelectItem key={r} value={r}>
                                            {r.charAt(0) + r.slice(1).toLowerCase()}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <div className="flex items-start gap-2">
                                <Checkbox
                                    id="primary"
                                    checked={isPrimary}
                                    onCheckedChange={(v) => setIsPrimary(!!v)}
                                />
                                <div className="grid gap-1 leading-none">
                                    <Label htmlFor="primary" className="cursor-pointer">
                                        Primary contact
                                    </Label>
                                    <p className="text-xs text-muted-foreground">
                                        Who the school rings first. Setting this moves it off
                                        whoever holds it now.
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-start gap-2">
                                <Checkbox
                                    id="collect"
                                    checked={canCollect}
                                    onCheckedChange={(v) => setCanCollect(!!v)}
                                />
                                <Label htmlFor="collect" className="cursor-pointer">
                                    May collect {firstName} from school
                                </Label>
                            </div>
                        </div>
                    </div>
                )}

                <DialogFooter>
                    <Button variant="outline" onClick={() => close(false)}>
                        Cancel
                    </Button>
                    {step === 'phone' ? (
                        <Button
                            onClick={lookUp}
                            disabled={phone.trim().length < 7 || search.isPending}
                        >
                            {search.isPending && (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            )}
                            Continue
                        </Button>
                    ) : (
                        <Button onClick={submit} disabled={!canSubmit || busy}>
                            {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Add guardian
                        </Button>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
