"use client";

import type { WebDeck, DeckSection, DeckTheme } from "@/types/deck";
import { BUILTIN_THEMES } from "@/lib/deck/theme";
import {
  InspectorSection,
  Field,
  ButtonGroup,
  EmptyInspector,
} from "./InspectorParts";
import { useI18n } from "@/lib/i18n/I18nProvider";

// Layout options per section type. Keys must match the SectionLayout unions.
const LAYOUTS_BY_TYPE: Record<string, { value: string; label: string }[]> = {
  hero: [
    { value: "centered", label: "Centered" },
    { value: "split", label: "Split" },
    { value: "background", label: "Background" },
    { value: "metrics", label: "Metrics" },
  ],
  cards: [
    { value: "grid", label: "Grid" },
    { value: "horizontal", label: "Horizontal" },
    { value: "feature-list", label: "Feature list" },
    { value: "case-study", label: "Case study" },
  ],
  image: [
    { value: "full-width", label: "Full width" },
    { value: "split-left", label: "Split left" },
    { value: "split-right", label: "Split right" },
    { value: "framed", label: "Framed" },
  ],
  gallery: [
    { value: "grid", label: "Grid" },
    { value: "carousel", label: "Carousel" },
    { value: "masonry", label: "Masonry" },
  ],
  chart: [
    { value: "card", label: "Card" },
    { value: "full-width", label: "Full width" },
    { value: "chart-with-insight", label: "With insight" },
  ],
  faq: [
    { value: "accordion", label: "Accordion" },
    { value: "two-column", label: "Two column" },
  ],
};

const DEFAULT_LAYOUT: Record<string, string> = {
  hero: "centered",
  cards: "grid",
  image: "full-width",
  gallery: "grid",
  chart: "chart-with-insight",
  faq: "accordion",
};

export function DesignInspector({
  deck,
  section,
  onTheme,
  onSection,
}: {
  deck: WebDeck;
  section: DeckSection | null;
  onTheme: (theme: DeckTheme) => void;
  onSection: (next: DeckSection) => void;
}) {
  const { t } = useI18n();
  const d = t.inspector.design;
  const layouts = section ? LAYOUTS_BY_TYPE[section.type] : undefined;

  return (
    <>
      <InspectorSection title={d.theme}>
        <div className="space-y-2">
          {BUILTIN_THEMES.map((theme) => {
            const active = theme.id === deck.theme.id;
            return (
              <button
                key={theme.id}
                onClick={() => onTheme(theme)}
                className={
                  "flex w-full items-center gap-3 rounded-lg border p-2.5 text-left transition-colors " +
                  (active
                    ? "border-accent ring-1 ring-accent"
                    : "border-border hover:border-accent/50")
                }
              >
                <span
                  className="flex h-8 w-8 shrink-0 overflow-hidden rounded-md border"
                  style={{ background: theme.colors.background }}
                >
                  <span className="h-full w-1/3" style={{ background: theme.colors.primary }} />
                  <span className="h-full w-1/3" style={{ background: theme.colors.accent }} />
                  <span className="h-full w-1/3" style={{ background: theme.colors.secondary }} />
                </span>
                <span className="flex-1">
                  <span className="block text-sm font-medium text-foreground">
                    {theme.name}
                  </span>
                  <span className="block text-xs text-muted-foreground">
                    {theme.typography.scale} · {theme.radius} · {theme.spacing}
                  </span>
                </span>
                {active ? <span className="text-accent">✓</span> : null}
              </button>
            );
          })}
        </div>
      </InspectorSection>

      {section && layouts ? (
        <InspectorSection title={d.layout}>
          <Field label={d.sectionLayout(section.type)}>
            <ButtonGroup
              value={section.layout ?? DEFAULT_LAYOUT[section.type] ?? ""}
              options={layouts}
              onChange={(v) =>
                // layout options are constrained to this section's type by
                // LAYOUTS_BY_TYPE; the union widens on spread so we re-assert.
                onSection({ ...section, layout: v } as DeckSection)
              }
            />
          </Field>
        </InspectorSection>
      ) : section ? (
        <InspectorSection title={d.layout}>
          <p className="text-xs text-muted-foreground">
            {d.noLayoutVariants}
          </p>
        </InspectorSection>
      ) : (
        <EmptyInspector message={d.empty} />
      )}
    </>
  );
}
