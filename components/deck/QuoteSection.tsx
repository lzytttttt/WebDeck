"use client";

import type { QuoteSection as QuoteSectionType } from "@/types/deck";
import { InlineText, useMaybeEdit } from "./EditContext";

export function QuoteSection({ section }: { section: QuoteSectionType }) {
  const edit = useMaybeEdit();
  const editable = edit?.editable ?? false;
  const patch = (next: Partial<QuoteSectionType>) =>
    edit?.updateSection({ ...section, ...next });

  return (
    <div className="mx-auto max-w-3xl px-6 py-12 text-center">
      <InlineText
        as="blockquote"
        editable={editable}
        value={section.quote}
        placeholder="Quote text"
        onChange={(v) => patch({ quote: v })}
        className="deck-heading text-2xl font-medium italic"
      />
      {section.author || editable ? (
        <InlineText
          as="cite"
          editable={editable}
          value={section.author ?? ""}
          placeholder="Author"
          onChange={(v) => patch({ author: v })}
          className="mt-4 block deck-muted"
        />
      ) : null}
    </div>
  );
}
