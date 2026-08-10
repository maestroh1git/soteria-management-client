'use client';

import { useState } from 'react';
import { Plus, Pencil, Trash2, Loader2, ShieldAlert } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    useBankDetails,
    useAddBankDetails,
    useUpdateBankDetails,
    useDeleteBankDetails,
} from '@/lib/hooks/use-employees';
import { useBanks } from '@/lib/hooks/use-banks';
import type { EmployeeBankDetails } from '@/lib/types/api';

interface Props {
    employeeId: string;
    employeeName: string;
    /** Editing is gated on the caller's role; viewing already is. */
    canEdit: boolean;
}

const EMPTY = { bankName: '', accountNumber: '', accountName: '' };

/**
 * Bank accounts for one employee.
 *
 * This is where salary actually lands, so the destructive edits are the ones
 * worth slowing down: changing an account number is the classic payroll fraud,
 * and it is indistinguishable from a correction unless someone is looking. The
 * form therefore states plainly what it is about to change, and every write
 * goes through the audited endpoints rather than the database.
 *
 * Bank names come from the server list rather than free text — a payment file
 * is matched on the institution code, and "GTB" is not a bank as far as the
 * upload validator is concerned.
 */
export function BankAccountsPanel({ employeeId, employeeName, canEdit }: Props) {
    const { data: accounts = [], isLoading } = useBankDetails(employeeId);
    const { data: banks = [] } = useBanks();

    const add = useAddBankDetails();
    const update = useUpdateBankDetails();
    const remove = useDeleteBankDetails();

    const [open, setOpen] = useState(false);
    const [editing, setEditing] = useState<EmployeeBankDetails | null>(null);
    const [form, setForm] = useState(EMPTY);
    const [confirmDelete, setConfirmDelete] = useState<EmployeeBankDetails | null>(
        null,
    );

    const startAdd = () => {
        setEditing(null);
        setForm({ ...EMPTY, accountName: employeeName });
        setOpen(true);
    };

    const startEdit = (account: EmployeeBankDetails) => {
        setEditing(account);
        // Only the bank can be prefilled. The number and name are encrypted and
        // never leave the server, so a correction means typing them again in
        // full — which for the field that decides where money lands is the
        // better behaviour anyway: no editing a digit of something half-read.
        setForm({ bankName: account.bankName, accountNumber: '', accountName: '' });
        setOpen(true);
    };

    const nubanValid = /^\d{10}$/.test(form.accountNumber.trim());
    const complete = form.bankName && nubanValid && form.accountName.trim();

    const submit = async () => {
        if (!complete) return;
        const dto = {
            bankName: form.bankName,
            accountNumber: form.accountNumber.trim(),
            accountName: form.accountName.trim(),
        };
        if (editing) {
            await update.mutateAsync({ id: editing.id, employeeId, dto });
        } else {
            await add.mutateAsync({
                employeeId,
                ...dto,
                isDefault: accounts.length === 0,
            });
        }
        setOpen(false);
    };

    const saving = add.isPending || update.isPending;

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-lg">Bank Accounts</CardTitle>
                {canEdit && (
                    <Button size="sm" onClick={startAdd}>
                        <Plus className="mr-2 h-4 w-4" />
                        Add account
                    </Button>
                )}
            </CardHeader>
            <CardContent>
                {isLoading ? (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Loader2 className="h-4 w-4 animate-spin" /> Loading…
                    </div>
                ) : accounts.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                        No bank account yet. Without one this employee cannot be
                        included in a payment file.
                    </p>
                ) : (
                    <div className="space-y-3">
                        {accounts.map((account) => (
                            <div
                                key={account.id}
                                className="flex items-center justify-between rounded-lg border p-3"
                            >
                                <div className="min-w-0">
                                    <div className="flex items-center gap-2">
                                        <p className="font-medium">{account.bankName}</p>
                                        {account.isDefault && (
                                            <Badge variant="secondary">Default</Badge>
                                        )}
                                    </div>
                                    <p className="text-sm text-muted-foreground">
                                        {account.accountNumberMasked ?? '••••'}
                                    </p>
                                </div>
                                {canEdit && (
                                    <div className="flex shrink-0 gap-1">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => startEdit(account)}
                                            aria-label="Edit account"
                                        >
                                            <Pencil className="h-4 w-4" />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => setConfirmDelete(account)}
                                            aria-label="Remove account"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </CardContent>

            {/* Add / edit */}
            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>
                            {editing ? 'Change bank account' : 'Add bank account'}
                        </DialogTitle>
                        <DialogDescription>
                            {editing
                                ? `This changes where ${employeeName}'s salary is paid. The change is recorded in the audit log.`
                                : `Where ${employeeName}'s salary will be paid.`}
                        </DialogDescription>
                    </DialogHeader>

                    {editing && (
                        <div className="flex gap-2 rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-200">
                            <ShieldAlert className="h-4 w-4 shrink-0" />
                            <span>
                                Confirm the new details against something the employee sent
                                you directly, not against this request.
                            </span>
                        </div>
                    )}

                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label>Bank</Label>
                            <Select
                                value={form.bankName}
                                onValueChange={(v) => setForm({ ...form, bankName: v })}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select a bank" />
                                </SelectTrigger>
                                <SelectContent>
                                    {banks.map((bank) => (
                                        <SelectItem key={bank.code} value={bank.name}>
                                            {bank.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label>Account number</Label>
                            <Input
                                inputMode="numeric"
                                maxLength={10}
                                placeholder="10 digits"
                                value={form.accountNumber}
                                onChange={(e) =>
                                    setForm({
                                        ...form,
                                        accountNumber: e.target.value.replace(/\D/g, ''),
                                    })
                                }
                            />
                            {form.accountNumber && !nubanValid && (
                                <p className="text-sm text-destructive">
                                    A NUBAN is exactly 10 digits.
                                </p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label>Account name</Label>
                            <Input
                                value={form.accountName}
                                onChange={(e) =>
                                    setForm({ ...form, accountName: e.target.value })
                                }
                            />
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setOpen(false)}>
                            Cancel
                        </Button>
                        <Button onClick={submit} disabled={!complete || saving}>
                            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {editing ? 'Save change' : 'Add account'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete confirmation — named, so it cannot be clicked through */}
            <Dialog
                open={!!confirmDelete}
                onOpenChange={(o) => !o && setConfirmDelete(null)}
            >
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Remove this account?</DialogTitle>
                        <DialogDescription>
                            {confirmDelete?.bankName} ·{' '}
                            {confirmDelete?.accountNumberMasked ?? '••••'}. If
                            this is {employeeName}&apos;s only account they will be left out
                            of the next payment file.
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
                                if (!confirmDelete) return;
                                await remove.mutateAsync({
                                    id: confirmDelete.id,
                                    employeeId,
                                });
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
        </Card>
    );
}
