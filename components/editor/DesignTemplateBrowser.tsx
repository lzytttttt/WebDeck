"use client";

import { BUILTIN_THEMES } from "@/lib/deck/theme";
import type { DeckTheme } from "@/types/deck";
import { useI18n } from "@/lib/i18n/I18nProvider";

/**
 * Browsable grid of built-in design templates. Each card shows a live color
 * swatch and a one-click "apply" that swaps the active deck theme.
 */
export function DesignTemplateBrowser({
  currentThemeId,
  onApply,
}: {
  currentThemeId: string;
  onApply: (theme: DeckTheme) => void;
}) {
  const { t } = useI18n();
  const d = t.inspector.design;

  return (
    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
      {BUILTIN_THEMES.map((theme) => {
        const active = theme.id === currentThemeId;
        const c = theme.colors;
        return (
          <button
            key={theme.id}
            onClick={() => onApply(theme)}
            className={
              "group flex items-center gap-3 rounded-lg border p-2.5 text-left transition-all duration-200 hover:border-accent/60 hover:shadow-sm " +
              (active ? "border-accent ring-1 ring-accent" : "border-border")
            }
          >
            <span
              className="flex h-10 w-10 shrink-0 overflow-hidden rounded-md border"
              style={{ background: c.background }}
            >
              <span className="h-full w-1/4" style={{ background: c.primary }} />
              <span className="h-full w-1/4" style={{ background: c.accent }} />
              <span className="h-full w-1/4" style={{ background: c.secondary }} />
              <span className="h-full w-1/4" style={{ background: c.text }} />
            </span>
            <span className="flex-1">
              <span className="block text-sm font-medium text-foreground">
                {theme.name}
              </span>
              <span className="block text-xs text-muted-foreground">
                {theme.typography.scale} · {theme.radius} · {theme.spacing}
              </span>
            </span>
            {active ? (
              <span className="text-accent">✓</span>
            ) : (
              <span className="text-xs text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100">
                {d.apply}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
