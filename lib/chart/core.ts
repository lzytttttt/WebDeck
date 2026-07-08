/**
 * Pure computation layer for chart layouts.
 *
 * This module contains **zero** rendering logic – it only computes geometry,
 * colours and data transforms. Both the React renderer (renderChart.tsx) and
 * the static HTML renderer (renderChartStatic.ts) call these functions and
 * then apply their own rendering on top.
 */

import type { ChartData, ChartConfig } from "@/types/deck";

// ─── Colour palette ─────────────────────────────────────────────────────────

/** Extended palette used by both renderers (React adds two more entries). */
export const PALETTE: string[] = [
  "var(--deck-accent)",
  "var(--deck-primary)",
  "var(--deck-secondary)",
  "color-mix(in srgb, var(--deck-accent) 60%, var(--deck-primary))",
  "color-mix(in srgb, var(--deck-primary) 60%, var(--deck-secondary))",
  "color-mix(in srgb, var(--deck-secondary) 60%, var(--deck-accent))",
];

/** React-only extra palette entries (kept separate so static stays minimal). */
export const PALETTE_EXTENDED: string[] = [
  ...PALETTE,
  "color-mix(in srgb, var(--deck-accent) 40%, transparent)",
  "color-mix(in srgb, var(--deck-primary) 40%, transparent)",
];

export function getColorForIndex(index: number, palette: string[] = PALETTE): string {
  return palette[((index % palette.length) + palette.length) % palette.length];
}

// ─── Value helpers ──────────────────────────────────────────────────────────

