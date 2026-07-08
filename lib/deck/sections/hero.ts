import type { HeroSection } from "@/types/deck";
import { registerSection } from "@/lib/deck/sectionRegistry";
import { HeroSection as HeroSectionComponent } from "@/components/deck/HeroSection";
import { esc } from "@/lib/deck/htmlUtils";

function create(): HeroSection {
  return {
    id: "",
    type: "hero",
    sourceSlideIndexes: [],
    title: "New Hero Title",
    subtitle: "Add a compelling subtitle here.",
    eyebrow: "Web Deck",
    layout: "centered",
  };
}

function hasContent(s: HeroSection): boolean {
  return Boolean(s.subtitle || s.summary || (s.metrics && s.metrics.length));
}

function renderStatic(section: HeroSection): string {
  return `<section class="hero">
    ${section.eyebrow ? `<div class="eyebrow">${esc(section.eyebrow)}</div>` : ""}
    <h1>${esc(section.title)}</h1>
    ${section.subtitle ? `<p class="subtitle">${esc(section.subtitle)}</p>` : ""}
  </section>`;
}

registerSection({
  type: "hero",
  label: "Hero",
  create,
  Component: HeroSectionComponent,
  renderStatic,
  hasContent,
  schemaHint:
    "hero: { id, type:\"hero\", sourceSlideIndexes:number[], title, subtitle?, eyebrow?, ctaLabel?, summary? }",
});

export { HeroSectionComponent as Component, create, hasContent, renderStatic };
