"use client";

import * as React from "react";
import { Check, ChevronsUpDown, Loader2 } from "lucide-react";
import type { EntityOption } from "@/hooks/use-entity-options";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function AutocompleteSelect({
  value,
  onValueChange,
  options,
  placeholder,
  emptyLabel = "No options",
  loading,
  className,
}: {
  value: string;
  onValueChange: (value: string) => void;
  options: EntityOption[];
  placeholder: string;
  emptyLabel?: string;
  loading?: boolean;
  className?: string;
}) {
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");
  const selected = options.find((option) => option.value === value);
  const filtered = query
    ? options.filter((option) =>
        option.label.toLowerCase().includes(query.toLowerCase()),
      )
    : options;

  return (
    <div className={cn("relative", className)}>
      <Button
        type="button"
        variant="outline"
        className="w-full justify-between font-normal"
        role="combobox"
        aria-expanded={open}
        onClick={() => setOpen((next) => !next)}
      >
        <span className={cn("truncate", !selected && "text-muted-foreground")}>
          {selected?.label ?? placeholder}
        </span>
        {loading ? (
          <Loader2 className="size-3.5 animate-spin" />
        ) : (
          <ChevronsUpDown className="size-3.5 opacity-60" />
        )}
      </Button>
      {open ? (
        <div className="absolute z-50 mt-1 w-full border bg-popover text-popover-foreground shadow-lg">
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={placeholder}
            className="h-8 w-full border-b bg-transparent px-2 text-xs outline-none"
          />
          <div className="max-h-52 overflow-y-auto p-1">
            {filtered.length === 0 ? (
              <div className="px-2 py-3 text-center text-xs text-muted-foreground">
                {emptyLabel}
              </div>
            ) : (
              filtered.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  className="flex w-full items-center justify-between px-2 py-1.5 text-start text-xs hover:bg-muted"
                  onClick={() => {
                    onValueChange(option.value);
                    setOpen(false);
                  }}
                >
                  {option.label}
                  {value === option.value ? <Check className="size-3" /> : null}
                </button>
              ))
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}

export { AutocompleteSelect as EntitySelect };
