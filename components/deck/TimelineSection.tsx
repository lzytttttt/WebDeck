"use client";

import type {
  TimelineItem,
  TimelineSection as TimelineSectionType,
} from "@/types/deck";
import { InlineText, useMaybeEdit } from "./EditContext";

export function TimelineSection({
  section,
}: {
  section: TimelineSectionType;
}) {
  const edit = useMaybeEdit();
  const editable = edit?.editable ?? false;
  const patch = (next: Partial<TimelineSectionType>) =>
    edit?.updateSection({ ...section, ...next });

  const setItem = (i: number, next: Partial<TimelineItem>) => {
    const items = section.items.map((it, j) => (j === i ? { ...it, ...next } : it));
    patch({ items });
  };
  const addItem = () =>
    patch({
      items: [...section.items, { time: "Time", title: "New milestone", description: "" }],
    });
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
      <div className="ml-2 border-l-2 deck-border">
        {section.items.map((item, i) => (
          <div key={i} className="group relative pb-8 pl-6 last:pb-0">
            <span className="absolute -left-[7px] top-1.5 h-3 w-3 rounded-full deck-bg-accent" />
            <InlineText
              editable={editable}
              value={item.time}
              placeholder="Time"
              onChange={(v) => setItem(i, { time: v })}
              className="deck-accent block text-sm font-semibold"
            />
            <InlineText
              as="h3"
              editable={editable}
              value={item.title}
              placeholder="Title"
              onChange={(v) => setItem(i, { title: v })}
              className="deck-heading font-semibold"
            />
            {item.description || editable ? (
              <InlineText
                as="p"
                editable={editable}
                value={item.description ?? ""}
                placeholder="Optional description"
                onChange={(v) => setItem(i, { description: v })}
                className="deck-muted text-sm"
              />
            ) : null}
            {editable ? (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  removeItem(i);
                }}
                className="absolute right-0 top-0 opacity-0 group-hover:opacity-100 text-xs deck-muted hover:text-red-500"
                aria-label="Remove milestone"
              >
                ✕
              </button>
            ) : null}
          </div>
        ))}
      </div>
      {editable ? (
        <button
          onClick={(e) => {
            e.stopPropagation();
            addItem();
          }}
          className="mt-4 text-xs font-semibold deck-accent hover:underline"
        >
          + Add milestone
        </button>
      ) : null}
    </div>
  );
}
