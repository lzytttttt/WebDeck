import type { ChartSection, ChartData, ChartConfig } from "@/types/deck";

// Static, dependency-free chart renderer for the offline HTML export. Mirrors
// the shapes produced by lib/deck/renderChart.tsx (React) but emits SVG/HTML
// strings so the exported file needs no JS to draw charts. Colors resolve from
// the same --deck-* theme vars, so charts follow the exported theme.

const PALETTE = [
  "var(--deck-accent)",
  "var(--deck-primary)",
  "var(--deck-secondary)",
  "color-mix(in srgb, var(--deck-accent) 60%, var(--deck-primary))",
  "color-mix(in srgb, var(--deck-primary) 60%, var(--deck-secondary))",
  "color-mix(in srgb, var(--deck-secondary) 60%, var(--deck-accent))",
];
const color = (i: number): string =>
  PALETTE[((i % PALETTE.length) + PALETTE.length) % PALETTE.length];

const num = (v: string | number | undefined): number => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};
const label = (v: string | number | undefined): string =>
  v === undefined || v === null ? "" : String(v);

function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function resolveYKeys(data: ChartData, config: ChartConfig): string[] {
  if (config.yKeys && config.yKeys.length) return config.yKeys;
  const xKey = config.xKey ?? data.columns[0];
  return data.columns.filter((c) => {
    if (c === xKey) return false;
    return data.rows.some((r) => Number.isFinite(Number(r[c])));
  });
}

