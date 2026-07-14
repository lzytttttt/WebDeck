import type {
  WebDeck,
  DeckSection,
  EnhancementSuggestion,
  SuggestionType,
} from "@/types/deck";
import { DEFAULT_MOTION } from "@/types/deck";
import { getThemeById } from "@/lib/deck/theme";
import { getAllSections } from "@/lib/deck/sections";
import {
  WebDeckAIOutputSchema,
  EnhancementSuggestionSchema,
} from "@/lib/schema/sections";

// Lightweight structural validation for AI-returned JSON. We do not pull in
// a schema lib for the MVP; these guards are enough to reject malformed
// output and trigger the Mock fallback.

const SECTION_TYPES = new Set(getAllSections().map((s) => s.type));

const SUGGESTION_TYPES = new Set<SuggestionType>([
  "split",
  "cards",
  "timeline",
  "comparison",
  "faq",
  "cta",
  "data-interaction",
]);

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

function isSection(v: unknown): v is DeckSection {
  if (!isRecord(v)) return false;
  if (typeof v.type !== "string" || !SECTION_TYPES.has(v.type)) return false;
  if (typeof v.title !== "string") return false;
  if (typeof v.id !== "string") return false;
  if (!Array.isArray(v.sourceSlideIndexes)) return false;
  return true;
}

export function isSuggestion(v: unknown): v is EnhancementSuggestion {
  if (!isRecord(v)) return false;
  if (typeof v.id !== "string") return false;
  if (typeof v.slideIndex !== "number") return false;
  if (typeof v.type !== "string" || !SUGGESTION_TYPES.has(v.type as SuggestionType))
    return false;
  if (typeof v.title !== "string") return false;
  if (typeof v.description !== "string") return false;
  if (typeof v.actionLabel !== "string") return false;
  return true;
}

// Validate a full WebDeck object. Returns the typed deck on success, or
// null when the shape is unusable (caller then falls back to Mock).
export function validateWebDeck(v: unknown): WebDeck | null {
  if (!isRecord(v)) return null;
  if (typeof v.title !== "string") return null;
  if (!Array.isArray(v.sections) || v.sections.length === 0) return null;
  if (!v.sections.every(isSection)) return null;

  const suggestions = Array.isArray(v.suggestions)
    ? v.suggestions.filter(isSuggestion)
    : [];

  const mode = v.mode === "enhanced" ? "enhanced" : "conservative";
  const themeId =
    isRecord(v.theme) && typeof v.theme.id === "string"
      ? v.theme.id
      : undefined;

  // Sections validated by isSection above; the union is trusted post-guard.
  const sections = v.sections as DeckSection[];
  return {
    id: typeof v.id === "string" ? v.id : "",
    title: v.title,
    subtitle: typeof v.subtitle === "string" ? v.subtitle : undefined,
    theme: getThemeById(themeId),
    mode,
    motion: { ...DEFAULT_MOTION },
    sections,
    suggestions,
  };
}

// Zod-based validation: validates AI output against the relaxed schema,
// then applies business-logic defaults. Returns null on hard failure.
export function validateWebDeckWithZod(v: unknown): WebDeck | null {
  const result = WebDeckAIOutputSchema.safeParse(v);
  if (!result.success) return null;

  const data = result.data;
  const themeId = data.theme?.id;

  // The relaxed schema accepts sections with generic type:string — filter to
  // known section types and cast.
  const sections = data.sections
    .filter((s) => SECTION_TYPES.has(s.type))
    .map((s) => s as unknown as DeckSection);

  if (sections.length === 0) return null;

  const suggestions = (data.suggestions ?? [])
    .filter((s) => SUGGESTION_TYPES.has(s.type as SuggestionType))
    .map((s) => s as unknown as EnhancementSuggestion);

  return {
    id: data.id ?? "",
    title: data.title,
    subtitle: data.subtitle,
    theme: getThemeById(themeId),
    mode: data.mode ?? "conservative",
    // Use the AI-provided motion when present (validated by DeckMotionSchema),
    // otherwise fall back to the default.
    motion: data.motion ?? { ...DEFAULT_MOTION },
    sections,
    suggestions,
  };
}

// Zod-based suggestion validation.
export function validateSuggestionsWithZod(v: unknown): EnhancementSuggestion[] | null {
  if (!Array.isArray(v)) return null;
  const valid: EnhancementSuggestion[] = [];
  for (const item of v) {
    const result = EnhancementSuggestionSchema.safeParse(item);
    if (result.success) valid.push(result.data as EnhancementSuggestion);
  }
  return valid.length > 0 ? valid : null;
}

export function validateSuggestions(v: unknown): EnhancementSuggestion[] | null {
  if (!Array.isArray(v)) return null;
  const valid = v.filter(isSuggestion);
  return valid.length > 0 ? valid : null;
}
