"use client";

import type { CTASection as CTASectionType } from "@/types/deck";
import { InlineText, useMaybeEdit } from "./EditContext";

export function CTASection({ section }: { section: CTASectionType }) {
  const edit = useMaybeEdit();
  const editable = edit?.editable ?? false;
  const patch = (next: Partial<CTASectionType>) =>
    edit?.updateSection({ ...section, ...next });

  return (
    <div className="mx-auto max-w-3xl px-6 py-12">
      <div className="deck-bg-primary deck-radius px-8 py-12 text-center">
        <InlineText
          as="h2"
          editable={editable}
          value={section.title}
          placeholder="Call to action"
          onChange={(v) => patch({ title: v })}
          className="text-2xl font-bold"
        />
        {section.description || editable ? (
          <InlineText
            as="p"
            editable={editable}
            value={section.description ?? ""}
            placeholder="Optional description"
            onChange={(v) => patch({ description: v })}
            className="mx-auto mt-3 max-w-xl opacity-80"
          />
        ) : null}
        <div className="mt-7 flex flex-wrap justify-center gap-3">
          <InlineText
            editable={editable}
            value={section.primaryLabel}
            placeholder="Primary action"
            onChange={(v) => patch({ primaryLabel: v })}
            className="inline-flex items-center deck-bg-accent deck-radius px-6 py-3 font-semibold"
          />
          {section.secondaryLabel || editable ? (
            <InlineText
              editable={editable}
              value={section.secondaryLabel ?? ""}
              placeholder="Secondary action"
              onChange={(v) => patch({ secondaryLabel: v })}
              className="inline-flex items-center deck-radius border border-current/30 px-6 py-3 font-semibold"
            />
          ) : null}
        </div>
      </div>
    </div>
  );
}
