import type { CTASection } from "@/types/deck";
import { registerSection } from "@/lib/deck/sectionRegistry";
import { CTASection as CTASectionComponent } from "@/components/deck/CTASection";
import { esc } from "@/lib/deck/htmlUtils";

function create(): CTASection {
  return {
    id: "",
    type: "cta",
    sourceSlideIndexes: [],
    title: "Ready to start?",
    description: "Add a short call to action.",
    primaryLabel: "Get started",
  };
}

function hasContent(s: CTASection): boolean {
  return Boolean(s.primaryLabel || s.description);
}

function renderStatic(section: CTASection): string {
  return `<section class="block cta">
    <h2>${esc(section.title)}</h2>
    ${section.description ? `<p>${esc(section.description)}</p>` : ""}
    <div class="cta-actions">
      <span class="btn primary">${esc(section.primaryLabel)}</span>
      ${section.secondaryLabel ? `<span class="btn">${esc(section.secondaryLabel)}</span>` : ""}
    </div>
  </section>`;
}

registerSection({
  type: "cta",
  label: "CTA",
  create,
  Component: CTASectionComponent,
  renderStatic,
  hasContent,
  schemaHint:
    "cta: { id, type:\"cta\", sourceSlideIndexes, title, description?, primaryLabel, secondaryLabel?, summary? }",
});

export { CTASectionComponent as Component, create, hasContent, renderStatic };
