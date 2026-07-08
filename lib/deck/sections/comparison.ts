import type { ComparisonSection } from "@/types/deck";
import { registerSection } from "@/lib/deck/sectionRegistry";
import { ComparisonSection as ComparisonSectionComponent } from "@/components/deck/ComparisonSection";
import { esc } from "@/lib/deck/htmlUtils";

function create(): ComparisonSection {
  return {
    id: "",
    type: "comparison",
    sourceSlideIndexes: [],
    title: "Comparison",
    leftHeader: "Option A",
    rightHeader: "Option B",
    rows: [
      { label: "Feature", left: "Yes", right: "No" },
      { label: "Price", left: "$", right: "$$" },
    ],
  };
}

function hasContent(s: ComparisonSection): boolean {
  return s.rows.length > 0;
}

function renderStatic(section: ComparisonSection): string {
  return `<section class="block">
    <h2>${esc(section.title)}</h2>
    <table class="cmp">
      <thead><tr><th></th><th>${esc(section.leftHeader)}</th><th>${esc(
        section.rightHeader,
      )}</th></tr></thead>
      <tbody>
        ${section.rows
          .map(
            (r) =>
              `<tr><td class="r-label">${esc(r.label)}</td><td>${esc(r.left)}</td><td>${esc(
                r.right,
              )}</td></tr>`,
          )
          .join("")}
      </tbody>
    </table>
  </section>`;
}

registerSection({
  type: "comparison",
  label: "Comparison",
  create,
  Component: ComparisonSectionComponent,
  renderStatic,
  hasContent,
  schemaHint:
    "comparison: { id, type:\"comparison\", sourceSlideIndexes, title, leftHeader, rightHeader, rows:{label,left,right}[], summary? }",
});

export { ComparisonSectionComponent as Component, create, hasContent, renderStatic };
