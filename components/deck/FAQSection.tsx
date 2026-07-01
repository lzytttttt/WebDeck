"use client";

import type { FAQItem, FAQSection as FAQSectionType } from "@/types/deck";
import { InlineText, useMaybeEdit } from "./EditContext";

// Native <details> gives an accessible accordion with zero client JS.
export function FAQSection({ section }: { section: FAQSectionType }) {
  const edit = useMaybeEdit();
  const editable = edit?.editable ?? false;
  const layout = section.layout ?? "accordion";
  const patch = (next: Partial<FAQSectionType>) =>
    edit?.updateSection({ ...section, ...next });

  const setItem = (i: number, next: Partial<FAQItem>) => {
    const items = section.items.map((it, j) => (j === i ? { ...it, ...next } : it));
    patch({ items });
  };
  const addItem = () =>
    patch({ items: [...section.items, { question: "New question", answer: "Answer" }] });
  const removeItem = (i: number) =>
    patch({ items: section.items.filter((_, j) => j !== i) });

  const removeBtn = (i: number) =>
    editable ? (
      <button
        onClick={(e) => {
          e.stopPropagation();
          removeItem(i);
        }}
        className="opacity-0 group-hover:opacity-100 text-xs deck-muted hover:text-red-500"
        aria-label="Remove question"
      >
        ✕
      </button>
    ) : null;

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
      {layout === "two-column" ? (
        <div className="grid gap-4 md:grid-cols-2">
          {section.items.map((item, i) => (
            <div key={i} className="group deck-card p-4">
              <div className="flex items-start justify-between gap-2">
                <InlineText
                  as="h3"
                  editable={editable}
                  value={item.question}
                  placeholder="Question"
                  onChange={(v) => setItem(i, { question: v })}
                  className="deck-heading font-semibold"
                />
                {removeBtn(i)}
              </div>
              <InlineText
                as="p"
                editable={editable}
                value={item.answer}
                placeholder="Answer"
                onChange={(v) => setItem(i, { answer: v })}
                className="mt-2 deck-muted"
              />
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {section.items.map((item, i) => (
            <details key={i} className="group deck-card p-4">
              <summary className="flex cursor-pointer list-none items-center justify-between font-semibold marker:hidden">
                <span className="flex-1">
                  <span className="mr-2 deck-accent">Q</span>
                  <InlineText
                    editable={editable}
                    value={item.question}
                    placeholder="Question"
                    onChange={(v) => setItem(i, { question: v })}
                    className="deck-heading"
                  />
                </span>
                {removeBtn(i)}
              </summary>
              <InlineText
                as="p"
                editable={editable}
                value={item.answer}
                placeholder="Answer"
                onChange={(v) => setItem(i, { answer: v })}
                className="mt-3 deck-muted"
              />
            </details>
          ))}
        </div>
      )}
      {editable ? (
        <button
          onClick={(e) => {
            e.stopPropagation();
            addItem();
          }}
          className="mt-4 text-xs font-semibold deck-accent hover:underline"
        >
          + Add question
        </button>
      ) : null}
    </div>
  );
}
