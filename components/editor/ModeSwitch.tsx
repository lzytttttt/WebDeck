"use client";

import type { DeckMode } from "@/types/deck";
import { useI18n } from "@/lib/i18n/I18nProvider";

export function ModeSwitch({
  mode,
  onChange,
  disabled,
}: {
  mode: DeckMode;
  onChange: (mode: DeckMode) => void;
  disabled?: boolean;
}) {
  const { t } = useI18n();
  return (
    <div className="inline-flex rounded-lg border bg-secondary p-0.5">
      {(["conservative", "enhanced"] as const).map((m) => (
        <button
          key={m}
          onClick={() => onChange(m)}
          disabled={disabled}
          className={`rounded-md px-3 py-1.5 text-xs font-semibold transition-colors disabled:opacity-50 ${
            mode === m
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          {m === "conservative" ? t.editor.mode.conservative : t.editor.mode.enhanced}
        </button>
      ))}
    </div>
  );
}
