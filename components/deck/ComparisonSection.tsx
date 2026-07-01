"use client";

import type {
  ComparisonRow,
  ComparisonSection as ComparisonSectionType,
} from "@/types/deck";
import { InlineText, useMaybeEdit } from "./EditContext";

export function ComparisonSection({
  section,
}: {
  section: ComparisonSectionType;
}) {
  const edit = useMaybeEdit();
  const editable = edit?.editable ?? false;
  const patch = (next: Partial<ComparisonSectionType>) =>
    edit?.updateSection({ ...section, ...next });

  const setRow = (i: number, next: Partial<ComparisonRow>) => {
    const rows = section.rows.map((r, j) => (j === i ? { ...r, ...next } : r));
    patch({ rows });
  };
  const addRow = () =>
    patch({ rows: [...section.rows, { label: "Row", left: "", right: "" }] });
  const removeRow = (i: number) =>
    patch({ rows: section.rows.filter((_, j) => j !== i) });

  return (
    <div className="mx-auto max-w-3xl px-6 py-12">
      <InlineText
        as="h2"
        editable={editable}
        value={section.title}
        placeholder="Section title"
        onChange={(v) => patch({ title: v })}
        className="deck-heading mb-6 text-2xl font-bold"
      />
      <div className="overflow-hidden deck-card p-0">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="deck-bg-surface">
              <th className="p-3 text-left" />
              <th className="p-3 text-left">
                <InlineText
                  editable={editable}
                  value={section.leftHeader}
                  placeholder="Left header"
                  onChange={(v) => patch({ leftHeader: v })}
                  className="deck-heading font-semibold"
                />
              </th>
              <th className="p-3 text-left">
                <InlineText
                  editable={editable}
                  value={section.rightHeader}
                  placeholder="Right header"
                  onChange={(v) => patch({ rightHeader: v })}
                  className="deck-heading font-semibold"
                />
              </th>
              {editable ? <th className="w-8 p-3" /> : null}
            </tr>
          </thead>
          <tbody>
            {section.rows.map((row, i) => (
              <tr key={i} className="group border-t deck-border">
                <td className="p-3">
                  <InlineText
                    editable={editable}
                    value={row.label}
                    placeholder="Label"
                    onChange={(v) => setRow(i, { label: v })}
                    className="deck-heading font-semibold"
                  />
                </td>
                <td className="p-3">
                  <InlineText
                    editable={editable}
                    value={row.left}
                    placeholder="—"
                    onChange={(v) => setRow(i, { left: v })}
                    className="deck-muted"
                  />
                </td>
                <td className="p-3">
                  <InlineText
                    editable={editable}
                    value={row.right}
                    placeholder="—"
                    onChange={(v) => setRow(i, { right: v })}
                    className="deck-muted"
                  />
                </td>
                {editable ? (
                  <td className="p-3 align-middle">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        removeRow(i);
                      }}
                      className="opacity-0 group-hover:opacity-100 text-xs deck-muted hover:text-red-500"
                      aria-label="Remove row"
                    >
                      ✕
                    </button>
                  </td>
                ) : null}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {editable ? (
        <button
          onClick={(e) => {
            e.stopPropagation();
            addRow();
          }}
          className="mt-4 text-xs font-semibold deck-accent hover:underline"
        >
          + Add row
        </button>
      ) : null}
    </div>
  );
}
