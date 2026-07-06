"use client";

import * as React from "react";
import { ArrowDown, ArrowUp, ChevronsUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/state";
import { cn } from "@/lib/utils";

export type ColumnDef<TData> = {
  id?: string;
  accessorKey?: keyof TData & string;
  header: React.ReactNode;
  cell?: (row: TData) => React.ReactNode;
  enableSorting?: boolean;
  className?: string;
};

export type AdminTableLabels = {
  noResults: string;
  page: string;
  of: string;
  rows: string;
  previous: string;
  next: string;
  search: string;
};

function cellValue<TData extends Record<string, unknown>>(
  row: TData,
  column: ColumnDef<TData>,
) {
  if (column.cell) return column.cell(row);
  const value = column.accessorKey ? row[column.accessorKey] : undefined;
  if (value === null || value === undefined || value === "") return "-";
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

export function SortableHeader({
  active,
  direction,
  children,
  onClick,
}: {
  active?: boolean;
  direction?: "asc" | "desc";
  children: React.ReactNode;
  onClick?: () => void;
}) {
  const Icon = active
    ? direction === "asc"
      ? ArrowUp
      : ArrowDown
    : ChevronsUpDown;
  return (
    <button
      type="button"
      className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground"
      onClick={onClick}
    >
      {children}
      <Icon className="size-3" />
    </button>
  );
}

export function AdminTable<TData extends Record<string, unknown>>({
  columns,
  data,
  pageSize = 10,
  searchKey,
  searchPlaceholder,
  labels,
  onRowClick,
  className,
}: {
  columns: ColumnDef<TData>[];
  data: TData[];
  pageSize?: number;
  searchKey: keyof TData & string;
  searchPlaceholder: string;
  labels?: Partial<AdminTableLabels>;
  onRowClick?: (row: TData) => void;
  className?: string;
}) {
  const resolvedLabels: AdminTableLabels = {
    noResults: "No results.",
    page: "Page",
    of: "of",
    rows: "rows",
    previous: "Previous",
    next: "Next",
    search: "Search",
    ...labels,
  };
  const [query, setQuery] = React.useState("");
  const [page, setPage] = React.useState(1);
  const [sort, setSort] = React.useState<{
    key: keyof TData & string;
    direction: "asc" | "desc";
  } | null>(null);

  const filtered = React.useMemo(() => {
    const normalized = query.trim().toLowerCase();
    const rows = normalized
      ? data.filter((row) =>
          String(row[searchKey] ?? "")
            .toLowerCase()
            .includes(normalized),
        )
      : data;

    if (!sort) return rows;
    return [...rows].sort((a, b) => {
      const av = String(a[sort.key] ?? "");
      const bv = String(b[sort.key] ?? "");
      return sort.direction === "asc"
        ? av.localeCompare(bv)
        : bv.localeCompare(av);
    });
  }, [data, query, searchKey, sort]);

  React.useEffect(() => {
    setPage(1);
  }, [query]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, pageCount);
  const visible = filtered.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize,
  );

  function toggleSort(key: keyof TData & string) {
    setSort((current) => {
      if (current?.key !== key) return { key, direction: "asc" };
      if (current.direction === "asc") return { key, direction: "desc" };
      return null;
    });
  }

  return (
    <div className={cn("space-y-3", className)}>
      <div className="flex items-center justify-between gap-3">
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={searchPlaceholder}
          aria-label={resolvedLabels.search}
          className="h-8 w-full max-w-xs border bg-background px-2 text-xs outline-none focus-visible:ring-1 focus-visible:ring-ring"
        />
        <div className="text-xs text-muted-foreground">
          {filtered.length} {resolvedLabels.rows}
        </div>
      </div>

      <div className="overflow-hidden border">
        <table className="w-full border-collapse text-sm">
          <thead className="bg-muted/60">
            <tr>
              {columns.map((column) => {
                const key = column.accessorKey;
                const sortable = column.enableSorting !== false && key;
                return (
                  <th
                    key={column.id ?? column.accessorKey}
                    className={cn(
                      "h-9 px-3 text-start align-middle",
                      column.className,
                    )}
                  >
                    {sortable ? (
                      <SortableHeader
                        active={sort?.key === key}
                        direction={sort?.direction}
                        onClick={() => toggleSort(key)}
                      >
                        {column.header}
                      </SortableHeader>
                    ) : (
                      <span className="text-xs font-medium text-muted-foreground">
                        {column.header}
                      </span>
                    )}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {visible.map((row, index) => (
              <tr
                key={String(row["id"] ?? index)}
                className={cn(
                  "border-t transition-colors hover:bg-muted/40",
                  onRowClick && "cursor-pointer",
                )}
                onClick={() => onRowClick?.(row)}
              >
                {columns.map((column) => (
                  <td
                    key={column.id ?? column.accessorKey}
                    className={cn(
                      "px-3 py-2 align-middle text-xs",
                      column.className,
                    )}
                  >
                    {cellValue(row, column)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
        {visible.length === 0 ? (
          <EmptyState title={resolvedLabels.noResults} className="border-0" />
        ) : null}
      </div>

      <div className="flex items-center justify-between gap-3 text-xs text-muted-foreground">
        <span>
          {resolvedLabels.page} {currentPage} {resolvedLabels.of} {pageCount}
        </span>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={currentPage <= 1}
            onClick={() => setPage((value) => Math.max(1, value - 1))}
          >
            {resolvedLabels.previous}
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={currentPage >= pageCount}
            onClick={() => setPage((value) => Math.min(pageCount, value + 1))}
          >
            {resolvedLabels.next}
          </Button>
        </div>
      </div>
    </div>
  );
}
