"use client";

import { ADDABLE_SECTIONS } from "@/lib/deck/sectionFactory";
import type { DeckSectionType } from "@/types/deck";
import { useI18n } from "@/lib/i18n/I18nProvider";

// Modal grid of section types. Parent handles create + insert.
export function AddSectionModal({
  onPick,
  onClose,
}: {
  onPick: (type: DeckSectionType) => void;
  onClose: () => void;
}) {
  const { t } = useI18n();
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg rounded-xl border bg-background p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-foreground">{t.addSection.title}</h2>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground"
            aria-label={t.addSection.close}
          >
            ✕
          </button>
        </div>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {ADDABLE_SECTIONS.map((s) => (
            <button
              key={s.type}
              onClick={() => onPick(s.type)}
              className="rounded-lg border border-border bg-card px-3 py-4 text-sm font-medium text-foreground transition-colors hover:border-accent hover:bg-accent/5"
            >
              {t.sections[s.type]}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
