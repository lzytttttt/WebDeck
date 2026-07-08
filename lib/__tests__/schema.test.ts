import { describe, it, expect } from "vitest";
import { validateWebDeck, validateSuggestions, isSuggestion } from "@/lib/ai/schema";
import type { EnhancementSuggestion } from "@/types/deck";

// ---------------------------------------------------------------------------
// Helpers — minimal valid fixtures
// ---------------------------------------------------------------------------

const validSection = {
  id: "sec1",
  type: "hero",
  title: "Intro",
  sourceSlideIndexes: [0],
};

const validDeck = {
  id: "deck-1",
  title: "My Deck",
  sections: [validSection],
};

const validSuggestion: EnhancementSuggestion = {
  id: "sug-1",
  slideIndex: 0,
  type: "split",
  title: "Split it",
  description: "Consider splitting this slide",
  actionLabel: "Apply",
};

// ---------------------------------------------------------------------------
// validateWebDeck
// ---------------------------------------------------------------------------

describe("validateWebDeck", () => {
  it("accepts a minimal valid deck", () => {
    const result = validateWebDeck(validDeck);
    expect(result).not.toBeNull();
    expect(result!.title).toBe("My Deck");
    expect(result!.sections).toHaveLength(1);
  });

  it("returns null for non-object input", () => {
    expect(validateWebDeck(null)).toBeNull();
    expect(validateWebDeck(undefined)).toBeNull();
    expect(validateWebDeck("string")).toBeNull();
    expect(validateWebDeck(42)).toBeNull();
    expect(validateWebDeck([])).toBeNull();
  });

  it("returns null when title is missing or non-string", () => {
    expect(validateWebDeck({ sections: [validSection] })).toBeNull();
    expect(
      validateWebDeck({ title: 123, sections: [validSection] }),
    ).toBeNull();
  });

  it("returns null when sections is empty", () => {
    expect(validateWebDeck({ title: "X", sections: [] })).toBeNull();
  });

  it("returns null when a section has an invalid type", () => {
    const bad = { ...validSection, type: "nonexistent" };
    expect(validateWebDeck({ title: "X", sections: [bad] })).toBeNull();
  });

  it("returns null when a section is missing id", () => {
    const bad = { type: "hero", title: "T", sourceSlideIndexes: [] };
    expect(validateWebDeck({ title: "X", sections: [bad] })).toBeNull();
  });

  it("filters out invalid suggestions and keeps valid ones", () => {
    const deck = {
      ...validDeck,
      suggestions: [validSuggestion, { id: "bad" }],
    };
    const result = validateWebDeck(deck);
    expect(result).not.toBeNull();
    expect(result!.suggestions).toHaveLength(1);
    expect(result!.suggestions[0].id).toBe("sug-1");
  });

  it("defaults mode to conservative when missing", () => {
    const result = validateWebDeck(validDeck);
    expect(result!.mode).toBe("conservative");
  });

  it("sets mode to enhanced when specified", () => {
    const result = validateWebDeck({ ...validDeck, mode: "enhanced" });
    expect(result!.mode).toBe("enhanced");
  });

  it("falls back to default theme when theme is missing", () => {
    const result = validateWebDeck(validDeck);
    expect(result!.theme).toBeDefined();
    expect(result!.theme.id).toBe("classic-business");
  });
});

// ---------------------------------------------------------------------------
// isSuggestion
// ---------------------------------------------------------------------------

describe("isSuggestion", () => {
  it("accepts a valid suggestion", () => {
    expect(isSuggestion(validSuggestion)).toBe(true);
  });

  it("rejects non-objects", () => {
    expect(isSuggestion(null)).toBe(false);
    expect(isSuggestion("str")).toBe(false);
  });

  it("rejects when required fields are missing", () => {
    expect(isSuggestion({ id: "x" })).toBe(false);
  });

  it("rejects unknown suggestion type", () => {
    expect(isSuggestion({ ...validSuggestion, type: "unknown" })).toBe(false);
  });

  it("rejects when slideIndex is not a number", () => {
    expect(isSuggestion({ ...validSuggestion, slideIndex: "0" })).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// validateSuggestions
// ---------------------------------------------------------------------------

describe("validateSuggestions", () => {
  it("returns null for non-array input", () => {
    expect(validateSuggestions(null)).toBeNull();
    expect(validateSuggestions({})).toBeNull();
  });

  it("returns null when no valid suggestions exist", () => {
    expect(validateSuggestions([{ id: "bad" }])).toBeNull();
  });

  it("returns valid suggestions from mixed array", () => {
    const result = validateSuggestions([validSuggestion, { bad: true }]);
    expect(result).toHaveLength(1);
  });

  it("returns all valid suggestions", () => {
    const result = validateSuggestions([validSuggestion]);
    expect(result).toHaveLength(1);
  });

  it("returns null for empty array", () => {
    expect(validateSuggestions([])).toBeNull();
  });
});