function emptyState(): string {
  return `<div class="chart-empty">暂无数据</div>`;
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

const W = 640;
const H = 320;
const PAD = { t: 20, r: 20, b: 40, l: 44 };

function svgOpen(): string {
  return `<svg viewBox="0 0 ${W} ${H}" class="chart-svg" preserveAspectRatio="xMidYMid meet">`;
}

function grid(config: ChartConfig, maxV: number): string {
  if (!config.showGrid) return "";
  const lines: string[] = [];
  const steps = 4;
  const innerH = H - PAD.t - PAD.b;
  for (let i = 0; i <= steps; i += 1) {
    const y = PAD.t + (innerH * i) / steps;
    const val = Math.round(maxV - (maxV * i) / steps);
    lines.push(
      `<line x1="${PAD.l}" y1="${y}" x2="${W - PAD.r}" y2="${y}" class="chart-grid"/>`,
      `<text x="${PAD.l - 6}" y="${y + 4}" class="chart-axis" text-anchor="end">${val}</text>`,
    );
  }
  return lines.join("");
}

function barChart(data: ChartData, config: ChartConfig, yKeys: string[], xKey: string): string {
  const innerW = W - PAD.l - PAD.r;
  const innerH = H - PAD.t - PAD.b;
  const maxV =
    Math.max(1, ...data.rows.flatMap((r) => yKeys.map((k) => num(r[k])))) * 1.1;
  const groupW = innerW / data.rows.length;
  const barW = Math.max(4, (groupW * 0.7) / yKeys.length);
  const bars = data.rows
    .map((r, ri) => {
      const gx = PAD.l + groupW * ri + groupW * 0.15;
      const cols = yKeys
        .map((k, ki) => {
          const h = (num(r[k]) / maxV) * innerH;
          const x = gx + barW * ki;
          const y = PAD.t + innerH - h;
          return `<rect x="${x}" y="${y}" width="${barW}" height="${Math.max(0, h)}" rx="2" fill="${color(ki)}"/>`;
        })
        .join("");
      const lx = PAD.l + groupW * ri + groupW / 2;
      return `${cols}<text x="${lx}" y="${H - PAD.b + 16}" class="chart-axis" text-anchor="middle">${esc(
        label(r[xKey]),
      )}</text>`;
    })
    .join("");
  const lg = config.showLegend !== false && yKeys.length > 1
    ? legend(yKeys.map((k, i) => ({ label: k, color: color(i) })))
    : "";
  return `${svgOpen()}${grid(config, maxV)}${bars}</svg>${lg}`;
}

function lineChart(data: ChartData, config: ChartConfig, yKeys: string[], xKey: string): string {
  const innerW = W - PAD.l - PAD.r;
  const innerH = H - PAD.t - PAD.b;
  const maxV =
    Math.max(1, ...data.rows.flatMap((r) => yKeys.map((k) => num(r[k])))) * 1.1;
  const n = data.rows.length;
  const xAt = (i: number) => PAD.l + (n <= 1 ? innerW / 2 : (innerW * i) / (n - 1));
  const yAt = (v: number) => PAD.t + innerH - (v / maxV) * innerH;
  const series = yKeys
    .map((k, ki) => {
      const pts = data.rows.map((r, ri) => `${xAt(ri)},${yAt(num(r[k]))}`).join(" ");
      const dots = data.rows
        .map((r, ri) => `<circle cx="${xAt(ri)}" cy="${yAt(num(r[k]))}" r="3" fill="${color(ki)}"/>`)
        .join("");
      return `<polyline points="${pts}" fill="none" stroke="${color(ki)}" stroke-width="2"/>${dots}`;
    })
    .join("");
  const labels = data.rows
    .map((r, ri) => `<text x="${xAt(ri)}" y="${H - PAD.b + 16}" class="chart-axis" text-anchor="middle">${esc(label(r[xKey]))}</text>`)
    .join("");
  const lg = config.showLegend !== false && yKeys.length > 1
    ? legend(yKeys.map((k, i) => ({ label: k, color: color(i) })))
    : "";
  return `${svgOpen()}${grid(config, maxV)}${series}${labels}</svg>${lg}`;
}

function pieChart(data: ChartData, config: ChartConfig, yKeys: string[], xKey: string, donut: boolean): string {
  const key = yKeys[0];
  const slices = data.rows.map((r) => ({ label: label(r[xKey]), value: num(r[key]) }));
  const total = slices.reduce((s, x) => s + x.value, 0) || 1;
  const cx = H / 2;
  const cy = H / 2;
  const rad = H / 2 - 24;
  let a0 = -Math.PI / 2;
  const paths = slices
    .map((s, i) => {
      const a1 = a0 + (s.value / total) * Math.PI * 2;
      const x0 = cx + rad * Math.cos(a0);
      const y0 = cy + rad * Math.sin(a0);
      const x1 = cx + rad * Math.cos(a1);
      const y1 = cy + rad * Math.sin(a1);
      const large = a1 - a0 > Math.PI ? 1 : 0;
      a0 = a1;
      return `<path d="M${cx},${cy} L${x0},${y0} A${rad},${rad} 0 ${large} 1 ${x1},${y1} Z" fill="${color(i)}"/>`;
    })
    .join("");
  const hole = donut ? `<circle cx="${cx}" cy="${cy}" r="${rad * 0.55}" fill="var(--deck-surface)"/>` : "";
  const lg = legend(slices.map((s, i) => ({ label: `${s.label} (${s.value})`, color: color(i) })));
  return `<svg viewBox="0 0 ${H} ${H}" class="chart-svg chart-pie" preserveAspectRatio="xMidYMid meet">${paths}${hole}</svg>${lg}`;
}

function kpiCards(data: ChartData, yKeys: string[]): string {
  const first = data.rows[0] ?? {};
  const cards = yKeys
    .map(
      (k, i) =>
        `<div class="kpi-card"><div class="kpi-value" style="color:${color(i)}">${esc(
          label(first[k]),
        )}</div><div class="kpi-label">${esc(k)}</div></div>`,
    )
    .join("");
  return `<div class="kpi-grid">${cards}</div>`;
}

function dataTable(data: ChartData): string {
  const head = data.columns.map((c) => `<th>${esc(c)}</th>`).join("");
  const body = data.rows
    .map(
      (r) =>
        `<tr>${data.columns.map((c) => `<td>${esc(label(r[c]))}</td>`).join("")}</tr>`,
    )
    .join("");
  return `<table class="chart-table"><thead><tr>${head}</tr></thead><tbody>${body}</tbody></table>`;
}

// Render just the chart graphic (no title/insight wrapper).
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
    return yKeys.length ? kpiCards(data, yKeys) : emptyState();
  }
  if (!data.rows.length || !yKeys.length) return emptyState();

  switch (section.chartType) {
    case "bar":
      return barChart(data, config, yKeys, xKey);
    case "line":
      return lineChart(data, config, yKeys, xKey);
    case "pie":
      return pieChart(data, config, yKeys, xKey, false);
    case "donut":
      return pieChart(data, config, yKeys, xKey, true);
    default:
      return emptyState();
  }
}
