"use client";

import type { ChartType, ChartData, ChartConfig } from "@/types/deck";
import {
  PALETTE_EXTENDED,
  getColorForIndex,
  toNum,
  toLabel,
  resolveYKeys,
  computeBarLayout,
  computeLineLayout,
  computePieLayout,
  computeDonutLayout,
  computeKpiLayout,
  computeTableLayout,
} from "@/lib/chart/core";

// Dependency-free SVG chart renderer. Everything is hand-rolled so the deck
// carries no charting library. Colors resolve from theme CSS vars so charts
// follow whichever theme the deck root sets.
//
// Layout computation is delegated to lib/chart/core.ts; this module only
// contains JSX rendering.

const color = (i: number): string => getColorForIndex(i, PALETTE_EXTENDED);

// Shared responsive SVG wrapper: viewBox fixes the coordinate space, CSS makes
// it fluid (full width, height scales to preserve aspect ratio).
function Svg({
  w,
  h,
  children,
}: {
  w: number;
  h: number;
  children: React.ReactNode;
}) {
  return (
    <svg
      viewBox={`0 0 ${w} ${h}`}
      preserveAspectRatio="xMidYMid meet"
      style={{ width: "100%", height: "auto", display: "block" }}
      role="img"
    >
      {children}
    </svg>
  );
}

// Centered placeholder with a tiny bar-chart glyph. Never crashes on empty data.
function EmptyState() {
  return (
    <div
      className="flex flex-col items-center justify-center gap-3 deck-muted py-12"
      style={{ minHeight: 160 }}
    >
      <svg viewBox="0 0 48 48" width="48" height="48" aria-hidden="true">
        <rect x="6" y="26" width="8" height="16" rx="1" fill="currentColor" opacity="0.4" />
        <rect x="20" y="16" width="8" height="26" rx="1" fill="currentColor" opacity="0.6" />
        <rect x="34" y="8" width="8" height="34" rx="1" fill="currentColor" opacity="0.35" />
      </svg>
      <span className="text-sm font-medium">No data</span>
    </div>
  );
}

