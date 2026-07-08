import type { FAQSection } from "@/types/deck";
import { registerSection } from "@/lib/deck/sectionRegistry";
import { FAQSection as FAQSectionComponent } from "@/components/deck/FAQSection";
import { esc } from "@/lib/deck/htmlUtils";

function create(): FAQSection {
  return {
    id: "",
    type: "faq",
    sourceSlideIndexes: [],
    title: "FAQ",
    layout: "accordion",
    items: [{ question: "Your question?", answer: "Your answer." }],
  };
}

function hasContent(s: FAQSection): boolean {
  return s.items.length > 0;
}

function renderStatic(section: FAQSection): string {
  return `<section class="block">
    <h2>${esc(section.title)}</h2>
    <div class="faq">
      ${section.items
        .map(
          (it) =>
            `<details><summary>${esc(it.question)}</summary><p>${esc(it.answer)}</p></details>`,
        )
        .join("")}
    </div>
  </section>`;
}

registerSection({
  type: "faq",
  label: "FAQ",
  create,
  Component: FAQSectionComponent,
  renderStatic,
  hasContent,
  schemaHint:
    "faq: { id, type:\"faq\", sourceSlideIndexes, title, items:{question,answer}[], summary? }",
});

export { FAQSectionComponent as Component, create, hasContent, renderStatic };
