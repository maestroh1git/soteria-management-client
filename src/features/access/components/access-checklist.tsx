'use client';

import { Lock } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { ACCESS_DESCRIPTIONS, ACCESS_LABELS } from '../roles';

/**
 * Tick the access a person should have; each says what it is for. Access they
 * have from their position (5.17) is shown ticked and locked: it is changed on
 * the position, not here.
 */
export function AccessChecklist({
    options,
    value,
    onChange,
    labelledBy,
    locked,
}: {
    options: string[];
    value: string[];
    onChange: (next: string[]) => void;
    labelledBy: string;
    /** Access that comes from elsewhere, and where: `{ roles, from: 'Head Teacher' }`. */
    locked?: { roles: string[]; from: string } | null;
}) {
    const lockedRoles = locked?.roles ?? [];
    return (
        <div role="group" aria-labelledby={labelledBy} className="grid gap-2 sm:grid-cols-2">
            {lockedRoles.map((role) => (
                <div
                    key={`locked-${role}`}
                    className="flex items-start gap-2 rounded-md border border-dashed bg-muted/30 p-2 text-sm"
                >
                    <Checkbox className="mt-0.5" checked disabled aria-label={`${ACCESS_LABELS[role] ?? role}, from ${locked!.from}`} />
                    <span>
                        <span className="flex items-center gap-1 font-medium">
                            {ACCESS_LABELS[role] ?? role}
                            <Lock className="h-3 w-3 text-muted-foreground" aria-hidden />
                        </span>
                        <span className="block text-xs text-muted-foreground">From {locked!.from}</span>
                    </span>
                </div>
            ))}
            {options.filter((r) => !lockedRoles.includes(r) || value.includes(r)).map((role) => (
                <label
                    key={role}
                    className="flex cursor-pointer items-start gap-2 rounded-md border p-2 text-sm hover:bg-muted/40"
                >
                    <Checkbox
                        className="mt-0.5"
                        checked={value.includes(role)}
                        onCheckedChange={(checked) =>
                            onChange(checked ? [...value, role] : value.filter((r) => r !== role))
                        }
                    />
                    <span>
                        <span className="block font-medium">{ACCESS_LABELS[role] ?? role}</span>
                        {lockedRoles.includes(role) && value.includes(role) ? (
                            <span className="block text-xs text-amber-700 dark:text-amber-400">
                                Also from {locked!.from}: untick to rely on the position.
                            </span>
                        ) : (
                            ACCESS_DESCRIPTIONS[role] && (
                                <span className="block text-xs text-muted-foreground">
                                    {ACCESS_DESCRIPTIONS[role]}
                                </span>
                            )
                        )}
                    </span>
                </label>
            ))}
        </div>
    );
}
