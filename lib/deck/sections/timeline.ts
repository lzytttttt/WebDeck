import type { TimelineSection } from "@/types/deck";
import { registerSection } from "@/lib/deck/sectionRegistry";
import { TimelineSection as TimelineSectionComponent } from "@/components/deck/TimelineSection";
import { esc } from "@/lib/deck/htmlUtils";

function create(): TimelineSection {
  return {
    id: "",
    type: "timeline",
    sourceSlideIndexes: [],
    title: "Timeline",
    items: [
      { time: "2024", title: "Milestone one" },
      { time: "2025", title: "Milestone two" },
    ],
  };
}

function hasContent(s: TimelineSection): boolean {
  return s.items.length > 0;
}

function renderStatic(section: TimelineSection): string {
  return `<section class="block">
    <h2>${esc(section.title)}</h2>
    <div class="timeline">
      ${section.items
        .map(
          (it) =>
            `<div class="tl-item"><div class="tl-time">${esc(it.time)}</div><div class="tl-body"><h3>${esc(
              it.title,
            )}</h3>${it.description ? `<p>${esc(it.description)}</p>` : ""}</div></div>`,
        )
        .join("")}
    </div>
  </section>`;
}

registerSection({
  type: "timeline",
  label: "Timeline",
  create,
  Component: TimelineSectionComponent,
  renderStatic,
  hasContent,
  schemaHint:
    "timeline: { id, type:\"timeline\", sourceSlideIndexes, title, items:{time,title,description?}[], summary? }",
});

export { TimelineSectionComponent as Component, create, hasContent, renderStatic };
