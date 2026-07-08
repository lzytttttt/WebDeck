import type { CardsSection } from "@/types/deck";
import { registerSection } from "@/lib/deck/sectionRegistry";
import { CardsSection as CardsSectionComponent } from "@/components/deck/CardsSection";
import { esc } from "@/lib/deck/htmlUtils";

function create(): CardsSection {
  return {
    id: "",
    type: "cards",
    sourceSlideIndexes: [],
    title: "Highlights",
    layout: "grid",
    cards: [
      { title: "Card one", description: "Describe this item." },
      { title: "Card two", description: "Describe this item." },
      { title: "Card three", description: "Describe this item." },
    ],
  };
}

function hasContent(s: CardsSection): boolean {
  return s.cards.length > 0;
}

function renderStatic(section: CardsSection): string {
  return `<section class="block">
    <h2>${esc(section.title)}</h2>
    <div class="cards">
      ${section.cards
        .map(
          (c) =>
            `<div class="card">${
              c.tag ? `<span class="tag">${esc(c.tag)}</span>` : ""
            }<h3>${esc(c.title)}</h3><p>${esc(c.description)}</p></div>`,
        )
        .join("")}
    </div>
  </section>`;
}

registerSection({
  type: "cards",
  label: "Cards",
  create,
  Component: CardsSectionComponent,
  renderStatic,
  hasContent,
  schemaHint:
    "cards: { id, type:\"cards\", sourceSlideIndexes, title, cards:{title,description,tag?}[], summary? }",
});

export { CardsSectionComponent as Component, create, hasContent, renderStatic };
