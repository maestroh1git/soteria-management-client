'use client';

import { useState, useCallback, useMemo } from 'react';
import { isRowNavigationClick } from '@/lib/utils/row-click';
import {
    ColumnDef,
    ColumnFiltersState,
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

export interface DataTableFilterOption {
    label: string;
    value: string;
}

export interface DataTableFilter {
    id: string;
    label: string;
    options: DataTableFilterOption[];
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

    const table = useReactTable({
        data,
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
                    .map((key) => data[parseInt(key)]);
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

    const handleRowClick = useCallback(
        (e: React.MouseEvent<HTMLTableRowElement>, row: TData) => {
            if (onRowClick && isRowNavigationClick(e)) onRowClick(row);
        },
        [onRowClick],
    );

    return (
        <div className="space-y-4">
            {/* Toolbar: search + filters */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                {(searchKey || onSearchChange) && (
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

            {/* Table */}
            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        {table.getHeaderGroups().map((headerGroup) => (
                            <TableRow key={headerGroup.id}>
                                {headerGroup.headers.map((header) => (
                                    <TableHead key={header.id}>
                                        {header.isPlaceholder
                                            ? null
                                            : flexRender(
                                                header.column.columnDef.header,
                                                header.getContext(),
                                            )}
                                    </TableHead>
                                ))}
                            </TableRow>
                        ))}
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            // Loading skeleton rows
                            Array.from({ length: 5 }).map((_, i) => (
                                <TableRow key={`skeleton-${i}`}>
                                    {columns.map((_, j) => (
                                        <TableCell key={`skeleton-${i}-${j}`}>
                                            <Skeleton className="h-5 w-full" />
                                        </TableCell>
                                    ))}
                                </TableRow>
                            ))
                        ) : table.getRowModel().rows?.length ? (
                            table.getRowModel().rows.map((row) => (
                                <TableRow
                                    key={row.id}
                                    data-state={row.getIsSelected() && 'selected'}
                                    className={onRowClick ? 'cursor-pointer' : undefined}
                                    onClick={
                                        onRowClick
                                            ? (e) => handleRowClick(e, row.original)
                                            : undefined
                                    }
                                >
                                    {row.getVisibleCells().map((cell) => (
                                        <TableCell key={cell.id}>
                                            {flexRender(
                                                cell.column.columnDef.cell,
                                                cell.getContext(),
                                            )}
                                        </TableCell>
                                    ))}
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell
                                    colSpan={columns.length}
                                    className="h-48"
                                >
                                    <EmptyState
                                        isError={isError}
                                        subject={errorSubject}
                                        title={emptyTitle}
                                        description={emptyDescription}
                                        actionLabel={emptyAction?.label}
                                        onAction={emptyAction?.onClick}
                                    />
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* Pagination */}
            {pagination && (
                <div className="flex items-center justify-between">
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
