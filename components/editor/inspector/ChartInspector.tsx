"use client";

import { useState } from "react";
import type { ChartSection, ChartType } from "@/types/deck";
import { parseCsv } from "@/lib/deck/parseCsv";
import {
  InspectorSection,
  Field,
  TextInput,
  SelectInput,
  Toggle,
  ButtonGroup,
} from "./InspectorParts";
import { useI18n } from "@/lib/i18n/I18nProvider";

const CHART_TYPE_VALUES: ChartType[] = ["bar", "line", "pie", "donut", "kpi", "table"];

export function ChartInspector({
  section,
  onChange,
}: {
  section: ChartSection;
  onChange: (next: ChartSection) => void;
}) {
  const { t } = useI18n();
  const ci = t.inspector.chart;
  const chartTypes = CHART_TYPE_VALUES.map((value) => ({ value, label: ci.types[value] }));
  const [csv, setCsv] = useState("");
  const [csvError, setCsvError] = useState<string | null>(null);

  const patch = (next: Partial<ChartSection>) => onChange({ ...section, ...next });
  const patchConfig = (next: Partial<ChartSection["config"]>) =>
    onChange({ ...section, config: { ...section.config, ...next } });

  const applyCsv = () => {
    const parsed = parseCsv(csv);
    if (!parsed) {
      setCsvError(ci.csvError);
      return;
    }
    setCsvError(null);
    // Reset xKey/yKeys to sensible defaults for the new columns.
    const [first, ...rest] = parsed.columns;
    patch({
      data: parsed,
      config: {
        ...section.config,
        xKey: first,
        yKeys: rest,
      },
    });
  };

  const { columns, rows } = section.data;

  const setCell = (rowIdx: number, col: string, raw: string) => {
    const num = Number(raw);
    const value: string | number =
      raw !== "" && !Number.isNaN(num) && col !== columns[0] ? num : raw;
    const nextRows = rows.map((r, i) =>
      i === rowIdx ? { ...r, [col]: value } : r,
    );
    patch({ data: { columns, rows: nextRows } });
  };

  const addRow = () => {
    const blank: Record<string, string | number> = {};
    columns.forEach((c) => (blank[c] = ""));
    patch({ data: { columns, rows: [...rows, blank] } });
  };

  const removeRow = (i: number) =>
    patch({ data: { columns, rows: rows.filter((_, j) => j !== i) } });

  const toggleYKey = (col: string) => {
    const cur = section.config.yKeys ?? [];
    const next = cur.includes(col)
      ? cur.filter((c) => c !== col)
      : [...cur, col];
    patchConfig({ yKeys: next });
  };

  return (
    <>
      <InspectorSection title={ci.title}>
        <Field label={ci.chartType}>
          <ButtonGroup
            value={section.chartType}
            options={chartTypes}
            onChange={(v) => patch({ chartType: v as ChartType })}
          />
        </Field>
        <Field label={ci.chartTitle}>
          <TextInput value={section.title} onChange={(v) => patch({ title: v })} />
        </Field>
        <Field label={ci.insight}>
          <TextInput
            value={section.insight ?? ""}
            onChange={(v) => patch({ insight: v })}
            placeholder={ci.insightPlaceholder}
            multiline
          />
        </Field>
      </InspectorSection>

      <InspectorSection title={ci.axes}>
        <Field label={ci.xAxis}>
          <SelectInput
            value={section.config.xKey ?? columns[0] ?? ""}
            options={columns.map((c) => ({ value: c, label: c }))}
            onChange={(v) => patchConfig({ xKey: v })}
          />
        </Field>
        <span className="mb-1 block text-xs font-medium text-foreground">
          {ci.ySeries}
        </span>
        <div className="mb-3 flex flex-wrap gap-1.5">
          {columns
            .filter((c) => c !== (section.config.xKey ?? columns[0]))
            .map((c) => {
              const on = (section.config.yKeys ?? []).includes(c);
              return (
                <button
                  key={c}
                  onClick={() => toggleYKey(c)}
                  className={
                    "rounded-md border px-2 py-1 text-xs " +
                    (on
                      ? "border-accent bg-accent/10 text-accent"
                      : "border-border text-muted-foreground")
                  }
                >
                  {c}
                </button>
              );
            })}
        </div>
        <Toggle
          label={ci.legend}
          checked={section.config.showLegend ?? true}
          onChange={(v) => patchConfig({ showLegend: v })}
        />
        <Toggle
          label={ci.grid}
          checked={section.config.showGrid ?? true}
          onChange={(v) => patchConfig({ showGrid: v })}
        />
      </InspectorSection>

      <InspectorSection title={ci.data}>
        <div className="mb-3 overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr>
                {columns.map((c) => (
                  <th key={c} className="border-b px-1 py-1 text-left font-semibold text-foreground">
                    {c}
                  </th>
                ))}
                <th className="border-b" />
              </tr>
            </thead>
            <tbody>
              {rows.map((row, ri) => (
                <tr key={ri}>
                  {columns.map((c) => (
                    <td key={c} className="px-0.5 py-0.5">
                      <input
                        value={String(row[c] ?? "")}
                        onChange={(e) => setCell(ri, c, e.target.value)}
                        className="w-full rounded border border-input bg-background px-1 py-0.5 text-xs"
                      />
                    </td>
                  ))}
                  <td>
                    <button
                      onClick={() => removeRow(ri)}
                      className="px-1 text-muted-foreground hover:text-red-500"
                      aria-label="Remove row"
                    >
                      ✕
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <button
          onClick={addRow}
          className="text-xs font-semibold text-accent hover:underline"
        >
          {ci.addRow}
        </button>
      </InspectorSection>

      <InspectorSection title={ci.pasteCsv}>
        <textarea
          value={csv}
          onChange={(e) => setCsv(e.target.value)}
          rows={5}
          placeholder={"Month,Revenue,Cost\nJan,120,80\nFeb,150,90"}
          className="w-full rounded-md border border-input bg-background px-2 py-1.5 font-mono text-xs"
        />
        {csvError ? (
          <p className="mt-1 text-xs text-red-500">{csvError}</p>
        ) : null}
        <button
          onClick={applyCsv}
          className="mt-2 w-full rounded-md bg-accent px-3 py-1.5 text-xs font-semibold text-accent-foreground hover:bg-accent/90"
        >
          {ci.parseApply}
        </button>
      </InspectorSection>
    </>
  );
}
