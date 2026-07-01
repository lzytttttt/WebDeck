"use client";

import type { ChartType, ChartData, ChartConfig } from "@/types/deck";

// Dependency-free SVG chart renderer. Everything is hand-rolled so the deck
// carries no charting library. Colors resolve from theme CSS vars so charts
// follow whichever theme the deck root sets.

// Palette derived from theme vars. color-mix fallbacks give distinct hues past
// the three named vars without introducing hardcoded colors.
const PALETTE: string[] = [
  "var(--deck-accent)",
  "var(--deck-primary)",
  "var(--deck-secondary)",
  "color-mix(in srgb, var(--deck-accent) 60%, var(--deck-primary))",
  "color-mix(in srgb, var(--deck-primary) 60%, var(--deck-secondary))",
  "color-mix(in srgb, var(--deck-secondary) 60%, var(--deck-accent))",
  "color-mix(in srgb, var(--deck-accent) 40%, transparent)",
  "color-mix(in srgb, var(--deck-primary) 40%, transparent)",
];

const color = (i: number): string => PALETTE[((i % PALETTE.length) + PALETTE.length) % PALETTE.length];

// Resolve the numeric series keys: explicit config, else every column (other
// than xKey) whose values coerce to finite numbers across the rows.
function resolveYKeys(data: ChartData, config: ChartConfig): string[] {
  if (config.yKeys && config.yKeys.length) return config.yKeys;
  const xKey = config.xKey ?? data.columns[0];
  return data.columns.filter((c) => {
    if (c === xKey) return false;
    return data.rows.some((r) => Number.isFinite(Number(r[c])));
  });
}

const num = (v: string | number | undefined): number => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};

const label = (v: string | number | undefined): string =>
  v === undefined || v === null ? "" : String(v);

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
// Bar
// ---------------------------------------------------------------------------

