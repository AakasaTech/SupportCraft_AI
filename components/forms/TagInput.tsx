"use client";

import { useState, useRef, KeyboardEvent } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

interface TagInputProps {
  value: string[];
  onChange: (tags: string[]) => void;
  placeholder?: string;
  maxTags?: number;
  disabled?: boolean;
  className?: string;
  id?: string;
  "aria-label"?: string;
}

export function TagInput({
  value = [],
  onChange,
  placeholder = "Add tag…",
  maxTags = 10,
  disabled,
  className,
  id,
  "aria-label": ariaLabel,
}: TagInputProps) {
  const [inputValue, setInputValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  function addTag(tag: string) {
    const trimmed = tag.trim().toLowerCase();
    if (trimmed && !value.includes(trimmed) && value.length < maxTags) {
      onChange([...value, trimmed]);
    }
    setInputValue("");
  }

  function removeTag(tag: string) {
    onChange(value.filter((t) => t !== tag));
  }

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if ((e.key === "Enter" || e.key === ",") && inputValue) {
      e.preventDefault();
      addTag(inputValue);
    }
    if (e.key === "Backspace" && !inputValue && value.length > 0) {
      removeTag(value[value.length - 1]);
    }
  }

  return (
    <div
      className={cn(
        "flex flex-wrap gap-1.5 min-h-10 w-full rounded-lg border border-input bg-input-background px-3 py-2",
        "focus-within:ring-2 focus-within:ring-ring focus-within:border-ring",
        "transition-shadow cursor-text",
        disabled && "opacity-60 cursor-not-allowed",
        className
      )}
      onClick={() => inputRef.current?.focus()}
    >
      {value.map((tag) => (
        <span
          key={tag}
          className="inline-flex items-center gap-1 rounded-md bg-secondary text-secondary-foreground text-xs font-medium px-2 py-0.5"
        >
          {tag}
          {!disabled && (
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); removeTag(tag); }}
              className="text-muted-foreground hover:text-foreground transition-colors"
              aria-label={`Remove ${tag}`}
            >
              <X size={10} />
            </button>
          )}
        </span>
      ))}

      {value.length < maxTags && (
        <input
          ref={inputRef}
          id={id}
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={() => inputValue && addTag(inputValue)}
          placeholder={value.length === 0 ? placeholder : ""}
          disabled={disabled}
          aria-label={ariaLabel}
          className={cn(
            "flex-1 min-w-24 bg-transparent text-sm text-foreground placeholder:text-muted-foreground",
            "outline-none border-none ring-0 py-0.5"
          )}
        />
      )}
    </div>
  );
}
