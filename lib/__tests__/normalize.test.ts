import { describe, it, expect } from "vitest";
import { normalizeDeck } from "@/lib/deck/normalize";
import type { WebDeck, DeckSection } from "@/types/deck";
import { DEFAULT_MOTION } from "@/types/deck";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeDeck(overrides: Partial<WebDeck> = {}): WebDeck {
  return {
    id: "d1",
    title: "Test",
    theme: {
      id: "classic-business",
      name: "Classic Business",
      colors: {
        background: "#f8fafc",
        surface: "#ffffff",
        primary: "#1e3a5f",
        secondary: "#334155",
        accent: "#2563eb",
        text: "#0f172a",
        mutedText: "#64748b",
      },
      typography: {
        headingFont: "Georgia, serif",
        bodyFont: "sans-serif",
        scale: "normal",
      },
      radius: "md",
      shadow: "sm",
      spacing: "normal",
    },
    mode: "conservative",
    motion: { ...DEFAULT_MOTION },
    sections: [
      {
        id: "s1",
        type: "hero",
        title: "Hello",
        sourceSlideIndexes: [0],
        subtitle: "World",
      } as DeckSection,
    ],
    suggestions: [],
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("normalizeDeck", () => {
  it("preserves all fields of an already-valid deck", () => {
    const deck = makeDeck();
    const result = normalizeDeck(deck);
    expect(result.id).toBe("d1");
    expect(result.title).toBe("Test");
    expect(result.sections).toHaveLength(1);
  });

  it("backfills missing id on a section", () => {
    const deck = makeDeck({
      sections: [
        { type: "hero", title: "T", sourceSlideIndexes: [] } as any,
      ],
    });
    const result = normalizeDeck(deck);
    expect(result.sections[0].id).toMatch(/^sec_0$/);
  });

  it("drops sections with no type (null from normalizeSection)", () => {
    const deck = makeDeck({
      sections: [
        { id: "s1", title: "T", sourceSlideIndexes: [] } as any,
      ],
    });
    const result = normalizeDeck(deck);
    expect(result.sections).toHaveLength(0);
  });

  it("normalizes motion from unknown preset to default", () => {
    const deck = makeDeck({
      motion: { preset: "invalid" as any, transition: "fade" },
    });
    const result = normalizeDeck(deck);
    expect(result.motion.preset).toBe(DEFAULT_MOTION.preset);
  });

  it("normalizes theme from non-record to default", () => {
    const deck = makeDeck({ theme: null as any });
    const result = normalizeDeck(deck);
    expect(result.theme.id).toBe("classic-business");
  });

  it("backfills sourceSlideIndexes when missing", () => {
    const deck = makeDeck({
      sections: [
        { id: "s1", type: "hero", title: "T" } as any,
      ],
    });
    const result = normalizeDeck(deck);
    expect(result.sections[0].sourceSlideIndexes).toEqual([]);
  });

  it("backfills title to empty string when missing", () => {
    const deck = makeDeck({
      sections: [
        { id: "s1", type: "hero", sourceSlideIndexes: [] } as any,
      ],
    });
    const result = normalizeDeck(deck);
    expect(result.sections[0].title).toBe("");
  });

  it("returns empty suggestions when suggestions is not an array", () => {
    const deck = makeDeck({ suggestions: "not-array" as any });
    const result = normalizeDeck(deck);
    expect(result.suggestions).toEqual([]);
  });
});
