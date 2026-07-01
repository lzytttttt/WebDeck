"use client";

import type { DeckCard, CardsSection as CardsSectionType } from "@/types/deck";
import { InlineText, useMaybeEdit } from "./EditContext";
import { cn } from "@/lib/utils";

export function CardsSection({ section }: { section: CardsSectionType }) {
  const edit = useMaybeEdit();
  const editable = edit?.editable ?? false;
  const layout = section.layout ?? "grid";
  const patch = (next: Partial<CardsSectionType>) =>
    edit?.updateSection({ ...section, ...next });

  const setCard = (i: number, next: Partial<DeckCard>) => {
    const cards = section.cards.map((c, j) => (j === i ? { ...c, ...next } : c));
    patch({ cards });
  };
  const addCard = () =>
    patch({
      cards: [...section.cards, { title: "New card", description: "Description" }],
    });
  const removeCard = (i: number) =>
    patch({ cards: section.cards.filter((_, j) => j !== i) });

  const containerClass = cn(
    layout === "grid" && "grid gap-4 sm:grid-cols-2 lg:grid-cols-3",
    layout === "horizontal" && "flex flex-wrap gap-4",
    layout === "feature-list" && "flex flex-col gap-4",
    layout === "case-study" && "grid gap-6 md:grid-cols-2",
  );

  const cardClass = cn(
    "group relative deck-card",
    layout === "horizontal" && "min-w-[220px] flex-1 p-5",
    layout === "feature-list" && "flex items-start gap-4 p-5",
    layout === "case-study" && "p-8",
    (layout === "grid") && "p-5",
  );

  return (
    <div className="mx-auto max-w-4xl px-6 py-12">
      <InlineText
        as="h2"
        editable={editable}
        value={section.title}
        placeholder="Section title"
        onChange={(v) => patch({ title: v })}
        className="deck-heading mb-6 text-2xl font-bold"
      />
      <div className={containerClass}>
        {section.cards.map((card, i) => (
          <div key={i} className={cardClass}>
            {layout === "feature-list" ? (
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full deck-bg-accent text-sm font-bold">
                {i + 1}
              </span>
            ) : null}
            <div className={layout === "feature-list" ? "flex-1" : undefined}>
              {card.tag || editable ? (
                <InlineText
                  editable={editable}
                  value={card.tag ?? ""}
                  placeholder="Tag"
                  onChange={(v) => setCard(i, { tag: v })}
                  className="mb-3 inline-block rounded-full deck-bg-accent px-2.5 py-0.5 text-xs font-semibold"
                />
              ) : null}
              <InlineText
                as="h3"
                editable={editable}
                value={card.title}
                placeholder="Card title"
                onChange={(v) => setCard(i, { title: v })}
                className={cn(
                  "deck-heading mb-2 font-semibold",
                  layout === "case-study" && "text-lg",
                )}
              />
              <InlineText
                as="p"
                editable={editable}
                value={card.description}
                placeholder="Card description"
                onChange={(v) => setCard(i, { description: v })}
                className="deck-muted text-sm"
              />
            </div>
            {editable ? (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  removeCard(i);
                }}
                className="absolute right-3 top-3 opacity-0 group-hover:opacity-100 text-xs deck-muted hover:text-red-500"
                aria-label="Remove card"
              >
                ✕
              </button>
            ) : null}
          </div>
        ))}
      </div>
      {editable ? (
        <button
          onClick={(e) => {
            e.stopPropagation();
            addCard();
          }}
          className="mt-4 text-xs font-semibold deck-accent hover:underline"
        >
          + Add card
        </button>
      ) : null}
    </div>
  );
}
