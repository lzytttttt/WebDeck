"use client";

import type { SlideLikeSection as SlideLikeSectionType } from "@/types/deck";
import { InlineText, useMaybeEdit } from "./EditContext";

// The "Text" section. Conservative rendering: title + bullets + optional body.
export function SlideLikeSection({
  section,
}: {
  section: SlideLikeSectionType;
}) {
  const edit = useMaybeEdit();
  const editable = edit?.editable ?? false;
  const patch = (next: Partial<SlideLikeSectionType>) =>
    edit?.updateSection({ ...section, ...next });

  const setBullet = (i: number, v: string) => {
    const bullets = [...section.bullets];
    bullets[i] = v;
    patch({ bullets });
  };
  const addBullet = () => patch({ bullets: [...section.bullets, "New point"] });
  const removeBullet = (i: number) =>
    patch({ bullets: section.bullets.filter((_, j) => j !== i) });

  return (
    <div className="mx-auto max-w-3xl px-6 py-8">
      <div className="deck-card p-8">
        <InlineText
          as="h2"
          editable={editable}
          value={section.title}
          placeholder="Section title"
          onChange={(v) => patch({ title: v })}
          className="deck-heading mb-5 text-2xl font-bold"
        />
        {section.body || editable ? (
          <InlineText
            as="p"
            editable={editable}
            value={section.body ?? ""}
            placeholder="Optional paragraph"
            onChange={(v) => patch({ body: v })}
            className="mb-4 deck-muted"
          />
        ) : null}
        {section.bullets.length ? (
          <ul className="space-y-2.5">
            {section.bullets.map((b, i) => (
              <li key={i} className="group flex gap-3 deck-text">
                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full deck-bg-accent" />
                <InlineText
                  editable={editable}
                  value={b}
                  placeholder="Bullet"
                  onChange={(v) => setBullet(i, v)}
                  className="flex-1"
                />
                {editable ? (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      removeBullet(i);
                    }}
                    className="opacity-0 group-hover:opacity-100 text-xs deck-muted hover:text-red-500"
                    aria-label="Remove bullet"
                  >
                    ✕
                  </button>
                ) : null}
              </li>
            ))}
          </ul>
        ) : null}
        {editable ? (
          <button
            onClick={(e) => {
              e.stopPropagation();
              addBullet();
            }}
            className="mt-4 text-xs font-semibold deck-accent hover:underline"
          >
            + Add bullet
          </button>
        ) : null}
      </div>
    </div>
  );
}
