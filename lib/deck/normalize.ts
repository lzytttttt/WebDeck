import type {
  WebDeck,
  DeckSection,
  DeckTheme,
  DeckMotion,
} from "@/types/deck";
import { DEFAULT_MOTION } from "@/types/deck";
import { DEFAULT_THEME, getThemeById } from "./theme";

// Migrate a persisted deck (possibly authored under the v0.1 schema) into a
// fully-populated v0.2 WebDeck. Old decks carried a flat theme
// ({ name, primary, accent, background }) and no motion field; new UI code
// assumes theme.colors / deck.motion always exist, so we backfill here on read.

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

function normalizeTheme(raw: unknown): DeckTheme {
  if (!isRecord(raw)) return DEFAULT_THEME;
  // v0.2 shape already? It has a nested `colors` object.
  if (isRecord(raw.colors) && typeof raw.id === "string") {
    return getThemeById(raw.id);
  }
  // v0.1 flat theme -> map to nearest builtin (default) rather than lose it.
  return DEFAULT_THEME;
}

function normalizeMotion(raw: unknown): DeckMotion {
  if (!isRecord(raw)) return { ...DEFAULT_MOTION };
  const preset = raw.preset;
  const transition = raw.transition;
  return {
    preset:
      preset === "none" ||
      preset === "fade" ||
      preset === "slide-up" ||
      preset === "scale" ||
      preset === "stagger"
        ? preset
        : DEFAULT_MOTION.preset,
    transition:
      transition === "none" ||
      transition === "fade" ||
      transition === "slide" ||
      transition === "zoom"
        ? transition
        : DEFAULT_MOTION.transition,
  };
}

// Guard against runtime shapes that would blank the preview. We keep the
// section as-is (the renderer tolerates missing optional fields) but ensure
// the always-required identity fields exist.
const VALID_SECTION_TYPES = new Set([
  "hero",
  "agenda",
  "slide",
  "cards",
  "timeline",
  "comparison",
  "faq",
  "quote",
  "cta",
  "image",
  "gallery",
  "chart",
]);

function normalizeSection(raw: unknown, i: number): DeckSection | null {
  if (!isRecord(raw)) return null;
  if (typeof raw.type !== "string") return null;
  if (!VALID_SECTION_TYPES.has(raw.type)) return null;
  const base = {
    ...raw,
    id: typeof raw.id === "string" && raw.id ? raw.id : `sec_${i}`,
    title: typeof raw.title === "string" ? raw.title : "",
    sourceSlideIndexes: Array.isArray(raw.sourceSlideIndexes)
      ? raw.sourceSlideIndexes
      : [],
  };
  // The union is wide; runtime shape is trusted after these identity checks.
  return base as DeckSection;
}

export function normalizeDeck(deck: WebDeck): WebDeck {
  const sections: DeckSection[] = [];
  for (let i = 0; i < deck.sections.length; i += 1) {
    const s = normalizeSection(deck.sections[i], i);
    if (s) sections.push(s);
  }
  return {
    ...deck,
    theme: normalizeTheme(deck.theme),
    motion: normalizeMotion(deck.motion),
    sections,
    suggestions: Array.isArray(deck.suggestions) ? deck.suggestions : [],
  };
}
