"use client";

import type { ParsedSlide } from "@/types/project";
import { useI18n } from "@/lib/i18n/I18nProvider";

export function SlideList({
  slides,
  activeSlideIndex,
  onSelect,
}: {
  slides: ParsedSlide[];
  activeSlideIndex: number | null;
  onSelect: (slideIndex: number) => void;
}) {
  const { t } = useI18n();
  return (
    <div className="flex h-full flex-col">
      <div className="border-b px-4 py-3">
        <h2 className="text-sm font-semibold text-foreground">
          {t.slideList.title}
        </h2>
        <p className="text-xs text-muted-foreground">
          {t.slideList.count(slides.length)}
        </p>
      </div>
      <div className="flex-1 space-y-2 overflow-y-auto p-3">
        {slides.map((slide) => (
          <button
            key={slide.id}
            onClick={() => onSelect(slide.index)}
            className={`w-full rounded-lg border p-3 text-left transition-colors hover:border-accent ${
              activeSlideIndex === slide.index
                ? "border-accent bg-accent/5"
                : "border-border bg-card"
            }`}
          >
            <div className="mb-1 flex items-center gap-2">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded bg-secondary text-[11px] font-semibold text-muted-foreground">
                {slide.index}
              </span>
              <span className="truncate text-sm font-medium text-foreground">
                {slide.title}
              </span>
            </div>
            {slide.bullets[0] ? (
              <p className="line-clamp-2 pl-7 text-xs text-muted-foreground">
                {slide.bullets[0]}
              </p>
            ) : null}
          </button>
        ))}
      </div>
    </div>
  );
}
