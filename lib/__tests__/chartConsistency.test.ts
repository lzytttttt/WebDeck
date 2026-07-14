import { describe, it, expect } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { renderChartStatic } from "@/lib/export/renderChartStatic";
import { ChartView } from "@/lib/deck/renderChart";
import type { ChartSection, ChartData, ChartConfig, ChartType } from "@/types/deck";

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const barData: ChartData = {
  columns: ["Month", "Revenue"],
  rows: [
    { Month: "Jan", Revenue: 120 },
    { Month: "Feb", Revenue: 150 },
    { Month: "Mar", Revenue: 180 },
  ],
};

const pieData: ChartData = {
  columns: ["Cat", "Val"],
  rows: [
    { Cat: "A", Val: 30 },
    { Cat: "B", Val: 70 },
  ],
};

function makeSection(type: ChartType, data: ChartData, config: ChartConfig = {}): ChartSection {
  return {
    id: "ch",
    type: "chart",
    sourceSlideIndexes: [],
    title: "Chart",
    chartType: type,
    data,
    config,
    insight: undefined,
  } as ChartSection;
}

function count(haystack: string, needle: string): number {
  return haystack.split(needle).length - 1;
}

// ---------------------------------------------------------------------------
// Static renderer faithfulness
// ---------------------------------------------------------------------------

describe("renderChartStatic (static export renderer)", () => {
  it("renders a bar chart with one rect per (row × yKey)", () => {
    const svg = renderChartStatic(makeSection("bar", barData));
    expect(svg).toContain("<svg");
    expect(count(svg, "<rect")).toBe(3);
  });

  it("renders a line chart with a polyline and a circle per point", () => {
    const svg = renderChartStatic(makeSection("line", barData));
    expect(count(svg, "<polyline")).toBe(1);
    expect(count(svg, "<circle")).toBe(3);
  });

  it("renders a pie chart with one path per slice", () => {
    const svg = renderChartStatic(makeSection("pie", pieData));
    expect(count(svg, "<path")).toBe(2);
  });

  it("renders a donut chart with one path per slice plus a hole", () => {
    const svg = renderChartStatic(makeSection("donut", pieData));
    expect(count(svg, "<path")).toBe(2);
    expect(svg).toContain("<circle");
  });

  it("renders KPI cards with one card per metric", () => {
    const html = renderChartStatic(makeSection("kpi", barData));
    expect(count(html, "kpi-card")).toBe(1);
  });

  it("renders a table with a header and one row per data row", () => {
    const html = renderChartStatic(makeSection("table", barData));
    expect(html).toContain("<table");
    expect(count(html, "<tr")).toBe(barData.rows.length + 1);
  });

  it("renders an empty state for missing data", () => {
    const html = renderChartStatic(
      makeSection("bar", { columns: [], rows: [] }),
    );
    expect(html).toContain("暂无数据");
  });

  it("respects showGrid to toggle grid lines", () => {
    const withGrid = renderChartStatic(makeSection("bar", barData, { showGrid: true }));
    const withoutGrid = renderChartStatic(makeSection("bar", barData, { showGrid: false }));
    expect(count(withGrid, "chart-grid")).toBeGreaterThan(0);
    expect(count(withoutGrid, "chart-grid")).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// React ↔ Static consistency
// The React renderer and the static string renderer both delegate layout to
// lib/chart/core.ts, so the number of primitive SVG elements they emit for the
// same dataset must match. (Donut is excluded: the React version draws true
// donut arcs while the static version overlays a circle — same visual, one
// extra element, so counts intentionally differ there.)
// ---------------------------------------------------------------------------

describe("ChartView ↔ renderChartStatic consistency", () => {
  function reactSvg(type: ChartType, data: ChartData, config: ChartConfig = {}): string {
    return renderToStaticMarkup(
      createElement(ChartView, { chartType: type, data, config }),
    );
  }

  it("bar charts emit the same number of rects", () => {
    const r = reactSvg("bar", barData);
    const s = renderChartStatic(makeSection("bar", barData));
    expect(count(r, "<rect")).toBe(count(s, "<rect"));
    expect(count(r, "<rect")).toBe(3);
  });

  it("line charts emit the same number of polylines and circles", () => {
    const r = reactSvg("line", barData);
    const s = renderChartStatic(makeSection("line", barData));
    expect(count(r, "<polyline")).toBe(count(s, "<polyline"));
    expect(count(r, "<circle")).toBe(count(s, "<circle"));
  });

  it("pie charts emit the same number of paths", () => {
    const r = reactSvg("pie", pieData);
    const s = renderChartStatic(makeSection("pie", pieData));
    expect(count(r, "<path")).toBe(count(s, "<path"));
    expect(count(r, "<path")).toBe(2);
  });

  it("kpi cards render the metric label in both renderers", () => {
    const r = reactSvg("kpi", barData);
    const s = renderChartStatic(makeSection("kpi", barData));
    // The metric label is derived from the resolved yKey ("Revenue").
    expect(r).toContain("Revenue");
    expect(s).toContain("Revenue");
  });

  it("tables emit the same number of rows", () => {
    const r = reactSvg("table", barData);
    const s = renderChartStatic(makeSection("table", barData));
    expect(count(r, "<tr")).toBe(count(s, "<tr"));
    expect(count(r, "<tr")).toBe(barData.rows.length + 1);
  });
});
