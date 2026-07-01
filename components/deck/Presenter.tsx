"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { WebDeck } from "@/types/deck";
import { SectionSwitch } from "@/components/deck/DeckRenderer";
import { themeToCssVars } from "@/lib/deck/theme";
import { cn } from "@/lib/utils";
import { useI18n } from "@/lib/i18n/I18nProvider";

// Map the deck's present transition to a CSS animation class keyed per slide.
function transitionClass(deck: WebDeck): string {
  switch (deck.motion.transition) {
    case "fade":
      return "deck-anim-fade";
    case "slide":
      return "deck-anim-slide-up";
    case "zoom":
      return "deck-anim-scale";
    default:
      return "";
  }
}

// Full-screen presentation. Each deck section is one "slide"; left/right
// arrows page through them, Esc exits, N toggles presenter notes. A progress
// bar tracks position and the deck's present transition animates each slide.
export function Presenter({ deck }: { deck: WebDeck }) {
  const { t } = useI18n();
  const router = useRouter();
  const [index, setIndex] = useState(0);
  const [showNotes, setShowNotes] = useState(false);
  const total = deck.sections.length;
  const anim = transitionClass(deck);

  const go = useCallback(
    (delta: number) => {
      setIndex((cur) => Math.min(Math.max(cur + delta, 0), total - 1));
    },
    [total],
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === " " || e.key === "PageDown") {
        e.preventDefault();
        go(1);
      } else if (e.key === "ArrowLeft" || e.key === "PageUp") {
        e.preventDefault();
        go(-1);
      } else if (e.key === "Escape") {
        router.back();
      } else if (e.key === "n" || e.key === "N") {
        setShowNotes((s) => !s);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [go, router]);

  const current = deck.sections[index];
  const notes = current?.summary?.trim() || t.present.notesEmpty;
  const progress = total > 0 ? ((index + 1) / total) * 100 : 0;

  return (
    <div
      className="deck-root fixed inset-0 flex flex-col"
      style={themeToCssVars(deck.theme) as React.CSSProperties}
    >
      {/* Progress bar */}
      <div className="h-1 w-full bg-black/10">
        <div
          className="h-full transition-all duration-300"
          style={{ width: `${progress}%`, background: "var(--deck-accent)" }}
        />
      </div>

      <div className="flex items-center justify-between px-6 py-3 text-sm deck-muted">
        <span className="font-medium deck-text">{deck.title}</span>
        <span>
          {index + 1} / {total} ·{" "}
          {deck.mode === "conservative" ? "Conservative" : "Enhanced"}
        </span>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowNotes((s) => !s)}
            className={cn(
              "rounded-md border px-3 py-1.5 font-semibold deck-text hover:bg-black/5",
              showNotes && "deck-bg-accent",
            )}
          >
            {t.present.notes} (N)
          </button>
          <button
            onClick={() => router.back()}
            className="rounded-md border px-3 py-1.5 font-semibold deck-text hover:bg-black/5"
          >
            {t.present.exit} (Esc)
          </button>
        </div>
      </div>

      <div className="flex flex-1 items-center overflow-y-auto">
        <div key={index} className={cn("mx-auto w-full max-w-4xl", anim)}>
          {current ? <SectionSwitch section={current} /> : null}
        </div>
      </div>

      {showNotes ? (
        <div className="max-h-48 overflow-y-auto border-t bg-black/80 px-8 py-4 text-sm leading-relaxed text-white">
          <div className="mx-auto max-w-4xl">
            <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-white/50">
              {t.present.notes}
            </div>
            {notes}
          </div>
        </div>
      ) : null}

      <div className="flex items-center justify-center gap-4 px-6 py-4">
        <button
          onClick={() => go(-1)}
          disabled={index === 0}
          className="rounded-full border px-5 py-2 text-sm font-semibold deck-text hover:bg-black/5 disabled:opacity-40"
        >
            ← {t.present.prev}
        </button>
        <button
          onClick={() => go(1)}
          disabled={index === total - 1}
          className="rounded-full border px-5 py-2 text-sm font-semibold deck-text hover:bg-black/5 disabled:opacity-40"
        >
            {t.present.next} →
        </button>
      </div>
    </div>
  );
}
