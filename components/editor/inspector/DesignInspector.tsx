"use client";

import type { WebDeck, DeckSection, DeckTheme } from "@/types/deck";
import {
  BUILTIN_THEMES,
  GOOGLE_FONTS_PRESET,
  exportTheme,
  importTheme,
} from "@/lib/deck/theme";
import {
  InspectorSection,
  Field,
  ButtonGroup,
  EmptyInspector,
} from "./InspectorParts";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { useCallback, useRef, useState } from "react";

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

/** Build a CSS font-family string from a Google Font name. */
function fontFamily(name: string): string {
  return `'${name}', sans-serif`;
}

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
  const [customOpen, setCustomOpen] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const updateTheme = useCallback(
    (patch: Partial<DeckTheme>) => {
      onTheme({ ...deck.theme, ...patch });
    },
    [deck.theme, onTheme],
  );

  const headingFont = deck.theme.typography.headingFont;
  const bodyFont = deck.theme.typography.bodyFont;

  // Derive the current font name (first in the stack) for the selectors.
  const currentHeading = headingFont.match(/^['"]?([^'",]+)/)?.[1] ?? "";
  const currentBody = bodyFont.match(/^['"]?([^'",]+)/)?.[1] ?? "";

  /** Download the current theme as a .json file. */
  const handleExport = useCallback(() => {
    const json = exportTheme(deck.theme);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `webdeck-theme-${deck.theme.id}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [deck.theme]);

  /** Import a theme from a .json file. */
  const handleImport = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        const theme = importTheme(reader.result as string);
        if (theme) onTheme(theme);
      };
      reader.readAsText(file);
      // Reset so the same file can be re-imported.
      e.target.value = "";
    },
    [onTheme],
  );

  return (
    <>
      {/* ── Built-in theme selector ── */}
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

      {/* ── Custom theme section ── */}
      <InspectorSection title={d.customTheme}>
        {/* Toggle */}
        <button
          onClick={() => setCustomOpen(!customOpen)}
          className="flex w-full items-center justify-between rounded-lg border border-border p-2.5 text-sm font-medium transition-colors hover:border-accent/50"
        >
          <span>{d.customTheme}</span>
          <span className="text-muted-foreground">{customOpen ? "▲" : "▼"}</span>
        </button>

        {customOpen && (
          <div className="mt-3 space-y-3">
            {/* Heading font selector */}
            <Field label={d.headingFont}>
              <select
                value={currentHeading}
                onChange={(e) => {
                  const name = e.target.value;
                  if (!name) return;
                  updateTheme({
                    typography: {
                      ...deck.theme.typography,
                      headingFont: fontFamily(name),
                    },
                  });
                }}
                className="w-full rounded-md border border-border bg-background px-2.5 py-1.5 text-sm"
              >
                <option value={currentHeading}>{currentHeading}</option>
                {GOOGLE_FONTS_PRESET.filter((f) => f !== currentHeading).map(
                  (f) => (
                    <option key={f} value={f}>
                      {f}
                    </option>
                  ),
                )}
              </select>
            </Field>

            {/* Body font selector */}
            <Field label={d.bodyFont}>
              <select
                value={currentBody}
                onChange={(e) => {
                  const name = e.target.value;
                  if (!name) return;
                  updateTheme({
                    typography: {
                      ...deck.theme.typography,
                      bodyFont: fontFamily(name),
                    },
                  });
                }}
                className="w-full rounded-md border border-border bg-background px-2.5 py-1.5 text-sm"
              >
                <option value={currentBody}>{currentBody}</option>
                {GOOGLE_FONTS_PRESET.filter((f) => f !== currentBody).map(
                  (f) => (
                    <option key={f} value={f}>
                      {f}
                    </option>
                  ),
                )}
              </select>
            </Field>

            {/* Custom CSS textarea */}
            <Field label={d.customCss}>
              <textarea
                value={deck.theme.customCss ?? ""}
                onChange={(e) => updateTheme({ customCss: e.target.value })}
                placeholder={d.customCssPlaceholder}
                rows={5}
                spellCheck={false}
                className="w-full rounded-md border border-border bg-background px-2.5 py-1.5 font-mono text-xs leading-relaxed"
              />
            </Field>

            {/* Export / Import buttons */}
            <div className="flex gap-2">
              <button
                onClick={handleExport}
                className="flex-1 rounded-md border border-border px-3 py-1.5 text-sm font-medium transition-colors hover:bg-accent/10"
              >
                {d.exportTheme}
              </button>
              <button
                onClick={() => fileRef.current?.click()}
                className="flex-1 rounded-md border border-border px-3 py-1.5 text-sm font-medium transition-colors hover:bg-accent/10"
              >
                {d.importTheme}
              </button>
              <input
                ref={fileRef}
                type="file"
                accept="application/json,.json"
                onChange={handleImport}
                hidden
              />
            </div>
          </div>
        )}
      </InspectorSection>

      {/* ── Section layout ── */}
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
