'use client';

import { Search, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';

export interface ListFilter {
    id: string;
    /** Plural, lower case: "statuses" reads "All statuses". */
    label: string;
    value: string | undefined;
    options: { value: string; label: string }[];
    onChange: (value: string | undefined) => void;
}

/**
 * The toolbar above a list: a search box and a select per filter, laid out and
 * worded the way DataTable's is, for the lists not yet on DataTable. "Clear"
 * appears once anything is set, so a list that looks empty never hides the
 * filter that emptied it.
 */
export function ListFilters({
    search,
    onSearch,
    searchPlaceholder = 'Search…',
    filters = [],
}: {
    search?: string;
    onSearch?: (value: string) => void;
    searchPlaceholder?: string;
    filters?: ListFilter[];
}) {
    const active = !!search || filters.some((f) => f.value);
    return (
        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
            {onSearch && (
                <div className="relative w-full sm:w-72">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                        value={search ?? ''}
                        onChange={(e) => onSearch(e.target.value)}
                        placeholder={searchPlaceholder}
                        aria-label={searchPlaceholder}
                        className="pl-9"
                    />
                </div>
            )}
            {filters.map((f) => (
                <Select
                    key={f.id}
                    value={f.value ?? 'all'}
                    onValueChange={(v) => f.onChange(v === 'all' ? undefined : v)}
                >
                    <SelectTrigger className="w-full sm:w-44" aria-label={`Filter by ${f.label}`}>
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All {f.label}</SelectItem>
                        {f.options.map((o) => (
                            <SelectItem key={o.value} value={o.value}>
                                {o.label}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            ))}
            {active && (
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                        onSearch?.('');
                        filters.forEach((f) => f.onChange(undefined));
                    }}
                >
                    <X className="mr-1 h-4 w-4" /> Clear
                </Button>
            )}
        </div>
    );
}

/** Whether `text` contains every word of `query`, ignoring case. */
export function matches(query: string, ...text: (string | null | undefined)[]): boolean {
    const hay = text.filter(Boolean).join(' ').toLowerCase();
    return query
        .toLowerCase()
        .split(/\s+/)
        .filter(Boolean)
        .every((w) => hay.includes(w));
}
