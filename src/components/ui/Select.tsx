"use client";

import { forwardRef, useCallback, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

export interface SelectOption {
  value: string;
  label: string;
}

export interface SelectProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "onChange"> {
  label?: string;
  error?: string;
  options: SelectOption[];
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  disabled?: boolean;
  required?: boolean;
  id?: string;
}

const TYPEAHEAD_RESET_MS = 600;

const Select = forwardRef<HTMLDivElement, SelectProps>(
  ({ className, label, error, options, value = "", onChange, disabled, required, id, ...props }, ref) => {
    const [open, setOpen] = useState(false);
    const [highlightedIndex, setHighlightedIndex] = useState(-1);
    const containerRef = useRef<HTMLDivElement>(null);
    const listRef = useRef<HTMLDivElement>(null);
    const optionRefs = useRef<(HTMLButtonElement | null)[]>([]);
    const typeaheadRef = useRef({ buffer: "", time: 0 });

    const selectedLabel = options.find((o) => o.value === value)?.label ?? options[0]?.label ?? "";
    const currentIndex = value ? options.findIndex((o) => o.value === value) : 0;
    const displayIndex = highlightedIndex >= 0 ? highlightedIndex : (currentIndex >= 0 ? currentIndex : 0);

    const scrollToIndex = useCallback(
      (idx: number) => {
        optionRefs.current[idx]?.scrollIntoView({ block: "nearest" });
      },
      []
    );

    useEffect(() => {
      const handleClickOutside = (e: MouseEvent) => {
        if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
          setOpen(false);
        }
      };
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    useEffect(() => {
      if (!open) return;
      setHighlightedIndex(currentIndex >= 0 ? currentIndex : 0);
      scrollToIndex(currentIndex >= 0 ? currentIndex : 0);
    }, [open, currentIndex, scrollToIndex]);

    useEffect(() => {
      if (!open) return;
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === "Escape") {
          setOpen(false);
          return;
        }
        if (e.key === "Enter") {
          e.preventDefault();
          const opt = options[displayIndex];
          if (opt) {
            onChange?.({ target: { value: opt.value } } as React.ChangeEvent<HTMLSelectElement>);
            setOpen(false);
          }
          return;
        }
        if (e.key === "ArrowDown") {
          e.preventDefault();
          const next = Math.min(displayIndex + 1, options.length - 1);
          setHighlightedIndex(next);
          scrollToIndex(next);
          return;
        }
        if (e.key === "ArrowUp") {
          e.preventDefault();
          const prev = Math.max(displayIndex - 1, 0);
          setHighlightedIndex(prev);
          scrollToIndex(prev);
          return;
        }
        if (e.key.length === 1 && /[a-zA-Z]/.test(e.key)) {
          e.preventDefault();
          const now = Date.now();
          const { buffer, time } = typeaheadRef.current;
          const key = e.key.toUpperCase();
          if (now - time > TYPEAHEAD_RESET_MS) typeaheadRef.current.buffer = "";

          const currentBuffer = typeaheadRef.current.buffer;
          const isCycle = currentBuffer.length === 1 && key === currentBuffer;

          if (isCycle) {
            typeaheadRef.current.time = now;
            const matches = options
              .map((o, i) => ({ i, label: o.label.toUpperCase() }))
              .filter(({ label }) => label.startsWith(key));
            if (matches.length === 0) return;
            const next = matches.find((m) => m.i > displayIndex) ?? matches[0];
            setHighlightedIndex(next.i);
            scrollToIndex(next.i);
          } else {
            const newBuffer = currentBuffer + key;
            const matches = options
              .map((o, i) => ({ i, label: o.label.toUpperCase() }))
              .filter(({ label }) => label.startsWith(newBuffer));
            if (matches.length === 0) return;
            typeaheadRef.current.buffer = newBuffer;
            typeaheadRef.current.time = now;
            setHighlightedIndex(matches[0].i);
            scrollToIndex(matches[0].i);
          }
        }
      };
      document.addEventListener("keydown", handleKeyDown);
      return () => document.removeEventListener("keydown", handleKeyDown);
    }, [open, displayIndex, options, onChange, scrollToIndex]);

    const handleSelect = (opt: SelectOption) => {
      onChange?.({ target: { value: opt.value } } as React.ChangeEvent<HTMLSelectElement>);
      setOpen(false);
    };

    const selectId = id || label?.toLowerCase().replace(/\s+/g, "-");

    return (
      <div ref={containerRef} className={cn("w-full relative", className)}>
        {label && (
          <label
            htmlFor={selectId}
            className="block text-sm font-robert font-medium text-foreground mb-1.5"
          >
            {label}
          </label>
        )}
        <button
          id={selectId}
          type="button"
          disabled={disabled}
          onClick={() => !disabled && setOpen(!open)}
          className={cn(
            "w-full px-4 py-3 rounded-xl appearance-none cursor-pointer text-left flex items-center justify-between gap-2",
            "bg-foreground/5 border border-border",
            "text-foreground font-robert text-sm",
            "transition-all duration-200",
            "focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent",
            "disabled:opacity-50 disabled:cursor-not-allowed",
            "hover:border-foreground/40",
            error && "border-red-500 focus:border-red-500 focus:ring-red-500",
            open && "border-accent ring-1 ring-accent"
          )}
          aria-haspopup="listbox"
          aria-expanded={open}
          aria-labelledby={label ? `${selectId}-label` : undefined}
        >
          <span>{selectedLabel}</span>
          <svg
            className={cn("w-5 h-5 shrink-0 text-accent transition-transform", open && "rotate-180")}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {open && (
          <div
            ref={listRef}
            role="listbox"
            tabIndex={-1}
            className="absolute z-50 bottom-full mb-1 w-full max-h-60 overflow-auto rounded-2xl border-2 border-accent bg-background shadow-xl py-1 outline-none"
          >
            {options.map((opt, i) => (
              <button
                key={opt.value}
                ref={(el) => { optionRefs.current[i] = el; }}
                role="option"
                type="button"
                aria-selected={i === displayIndex}
                onClick={() => handleSelect(opt)}
                className={cn(
                  "w-full px-4 py-2.5 text-left text-sm font-robert text-foreground",
                  "hover:bg-accent/20 transition-colors",
                  "focus:outline-none focus:bg-accent/20",
                  (opt.value === value || i === displayIndex) && "bg-accent/20 text-accent"
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>
        )}

        {error && (
          <p className="mt-1.5 text-xs text-red-500 font-robert">{error}</p>
        )}
      </div>
    );
  }
);

Select.displayName = "Select";

export { Select };
