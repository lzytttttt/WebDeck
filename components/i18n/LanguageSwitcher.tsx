"use client";

import { useState, useRef, useEffect } from "react";
import { Languages, Check, ChevronDown } from "lucide-react";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { APP_LOCALES, LOCALE_NAMES, type AppLocale } from "@/lib/i18n/types";
import { cn } from "@/lib/utils";

// Global locale switcher. Dropdown listing both languages by their native
// name (identical in both locales per spec). Closes on outside click / Esc.
export function LanguageSwitcher({
  className,
  align = "right",
}: {
  className?: string;
  align?: "left" | "right";
}) {
  const { locale, setLocale, t } = useI18n();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const pick = (next: AppLocale) => {
    setLocale(next);
    setOpen(false);
  };

  return (
    <div ref={ref} className={cn("relative", className)}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={t.common.language}
        aria-haspopup="listbox"
        aria-expanded={open}
        className="inline-flex items-center gap-1.5 rounded-md border border-input bg-background px-2.5 py-1.5 text-sm text-foreground hover:bg-secondary"
      >
        <Languages className="h-4 w-4" />
        <span className="hidden sm:inline">{LOCALE_NAMES[locale]}</span>
        <ChevronDown className="h-3.5 w-3.5 opacity-60" />
      </button>
      {open ? (
        <div
          role="listbox"
          className={cn(
            "absolute z-50 mt-1 min-w-[9rem] rounded-lg border bg-card p-1 shadow-lg",
            align === "right" ? "right-0" : "left-0",
          )}
        >
          <div className="px-2 py-1 text-xs font-medium text-muted-foreground">
            {t.locale.label}
          </div>
          {APP_LOCALES.map((loc) => (
            <button
              key={loc}
              type="button"
              role="option"
              aria-selected={loc === locale}
              onClick={() => pick(loc)}
              className={cn(
                "flex w-full items-center justify-between gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-secondary",
                loc === locale ? "font-semibold text-foreground" : "text-foreground",
              )}
            >
              {LOCALE_NAMES[loc]}
              {loc === locale ? <Check className="h-4 w-4 text-accent" /> : null}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
