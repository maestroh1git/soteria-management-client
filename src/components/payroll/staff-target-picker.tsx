'use client';

import { useMemo, useState } from 'react';
import { Search } from 'lucide-react';

import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { useDepartments } from '@/features/staff/departments/hooks';
import { usePositions } from '@/features/staff/positions/hooks';
import { useEmployees } from '@/lib/hooks/use-employees';
import { listName } from '@/lib/utils/names';
import type { StaffScope, StaffTarget } from '@/lib/api/staff-target';

const SCOPES: Array<{ value: StaffScope; label: string }> = [
    { value: 'ALL', label: 'Everyone on the payroll' },
    { value: 'DEPARTMENTS', label: 'Staff in some departments' },
    { value: 'POSITIONS', label: 'Staff in some positions' },
    { value: 'EMPLOYEES', label: 'People I choose' },
];

/** A target the API will accept: ALL, or a scope with at least one id. */
export function targetIsComplete(t: StaffTarget): boolean {
    return t.scope === 'ALL' || (t.ids?.length ?? 0) > 0;
}

/**
 * Who a bulk pay action is for. Active staff only, as the API resolves it; the
 * preview the dialog shows next is what says exactly who that is.
 */
export function StaffTargetPicker({
    id,
    value,
    onChange,
}: {
    id: string;
    value: StaffTarget;
    onChange: (t: StaffTarget) => void;
}) {
    const [search, setSearch] = useState('');
    const departments = useDepartments(value.scope === 'DEPARTMENTS');
    const positions = usePositions(value.scope === 'POSITIONS');
    const employees = useEmployees({ status: 'ACTIVE' }, value.scope === 'EMPLOYEES');

    const options = useMemo(() => {
        if (value.scope === 'DEPARTMENTS')
            return (departments.data ?? []).map((d) => ({ id: d.id, label: d.name }));
        if (value.scope === 'POSITIONS')
            return (positions.data ?? []).map((p) => ({
                id: p.id,
                label: p.department?.name ? `${p.name} · ${p.department.name}` : p.name,
            }));
        if (value.scope === 'EMPLOYEES')
            return (employees.data ?? []).map((e) => ({
                id: e.id,
                label: `${listName(e)} · ${e.employeeNumber}`,
            }));
        return [];
    }, [value.scope, departments.data, positions.data, employees.data]);

    const needle = search.trim().toLowerCase();
    const shown = needle ? options.filter((o) => o.label.toLowerCase().includes(needle)) : options;
    const chosen = new Set(value.ids ?? []);
    const toggle = (optionId: string, on: boolean) => {
        const next = new Set(chosen);
        if (on) next.add(optionId);
        else next.delete(optionId);
        onChange({ scope: value.scope, ids: [...next] });
    };

    return (
        <div className="space-y-2">
            <Label htmlFor={id}>Who is it for? *</Label>
            <Select
                value={value.scope}
                onValueChange={(scope) => {
                    setSearch('');
                    onChange(
                        scope === 'ALL'
                            ? { scope: 'ALL' }
                            : { scope: scope as StaffScope, ids: [] },
                    );
                }}
            >
                <SelectTrigger id={id} className="w-full">
                    <SelectValue />
                </SelectTrigger>
                <SelectContent>
                    {SCOPES.map((s) => (
                        <SelectItem key={s.value} value={s.value}>
                            {s.label}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>

            {value.scope !== 'ALL' && (
                <div className="rounded-md border">
                    {value.scope === 'EMPLOYEES' && (
                        <div className="relative border-b">
                            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                            <Input
                                aria-label="Find a person"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Name or staff number"
                                className="border-0 pl-9 shadow-none focus-visible:ring-0"
                            />
                        </div>
                    )}
                    <ul className="max-h-48 overflow-y-auto py-1">
                        {shown.length === 0 ? (
                            <li className="px-3 py-2 text-sm text-muted-foreground">
                                Nothing to choose from.
                            </li>
                        ) : (
                            shown.map((o) => (
                                <li key={o.id}>
                                    <label className="flex cursor-pointer items-center gap-2 px-3 py-1.5 text-sm hover:bg-muted/50">
                                        <Checkbox
                                            checked={chosen.has(o.id)}
                                            onCheckedChange={(v) => toggle(o.id, v === true)}
                                        />
                                        <span className="min-w-0 truncate">{o.label}</span>
                                    </label>
                                </li>
                            ))
                        )}
                    </ul>
                    <p className="border-t px-3 py-1.5 text-xs text-muted-foreground">
                        {chosen.size} chosen
                    </p>
                </div>
            )}
        </div>
    );
}
