'use client';

import { useState, useCallback, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { isRowNavigationClick } from '@/lib/utils/row-click';
import {
    ColumnDef,
    ColumnFiltersState,
    RowData,
    SortingState,
    VisibilityState,
    flexRender,
    getCoreRowModel,
    getFilteredRowModel,
    getSortedRowModel,
    useReactTable,
    RowSelectionState,
} from '@tanstack/react-table';

import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from './empty-state';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { ChevronLeft, ChevronRight, Search } from 'lucide-react';

// ============================================================
// Types
// ============================================================

declare module '@tanstack/react-table' {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    interface ColumnMeta<TData extends RowData, TValue> {
        /** Under 640px, rows become cards: this column is the card's title. */
        cardTitle?: boolean;
        /** Leave this column off the card (it repeats the title, or is a control). */
        hideOnCard?: boolean;
        /** Right-align (figures). */
        align?: 'right';
    }
}

export interface DataTableFilterOption {
    label: string;
    value: string;
}

export interface DataTableFilter {
    id: string;
    label: string;
    options: DataTableFilterOption[];
    /** The selected value, when the page holds the filter (undefined = all). */
    value?: string;
}

export interface DataTablePagination {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
}

interface DataTableProps<TData, TValue> {
    columns: ColumnDef<TData, TValue>[];
    data: TData[];
    searchKey?: string;
    /**
     * Search the loaded rows by this text (a name, a number). For lists the
     * API returns whole; a paginated list searches on the server through
     * `onSearchChange` instead.
     */
    searchText?: (row: TData) => string;
    searchPlaceholder?: string;
    filters?: DataTableFilter[];
    pagination?: DataTablePagination;
    onPageChange?: (page: number) => void;
    onLimitChange?: (limit: number) => void;
    onSearchChange?: (search: string) => void;
    onFilterChange?: (filterId: string, value: string | undefined) => void;
    enableRowSelection?: boolean;
    onRowSelectionChange?: (selectedRows: TData[]) => void;
    /**
     * A click anywhere in the row. The row is a mouse affordance only: the
     * keyboard and screen-reader path stays the link inside the row, so this
     * adds neither a second tab stop nor a control with no accessible name.
     */
    onRowClick?: (row: TData) => void;
    /**
     * Where a row leads. A plain click on the row goes there; the row's own
     * link (put one in the title cell or `rowActions`) is the keyboard path
     * and the one a modified click opens in a new tab.
     */
    rowHref?: (row: TData) => string;
    /** A trailing cell per row: a menu, a chevron link. */
    rowActions?: (row: TData) => ReactNode;
    /** Cap the height and keep the header in view while the rows scroll. */
    maxHeight?: string;
    bulkActions?: React.ReactNode;
    loading?: boolean;
    emptyTitle?: string;
    emptyDescription?: string;
    emptyAction?: { label: string; onClick: () => void };
    /**
     * The query behind `data` failed. Without this an empty array and a
     * failed request render identically — "No results found" for rows we
     * never received.
     */
    isError?: boolean;
    /** What could not be loaded: "the employees". */
    errorSubject?: string;
}

// ============================================================
// Component
// ============================================================

export function DataTable<TData, TValue>({
    columns,
    data,
    searchKey,
    searchText,
    searchPlaceholder = 'Search...',
    filters = [],
    pagination,
    onPageChange,
    onLimitChange,
    onSearchChange,
    onFilterChange,
    enableRowSelection = false,
    onRowSelectionChange,
    onRowClick,
    rowHref,
    rowActions,
    maxHeight,
    bulkActions,
    loading = false,
    emptyTitle = 'No results found',
    emptyDescription,
    emptyAction,
    isError,
    errorSubject,
}: DataTableProps<TData, TValue>) {
    const [sorting, setSorting] = useState<SortingState>([]);
    const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
    const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
    const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
    const [searchValue, setSearchValue] = useState('');

    const needle = searchText && !onSearchChange ? searchValue.trim().toLowerCase() : '';
    const shown = needle
        ? data.filter((row) => searchText!(row).toLowerCase().includes(needle))
        : data;

    const table = useReactTable({
        data: shown,
        columns,
        getCoreRowModel: getCoreRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        onSortingChange: setSorting,
        onColumnFiltersChange: setColumnFilters,
        onColumnVisibilityChange: setColumnVisibility,
        onRowSelectionChange: (updater) => {
            const newSelection =
                typeof updater === 'function' ? updater(rowSelection) : updater;
            setRowSelection(newSelection);
            if (onRowSelectionChange) {
                const selectedRows = Object.keys(newSelection)
                    .filter((key) => newSelection[key])
                    .map((key) => shown[parseInt(key)]);
                onRowSelectionChange(selectedRows);
            }
        },
        enableRowSelection,
        state: {
            sorting,
            columnFilters,
            columnVisibility,
            rowSelection,
        },
        // When server-side pagination is used, we don't paginate client-side
        manualPagination: !!pagination,
    });

    const handleSearch = useCallback(
        (value: string) => {
            setSearchValue(value);
            if (onSearchChange) {
                onSearchChange(value);
            } else if (searchKey) {
                table.getColumn(searchKey)?.setFilterValue(value);
            }
        },
        [onSearchChange, searchKey, table],
    );

    const selectedCount = Object.keys(rowSelection).filter(
        (key) => rowSelection[key],
    ).length;

    const router = useRouter();
    const openRow = rowHref
        ? (row: TData) => router.push(rowHref(row))
        : onRowClick;
    const handleRowClick = (e: React.MouseEvent<HTMLElement>, row: TData) => {
        if (openRow && isRowNavigationClick(e)) openRow(row);
    };
    const colCount = columns.length + (rowActions ? 1 : 0);
    const rows = table.getRowModel().rows;
    const empty = (
        <EmptyState
            isError={isError}
            subject={errorSubject}
            title={emptyTitle}
            description={emptyDescription}
            actionLabel={emptyAction?.label}
            onAction={emptyAction?.onClick}
        />
    );

    return (
        <div className="space-y-4">
            {/* Toolbar: search + filters */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                {(searchKey || onSearchChange || searchText) && (
                    <div className="relative w-full sm:w-72">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder={searchPlaceholder}
                            value={searchValue}
                            onChange={(e) => handleSearch(e.target.value)}
                            className="pl-9"
                        />
                    </div>
                )}
                {filters.map((filter) => (
                    <Select
                        key={filter.id}
                        {...(filter.value !== undefined || 'value' in filter
                            ? { value: filter.value ?? 'all' }
                            : {})}
                        onValueChange={(value) =>
                            onFilterChange?.(filter.id, value === 'all' ? undefined : value)
                        }
                    >
                        <SelectTrigger className="w-full sm:w-40">
                            <SelectValue placeholder={filter.label} />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All {filter.label}</SelectItem>
                            {filter.options.map((option) => (
                                <SelectItem key={option.value} value={option.value}>
                                    {option.label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                ))}
            </div>

            {/* Bulk actions bar */}
            {enableRowSelection && selectedCount > 0 && bulkActions && (
                <div className="flex items-center gap-3 bg-muted/50 rounded-lg px-4 py-2">
                    <span className="text-sm font-medium">
                        {selectedCount} selected
                    </span>
                    <div className="flex items-center gap-2">{bulkActions}</div>
                </div>
            )}

            {/* Table (from 640px up) */}
            <div
                className="hidden rounded-md border sm:block"
                style={maxHeight ? { maxHeight, overflowY: 'auto' } : undefined}
            >
                <Table>
                    <TableHeader
                        className={
                            maxHeight
                                ? 'sticky top-0 z-10 bg-background shadow-[0_1px_0_var(--border)]'
                                : undefined
                        }
                    >
                        {table.getHeaderGroups().map((headerGroup) => (
                            <TableRow key={headerGroup.id}>
                                {headerGroup.headers.map((header) => (
                                    <TableHead
                                        key={header.id}
                                        className={
                                            header.column.columnDef.meta?.align === 'right'
                                                ? 'text-right'
                                                : undefined
                                        }
                                    >
                                        {header.isPlaceholder
                                            ? null
                                            : flexRender(
                                                header.column.columnDef.header,
                                                header.getContext(),
                                            )}
                                    </TableHead>
                                ))}
                                {rowActions && <TableHead aria-label="Actions" />}
                            </TableRow>
                        ))}
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            // Loading skeleton rows
                            Array.from({ length: 5 }).map((_, i) => (
                                <TableRow key={`skeleton-${i}`}>
                                    {Array.from({ length: colCount }).map((_, j) => (
                                        <TableCell key={`skeleton-${i}-${j}`}>
                                            <Skeleton className="h-5 w-full" />
                                        </TableCell>
                                    ))}
                                </TableRow>
                            ))
                        ) : rows.length ? (
                            rows.map((row) => (
                                <TableRow
                                    key={row.id}
                                    data-state={row.getIsSelected() && 'selected'}
                                    className={openRow ? 'cursor-pointer' : undefined}
                                    onClick={
                                        openRow
                                            ? (e) => handleRowClick(e, row.original)
                                            : undefined
                                    }
                                >
                                    {row.getVisibleCells().map((cell) => (
                                        <TableCell
                                            key={cell.id}
                                            className={
                                                cell.column.columnDef.meta?.align === 'right'
                                                    ? 'text-right'
                                                    : undefined
                                            }
                                        >
                                            {flexRender(
                                                cell.column.columnDef.cell,
                                                cell.getContext(),
                                            )}
                                        </TableCell>
                                    ))}
                                    {rowActions && (
                                        <TableCell className="w-10 text-right">
                                            {rowActions(row.original)}
                                        </TableCell>
                                    )}
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={colCount} className="h-48">
                                    {empty}
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* Cards (under 640px): a table this wide cannot be read on a phone */}
            <div className="space-y-2 sm:hidden">
                {loading ? (
                    Array.from({ length: 3 }).map((_, i) => (
                        <Skeleton key={`card-skeleton-${i}`} className="h-24 w-full" />
                    ))
                ) : rows.length ? (
                    rows.map((row) => {
                        const cells = row.getVisibleCells();
                        const title = cells.find((c) => c.column.columnDef.meta?.cardTitle);
                        return (
                            <div
                                key={row.id}
                                className={`rounded-lg border bg-card p-3 ${openRow ? 'cursor-pointer active:bg-muted/50' : ''}`}
                                onClick={openRow ? (e) => handleRowClick(e, row.original) : undefined}
                            >
                                <div className="flex items-start justify-between gap-2">
                                    <div className="min-w-0 font-medium">
                                        {title &&
                                            flexRender(title.column.columnDef.cell, title.getContext())}
                                    </div>
                                    {rowActions?.(row.original)}
                                </div>
                                <dl className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1 text-sm">
                                    {cells
                                        .filter(
                                            (c) =>
                                                c !== title &&
                                                !c.column.columnDef.meta?.hideOnCard &&
                                                c.column.id !== 'select',
                                        )
                                        .map((c) => (
                                            <div key={c.id} className="min-w-0">
                                                <dt className="text-xs text-muted-foreground">
                                                    {typeof c.column.columnDef.header === 'string'
                                                        ? c.column.columnDef.header
                                                        : c.column.id}
                                                </dt>
                                                <dd className="truncate">
                                                    {flexRender(c.column.columnDef.cell, c.getContext())}
                                                </dd>
                                            </div>
                                        ))}
                                </dl>
                            </div>
                        );
                    })
                ) : (
                    <div className="rounded-lg border p-6">{empty}</div>
                )}
            </div>

            {/* Pagination */}
            {pagination && (
                <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">
                            Showing{' '}
                            {Math.min(
                                (pagination.page - 1) * pagination.limit + 1,
                                pagination.total,
                            )}{' '}
                            –{' '}
                            {Math.min(pagination.page * pagination.limit, pagination.total)}{' '}
                            of {pagination.total}
                        </span>
                        {onLimitChange && (
                        <Select
                            value={String(pagination.limit)}
                            onValueChange={(value) => onLimitChange?.(parseInt(value))}
                        >
                            <SelectTrigger className="w-20 h-8">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {[10, 20, 50, 100].map((size) => (
                                    <SelectItem key={size} value={String(size)}>
                                        {size}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        )}
                    </div>
                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8"
                            disabled={pagination.page <= 1}
                            onClick={() => onPageChange?.(pagination.page - 1)}
                        >
                            <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <span className="text-sm tabular-nums">
                            Page {pagination.page} of {pagination.totalPages}
                        </span>
                        <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8"
                            disabled={pagination.page >= pagination.totalPages}
                            onClick={() => onPageChange?.(pagination.page + 1)}
                        >
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
}
