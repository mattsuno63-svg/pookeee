"use client";

import { useState, useRef, useEffect } from "react";
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, addDays, addMonths, subMonths, isSameMonth, isSameDay } from "date-fns";
import { it } from "date-fns/locale";
import { cn } from "@/lib/utils";

interface DatePickerProps {
  value: string;
  onChange: (date: string) => void;
  label?: string;
  error?: string;
  min?: string;
  className?: string;
}

export function DatePicker({ value, onChange, label, error, min, className }: DatePickerProps) {
  const [open, setOpen] = useState(false);
  const [viewDate, setViewDate] = useState(value ? new Date(value) : new Date());
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (value) setViewDate(new Date(value));
  }, [value]);

  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("click", h);
    return () => document.removeEventListener("click", h);
  }, []);

  const monthStart = startOfMonth(viewDate);
  const monthEnd = endOfMonth(viewDate);
  const calStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const calEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
  const days: Date[] = [];
  let d = calStart;
  while (d <= calEnd) {
    days.push(d);
    d = addDays(d, 1);
  }
  const minDate = min ? new Date(min) : undefined;

  return (
    <div ref={ref} className={cn("relative", className)}>
      {label && (
        <label className="block text-sm font-robert font-medium text-foreground mb-1.5">
          {label}
        </label>
      )}
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={cn(
          "w-full px-4 py-3 rounded-lg text-left flex items-center justify-between",
          "bg-foreground/5 border border-border",
          "text-foreground font-robert text-sm",
          "transition-all duration-200",
          "focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent",
          "hover:border-foreground/40",
          error && "border-red-500"
        )}
      >
        <span className={value ? "" : "text-muted/70"}>
          {value ? format(new Date(value), "d MMMM yyyy", { locale: it }) : "Seleziona data"}
        </span>
        <span className="text-accent">📅</span>
      </button>
      {open && (
        <div className="absolute top-full left-0 mt-1 z-50 p-3 rounded-lg border border-border bg-background shadow-xl min-w-[280px]">
          <div className="flex items-center justify-between mb-3">
            <button
              type="button"
              onClick={() => setViewDate(subMonths(viewDate, 1))}
              className="p-1 rounded hover:bg-foreground/10 text-muted hover:text-foreground"
              aria-label="Mese precedente"
            >
              ‹
            </button>
            <span className="font-medium text-sm">
              {format(viewDate, "MMMM yyyy", { locale: it })}
            </span>
            <button
              type="button"
              onClick={() => setViewDate(addMonths(viewDate, 1))}
              className="p-1 rounded hover:bg-foreground/10 text-muted hover:text-foreground"
              aria-label="Mese successivo"
            >
              ›
            </button>
          </div>
          <div className="flex items-center justify-center mb-2">
            <span className="text-xs text-accent bg-accent/10 px-2 py-0.5 rounded">
              📅 Oggi: {format(new Date(), "d MMMM", { locale: it })}
            </span>
          </div>
          <div className="grid grid-cols-7 gap-0.5 text-center text-xs mb-1">
            {["Lun", "Mar", "Mer", "Gio", "Ven", "Sab", "Dom"].map((d) => (
              <span key={d} className="text-muted py-1">{d}</span>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-0.5">
            {days.map((day) => {
              const inMonth = isSameMonth(day, viewDate);
              const selected = value && isSameDay(day, new Date(value));
              const disabled = minDate && day < minDate;
              const isToday = isSameDay(day, new Date());
              return (
                <button
                  key={day.toISOString()}
                  type="button"
                  onClick={() => {
                    if (!disabled) {
                      onChange(format(day, "yyyy-MM-dd"));
                      setOpen(false);
                    }
                  }}
                  disabled={disabled}
                  className={cn(
                    "w-8 h-8 rounded text-sm transition-colors relative",
                    inMonth ? "text-foreground" : "text-muted/50",
                    selected && "bg-accent text-background font-medium",
                    !selected && isToday && "ring-2 ring-accent ring-offset-2 ring-offset-background font-semibold",
                    !selected && inMonth && !disabled && "hover:bg-foreground/20",
                    disabled && "opacity-40 cursor-not-allowed"
                  )}
                >
                  {format(day, "d")}
                  {isToday && <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 text-[8px] text-accent">•</span>}
                </button>
              );
            })}
          </div>
        </div>
      )}
      {error && (
        <p className="mt-1.5 text-xs text-red-500 font-robert">{error}</p>
      )}
    </div>
  );
}
