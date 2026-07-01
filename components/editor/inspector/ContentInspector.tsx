"use client";

import type { DeckSection } from "@/types/deck";
import { ChartInspector } from "./ChartInspector";
import {
  InspectorSection,
  Field,
  TextInput,
  EmptyInspector,
} from "./InspectorParts";
import { useI18n } from "@/lib/i18n/I18nProvider";

// Content editing for the currently-selected section. Most inline text is
// edited directly on the canvas; this panel exposes the same fields for a
// keyboard-driven flow plus type-specific extras (chart data lives here).
export function ContentInspector({
  section,
  onChange,
}: {
  section: DeckSection | null;
  onChange: (next: DeckSection) => void;
}) {
  const { t } = useI18n();
  const c = t.inspector.content;
  if (!section) {
    return <EmptyInspector message={c.empty} />;
  }

  if (section.type === "chart") {
    return <ChartInspector section={section} onChange={onChange} />;
  }

  const patch = (next: Partial<DeckSection>) =>
    onChange({ ...section, ...next } as DeckSection);

  return (
    <InspectorSection title={c.title}>
      <Field label={c.sectionTitle}>
        <TextInput
          value={section.title}
          onChange={(v) => patch({ title: v })}
          placeholder={c.titlePlaceholder}
        />
      </Field>
      {section.type === "hero" ? (
        <>
          <Field label={c.eyebrow}>
            <TextInput
              value={section.eyebrow ?? ""}
              onChange={(v) => patch({ eyebrow: v })}
            />
          </Field>
          <Field label={c.subtitle}>
            <TextInput
              value={section.subtitle ?? ""}
              onChange={(v) => patch({ subtitle: v })}
              multiline
            />
          </Field>
          <Field label={c.ctaLabel}>
            <TextInput
              value={section.ctaLabel ?? ""}
              onChange={(v) => patch({ ctaLabel: v })}
            />
          </Field>
        </>
      ) : null}
      {section.type === "slide" ? (
        <Field label={c.body}>
          <TextInput
            value={section.body ?? ""}
            onChange={(v) => patch({ body: v })}
            multiline
          />
        </Field>
      ) : null}
      {section.type === "cta" ? (
        <>
          <Field label={c.description}>
            <TextInput
              value={section.description ?? ""}
              onChange={(v) => patch({ description: v })}
              multiline
            />
          </Field>
          <Field label={c.primaryLabel}>
            <TextInput
              value={section.primaryLabel}
              onChange={(v) => patch({ primaryLabel: v })}
            />
          </Field>
          <Field label={c.secondaryLabel}>
            <TextInput
              value={section.secondaryLabel ?? ""}
              onChange={(v) => patch({ secondaryLabel: v })}
            />
          </Field>
        </>
      ) : null}
      <p className="mt-2 text-xs text-muted-foreground">
        {c.hint}
      </p>
    </InspectorSection>
  );
}
