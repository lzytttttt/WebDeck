import type { QuoteSection } from "@/types/deck";
import { registerSection } from "@/lib/deck/sectionRegistry";
import { QuoteSection as QuoteSectionComponent } from "@/components/deck/QuoteSection";
import { esc } from "@/lib/deck/htmlUtils";

function create(): QuoteSection {
  return {
    id: "",
    type: "quote",
    sourceSlideIndexes: [],
    title: "Quote",
    quote: "An inspiring statement.",
  };
}

function hasContent(s: QuoteSection): boolean {
  return Boolean(s.quote);
}

function renderStatic(section: QuoteSection): string {
  return `<section class="block quote">
    <blockquote>${esc(section.quote)}</blockquote>
    ${section.author ? `<cite>— ${esc(section.author)}</cite>` : ""}
  </section>`;
}

registerSection({
  type: "quote",
  label: "Quote",
  create,
  Component: QuoteSectionComponent,
  renderStatic,
  hasContent,
  schemaHint:
    "quote: { id, type:\"quote\", sourceSlideIndexes, title, quote, author?, summary? }",
});

export { QuoteSectionComponent as Component, create, hasContent, renderStatic };
