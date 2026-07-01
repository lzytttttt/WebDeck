"use client";

import type { EnhancementSuggestion } from "@/types/deck";
import { useI18n } from "@/lib/i18n/I18nProvider";

export function SuggestionsPanel({
  suggestions,
  onApply,
  applyingId,
}: {
  suggestions: EnhancementSuggestion[];
  onApply: (suggestion: EnhancementSuggestion) => void;
  applyingId: string | null;
}) {
  const { t } = useI18n();
  return (
    <div className="flex h-full flex-col">
      <div className="border-b px-4 py-3">
        <h2 className="text-sm font-semibold text-foreground">
          {t.suggestions.title}
        </h2>
        <p className="text-xs text-muted-foreground">
          {t.suggestions.count(suggestions.length)}
        </p>
      </div>
      <div className="flex-1 space-y-3 overflow-y-auto p-3">
        {suggestions.length === 0 ? (
          <p className="px-2 py-8 text-center text-sm text-muted-foreground">
            {t.suggestions.allApplied}
          </p>
        ) : (
          suggestions.map((s) => (
            <div key={s.id} className="rounded-lg border bg-card p-3 shadow-sm">
              <span className="mb-2 inline-block rounded-full bg-accent/15 px-2 py-0.5 text-[11px] font-semibold text-accent">
                {t.suggestions.types[s.type]} · {t.suggestions.slideRef(s.slideIndex)}
              </span>
              <h3 className="text-sm font-semibold text-foreground">{s.title}</h3>
              <p className="mt-1 text-xs text-muted-foreground">{s.description}</p>
              <button
                onClick={() => onApply(s)}
                disabled={applyingId === s.id}
                className="mt-3 w-full rounded-md bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
              >
                {applyingId === s.id ? t.suggestions.applying : t.suggestions.apply}
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
