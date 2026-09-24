'use client';

import { Checkbox } from '@/components/ui/checkbox';
import { ACCESS_DESCRIPTIONS, ACCESS_LABELS } from '../roles';

/** Tick the access a person should have; each says what it is for. */
export function AccessChecklist({
    options,
    value,
    onChange,
    labelledBy,
}: {
    options: string[];
    value: string[];
    onChange: (next: string[]) => void;
    labelledBy: string;
}) {
    return (
        <div role="group" aria-labelledby={labelledBy} className="grid gap-2 sm:grid-cols-2">
            {options.map((role) => (
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
                        {ACCESS_DESCRIPTIONS[role] && (
                            <span className="block text-xs text-muted-foreground">
                                {ACCESS_DESCRIPTIONS[role]}
                            </span>
                        )}
                    </span>
                </label>
            ))}
        </div>
    );
}
