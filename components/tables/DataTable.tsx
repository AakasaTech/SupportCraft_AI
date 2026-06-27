"use client";

import { useState } from "react";
import {
  useReactTable,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  getExpandedRowModel,
  flexRender,
  type ColumnDef,
  type SortingState,
  type ColumnFiltersState,
  type VisibilityState,
  type ExpandedState,
  type Row,
} from "@tanstack/react-table";
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  ChevronDown,
  ChevronUp,
  ChevronsUpDown,
  Settings2,
  Search,
} from "lucide-react";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { cn } from "@/lib/utils";
import { SkeletonTable } from "@/components/feedback/Skeleton";

interface DataTableProps<TData> {
  data: TData[];
  columns: ColumnDef<TData, unknown>[];
  isLoading?: boolean;
  enableRowSelection?: boolean;
  enableColumnVisibility?: boolean;
  enableSearch?: boolean;
  searchPlaceholder?: string;
  renderSubRow?: (row: Row<TData>) => React.ReactNode;
  pageSize?: number;
  emptyState?: React.ReactNode;
  onRowClick?: (row: TData) => void;
  className?: string;
}

export function DataTable<TData>({
  data,
  columns,
  isLoading,
  enableRowSelection,
  enableColumnVisibility,
  enableSearch,
  searchPlaceholder = "Search…",
  renderSubRow,
  pageSize = 10,
  emptyState,
  onRowClick,
  className,
}: DataTableProps<TData>) {
  const [sorting, setSorting]           = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = useState({});
  const [expanded, setExpanded]         = useState<ExpandedState>({});
  const [globalFilter, setGlobalFilter] = useState("");

  const table = useReactTable({
    data,
    columns,
    state: { sorting, columnFilters, columnVisibility, rowSelection, expanded, globalFilter },
    enableRowSelection,
    onSortingChange:          setSorting,
    onColumnFiltersChange:    setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange:     setRowSelection,
    onExpandedChange:         setExpanded,
    onGlobalFilterChange:     setGlobalFilter,
    getCoreRowModel:       getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel:     getSortedRowModel(),
    getFilteredRowModel:   getFilteredRowModel(),
    getExpandedRowModel:   getExpandedRowModel(),
    initialState:          { pagination: { pageSize } },
  });

  const selectedCount = Object.keys(rowSelection).length;

  if (isLoading) return <SkeletonTable rows={pageSize} cols={columns.length} className={className} />;

  return (
    <div className={cn("space-y-3", className)}>
      {(enableSearch || enableColumnVisibility || selectedCount > 0) && (
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            {enableSearch && (
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                <input
                  value={globalFilter}
                  onChange={(e) => setGlobalFilter(e.target.value)}
                  placeholder={searchPlaceholder}
                  className={cn(
                    "pl-9 pr-3 h-9 w-60 rounded-lg border border-input bg-input-background text-sm",
                    "placeholder:text-muted-foreground",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:border-ring",
                    "transition-shadow"
                  )}
                />
              </div>
            )}
            {selectedCount > 0 && (
              <span className="text-sm text-muted-foreground font-medium">
                {selectedCount} selected
              </span>
            )}
          </div>

          {enableColumnVisibility && (
            <DropdownMenu.Root>
              <DropdownMenu.Trigger asChild>
                <button
                  className={cn(
                    "flex items-center gap-2 h-9 px-3 rounded-lg border border-border",
                    "text-sm text-muted-foreground hover:text-foreground hover:bg-hover",
                    "transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  )}
                >
                  <Settings2 size={14} />
                  <span className="hidden sm:block">Columns</span>
                </button>
              </DropdownMenu.Trigger>
              <DropdownMenu.Portal>
                <DropdownMenu.Content
                  className="z-50 min-w-44 rounded-xl border border-border bg-popover p-1 elevation-dropdown animate-scale-in"
                  align="end"
                  sideOffset={6}
                >
                  <p className="px-3 py-1.5 text-xs text-label">Toggle columns</p>
                  {table
                    .getAllColumns()
                    .filter((col) => col.getCanHide())
                    .map((col) => (
                      <DropdownMenu.CheckboxItem
                        key={col.id}
                        checked={col.getIsVisible()}
                        onCheckedChange={(v) => col.toggleVisibility(!!v)}
                        className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-foreground cursor-pointer hover:bg-hover transition-colors"
                      >
                        <span className="flex-1 capitalize">{col.id}</span>
                      </DropdownMenu.CheckboxItem>
                    ))}
                </DropdownMenu.Content>
              </DropdownMenu.Portal>
            </DropdownMenu.Root>
          )}
        </div>
      )}

      <div className="sc-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              {table.getHeaderGroups().map((hg) => (
                <tr key={hg.id} className="border-b border-border">
                  {hg.headers.map((header) => (
                    <th
                      key={header.id}
                      scope="col"
                      className={cn(
                        "px-4 py-3 text-left text-xs font-semibold text-muted-foreground bg-surface",
                        header.column.getCanSort() && "cursor-pointer select-none hover:text-foreground transition-colors"
                      )}
                      onClick={header.column.getToggleSortingHandler()}
                      style={{ width: header.getSize() !== 150 ? header.getSize() : undefined }}
                    >
                      {header.isPlaceholder ? null : (
                        <div className="flex items-center gap-1.5">
                          {flexRender(header.column.columnDef.header, header.getContext())}
                          {header.column.getCanSort() && (
                            header.column.getIsSorted() === "asc"  ? <ChevronUp size={12} className="text-primary" /> :
                            header.column.getIsSorted() === "desc" ? <ChevronDown size={12} className="text-primary" /> :
                            <ChevronsUpDown size={12} className="text-muted-foreground/40" />
                          )}
                        </div>
                      )}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody>
              {table.getRowModel().rows.length === 0 ? (
                <tr>
                  <td colSpan={columns.length} className="px-4 py-16 text-center">
                    {emptyState ?? (
                      <div className="text-sm text-muted-foreground">No results found.</div>
                    )}
                  </td>
                </tr>
              ) : (
                table.getRowModel().rows.map((row) => (
                  <>
                    <tr
                      key={row.id}
                      className={cn(
                        "border-b border-border transition-colors",
                        onRowClick && "cursor-pointer hover:bg-hover",
                        row.getIsSelected() && "bg-primary-subtle"
                      )}
                      onClick={() => onRowClick?.(row.original)}
                    >
                      {row.getVisibleCells().map((cell) => (
                        <td key={cell.id} className="px-4 py-3">
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </td>
                      ))}
                    </tr>
                    {renderSubRow && row.getIsExpanded() && (
                      <tr key={`${row.id}-expanded`} className="bg-surface">
                        <td colSpan={row.getVisibleCells().length} className="px-4 py-3">
                          {renderSubRow(row)}
                        </td>
                      </tr>
                    )}
                  </>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between gap-3 px-4 py-3 border-t border-border bg-surface">
          <p className="text-sm text-muted-foreground">
            Showing{" "}
            <span className="font-medium text-foreground">
              {table.getState().pagination.pageIndex * table.getState().pagination.pageSize + 1}
            </span>{" "}
            to{" "}
            <span className="font-medium text-foreground">
              {Math.min(
                (table.getState().pagination.pageIndex + 1) * table.getState().pagination.pageSize,
                table.getFilteredRowModel().rows.length
              )}
            </span>{" "}
            of{" "}
            <span className="font-medium text-foreground">
              {table.getFilteredRowModel().rows.length}
            </span>
          </p>

          <div className="flex items-center gap-1">
            <PaginationButton
              onClick={() => table.setPageIndex(0)}
              disabled={!table.getCanPreviousPage()}
              aria-label="First page"
            >
              <ChevronsLeft size={14} />
            </PaginationButton>
            <PaginationButton
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
              aria-label="Previous page"
            >
              <ChevronLeft size={14} />
            </PaginationButton>

            <span className="px-2 text-sm text-foreground font-medium">
              {table.getState().pagination.pageIndex + 1} / {table.getPageCount()}
            </span>

            <PaginationButton
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
              aria-label="Next page"
            >
              <ChevronRight size={14} />
            </PaginationButton>
            <PaginationButton
              onClick={() => table.setPageIndex(table.getPageCount() - 1)}
              disabled={!table.getCanNextPage()}
              aria-label="Last page"
            >
              <ChevronsRight size={14} />
            </PaginationButton>
          </div>
        </div>
      </div>
    </div>
  );
}

function PaginationButton({
  children,
  onClick,
  disabled,
  "aria-label": ariaLabel,
}: {
  children: React.ReactNode;
  onClick: () => void;
  disabled: boolean;
  "aria-label": string;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel}
      className={cn(
        "h-8 w-8 flex items-center justify-center rounded-lg text-muted-foreground",
        "hover:bg-hover hover:text-foreground transition-colors",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        "disabled:opacity-40 disabled:cursor-not-allowed"
      )}
    >
      {children}
    </button>
  );
}
