"use client";

import type { ChartSection as ChartSectionType } from "@/types/deck";
import { InlineText, useMaybeEdit } from "./EditContext";
import { ChartView } from "@/lib/deck/renderChart";

export function ChartSection({ section }: { section: ChartSectionType }) {
  const edit = useMaybeEdit();
  const editable = edit?.editable ?? false;
  const patch = (next: Partial<ChartSectionType>) =>
    edit?.updateSection({ ...section, ...next });

  const layout = section.layout ?? "chart-with-insight";

  const chart = (
    <ChartView
      chartType={section.chartType}
      data={section.data}
      config={section.config}
    />
  );

  const title = (
    <InlineText
      as="h2"
      editable={editable}
      value={section.title}
      placeholder="Chart title"
      onChange={(v) => patch({ title: v })}
      className="deck-heading text-2xl font-bold"
    />
  );

  const description =
    section.description || editable ? (
      <InlineText
        as="p"
        editable={editable}
        value={section.description ?? ""}
        placeholder="Optional description"
        onChange={(v) => patch({ description: v })}
        className="mt-2 deck-muted"
      />
    ) : null;

  if (layout === "chart-with-insight") {
    return (
      <div className="mx-auto max-w-5xl px-6 py-8">
        {title}
        {description}
        <div className="mt-6 grid grid-cols-1 gap-8 md:grid-cols-2 md:items-center">
          <div>{chart}</div>
          <div>
            <InlineText
              as="p"
              editable={editable}
              value={section.insight ?? ""}
              placeholder="What does this chart tell us?"
              onChange={(v) => patch({ insight: v })}
              className="deck-muted leading-relaxed"
            />
          </div>
        </div>
      </div>
    );
  }

  if (layout === "full-width") {
    return (
      <div className="mx-auto max-w-6xl px-6 py-8">
        {title}
        {description}
        <div className="mt-6">{chart}</div>
      </div>
    );
  }

  // "card"
  return (
    <div className="mx-auto max-w-4xl px-6 py-8">
      <div className="deck-card p-8">
        {title}
        {description}
        <div className="mt-6">{chart}</div>
      </div>
    </div>
  );
}