function Legend({ items }: { items: Array<{ label: string; color: string }> }) {
  return (
    <div className="mt-3 flex flex-wrap items-center justify-center gap-x-5 gap-y-2">
      {items.map((it, i) => (
        <div key={i} className="flex items-center gap-2 text-xs deck-muted">
          <span
            className="inline-block h-3 w-3 shrink-0 rounded-sm"
            style={{ background: it.color }}
          />
          <span>{it.label}</span>
        </div>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Shared dimensions
// ---------------------------------------------------------------------------

const REACT_DIMS = { W: 640, H: 360, padL: 44, padR: 16, padT: 16, padB: 44 };

// ---------------------------------------------------------------------------
// Bar
// ---------------------------------------------------------------------------

function BarChart({
  data,
  config,
}: {
  data: ChartData;
  config: ChartConfig;
}) {
  const { W, H, padL, padR, padB } = REACT_DIMS;
  const layout = computeBarLayout(data, config, REACT_DIMS, {
    barGap: 4,
    barMinWidth: 2,
    groupInnerRatio: 0.72,
  });

  return (
    <div>
      <Svg w={W} h={H}>
        {config.showGrid
          ? layout.gridLines.map((gl, i) => (
              <g key={i}>
                <line
                  x1={padL}
                  y1={gl.y}
                  x2={W - padR}
                  y2={gl.y}
                  stroke="color-mix(in srgb, var(--deck-text) 14%, transparent)"
                  strokeWidth={1}
                  opacity={0.5}
                />
                <text
                  x={padL - 6}
                  y={gl.y + 3}
                  textAnchor="end"
                  fontSize={10}
                  fill="var(--deck-muted)"
                >
                  {gl.value}
                </text>
              </g>
            ))
          : null}
        {data.rows.map((_r, ri) => {
          const groupBars = layout.bars.filter((b) => b.groupIndex === ri);
          const labelItem = layout.xAxis[ri];
          return (
            <g key={ri}>
              {groupBars.map((bar) => (
                <rect
                  key={bar.colorIndex}
                  x={bar.x}
                  y={bar.y}
                  width={bar.width}
                  height={bar.height}
                  rx={2}
                  fill={color(bar.colorIndex)}
                />
              ))}
              <text
                x={labelItem.x}
                y={H - padB + 16}
                textAnchor="middle"
                fontSize={10}
                fill="var(--deck-muted)"
              >
                {labelItem.label}
              </text>
            </g>
          );
        })}
        <line
          x1={padL}
          y1={layout.gridLines[0]?.y ?? 0}
          x2={W - padR}
          y2={layout.gridLines[0]?.y ?? 0}
          stroke="color-mix(in srgb, var(--deck-text) 14%, transparent)"
          strokeWidth={1}
        />
      </Svg>
      {config.showLegend
        ? <Legend items={resolveYKeys(data, config).map((k, i) => ({ label: k, color: color(i) }))} />
        : null}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Line
// ---------------------------------------------------------------------------

function LineChart({
  data,
  config,
}: {
  data: ChartData;
  config: ChartConfig;
}) {
  const { W, H, padL, padR, padB } = REACT_DIMS;
  const yKeys = resolveYKeys(data, config);
  const layout = computeLineLayout(data, config, REACT_DIMS);

  return (
    <div>
      <Svg w={W} h={H}>
        {config.showGrid
          ? layout.gridLines.map((gl, i) => (
              <g key={i}>
                <line
                  x1={padL}
                  y1={gl.y}
                  x2={W - padR}
                  y2={gl.y}
                  stroke="color-mix(in srgb, var(--deck-text) 14%, transparent)"
                  strokeWidth={1}
                  opacity={0.5}
                />
                <text
                  x={padL - 6}
                  y={gl.y + 3}
                  textAnchor="end"
                  fontSize={10}
                  fill="var(--deck-muted)"
                >
                  {gl.value}
                </text>
              </g>
            ))
          : null}
        {layout.series.map((s) => (
          <g key={s.colorIndex}>
            <polyline
              points={s.polyline}
              fill="none"
              stroke={color(s.colorIndex)}
              strokeWidth={2.5}
              strokeLinejoin="round"
              strokeLinecap="round"
            />
            {s.points.map((p, i) => (
              <circle
                key={i}
                cx={p.x}
                cy={p.y}
                r={3}
                fill={color(s.colorIndex)}
              />
            ))}
          </g>
        ))}
        {layout.xAxis.map((xl, i) => (
          <text
            key={i}
            x={xl.x}
            y={H - padB + 16}
            textAnchor="middle"
            fontSize={10}
            fill="var(--deck-muted)"
          >
            {xl.label}
          </text>
        ))}
        <line
          x1={padL}
          y1={layout.gridLines[0]?.y ?? 0}
          x2={W - padR}
          y2={layout.gridLines[0]?.y ?? 0}
          stroke="color-mix(in srgb, var(--deck-text) 14%, transparent)"
          strokeWidth={1}
        />
      </Svg>
      {config.showLegend
        ? <Legend items={yKeys.map((k, i) => ({ label: k, color: color(i) }))} />
        : null}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Pie / Donut
// ---------------------------------------------------------------------------

function PieChart({
  data,
  config,
  donut,
}: {
  data: ChartData;
  config: ChartConfig;
  donut: boolean;
}) {
  const PIE_DIMS = { W: 360, H: 360 };
  const layout = donut
    ? computeDonutLayout(data, config, PIE_DIMS, 0.55, 150)
    : computePieLayout(data, config, PIE_DIMS, 150);

  const xKey = config.xKey ?? data.columns[0];

  return (
    <div>
      <Svg w={PIE_DIMS.W} h={PIE_DIMS.H}>
        {layout.slices.map((s) => (
          <path key={s.colorIndex} d={s.d} fill={color(s.colorIndex)} stroke="var(--deck-bg)" strokeWidth={1} />
        ))}
      </Svg>
      {config.showLegend !== false
        ? (
          <Legend
            items={data.rows.map((row, i) => ({
              label: toLabel(xKey ? row[xKey] : `#${i + 1}`),
              color: color(i),
            }))}
          />
        )
        : null}
    </div>
  );
}

// ---------------------------------------------------------------------------
// KPI
// ---------------------------------------------------------------------------

function KpiCards({
  data,
  config,
}: {
  data: ChartData;
  config: ChartConfig;
}) {
  const layout = computeKpiLayout(data, config, { useLastRow: true });
  return (
    <div className="flex flex-wrap gap-4">
      {layout.metrics.map((m) => (
        <div key={m.label} className="deck-card flex-1 p-6" style={{ minWidth: 160 }}>
          <div className="text-3xl font-bold deck-heading" style={{ color: color(m.colorIndex) }}>
            {m.value}
          </div>
          <div className="mt-1 text-sm deck-muted">{m.label}</div>
        </div>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Table
// ---------------------------------------------------------------------------

function DataTable({ data }: { data: ChartData }) {
  const layout = computeTableLayout(data);
  return (
    <div className="deck-card overflow-x-auto">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr>
            {layout.columns.map((c) => (
              <th
                key={c.key}
                className="deck-border border-b px-4 py-3 text-left font-semibold deck-heading"
              >
                {c.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {layout.rows.map((row, ri) => (
            <tr key={ri}>
              {layout.columns.map((c) => (
                <td key={c.key} className="deck-border border-b px-4 py-2.5 deck-text">
                  {row[c.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Entry point
// ---------------------------------------------------------------------------

export function ChartView({
  chartType,
  data,
  config,
}: {
  chartType: ChartType;
  data: ChartData;
  config: ChartConfig;
}) {
  const rows = data.rows ?? [];
  const columns = data.columns ?? [];
  const safe: ChartData = { columns, rows };

  // Table renders raw columns/rows; empty means only "No data".
  if (chartType === "table") {
    return columns.length ? <DataTable data={safe} /> : <EmptyState />;
  }

  // Every graphical chart needs at least one row and one numeric series.
  const yKeys = resolveYKeys(safe, config);
  if (!rows.length || !yKeys.length) return <EmptyState />;

  switch (chartType) {
    case "bar":
      return <BarChart data={safe} config={config} />;
    case "line":
      return <LineChart data={safe} config={config} />;
    case "pie":
      return <PieChart data={safe} config={config} donut={false} />;
    case "donut":
      return <PieChart data={safe} config={config} donut />;
    case "kpi":
      return <KpiCards data={safe} config={config} />;
    default:
      return <EmptyState />;
  }
}
