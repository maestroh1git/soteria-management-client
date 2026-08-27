'use client';

import { useMemo, useState } from 'react';
import { Plus, Pencil, Trash2, Loader2, Search } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { LoadingSkeleton } from '@/components/common/loading-skeleton';
import { EmptyState } from '@/components/common/empty-state';
import {
    useBanks,
    useCreateBank,
    useUpdateBank,
    useDeleteBank,
} from '@/lib/hooks/use-banks';
import { useAuth } from '@/lib/hooks/use-auth';
import type { Bank } from '@/lib/api/banks';

const EMPTY = { name: '', code: '' };

export default function BanksPage() {
    const { hasRole } = useAuth();
    const canManage = hasRole(['tenant_owner', 'ADMIN', 'PAYROLL_OFFICER']);

    const { data: banks = [], isLoading } = useBanks();
    const create = useCreateBank();
    const update = useUpdateBank();
    const remove = useDeleteBank();

    const [query, setQuery] = useState('');
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editing, setEditing] = useState<Bank | null>(null);
    const [form, setForm] = useState(EMPTY);
    const [confirmDelete, setConfirmDelete] = useState<Bank | null>(null);

    const filtered = useMemo(() => {
        const q = query.trim().toLowerCase();
        if (!q) return banks;
        return banks.filter(
            (b) =>
                b.name.toLowerCase().includes(q) || b.code.toLowerCase().includes(q),
        );
    }, [banks, query]);

    const customCount = banks.filter((b) => b.custom).length;

    const startAdd = () => {
        setEditing(null);
        setForm(EMPTY);
        setDialogOpen(true);
    };

    const startEdit = (bank: Bank) => {
        setEditing(bank);
        setForm({ name: bank.name, code: bank.code });
        setDialogOpen(true);
    };

    const complete = form.name.trim() && form.code.trim();
    const saving = create.isPending || update.isPending;

    const submit = async () => {
        if (!complete) return;
        const dto = { name: form.name.trim(), code: form.code.trim() };
        if (editing?.id) {
            await update.mutateAsync({ id: editing.id, dto });
        } else {
            await create.mutateAsync(dto);
        }
        setDialogOpen(false);
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Banks</h1>
                    <p className="text-sm text-muted-foreground">
                        The institutions staff are paid at. The standard list is built in;
                        add any bank it does not yet name.
                    </p>
                </div>
                {canManage && (
                    <Button onClick={startAdd} className="gap-2">
                        <Plus className="h-4 w-4" />
                        Add bank
                    </Button>
                )}
            </div>

            {/* Search */}
            <div className="relative max-w-sm">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                    className="pl-9"
                    placeholder="Search by name or code…"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                />
            </div>

            {/* List */}
            {isLoading ? (
                <LoadingSkeleton rows={6} />
            ) : filtered.length === 0 ? (
                <EmptyState
                    title="No banks match"
                    description="Try a different name or NIBSS code."
                />
            ) : (
                <div className="rounded-md border overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b bg-muted/50">
                                <th className="px-4 py-3 text-left font-medium">Bank</th>
                                <th className="px-4 py-3 text-left font-medium">Code</th>
                                <th className="px-4 py-3 text-left font-medium">Source</th>
                                {canManage && <th className="px-4 py-3" />}
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.map((bank) => (
                                <tr key={bank.custom ? bank.id : bank.code} className="border-b">
                                    <td className="px-4 py-3 font-medium">{bank.name}</td>
                                    <td className="px-4 py-3 tabular-nums text-muted-foreground">
                                        {bank.code}
                                    </td>
                                    <td className="px-4 py-3">
                                        {bank.custom ? (
                                            <Badge variant="secondary">Custom</Badge>
                                        ) : (
                                            <Badge variant="outline">Standard</Badge>
                                        )}
                                    </td>
                                    {canManage && (
                                        <td className="px-4 py-3">
                                            {bank.custom && (
                                                <div className="flex justify-end gap-1">
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => startEdit(bank)}
                                                        aria-label="Edit bank"
                                                    >
                                                        <Pencil className="h-4 w-4" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => setConfirmDelete(bank)}
                                                        aria-label="Remove bank"
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            )}
                                        </td>
                                    )}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {!isLoading && (
                <p className="text-xs text-muted-foreground">
                    {banks.length} banks · {customCount} added by you
                </p>
            )}

            {/* Add / edit */}
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>
                            {editing ? 'Edit bank' : 'Add bank'}
                        </DialogTitle>
                        <DialogDescription>
                            The code is the 3-digit NIBSS institution code a payment file is
                            matched on — a wrong code sends money to the wrong bank, so
                            confirm it against the bank itself.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label>Bank name</Label>
                            <Input
                                placeholder="e.g. PalmPay"
                                value={form.name}
                                onChange={(e) => setForm({ ...form, name: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>NIBSS code</Label>
                            <Input
                                inputMode="numeric"
                                placeholder="e.g. 999991"
                                value={form.code}
                                onChange={(e) =>
                                    setForm({
                                        ...form,
                                        code: e.target.value.replace(/\s/g, ''),
                                    })
                                }
                            />
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDialogOpen(false)}>
                            Cancel
                        </Button>
                        <Button onClick={submit} disabled={!complete || saving}>
                            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {editing ? 'Save changes' : 'Add bank'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete confirmation */}
            <Dialog
                open={!!confirmDelete}
                onOpenChange={(o) => !o && setConfirmDelete(null)}
            >
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Remove this bank?</DialogTitle>
                        <DialogDescription>
                            {confirmDelete?.name} ({confirmDelete?.code}) will no longer appear
                            when choosing a bank. Employees already saved against it keep their
                            details, but you will not be able to pick it again.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setConfirmDelete(null)}>
                            Cancel
                        </Button>
                        <Button
                            variant="destructive"
                            disabled={remove.isPending}
                            onClick={async () => {
                                if (!confirmDelete?.id) return;
                                await remove.mutateAsync(confirmDelete.id);
                                setConfirmDelete(null);
                            }}
                        >
                            {remove.isPending && (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            )}
                            Remove
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
