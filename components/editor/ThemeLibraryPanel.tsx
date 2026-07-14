"use client";

import { useCallback, useEffect, useState } from "react";
import type { DeckTheme } from "@/types/deck";
import { useI18n } from "@/lib/i18n/I18nProvider";

/**
 * User's saved theme library. Lists custom themes persisted via /api/themes,
 * lets the user apply one to the active deck, delete one, or save the current
 * deck theme as a new template.
 */
export function ThemeLibraryPanel({
  currentTheme,
  onApply,
}: {
  currentTheme: DeckTheme;
  onApply: (theme: DeckTheme) => void;
}) {
  const { t } = useI18n();
  const d = t.inspector.design;

  const [themes, setThemes] = useState<DeckTheme[]>([]);
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/themes");
      if (res.ok) {
        const data = (await res.json()) as { themes: DeckTheme[] };
        setThemes(data.themes);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const handleSave = useCallback(async () => {
    const id = `theme_${crypto.randomUUID()}`;
    const toSave: DeckTheme = {
      ...currentTheme,
      id,
      name: name.trim() || currentTheme.name || "Custom theme",
    };
    const res = await fetch("/api/themes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ theme: toSave }),
    });
    if (res.ok) {
      setName("");
      await refresh();
    }
  }, [currentTheme, name, refresh]);

  const handleDelete = useCallback(
    async (id: string) => {
      const res = await fetch(`/api/themes/${id}`, { method: "DELETE" });
      if (res.ok) await refresh();
    },
    [refresh],
  );

  return (
    <div className="space-y-3">
      {/* Save current theme */}
      <div className="flex gap-2">
        <input
          type="text"
          value={name}
          placeholder={d.themeName}
          onChange={(e) => setName(e.target.value)}
          className="min-w-0 flex-1 rounded-md border border-border bg-background px-2.5 py-1.5 text-sm text-foreground outline-none focus:border-accent"
        />
        <button
          onClick={() => void handleSave()}
          className="shrink-0 rounded-md bg-accent px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-accent/90"
        >
          {d.saveTheme}
        </button>
      </div>

      {/* Saved list */}
      {loading ? (
        <p className="text-xs text-muted-foreground">{d.loading}</p>
      ) : themes.length === 0 ? (
        <p className="text-xs text-muted-foreground">{d.noSavedThemes}</p>
      ) : (
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {themes.map((theme) => {
            const c = theme.colors;
            return (
              <div
                key={theme.id}
                className="flex items-center gap-2.5 rounded-lg border border-border p-2"
              >
                <span
                  className="flex h-9 w-9 shrink-0 overflow-hidden rounded-md border"
                  style={{ background: c.background }}
                >
                  <span className="h-full w-1/4" style={{ background: c.primary }} />
                  <span className="h-full w-1/4" style={{ background: c.accent }} />
                  <span className="h-full w-1/4" style={{ background: c.secondary }} />
                  <span className="h-full w-1/4" style={{ background: c.text }} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium text-foreground">
                    {theme.name}
                  </span>
                </span>
                <button
                  onClick={() => onApply(theme)}
                  className="rounded-md border border-border px-2 py-1 text-xs font-medium text-foreground transition-colors hover:border-accent hover:text-accent"
                >
                  {d.apply}
                </button>
                <button
                  onClick={() => void handleDelete(theme.id)}
                  aria-label={d.delete}
                  className="rounded-md border border-border px-2 py-1 text-xs text-muted-foreground transition-colors hover:border-red-500 hover:text-red-500"
                >
                  ✕
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
