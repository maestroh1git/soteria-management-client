'use client';

import { useEffect, useMemo, useState } from 'react';
import { Plus, Copy, Loader2, Info } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { EmptyState } from '@/components/common/empty-state';
import { useSessions } from '@/lib/hooks/use-academics';
import { useAccounts } from '@/lib/hooks/use-finance';
import {
    useCopyTermPrices,
    useCreateFeeItem,
    useFeeItems,
    useFeeProjection,
    usePriceList,
    useRemoveFeeItem,
    useSetFeePrice,
} from '@/lib/hooks/use-fees';
import type { FeeCategory } from '@/lib/api/fees';

/** Groups digits without parsing the string into a float. */
const money = (v: string) => {
    const [whole, fraction = '00'] = (v ?? '0').split('.');
    const sign = whole.startsWith('-') ? '-' : '';
    return `${sign}${whole.replace('-', '').replace(/\B(?=(\d{3})+(?!\d))/g, ',')}.${fraction}`;
};

const CATEGORIES: FeeCategory[] = [
    'TUITION',
    'BOARDING',
    'TRANSPORT',
    'LEVY',
    'MATERIALS',
    'OTHER',
];

/**
 * The fee catalogue and the price list.
 *
 * The grid is the point. A bursar comparing this term against last term reads
 * across a row, and a price list split over one-fee-at-a-time forms is one
 * nobody checks — they keep the real one in Excel and the system holds a copy
 * that is wrong.
 *
 * Nothing on this page bills anybody. Invoicing is S2.
 */