export function toNum(v: string | number | undefined): number {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

export function toLabel(v: string | number | undefined): string {
  return v === undefined || v === null ? "" : String(v);
}

export function formatValue(value: string | number | undefined): string {
  return toLabel(value);
}

// ─── Series resolution ──────────────────────────────────────────────────────

export function resolveYKeys(data: ChartData, config: ChartConfig): string[] {
  if (config.yKeys && config.yKeys.length) return config.yKeys;
  const xKey = config.xKey ?? data.columns[0];
  return data.columns.filter((c) => {
    if (c === xKey) return false;
    return data.rows.some((r) => Number.isFinite(Number(r[c])));
  });
}

// ─── Grid lines ─────────────────────────────────────────────────────────────

export type GridLine = { y: number; value: number };

export function computeGridLines(
  padT: number,
  plotH: number,
  max: number,
  steps: number = 4,
): GridLine[] {
  const lines: GridLine[] = [];
  for (let i = 0; i <= steps; i += 1) {
    lines.push({
      y: padT + (plotH * i) / steps,
      value: Math.round(max - (max * i) / steps),
    });
  }
  return lines;
}

// ─── Bar layout ─────────────────────────────────────────────────────────────

export type BarRect = {
  x: number;
  y: number;
  width: number;
  height: number;
  colorIndex: number;
  groupIndex: number;
};

export type BarXLabel = { x: number; label: string };

export type BarLayoutResult = {
  bars: BarRect[];
  xAxis: BarXLabel[];
  gridLines: GridLine[];
  max: number;
  plotW: number;
  plotH: number;
};

export function computeBarLayout(
  data: ChartData,
  config: ChartConfig,
  dims: { W: number; H: number; padL: number; padR: number; padT: number; padB: number },
  opts?: {
    barGap?: number;
    maxMultiplier?: number;
    barMinWidth?: number;
    groupInnerRatio?: number;
    groupLeftPadRatio?: number;
    gridSteps?: number;
  },
): BarLayoutResult {
  const { W, H, padL, padR, padT, padB } = dims;
  const plotW = W - padL - padR;
  const plotH = H - padT - padB;

  const xKey = config.xKey ?? data.columns[0];
  const yKeys = resolveYKeys(data, config);

  const barGap = opts?.barGap ?? 0;
  const maxMultiplier = opts?.maxMultiplier ?? 1;
  const barMinWidth = opts?.barMinWidth ?? 2;
  const groupInnerRatio = opts?.groupInnerRatio ?? 0.72;
  const groupLeftPadRatio = opts?.groupLeftPadRatio ?? (1 - groupInnerRatio) / 2;
  const gridSteps = opts?.gridSteps ?? 4;

  const rawMax = Math.max(1, ...data.rows.flatMap((r) => yKeys.map((k) => toNum(r[k]))));
  const max = rawMax * maxMultiplier;

  const groupW = plotW / Math.max(1, data.rows.length);
  const innerW = groupW * groupInnerRatio;
  const barW = Math.max(barMinWidth, (innerW - barGap * Math.max(0, yKeys.length - 1)) / Math.max(1, yKeys.length));

  const bars: BarRect[] = [];
  const xAxis: BarXLabel[] = [];

  data.rows.forEach((r, ri) => {
    const gx = padL + groupW * ri + groupW * groupLeftPadRatio;
    yKeys.forEach((k, ki) => {
      const v = toNum(r[k]);
      const bh = (v / max) * plotH;
      bars.push({
        x: gx + ki * (barW + barGap),
        y: padT + plotH - bh,
        width: barW,
        height: Math.max(0, bh),
        colorIndex: ki,
        groupIndex: ri,
      });
    });
    xAxis.push({
      x: padL + groupW * ri + groupW / 2,
      label: toLabel(r[xKey]),
    });
  });

  const gridLines = computeGridLines(padT, plotH, max, gridSteps);

  return { bars, xAxis, gridLines, max, plotW, plotH };
}

// ─── Line layout ────────────────────────────────────────────────────────────

export type LinePoint = { x: number; y: number };
export type LineSeries = { points: LinePoint[]; polyline: string; colorIndex: number };

export type LineLayoutResult = {
  series: LineSeries[];
  xAxis: BarXLabel[];
  gridLines: GridLine[];
  max: number;
  plotW: number;
  plotH: number;
};

export function computeLineLayout(
  data: ChartData,
  config: ChartConfig,
  dims: { W: number; H: number; padL: number; padR: number; padT: number; padB: number },
  opts?: {
    maxMultiplier?: number;
    gridSteps?: number;
  },
): LineLayoutResult {
  const { W, H, padL, padR, padT, padB } = dims;
  const plotW = W - padL - padR;
  const plotH = H - padT - padB;

  const xKey = config.xKey ?? data.columns[0];
  const yKeys = resolveYKeys(data, config);

  const maxMultiplier = opts?.maxMultiplier ?? 1;
  const gridSteps = opts?.gridSteps ?? 4;

  const rawMax = Math.max(1, ...data.rows.flatMap((r) => yKeys.map((k) => toNum(r[k]))));
  const max = rawMax * maxMultiplier;

  const n = data.rows.length;
  const xAt = (i: number) => (n <= 1 ? padL + plotW / 2 : padL + (plotW * i) / (n - 1));
  const yAt = (v: number) => padT + plotH - (v / max) * plotH;

  const series: LineSeries[] = yKeys.map((k, ki) => {
    const points: LinePoint[] = data.rows.map((r, ri) => ({ x: xAt(ri), y: yAt(toNum(r[k])) }));
    return {
      points,
      polyline: points.map((p) => `${p.x},${p.y}`).join(" "),
      colorIndex: ki,
    };
  });

  const xAxis: BarXLabel[] = data.rows.map((r, ri) => ({
    x: xAt(ri),
    label: toLabel(r[xKey]),
  }));

  const gridLines = computeGridLines(padT, plotH, max, gridSteps);

  return { series, xAxis, gridLines, max, plotW, plotH };
}

// ─── Pie / Donut layout ─────────────────────────────────────────────────────

export type PieSlice = {
  d: string;
  colorIndex: number;
  label: string;
  value: number;
};

export type PieLayoutResult = {
  slices: PieSlice[];
  cx: number;
  cy: number;
  radius: number;
  total: number;
};

export type DonutLayoutResult = PieLayoutResult & {
  innerRadius: number;
};

function computeSlices(
  data: ChartData,
  config: ChartConfig,
  cx: number,
  cy: number,
  radius: number,
  innerRadius: number,
): { slices: PieSlice[]; total: number } {
  const xKey = config.xKey ?? data.columns[0];
  const yKeys = resolveYKeys(data, config);
  const key = yKeys[0];

  const raw = data.rows.map((r) => ({ label: toLabel(r[xKey]), value: toNum(r[key]) }));
  const total = raw.reduce((s, x) => s + x.value, 0) || 1;

  let a0 = -Math.PI / 2;
  const slices: PieSlice[] = raw.map((s, i) => {
    const a1 = a0 + (s.value / total) * Math.PI * 2;
    const large = a1 - a0 > Math.PI ? 1 : 0;
    const x0 = cx + radius * Math.cos(a0);
    const y0 = cy + radius * Math.sin(a0);
    const x1 = cx + radius * Math.cos(a1);
    const y1 = cy + radius * Math.sin(a1);

    let d: string;
    if (innerRadius > 0) {
      const ix0 = cx + innerRadius * Math.cos(a0);
      const iy0 = cy + innerRadius * Math.sin(a0);
      const ix1 = cx + innerRadius * Math.cos(a1);
      const iy1 = cy + innerRadius * Math.sin(a1);
      d = `M${x0},${y0} A${radius},${radius} 0 ${large} 1 ${x1},${y1} L${ix1},${iy1} A${innerRadius},${innerRadius} 0 ${large} 0 ${ix0},${iy0} Z`;
    } else {
      d = `M${cx},${cy} L${x0},${y0} A${radius},${radius} 0 ${large} 1 ${x1},${y1} Z`;
    }

    a0 = a1;
    return { d, colorIndex: i, label: s.label, value: s.value };
  });

  return { slices, total };
}

export function computePieLayout(
  data: ChartData,
  config: ChartConfig,
  dims: { W: number; H: number },
  radiusOverride?: number,
): PieLayoutResult {
  const cx = dims.W / 2;
  const cy = dims.H / 2;
  const radius = radiusOverride ?? dims.H / 2 - 24;
  const { slices, total } = computeSlices(data, config, cx, cy, radius, 0);
  return { slices, cx, cy, radius, total };
}

export function computeDonutLayout(
  data: ChartData,
  config: ChartConfig,
  dims: { W: number; H: number },
  innerRatio: number = 0.55,
  radiusOverride?: number,
): DonutLayoutResult {
  const cx = dims.W / 2;
  const cy = dims.H / 2;
  const radius = radiusOverride ?? dims.H / 2 - 24;
  const innerRadius = radius * innerRatio;
  const { slices, total } = computeSlices(data, config, cx, cy, radius, innerRadius);
  return { slices, cx, cy, radius, innerRadius, total };
}

// ─── KPI layout ─────────────────────────────────────────────────────────────

export type KpiMetric = { value: string; label: string; colorIndex: number };

export type KpiLayoutResult = {
  metrics: KpiMetric[];
};

export function computeKpiLayout(
  data: ChartData,
  config: ChartConfig,
  opts?: { useLastRow?: boolean },
): KpiLayoutResult {
  const yKeys = resolveYKeys(data, config);
  const row = opts?.useLastRow
    ? data.rows[data.rows.length - 1] ?? {}
    : data.rows[0] ?? {};
  const metrics: KpiMetric[] = yKeys.map((k, i) => ({
    value: toLabel(row[k]),
    label: k,
    colorIndex: i,
  }));
  return { metrics };
}

// ─── Table layout ───────────────────────────────────────────────────────────

export type TableColumn = { key: string; label: string };
export type TableRow = Record<string, string>;

export type TableLayoutResult = {
  columns: TableColumn[];
  rows: TableRow[];
};

export function computeTableLayout(data: ChartData): TableLayoutResult {
  const columns: TableColumn[] = data.columns.map((c) => ({ key: c, label: c }));
  const rows: TableRow[] = data.rows.map((r) => {
    const row: TableRow = {};
    data.columns.forEach((c) => {
      row[c] = toLabel(r[c]);
    });
    return row;
  });
  return { columns, rows };
}
