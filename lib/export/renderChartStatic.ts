import type { ChartSection, ChartData, ChartConfig } from "@/types/deck";
import {
  PALETTE,
  getColorForIndex,
  toLabel,
  resolveYKeys,
  computeBarLayout,
  computeLineLayout,
  computePieLayout,
  computeDonutLayout,
  computeKpiLayout,
  computeTableLayout,
} from "@/lib/chart/core";

// Static, dependency-free chart renderer for the offline HTML export. Mirrors
// the shapes produced by lib/deck/renderChart.tsx (React) but emits SVG/HTML
// strings so the exported file needs no JS to draw charts. Colors resolve from
// the same --deck-* theme vars, so charts follow the exported theme.
//
// Layout computation is delegated to lib/chart/core.ts; this module only
// contains HTML string assembly.

const color = (i: number): string => getColorForIndex(i, PALETTE);

function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function legend(items: Array<{ label: string; color: string }>): string {
  return `<div class="chart-legend">${items
    .map(
      (it) =>
        `<span class="chart-legend-item"><span class="chart-swatch" style="background:${it.color}"></span>${esc(
          it.label,
        )}</span>`,
    )
    .join("")}</div>`;
}

function emptyState(): string {
  return `<div class="chart-empty">暂无数据</div>`;
}

// ---------------------------------------------------------------------------
// Shared dimensions
// ---------------------------------------------------------------------------

const W = 640;
const H = 320;
const PAD = { t: 20, r: 20, b: 40, l: 44 };
const DIMS = { W, H, padL: PAD.l, padR: PAD.r, padT: PAD.t, padB: PAD.b };

function svgOpen(): string {
  return `<svg viewBox="0 0 ${W} ${H}" class="chart-svg" preserveAspectRatio="xMidYMid meet">`;
}

// ---------------------------------------------------------------------------
// Bar
// ---------------------------------------------------------------------------

function barChart(data: ChartData, config: ChartConfig): string {
  const layout = computeBarLayout(data, config, DIMS, {
    maxMultiplier: 1.1,
    barMinWidth: 4,
    groupInnerRatio: 0.7,
    groupLeftPadRatio: 0.15,
  });

  const rows = data.rows.map((_r, ri) => {
    const groupBars = layout.bars.filter((b) => b.groupIndex === ri);
    const labelItem = layout.xAxis[ri];
    const cols = groupBars
      .map(
        (bar) =>
          `<rect x="${bar.x}" y="${bar.y}" width="${bar.width}" height="${Math.max(0, bar.height)}" rx="2" fill="${color(bar.colorIndex)}"/>`,
      )
      .join("");
    return `${cols}<text x="${labelItem.x}" y="${H - PAD.b + 16}" class="chart-axis" text-anchor="middle">${esc(
      labelItem.label,
    )}</text>`;
  }).join("");

  const grid = config.showGrid
    ? layout.gridLines
        .map(
          (gl) =>
            `<line x1="${PAD.l}" y1="${gl.y}" x2="${W - PAD.r}" y2="${gl.y}" class="chart-grid"/>` +
            `<text x="${PAD.l - 6}" y="${gl.y + 4}" class="chart-axis" text-anchor="end">${gl.value}</text>`,
        )
        .join("")
    : "";

  const yKeys = resolveYKeys(data, config);
  const lg =
    config.showLegend !== false && yKeys.length > 1
      ? legend(yKeys.map((k, i) => ({ label: k, color: color(i) })))
      : "";
  return `${svgOpen()}${grid}${rows}</svg>${lg}`;
}

// ---------------------------------------------------------------------------
// Line
// ---------------------------------------------------------------------------

