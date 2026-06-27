"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  type ColumnDef,
  type RowSelectionState,
} from "@tanstack/react-table";
import {
  ChevronUp, ChevronDown, ChevronsUpDown,
  ChevronLeft, ChevronRight, Eye, EyeOff,
} from "lucide-react";
import { StatusBadge } from "@/components/tickets/shared/StatusBadge";
import { PriorityBadge } from "@/components/tickets/shared/PriorityBadge";
import { BulkActions } from "./BulkActions";
import { cn } from "@/lib/utils";
import { computeSLA, getSLABgColor } from "@/lib/sla";
import type { TicketRow } from "@/types/database";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuCheckboxItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface Props {
  tickets: TicketRow[];
  total:   number;
  page:    number;
  pages:   number;
}

function timeAgo(iso: string): string {
  const d = Date.now() - new Date(iso).getTime();
  const m = Math.floor(d / 60000);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

function SortHeader({ label, field }: { label: string; field: string }) {
  const router = useRouter();
  const sp = useSearchParams();
  const sort = sp.get("sort");
  const order = sp.get("order");
  const active = sort === field;

  const toggle = () => {
    const params = new URLSearchParams(sp.toString());
    params.set("sort", field);
    params.set("order", active && order === "asc" ? "desc" : "asc");
    router.push(`/tickets?${params}`);
  };

  return (
    <button onClick={toggle} className="flex items-center gap-1 hover:text-foreground transition-colors">
      {label}
      {active
        ? order === "asc"
          ? <ChevronUp size={12} />
          : <ChevronDown size={12} />
        : <ChevronsUpDown size={12} className="opacity-40" />}
    </button>
  );
}

export function TicketTable({ tickets, total, page, pages }: Props) {
  const router = useRouter();
  const sp = useSearchParams();
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [columnVisibility, setColumnVisibility] = useState<Record<string, boolean>>({
    category:   true,
    department: false,
    source:     false,
    created_at: false,
  });

  const selectedIds = useMemo(
    () => Object.keys(rowSelection).filter((k) => rowSelection[k]),
    [rowSelection]
  );

  const columns = useMemo<ColumnDef<TicketRow>[]>(() => [
    // Checkbox
    {
      id: "select",
      header: ({ table }) => (
        <input
          type="checkbox"
          checked={table.getIsAllPageRowsSelected()}
          onChange={table.getToggleAllPageRowsSelectedHandler()}
          className="rounded border-border"
          aria-label="Select all"
        />
      ),
      cell: ({ row }) => (
        <input
          type="checkbox"
          checked={row.getIsSelected()}
          onChange={row.getToggleSelectedHandler()}
          className="rounded border-border"
          aria-label="Select row"
        />
      ),
      size: 40,
    },
    // Ticket #
    {
      id: "ticket_number",
      header: () => <SortHeader label="#" field="ticket_number" />,
      accessorKey: "ticket_number",
      cell: ({ getValue }) => (
        <span className="font-mono text-[11px] text-muted-foreground">{getValue() as string ?? "—"}</span>
      ),
      size: 80,
    },
    // Subject
    {
      id: "title",
      header: () => <SortHeader label="Subject" field="title" />,
      accessorKey: "title",
      cell: ({ row }) => (
        <Link
          href={`/tickets/${row.original.id}`}
          className="font-medium text-sm hover:text-primary hover:underline line-clamp-1 transition-colors"
        >
          {row.original.title}
        </Link>
      ),
    },
    // Customer
    {
      id: "customer",
      header: "Customer",
      cell: ({ row }) => {
        const c = row.original.customer;
        return c ? (
          <div>
            <p className="text-xs font-medium">{c.name}</p>
            {c.company && <p className="text-[10px] text-muted-foreground">{c.company}</p>}
          </div>
        ) : <span className="text-muted-foreground text-xs">—</span>;
      },
    },
    // Status
    {
      id: "status",
      header: () => <SortHeader label="Status" field="status" />,
      accessorKey: "status",
      cell: ({ getValue }) => <StatusBadge status={getValue() as TicketRow["status"]} size="sm" />,
    },
    // Priority
    {
      id: "priority",
      header: () => <SortHeader label="Priority" field="priority" />,
      accessorKey: "priority",
      cell: ({ getValue }) => <PriorityBadge priority={getValue() as TicketRow["priority"]} size="sm" />,
    },
    // Assignee
    {
      id: "assignee",
      header: "Agent",
      cell: ({ row }) => {
        const a = row.original.assignee;
        return a ? (
          <div className="flex items-center gap-1.5">
            <div className="w-5 h-5 rounded-full bg-primary-subtle text-primary text-[10px] flex items-center justify-center font-semibold shrink-0">
              {a.full_name.charAt(0)}
            </div>
            <span className="text-xs truncate max-w-[80px]">{a.full_name}</span>
          </div>
        ) : <span className="text-[10px] text-muted-foreground">Unassigned</span>;
      },
    },
    // SLA
    {
      id: "sla",
      header: "SLA",
      cell: ({ row }) => {
        const t = row.original;
        const sla = computeSLA(t.created_at, t.priority, t.first_response_at ?? null);
        return (
          <span className={cn("text-[10px] font-medium px-1.5 py-0.5 rounded-full", getSLABgColor(sla.resolutionStatus))}>
            {sla.resolutionLabel}
          </span>
        );
      },
    },
    // Category (toggleable)
    {
      id: "category",
      header: "Category",
      accessorKey: "category",
      cell: ({ getValue }) => <span className="text-xs text-muted-foreground">{getValue() as string ?? "—"}</span>,
    },
    // Department (toggleable, hidden by default)
    {
      id: "department",
      header: "Department",
      accessorKey: "department",
      cell: ({ getValue }) => <span className="text-xs text-muted-foreground">{getValue() as string ?? "—"}</span>,
    },
    // Last updated
    {
      id: "updated_at",
      header: () => <SortHeader label="Updated" field="updated_at" />,
      accessorKey: "updated_at",
      cell: ({ getValue }) => <span className="text-xs text-muted-foreground">{timeAgo(getValue() as string)}</span>,
    },
  ], []);

  const table = useReactTable({
    data: tickets,
    columns,
    state: { rowSelection, columnVisibility },
    enableRowSelection: true,
    onRowSelectionChange: setRowSelection,
    onColumnVisibilityChange: setColumnVisibility as never,
    getCoreRowModel: getCoreRowModel(),
    getRowId: (row) => row.id,
  });

  const goPage = (p: number) => {
    const params = new URLSearchParams(sp.toString());
    params.set("page", String(p));
    router.push(`/tickets?${params}`);
  };

  return (
    <>
      {/* Column visibility + count */}
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs text-muted-foreground">{total.toLocaleString()} tickets</p>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground px-2.5 py-1.5 rounded-lg hover:bg-muted transition-colors">
              <Eye size={13} /> Columns
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-44">
            {table.getAllColumns().filter((c) => !["select", "title"].includes(c.id)).map((col) => (
              <DropdownMenuCheckboxItem
                key={col.id}
                checked={col.getIsVisible()}
                onCheckedChange={(v) => col.toggleVisibility(v)}
              >
                <span className="capitalize text-xs">{col.id.replace(/_/g, " ")}</span>
              </DropdownMenuCheckboxItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Table */}
      <div className="sc-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              {table.getHeaderGroups().map((hg) => (
                <tr key={hg.id} className="border-b border-border bg-muted/30">
                  {hg.headers.map((header) => (
                    <th
                      key={header.id}
                      className="px-3 py-2.5 text-left text-xs font-medium text-muted-foreground whitespace-nowrap"
                      style={{ width: header.getSize() !== 150 ? header.getSize() : undefined }}
                    >
                      {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody className="divide-y divide-border">
              {table.getRowModel().rows.length === 0 ? (
                <tr>
                  <td colSpan={columns.length} className="py-16 text-center text-sm text-muted-foreground">
                    No tickets found. Adjust your filters or create a new ticket.
                  </td>
                </tr>
              ) : (
                table.getRowModel().rows.map((row) => (
                  <tr
                    key={row.id}
                    className={cn(
                      "hover:bg-hover transition-colors",
                      row.getIsSelected() ? "bg-primary-subtle/30" : ""
                    )}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <td key={cell.id} className="px-3 py-3">
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-border">
            <span className="text-xs text-muted-foreground">
              Page {page} of {pages}
            </span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => goPage(page - 1)}
                disabled={page <= 1}
                className="p-1.5 rounded-lg hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft size={15} />
              </button>
              {Array.from({ length: Math.min(pages, 5) }, (_, i) => {
                const p = i + Math.max(1, page - 2);
                if (p > pages) return null;
                return (
                  <button
                    key={p}
                    onClick={() => goPage(p)}
                    className={cn(
                      "w-7 h-7 rounded-lg text-xs font-medium transition-colors",
                      p === page ? "bg-primary text-white" : "hover:bg-muted text-muted-foreground"
                    )}
                  >
                    {p}
                  </button>
                );
              })}
              <button
                onClick={() => goPage(page + 1)}
                disabled={page >= pages}
                className="p-1.5 rounded-lg hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight size={15} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Bulk actions bar */}
      {selectedIds.length > 0 && (
        <BulkActions
          selectedIds={selectedIds}
          onClear={() => setRowSelection({})}
        />
      )}
    </>
  );
}