export default function FeesPage() {
    const { data: sessions } = useSessions();
    const [sessionId, setSessionId] = useState<string>();
    const [termId, setTermId] = useState<string>();

    const { data: priceList, isLoading } = usePriceList(sessionId);
    const { data: projection } = useFeeProjection(sessionId);
    const { data: items } = useFeeItems(true);
    const { data: accounts } = useAccounts();
    const setPrice = useSetFeePrice();

    const [addOpen, setAddOpen] = useState(false);
    const [copyOpen, setCopyOpen] = useState(false);

    // Default to the current session, then to the first one there is.
    useEffect(() => {
        if (!sessionId && sessions?.length) {
            setSessionId((sessions.find((s) => s.isCurrent) ?? sessions[0]).id);
        }
    }, [sessions, sessionId]);

    useEffect(() => {
        if (priceList?.terms.length && !priceList.terms.some((t) => t.id === termId)) {
            setTermId(priceList.terms[0].id);
        }
    }, [priceList, termId]);

    /** (level, item) → price, for the term on screen. */
    const cells = useMemo(() => {
        const map = new Map<string, { id: string; amount: string }>();
        for (const p of priceList?.prices ?? []) {
            if (p.termId === termId) {
                map.set(`${p.classLevelId}:${p.feeItemId}`, {
                    id: p.id,
                    amount: p.amount,
                });
            }
        }
        return map;
    }, [priceList, termId]);

    const termProjection = projection?.terms.find((t) => t.termId === termId);
    const revenueAccounts = (accounts ?? []).filter((a) => a.type === 'REVENUE');

    const rowTotal = (levelId: string) =>
        (priceList?.items ?? [])
            .filter((i) => !i.isOptional)
            .reduce((kobo, item) => {
                const cell = cells.get(`${levelId}:${item.id}`);
                return kobo + Math.round(Number(cell?.amount ?? 0) * 100);
            }, 0);

    return (
        <div className="space-y-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-semibold tracking-tight">Fees</h1>
                    <p className="text-sm text-muted-foreground">
                        What the school charges, and what it costs per class each term.
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <Select value={sessionId} onValueChange={setSessionId}>
                        <SelectTrigger className="w-44">
                            <SelectValue placeholder="Session" />
                        </SelectTrigger>
                        <SelectContent>
                            {(sessions ?? []).map((s) => (
                                <SelectItem key={s.id} value={s.id}>
                                    {s.name}
                                    {s.isCurrent ? ' (current)' : ''}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>

            <Tabs defaultValue="prices">
                <TabsList>
                    <TabsTrigger value="prices">Price list</TabsTrigger>
                    <TabsTrigger value="catalogue">Fees charged</TabsTrigger>
                </TabsList>

                {/* ── Price list ───────────────────────────────────────── */}
                <TabsContent value="prices" className="space-y-4 pt-4">
                    {projection && (
                        <Card>
                            <CardHeader className="pb-3">
                                <CardTitle className="text-base">
                                    If every child on the roll were billed
                                </CardTitle>
                                <CardDescription>
                                    The number to hold against what you expect to bill.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                <div className="flex flex-wrap gap-6">
                                    <div>
                                        <p className="text-xs text-muted-foreground">
                                            Whole session
                                        </p>
                                        <p className="text-2xl font-bold tabular-nums">
                                            ₦{money(projection.projectedTotal)}
                                        </p>
                                    </div>
                                    {projection.terms.map((t) => (
                                        <div key={t.termId}>
                                            <p className="text-xs text-muted-foreground">
                                                {t.termName}
                                            </p>
                                            <p className="text-lg font-semibold tabular-nums">
                                                ₦{money(t.projected)}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                                <p className="flex items-start gap-2 text-xs text-muted-foreground">
                                    <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                                    {projection.excludes}
                                </p>
                            </CardContent>
                        </Card>
                    )}

                    <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex flex-wrap gap-1">
                            {(priceList?.terms ?? []).map((t) => (
                                <Button
                                    key={t.id}
                                    variant={t.id === termId ? 'default' : 'outline'}
                                    size="sm"
                                    onClick={() => setTermId(t.id)}
                                >
                                    {t.name}
                                </Button>
                            ))}
                        </div>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCopyOpen(true)}
                            disabled={(priceList?.terms.length ?? 0) < 2}
                        >
                            <Copy className="mr-2 h-4 w-4" />
                            Copy from another term
                        </Button>
                    </div>

                    {isLoading ? (
                        <div className="flex justify-center py-12">
                            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                        </div>
                    ) : !priceList?.levels.length || !priceList?.items.length ? (
                        <EmptyState
                            title="Nothing to price yet"
                            description={
                                !priceList?.levels.length
                                    ? 'Add class levels under Classes first — fees are set per level.'
                                    : 'Add what the school charges on the "Fees charged" tab.'
                            }
                        />
                    ) : (
                        <Card>
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead className="border-b bg-muted/40">
                                        <tr>
                                            <th className="sticky left-0 z-10 bg-muted/40 px-4 py-3 text-left font-medium">
                                                Class
                                            </th>
                                            {priceList.items.map((item) => (
                                                <th
                                                    key={item.id}
                                                    className="px-3 py-3 text-right font-medium"
                                                >
                                                    <div className="whitespace-nowrap">
                                                        {item.name}
                                                    </div>
                                                    {item.isOptional && (
                                                        <span className="text-[10px] font-normal text-muted-foreground">
                                                            optional
                                                        </span>
                                                    )}
                                                    {item.appliesTo === 'NEW_STUDENTS' && (
                                                        <span className="text-[10px] font-normal text-muted-foreground">
                                                            new students
                                                        </span>
                                                    )}
                                                </th>
                                            ))}
                                            <th className="px-4 py-3 text-right font-medium">
                                                Per student
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y">
                                        {priceList.levels.map((level) => (
                                            <tr key={level.id}>
                                                <td className="sticky left-0 z-10 bg-background px-4 py-2 font-medium">
                                                    {level.name}
                                                </td>
                                                {priceList.items.map((item) => {
                                                    const cell = cells.get(
                                                        `${level.id}:${item.id}`,
                                                    );
                                                    return (
                                                        <td key={item.id} className="px-2 py-1.5">
                                                            <PriceCell
                                                                value={cell?.amount ?? ''}
                                                                saving={setPrice.isPending}
                                                                onCommit={(amount) => {
                                                                    if (!termId) return;
                                                                    setPrice.mutate({
                                                                        termId,
                                                                        classLevelId: level.id,
                                                                        feeItemId: item.id,
                                                                        amount,
                                                                    });
                                                                }}
                                                            />
                                                        </td>
                                                    );
                                                })}
                                                <td className="px-4 py-2 text-right font-semibold tabular-nums">
                                                    ₦{money((rowTotal(level.id) / 100).toFixed(2))}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                            <div className="border-t px-4 py-2 text-xs text-muted-foreground">
                                Per student counts mandatory fees only.
                                {termProjection
                                    ? ` ${termProjection.levels.reduce((n, l) => n + l.students, 0)} children on the roll this term.`
                                    : ''}
                            </div>
                        </Card>
                    )}
                </TabsContent>

                {/* ── Catalogue ────────────────────────────────────────── */}
                <TabsContent value="catalogue" className="space-y-4 pt-4">
                    <div className="flex justify-end">
                        <Button size="sm" onClick={() => setAddOpen(true)}>
                            <Plus className="mr-2 h-4 w-4" />
                            Add a fee
                        </Button>
                    </div>

                    {!items?.length ? (
                        <EmptyState
                            title="No fees yet"
                            description="Tuition, boarding, the bus, levies — whatever the school charges for."
                        />
                    ) : (
                        <Card>
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead className="border-b bg-muted/40">
                                        <tr>
                                            <th className="px-4 py-3 text-left font-medium">Fee</th>
                                            <th className="px-4 py-3 text-left font-medium">
                                                Category
                                            </th>
                                            <th className="px-4 py-3 text-left font-medium">
                                                Credits
                                            </th>
                                            <th className="px-4 py-3 text-left font-medium">
                                                Charged to
                                            </th>
                                            <th className="px-4 py-3" />
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y">
                                        {items.map((item) => (
                                            <FeeRow key={item.id} item={item} />
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </Card>
                    )}
                </TabsContent>
            </Tabs>

            <AddFeeDialog
                open={addOpen}
                onOpenChange={setAddOpen}
                revenueAccounts={revenueAccounts}
            />
            <CopyTermDialog
                open={copyOpen}
                onOpenChange={setCopyOpen}
                terms={priceList?.terms ?? []}
                currentTermId={termId}
            />
        </div>
    );
}

/**
 * One editable price.
 *
 * Commits on blur rather than on every keystroke — a request per character
 * would be both wasteful and a race, and a bursar tabbing across a row expects
 * the previous cell to have saved. Unchanged values do not fire at all.
 */
function PriceCell({
    value,
    saving,
    onCommit,
}: {
    value: string;
    saving: boolean;
    onCommit: (amount: number) => void;
}) {
    const [draft, setDraft] = useState(value);

    useEffect(() => setDraft(value), [value]);

    return (
        <Input
            value={draft}
            inputMode="decimal"
            disabled={saving}
            className="h-8 w-28 text-right tabular-nums"
            placeholder="—"
            onChange={(e) => setDraft(e.target.value)}
            onBlur={() => {
                const trimmed = draft.trim();
                if (trimmed === (value ?? '').trim()) return;
                const amount = Number(trimmed);
                if (trimmed === '' || Number.isNaN(amount) || amount < 0) {
                    setDraft(value);
                    return;
                }
                onCommit(amount);
            }}
        />
    );
}

function FeeRow({ item }: { item: NonNullable<ReturnType<typeof useFeeItems>['data']>[number] }) {
    const remove = useRemoveFeeItem();

    return (
        <tr className={item.active ? '' : 'opacity-50'}>
            <td className="px-4 py-3">
                <div className="font-medium">{item.name}</div>
                <div className="text-xs text-muted-foreground">{item.code}</div>
            </td>
            <td className="px-4 py-3">
                <Badge variant="outline">{item.category}</Badge>
            </td>
            <td className="px-4 py-3 text-muted-foreground">
                {item.revenueAccount?.name ?? '—'}
            </td>
            <td className="px-4 py-3">
                <div className="flex flex-wrap gap-1">
                    {item.isOptional ? (
                        <Badge variant="secondary">Only children who take it</Badge>
                    ) : (
                        <Badge variant="secondary">Everyone in the class</Badge>
                    )}
                    {item.appliesTo === 'NEW_STUDENTS' && (
                        <Badge variant="secondary">New students</Badge>
                    )}
                    {!item.active && <Badge variant="outline">Retired</Badge>}
                </div>
            </td>
            <td className="px-4 py-3 text-right">
                {item.active && (
                    <Button
                        variant="ghost"
                        size="sm"
                        disabled={remove.isPending}
                        onClick={() => remove.mutate(item.id)}
                    >
                        Retire
                    </Button>
                )}
            </td>
        </tr>
    );
}

function AddFeeDialog({
    open,
    onOpenChange,
    revenueAccounts,
}: {
    open: boolean;
    onOpenChange: (v: boolean) => void;
    revenueAccounts: Array<{ id: string; code: string; name: string }>;
}) {
    const create = useCreateFeeItem();
    const [code, setCode] = useState('');
    const [name, setName] = useState('');
    const [category, setCategory] = useState<FeeCategory>('TUITION');
    const [revenueAccountId, setRevenueAccountId] = useState('');
    const [isOptional, setIsOptional] = useState(false);
    const [newStudentsOnly, setNewStudentsOnly] = useState(false);

    const reset = () => {
        setCode('');
        setName('');
        setCategory('TUITION');
        setRevenueAccountId('');
        setIsOptional(false);
        setNewStudentsOnly(false);
    };

    const submit = async () => {
        await create.mutateAsync({
            code: code.trim().toUpperCase(),
            name: name.trim(),
            category,
            revenueAccountId,
            isOptional,
            appliesTo: newStudentsOnly ? 'NEW_STUDENTS' : 'ALL',
        });
        reset();
        onOpenChange(false);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Add a fee</DialogTitle>
                    <DialogDescription>
                        What it costs comes later — that depends on the class and the term.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                            <Label htmlFor="fee-name">Name</Label>
                            <Input
                                id="fee-name"
                                value={name}
                                placeholder="Tuition"
                                onChange={(e) => setName(e.target.value)}
                            />
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="fee-code">Short code</Label>
                            <Input
                                id="fee-code"
                                value={code}
                                placeholder="TUITION"
                                onChange={(e) => setCode(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <Label>Category</Label>
                        <Select
                            value={category}
                            onValueChange={(v) => setCategory(v as FeeCategory)}
                        >
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {CATEGORIES.map((c) => (
                                    <SelectItem key={c} value={c}>
                                        {c.charAt(0) + c.slice(1).toLowerCase()}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-1.5">
                        <Label>Income account</Label>
                        <Select
                            value={revenueAccountId}
                            onValueChange={setRevenueAccountId}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Which income this is" />
                            </SelectTrigger>
                            <SelectContent>
                                {revenueAccounts.map((a) => (
                                    <SelectItem key={a.id} value={a.id}>
                                        {a.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <p className="text-xs text-muted-foreground">
                            This is what makes &ldquo;how much did we earn from
                            transport&rdquo; answerable from the books.
                        </p>
                    </div>

                    <div className="space-y-2">
                        <label className="flex items-start gap-2 text-sm">
                            <Checkbox
                                checked={isOptional}
                                onCheckedChange={(v) => setIsOptional(v === true)}
                            />
                            <span>
                                Only children who take it
                                <span className="block text-xs text-muted-foreground">
                                    The bus, boarding. Otherwise everyone in the class is
                                    charged.
                                </span>
                            </span>
                        </label>
                        <label className="flex items-start gap-2 text-sm">
                            <Checkbox
                                checked={newStudentsOnly}
                                onCheckedChange={(v) => setNewStudentsOnly(v === true)}
                            />
                            <span>
                                New students only
                                <span className="block text-xs text-muted-foreground">
                                    Admission fees, caution deposits — charged in a child&apos;s
                                    first term.
                                </span>
                            </span>
                        </label>
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                        Cancel
                    </Button>
                    <Button
                        onClick={submit}
                        disabled={
                            !name.trim() ||
                            !code.trim() ||
                            !revenueAccountId ||
                            create.isPending
                        }
                    >
                        {create.isPending && (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        )}
                        Add fee
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

function CopyTermDialog({
    open,
    onOpenChange,
    terms,
    currentTermId,
}: {
    open: boolean;
    onOpenChange: (v: boolean) => void;
    terms: Array<{ id: string; name: string }>;
    currentTermId?: string;
}) {
    const copy = useCopyTermPrices();
    const [fromTermId, setFromTermId] = useState('');
    const [overwrite, setOverwrite] = useState(false);

    const submit = async () => {
        if (!currentTermId) return;
        await copy.mutateAsync({ fromTermId, toTermId: currentTermId, overwrite });
        setFromTermId('');
        setOverwrite(false);
        onOpenChange(false);
    };

    const target = terms.find((t) => t.id === currentTermId);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Copy prices into {target?.name}</DialogTitle>
                    <DialogDescription>
                        Prices already set here are left alone unless you say otherwise.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                    <div className="space-y-1.5">
                        <Label>Copy from</Label>
                        <Select value={fromTermId} onValueChange={setFromTermId}>
                            <SelectTrigger>
                                <SelectValue placeholder="Which term" />
                            </SelectTrigger>
                            <SelectContent>
                                {terms
                                    .filter((t) => t.id !== currentTermId)
                                    .map((t) => (
                                        <SelectItem key={t.id} value={t.id}>
                                            {t.name}
                                        </SelectItem>
                                    ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <label className="flex items-start gap-2 text-sm">
                        <Checkbox
                            checked={overwrite}
                            onCheckedChange={(v) => setOverwrite(v === true)}
                        />
                        <span>
                            Replace prices already set here
                            <span className="block text-xs text-muted-foreground">
                                Off by default, so a figure somebody has already corrected
                                is not quietly overwritten.
                            </span>
                        </span>
                    </label>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                        Cancel
                    </Button>
                    <Button
                        onClick={submit}
                        disabled={!fromTermId || !currentTermId || copy.isPending}
                    >
                        {copy.isPending && (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        )}
                        Copy
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