function lineChart(data: ChartData, config: ChartConfig): string {
  const yKeys = resolveYKeys(data, config);
  const layout = computeLineLayout(data, config, DIMS, {
    maxMultiplier: 1.1,
  });

  const series = layout.series
    .map((s) => {
      const dots = s.points
        .map((p) => `<circle cx="${p.x}" cy="${p.y}" r="3" fill="${color(s.colorIndex)}"/>`)
        .join("");
      return `<polyline points="${s.polyline}" fill="none" stroke="${color(s.colorIndex)}" stroke-width="2"/>${dots}`;
    })
    .join("");

  const labels = layout.xAxis
    .map(
      (xl) =>
        `<text x="${xl.x}" y="${H - PAD.b + 16}" class="chart-axis" text-anchor="middle">${esc(xl.label)}</text>`,
    )
    .join("");

  const grid = config.showGrid
    ? layout.gridLines
        .map(
          (gl) =>
            `<line x1="${PAD.l}" y1="${gl.y}" x2="${W - PAD.r}" y2="${gl.y}" class="chart-grid"/>` +
            `<text x="${PAD.l - 6}" y="${gl.y + 4}" class="chart-axis" text-anchor="end">${gl.value}</text>`,
        )
        .join("")
    : "";

  const lg =
    config.showLegend !== false && yKeys.length > 1
      ? legend(yKeys.map((k, i) => ({ label: k, color: color(i) })))
      : "";
  return `${svgOpen()}${grid}${series}${labels}</svg>${lg}`;
}

// ---------------------------------------------------------------------------
// Pie / Donut
// ---------------------------------------------------------------------------

function pieChart(data: ChartData, config: ChartConfig, donut: boolean): string {
  const PIE_H = H;
  const PIE_DIMS = { W: PIE_H, H: PIE_H };
  const layout = donut
    ? computeDonutLayout(data, config, PIE_DIMS, 0.55)
    : computePieLayout(data, config, PIE_DIMS);

  const xKey = config.xKey ?? data.columns[0];

  const paths = layout.slices
    .map((s) => `<path d="${s.d}" fill="${color(s.colorIndex)}"/>`)
    .join("");

  // For the static renderer, the donut hole is rendered as a circle overlay
  // (simpler than the donut path arcs used in the React version).
  const hole = donut
    ? `<circle cx="${layout.cx}" cy="${layout.cy}" r="${layout.radius * 0.55}" fill="var(--deck-surface)"/>`
    : "";

  const lg = legend(
    layout.slices.map((s) => ({ label: `${s.label} (${s.value})`, color: color(s.colorIndex) })),
  );
  return `<svg viewBox="0 0 ${PIE_H} ${PIE_H}" class="chart-svg chart-pie" preserveAspectRatio="xMidYMid meet">${paths}${hole}</svg>${lg}`;
}

// ---------------------------------------------------------------------------
// KPI
// ---------------------------------------------------------------------------

function kpiCards(data: ChartData, config: ChartConfig): string {
  const layout = computeKpiLayout(data, config);
  const cards = layout.metrics
    .map(
      (m) =>
        `<div class="kpi-card"><div class="kpi-value" style="color:${color(m.colorIndex)}">${esc(
          m.value,
        )}</div><div class="kpi-label">${esc(m.label)}</div></div>`,
    )
    .join("");
  return `<div class="kpi-grid">${cards}</div>`;
}

// ---------------------------------------------------------------------------
// Table
// ---------------------------------------------------------------------------

function dataTable(data: ChartData): string {
  const layout = computeTableLayout(data);
  const head = layout.columns.map((c) => `<th>${esc(c.label)}</th>`).join("");
  const body = layout.rows
    .map(
      (r) =>
        `<tr>${layout.columns.map((c) => `<td>${esc(r[c.key])}</td>`).join("")}</tr>`,
    )
    .join("");
  return `<table class="chart-table"><thead><tr>${head}</tr></thead><tbody>${body}</tbody></table>`;
}

// ---------------------------------------------------------------------------
// Entry point
// ---------------------------------------------------------------------------

export function renderChartStatic(section: ChartSection): string {
  const data: ChartData = {
    columns: section.data?.columns ?? [],
    rows: section.data?.rows ?? [],
  };
  const config = section.config ?? {};

  if (section.chartType === "table") {
    return data.columns.length ? dataTable(data) : emptyState();
  }

  const xKey = config.xKey ?? data.columns[0];
  const yKeys = resolveYKeys(data, config);

  if (section.chartType === "kpi") {
    return yKeys.length ? kpiCards(data, config) : emptyState();
  }
  if (!data.rows.length || !yKeys.length) return emptyState();

  switch (section.chartType) {
    case "bar":
      return barChart(data, config);
    case "line":
      return lineChart(data, config);
    case "pie":
      return pieChart(data, config, false);
    case "donut":
      return pieChart(data, config, true);
    default:
      return emptyState();
  }
}
