"use client";

import type { AgendaItem, AgendaSection as AgendaSectionType } from "@/types/deck";
import { InlineText, useMaybeEdit } from "./EditContext";

export function AgendaSection({ section }: { section: AgendaSectionType }) {
  const edit = useMaybeEdit();
  const editable = edit?.editable ?? false;
  const patch = (next: Partial<AgendaSectionType>) =>
    edit?.updateSection({ ...section, ...next });

  const setItem = (i: number, next: Partial<AgendaItem>) => {
    const items = section.items.map((it, j) => (j === i ? { ...it, ...next } : it));
    patch({ items });
  };
  const addItem = () =>
    patch({ items: [...section.items, { label: "New item", description: "" }] });
  const removeItem = (i: number) =>
    patch({ items: section.items.filter((_, j) => j !== i) });

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
      <ol className="space-y-3">
        {section.items.map((item, i) => (
          <li key={i} className="group flex gap-4 deck-card p-4">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full deck-bg-accent text-sm font-bold">
              {i + 1}
            </span>
            <div className="flex-1">
              <InlineText
                editable={editable}
                value={item.label}
                placeholder="Item label"
                onChange={(v) => setItem(i, { label: v })}
                className="deck-heading block font-semibold"
              />
              {item.description || editable ? (
                <InlineText
                  editable={editable}
                  value={item.description ?? ""}
                  placeholder="Optional description"
                  onChange={(v) => setItem(i, { description: v })}
                  className="deck-muted block text-sm"
                />
              ) : null}
            </div>
            {editable ? (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  removeItem(i);
                }}
                className="opacity-0 group-hover:opacity-100 text-xs deck-muted hover:text-red-500"
                aria-label="Remove item"
              >
                ✕
              </button>
            ) : null}
          </li>
        ))}
      </ol>
      {editable ? (
        <button
          onClick={(e) => {
            e.stopPropagation();
            addItem();
          }}
          className="mt-4 text-xs font-semibold deck-accent hover:underline"
        >
          + Add item
        </button>
      ) : null}
    </div>
  );
}
