import type { AgendaSection } from "@/types/deck";
import { registerSection } from "@/lib/deck/sectionRegistry";
import { AgendaSection as AgendaSectionComponent } from "@/components/deck/AgendaSection";
import { esc } from "@/lib/deck/htmlUtils";

function create(): AgendaSection {
  return {
    id: "",
    type: "agenda",
    sourceSlideIndexes: [],
    title: "Agenda",
    items: [{ label: "First topic" }, { label: "Second topic" }],
  };
}

function hasContent(s: AgendaSection): boolean {
  return s.items.length > 0;
}

function renderStatic(section: AgendaSection): string {
  return `<section class="block">
    <h2>${esc(section.title)}</h2>
    <ol class="agenda">
      ${section.items
        .map(
          (it) =>
            `<li><span class="a-label">${esc(it.label)}</span>${
              it.description ? `<span class="a-desc">${esc(it.description)}</span>` : ""
            }</li>`,
        )
        .join("")}
    </ol>
  </section>`;
}

registerSection({
  type: "agenda",
  label: "Agenda",
  create,
  Component: AgendaSectionComponent,
  renderStatic,
  hasContent,
  schemaHint:
    "agenda: { id, type:\"agenda\", sourceSlideIndexes, title, items:{label,description?}[], summary? }",
});

export { AgendaSectionComponent as Component, create, hasContent, renderStatic };
