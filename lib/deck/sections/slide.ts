import type { SlideLikeSection } from "@/types/deck";
import { registerSection } from "@/lib/deck/sectionRegistry";
import { SlideLikeSection as SlideLikeSectionComponent } from "@/components/deck/SlideLikeSection";
import { esc } from "@/lib/deck/htmlUtils";

function create(): SlideLikeSection {
  return {
    id: "",
    type: "slide",
    sourceSlideIndexes: [],
    title: "New Section",
    bullets: ["First point", "Second point"],
  };
}

function hasContent(s: SlideLikeSection): boolean {
  return Boolean(s.body || (s.bullets && s.bullets.length));
}

function renderStatic(section: SlideLikeSection): string {
  return `<section class="block slide-like">
    <h2>${esc(section.title)}</h2>
    ${section.body ? `<p>${esc(section.body)}</p>` : ""}
    ${
      section.bullets.length
        ? `<ul>${section.bullets.map((b) => `<li>${esc(b)}</li>`).join("")}</ul>`
        : ""
    }
  </section>`;
}

registerSection({
  type: "slide",
  label: "Text",
  create,
  Component: SlideLikeSectionComponent,
  renderStatic,
  hasContent,
  schemaHint:
    "slide: { id, type:\"slide\", sourceSlideIndexes, title, bullets:string[], body?, notes?, summary? }",
});

export { SlideLikeSectionComponent as Component, create, hasContent, renderStatic };
