import type { ChartSection, ChartData } from "@/types/deck";
import { registerSection } from "@/lib/deck/sectionRegistry";
import { ChartSection as ChartSectionComponent } from "@/components/deck/ChartSection";
import { esc } from "@/lib/deck/htmlUtils";
import { renderChartStatic } from "@/lib/export/renderChartStatic";

function create(): ChartSection {
  return {
    id: "",
    type: "chart",
    sourceSlideIndexes: [],
    title: "Chart",
    chartType: "bar",
    layout: "chart-with-insight",
    insight: "",
    data: {
      columns: ["Month", "Revenue", "Cost"],
      rows: [
        { Month: "Jan", Revenue: 120, Cost: 80 },
        { Month: "Feb", Revenue: 150, Cost: 90 },
        { Month: "Mar", Revenue: 180, Cost: 100 },
      ],
    },
    config: {
      xKey: "Month",
      yKeys: ["Revenue", "Cost"],
      showLegend: true,
      showGrid: true,
    },
  };
}

function hasContent(s: ChartSection): boolean {
  return s.data.rows.length > 0;
}

function renderStatic(section: ChartSection): string {
  const insight = section.insight
    ? `<p class="chart-insight">${esc(section.insight)}</p>`
    : "";
  const desc = section.description
    ? `<p class="chart-desc">${esc(section.description)}</p>`
    : "";
  const graphic = renderChartStatic(section);
  const withInsight = section.layout === "chart-with-insight" && insight;
  const body = withInsight
    ? `<div class="chart-split"><div class="chart-graphic">${graphic}</div><div class="chart-side">${insight}</div></div>`
    : `<div class="chart-graphic">${graphic}</div>${insight}`;
  return `<section class="block"><h2>${esc(section.title)}</h2>${desc}${body}</section>`;
}

registerSection({
  type: "chart",
  label: "Chart",
  create,
  Component: ChartSectionComponent,
  renderStatic,
  hasContent,
  schemaHint:
    "chart: { id, type:\"chart\", sourceSlideIndexes, title, chartType, data:{columns,rows}, config, insight?, layout?, summary? }",
});

export { ChartSectionComponent as Component, create, hasContent, renderStatic };