function BarChart({
  data,
  config,
  yKeys,
  xKey,
}: {
  data: ChartData;
  config: ChartConfig;
  yKeys: string[];
  xKey: string | undefined;
}) {
  const W = 640;
  const H = 360;
  const padL = 44;
  const padR = 16;
  const padT = 16;
  const padB = 44;
  const plotW = W - padL - padR;
  const plotH = H - padT - padB;

  const max = Math.max(
    1,
    ...data.rows.flatMap((r) => yKeys.map((k) => num(r[k]))),
  );
  const gridLines = 4;

  const groupW = plotW / data.rows.length;
  const barGap = 4;
  const innerW = groupW * 0.72;
  const barW = Math.max(2, (innerW - barGap * (yKeys.length - 1)) / yKeys.length);

  const y0 = padT + plotH;

  return (
    <div>
      <Svg w={W} h={H}>
        {config.showGrid
          ? Array.from({ length: gridLines + 1 }, (_, i) => {
              const gy = padT + (plotH * i) / gridLines;
              const val = max - (max * i) / gridLines;
              return (
                <g key={i}>
                  <line
                    x1={padL}
                    y1={gy}
                    x2={W - padR}
                    y2={gy}
                    stroke="color-mix(in srgb, var(--deck-text) 14%, transparent)"
                    strokeWidth={1}
                    opacity={0.5}
                  />
                  <text
                    x={padL - 6}
                    y={gy + 3}
                    textAnchor="end"
                    fontSize={10}
                    fill="var(--deck-muted)"
                  >
                    {Math.round(val)}
                  </text>
                </g>
              );
            })
          : null}
        {data.rows.map((r, ri) => {
          const gx = padL + groupW * ri + (groupW - innerW) / 2;
          return (
            <g key={ri}>
              {yKeys.map((k, ki) => {
                const v = num(r[k]);
                const bh = (v / max) * plotH;
                const bx = gx + ki * (barW + barGap);
                return (
                  <rect
                    key={ki}
                    x={bx}
                    y={y0 - bh}
                    width={barW}
                    height={Math.max(0, bh)}
                    rx={2}
                    fill={color(ki)}
                  />
                );
              })}
              <text
                x={padL + groupW * ri + groupW / 2}
                y={H - padB + 16}
                textAnchor="middle"
                fontSize={10}
                fill="var(--deck-muted)"
              >
                {label(xKey ? r[xKey] : "")}
              </text>
            </g>
          );
        })}
        <line
          x1={padL}
          y1={y0}
          x2={W - padR}
          y2={y0}
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
// Line
// ---------------------------------------------------------------------------

function LineChart({
  data,
  config,
  yKeys,
  xKey,
}: {
  data: ChartData;
  config: ChartConfig;
  yKeys: string[];
  xKey: string | undefined;
}) {
  const W = 640;
  const H = 360;
  const padL = 44;
  const padR = 16;
  const padT = 16;
  const padB = 44;
  const plotW = W - padL - padR;
  const plotH = H - padT - padB;

  const max = Math.max(
    1,
    ...data.rows.flatMap((r) => yKeys.map((k) => num(r[k]))),
  );
  const gridLines = 4;
  const y0 = padT + plotH;

  const n = data.rows.length;
  const xAt = (i: number) => (n === 1 ? padL + plotW / 2 : padL + (plotW * i) / (n - 1));
  const yAt = (v: number) => y0 - (v / max) * plotH;

  return (
    <div>
      <Svg w={W} h={H}>
        {config.showGrid
          ? Array.from({ length: gridLines + 1 }, (_, i) => {
              const gy = padT + (plotH * i) / gridLines;
              const val = max - (max * i) / gridLines;
              return (
                <g key={i}>
                  <line
                    x1={padL}
                    y1={gy}
                    x2={W - padR}
                    y2={gy}
                    stroke="color-mix(in srgb, var(--deck-text) 14%, transparent)"
                    strokeWidth={1}
                    opacity={0.5}
                  />
                  <text
                    x={padL - 6}
                    y={gy + 3}
                    textAnchor="end"
                    fontSize={10}
                    fill="var(--deck-muted)"
                  >
                    {Math.round(val)}
                  </text>
                </g>
              );
            })
          : null}
        {yKeys.map((k, ki) => {
          const pts = data.rows.map((r, i) => `${xAt(i)},${yAt(num(r[k]))}`).join(" ");
          return (
            <g key={ki}>
              <polyline
                points={pts}
                fill="none"
                stroke={color(ki)}
                strokeWidth={2.5}
                strokeLinejoin="round"
                strokeLinecap="round"
              />
              {data.rows.map((r, i) => (
                <circle
                  key={i}
                  cx={xAt(i)}
                  cy={yAt(num(r[k]))}
                  r={3}
                  fill={color(ki)}
                />
              ))}
            </g>
          );
        })}
        {data.rows.map((r, i) => (
          <text
            key={i}
            x={xAt(i)}
            y={H - padB + 16}
            textAnchor="middle"
            fontSize={10}
            fill="var(--deck-muted)"
          >
            {label(xKey ? r[xKey] : "")}
          </text>
        ))}
        <line
          x1={padL}
          y1={y0}
          x2={W - padR}
          y2={y0}
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
  yKeys,
  xKey,
  donut,
}: {
  data: ChartData;
  config: ChartConfig;
  yKeys: string[];
  xKey: string | undefined;
  donut: boolean;
}) {
  const W = 360;
  const H = 360;
  const cx = W / 2;
  const cy = H / 2;
  const r = 150;
  const inner = donut ? 82 : 0;

  const key = yKeys[0];
  const values = data.rows.map((row) => num(row[key]));
  const total = values.reduce((a, b) => a + b, 0);

  // Guard: all-zero total would divide by zero.
  const safeTotal = total > 0 ? total : 1;

  let angle = -Math.PI / 2; // start at top
  const slices = values.map((v, i) => {
    const frac = v / safeTotal;
    const start = angle;
    const end = angle + frac * Math.PI * 2;
    angle = end;
    const largeArc = end - start > Math.PI ? 1 : 0;
    const x1 = cx + r * Math.cos(start);
    const y1 = cy + r * Math.sin(start);
    const x2 = cx + r * Math.cos(end);
    const y2 = cy + r * Math.sin(end);

    let d: string;
    if (inner > 0) {
      const ix1 = cx + inner * Math.cos(end);
      const iy1 = cy + inner * Math.sin(end);
      const ix2 = cx + inner * Math.cos(start);
      const iy2 = cy + inner * Math.sin(start);
      d = `M ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2} L ${ix1} ${iy1} A ${inner} ${inner} 0 ${largeArc} 0 ${ix2} ${iy2} Z`;
    } else {
      d = `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2} Z`;
    }
    return { d, color: color(i) };
  });

  return (
    <div>
      <Svg w={W} h={H}>
        {slices.map((s, i) => (
          <path key={i} d={s.d} fill={s.color} stroke="var(--deck-bg)" strokeWidth={1} />
        ))}
      </Svg>
      {config.showLegend !== false
        ? (
          <Legend
            items={data.rows.map((row, i) => ({
              label: label(xKey ? row[xKey] : `#${i + 1}`),
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
  yKeys,
}: {
  data: ChartData;
  yKeys: string[];
}) {
  const last = data.rows[data.rows.length - 1];
  return (
    <div className="flex flex-wrap gap-4">
      {yKeys.map((k, i) => (
        <div key={k} className="deck-card flex-1 p-6" style={{ minWidth: 160 }}>
          <div className="text-3xl font-bold deck-heading" style={{ color: color(i) }}>
            {label(last ? last[k] : "")}
          </div>
          <div className="mt-1 text-sm deck-muted">{k}</div>
        </div>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Table
// ---------------------------------------------------------------------------

function DataTable({ data }: { data: ChartData }) {
  return (
    <div className="deck-card overflow-x-auto">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr>
            {data.columns.map((c) => (
              <th
                key={c}
                className="deck-border border-b px-4 py-3 text-left font-semibold deck-heading"
              >
                {c}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.rows.map((row, ri) => (
            <tr key={ri}>
              {data.columns.map((c) => (
                <td key={c} className="deck-border border-b px-4 py-2.5 deck-text">
                  {label(row[c])}
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

  const xKey = config.xKey ?? columns[0];
  const yKeys = resolveYKeys(safe, config);

  // Every graphical chart needs at least one row and one numeric series.
  if (!rows.length || !yKeys.length) return <EmptyState />;

  switch (chartType) {
    case "bar":
      return <BarChart data={safe} config={config} yKeys={yKeys} xKey={xKey} />;
    case "line":
      return <LineChart data={safe} config={config} yKeys={yKeys} xKey={xKey} />;
    case "pie":
      return <PieChart data={safe} config={config} yKeys={yKeys} xKey={xKey} donut={false} />;
    case "donut":
      return <PieChart data={safe} config={config} yKeys={yKeys} xKey={xKey} donut />;
    case "kpi":
      return <KpiCards data={safe} yKeys={yKeys} />;
    default:
      return <EmptyState />;
  }
}
