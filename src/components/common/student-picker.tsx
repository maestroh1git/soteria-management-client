'use client';

import { useState } from 'react';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useStudents } from '@/lib/hooks/use-students';
import { useDebouncedValue } from '@/lib/hooks/use-debounced-value';
import { listName } from '@/lib/utils/names';

export interface PickedStudent {
    id: string;
    name: string;
    admissionNumber: string;
}

/**
 * Find a pupil by name or admission number. The roll can be thousands long, so
 * this searches the server as you type rather than offering a list to scroll.
 */
export function StudentPicker({
    value,
    onChange,
    id,
}: {
    value: PickedStudent | null;
    onChange: (student: PickedStudent | null) => void;
    id?: string;
}) {
    const [text, setText] = useState('');
    const search = useDebouncedValue(text.trim());
    const { data, isFetching } = useStudents(
        { search, status: 'ACTIVE', limit: 8 },
        search.length >= 2,
    );
    const results = search.length >= 2 ? (data?.items ?? []) : [];

    if (value) {
        return (
            <div className="flex items-center justify-between rounded-md border px-3 py-2 text-sm">
                <span>
                    <span className="font-medium">{value.name}</span>{' '}
                    <span className="text-muted-foreground">{value.admissionNumber}</span>
                </span>
                <button
                    type="button"
                    className="text-xs text-muted-foreground underline"
                    onClick={() => onChange(null)}
                >
                    Change
                </button>
            </div>
        );
    }

    return (
        <div className="space-y-1">
            <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                    id={id}
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    placeholder="Type a name or admission number"
                    className="pl-9"
                    autoComplete="off"
                />
            </div>
            {search.length >= 2 && (
                <ul className="max-h-56 overflow-y-auto rounded-md border" role="listbox">
                    {results.length === 0 ? (
                        <li className="px-3 py-2 text-sm text-muted-foreground">
                            {isFetching ? 'Searching…' : 'No pupil by that name or number.'}
                        </li>
                    ) : (
                        results.map((s) => (
                            <li key={s.id}>
                                <button
                                    type="button"
                                    role="option"
                                    aria-selected={false}
                                    className="flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-muted"
                                    onClick={() =>
                                        onChange({
                                            id: s.id,
                                            name: `${s.firstName} ${s.lastName}`,
                                            admissionNumber: s.admissionNumber,
                                        })
                                    }
                                >
                                    <span>{listName(s)}</span>
                                    <span className="text-muted-foreground">{s.admissionNumber}</span>
                                </button>
                            </li>
                        ))
                    )}
                </ul>
            )}
        </div>
    );
}
