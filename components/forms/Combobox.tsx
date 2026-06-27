"use client";

import { useState } from "react";
import * as Popover from "@radix-ui/react-popover";
import { Command } from "cmdk";
import { Check, ChevronsUpDown, Search } from "lucide-react";
import { cn } from "@/lib/utils";

export interface ComboboxOption {
  value: string;
  label: string;
  description?: string;
}

interface ComboboxProps {
  options: ComboboxOption[];
  value?: string;
  onChange: (value: string) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyMessage?: string;
  disabled?: boolean;
  className?: string;
  id?: string;
}

export function Combobox({
  options,
  value,
  onChange,
  placeholder = "Select option…",
  searchPlaceholder = "Search…",
  emptyMessage = "No options found.",
  disabled,
  className,
  id,
}: ComboboxProps) {
  const [open, setOpen] = useState(false);
  const selected = options.find((o) => o.value === value);

  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <Popover.Trigger asChild>
        <button
          id={id}
          type="button"
          role="combobox"
          aria-expanded={open}
          aria-haspopup="listbox"
          aria-controls="combobox-list"
          disabled={disabled}
          className={cn(
            "flex h-10 w-full items-center justify-between gap-2 rounded-lg",
            "border border-input bg-input-background px-3 py-2 text-sm",
            "hover:bg-hover transition-colors",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:border-ring",
            "disabled:opacity-60 disabled:cursor-not-allowed",
            !selected && "text-muted-foreground",
            className
          )}
        >
          <span className="truncate">{selected?.label ?? placeholder}</span>
          <ChevronsUpDown size={14} className="text-muted-foreground shrink-0" aria-hidden />
        </button>
      </Popover.Trigger>

      <Popover.Portal>
        <Popover.Content
          className={cn(
            "z-50 w-[var(--radix-popover-trigger-width)] min-w-48 rounded-xl",
            "border border-border bg-popover p-1 elevation-dropdown",
            "animate-scale-in origin-top"
          )}
          align="start"
          sideOffset={4}
        >
          <Command>
            <div className="flex items-center gap-2 px-3 py-2 border-b border-border mb-1">
              <Search size={13} className="text-muted-foreground shrink-0" />
              <Command.Input
                placeholder={searchPlaceholder}
                className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none"
              />
            </div>
            <Command.List className="max-h-56 overflow-y-auto">
              <Command.Empty className="py-4 text-center text-sm text-muted-foreground">
                {emptyMessage}
              </Command.Empty>
              {options.map((option) => (
                <Command.Item
                  key={option.value}
                  value={option.label}
                  onSelect={() => {
                    onChange(option.value === value ? "" : option.value);
                    setOpen(false);
                  }}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2 rounded-lg text-sm cursor-pointer",
                    "text-foreground transition-colors",
                    "data-[selected=true]:bg-hover"
                  )}
                >
                  <Check
                    size={13}
                    className={cn(
                      "shrink-0 transition-opacity",
                      value === option.value ? "opacity-100 text-primary" : "opacity-0"
                    )}
                  />
                  <div className="flex-1 min-w-0">
                    <span className="font-medium">{option.label}</span>
                    {option.description && (
                      <span className="block text-xs text-muted-foreground truncate">
                        {option.description}
                      </span>
                    )}
                  </div>
                </Command.Item>
              ))}
            </Command.List>
          </Command>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}
