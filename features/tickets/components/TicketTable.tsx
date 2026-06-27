"use client";

import { useState } from "react";
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  flexRender,
  type ColumnDef,
  type SortingState,
  type ColumnFiltersState,
} from "@tanstack/react-table";
import Link from "next/link";
import { ArrowUpDown, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { TicketStatusBadge, TicketPriorityBadge } from "./TicketStatusBadge";
import { formatRelativeTime } from "@/lib/utils";
import type { TicketWithRelations } from "../types";

interface TicketTableProps {
  tickets: TicketWithRelations[];
}

export function TicketTable({ tickets }: TicketTableProps) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [globalFilter, setGlobalFilter] = useState("");

  const columns: ColumnDef<TicketWithRelations>[] = [
    {
      accessorKey: "title",
      header: ({ column }) => (
        <button
          className="flex items-center gap-1 text-left font-medium hover:text-foreground transition-colors"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Title <ArrowUpDown className="h-3.5 w-3.5 opacity-50" />
        </button>
      ),
      cell: ({ row }) => (
        <Link
          href={`/tickets/${row.original.id}`}
          className="font-medium hover:text-primary transition-colors line-clamp-1 max-w-[280px]"
        >
          {row.original.title}
        </Link>
      ),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => <TicketStatusBadge status={row.original.status} />,
      filterFn: (row, _, value) => value === "all" || row.original.status === value,
    },
    {
      accessorKey: "priority",
      header: "Priority",
      cell: ({ row }) => <TicketPriorityBadge priority={row.original.priority} />,
    },
    {
      id: "customer",
      header: "Customer",
      cell: ({ row }) =>
        row.original.customer ? (
          <span className="text-sm text-muted-foreground">{row.original.customer.name}</span>
        ) : (
          <span className="text-xs text-muted-foreground/50">—</span>
        ),
    },
    {
      id: "assignee",
      header: "Assignee",
      cell: ({ row }) =>
        row.original.assignee ? (
          <div className="flex items-center gap-2">
            <Avatar className="h-6 w-6">
              <AvatarImage src={row.original.assignee.avatar_url ?? undefined} />
              <AvatarFallback className="text-xs">
                {row.original.assignee.full_name
                  .split(" ")
                  .map((n) => n[0])
                  .join("")
                  .slice(0, 2)}
              </AvatarFallback>
            </Avatar>
            <span className="text-sm">{row.original.assignee.full_name}</span>
          </div>
        ) : (
          <span className="text-xs text-muted-foreground/50">Unassigned</span>
        ),
    },
    {
      accessorKey: "created_at",
      header: ({ column }) => (
        <button
          className="flex items-center gap-1 font-medium hover:text-foreground transition-colors"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Created <ArrowUpDown className="h-3.5 w-3.5 opacity-50" />
        </button>
      ),
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">
          {formatRelativeTime(row.original.created_at)}
        </span>
      ),
    },
  ];

  const table = useReactTable({
    data: tickets,
    columns,
    state: { sorting, columnFilters, globalFilter },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search tickets…"
            value={globalFilter}
            onChange={(e) => setGlobalFilter(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select
          onValueChange={(value) => {
            if (value === "all") {
              setColumnFilters([]);
            } else {
              setColumnFilters([{ id: "status", value }]);
            }
          }}
          defaultValue="all"
        >
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="open">Open</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="resolved">Resolved</SelectItem>
            <SelectItem value="closed">Closed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-lg border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <th
                    key={header.id}
                    className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide"
                  >
                    {flexRender(header.column.columnDef.header, header.getContext())}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody className="divide-y divide-border bg-background">
            {table.getRowModel().rows.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length}
                  className="px-4 py-12 text-center text-muted-foreground"
                >
                  No tickets found
                </td>
              </tr>
            ) : (
              table.getRowModel().rows.map((row) => (
                <tr key={row.id} className="hover:bg-muted/30 transition-colors">
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id} className="px-4 py-3">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <p className="text-xs text-muted-foreground">
        {table.getFilteredRowModel().rows.length} of {tickets.length} tickets
      </p>
    </div>
  );
}
