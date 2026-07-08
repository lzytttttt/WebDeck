import { describe, it, expect } from "vitest";
import {
  themeToCssVars,
  cssVarsToString,
  getThemeById,
  BUILTIN_THEMES,
  DEFAULT_THEME,
} from "@/lib/deck/theme";
import type { DeckTheme } from "@/types/deck";

// ---------------------------------------------------------------------------
// getThemeById
// ---------------------------------------------------------------------------

describe("getThemeById", () => {
  it("returns the classic-business theme for a known id", () => {
    const theme = getThemeById("classic-business");
    expect(theme.id).toBe("classic-business");
  });

  it("returns default theme for undefined id", () => {
    expect(getThemeById(undefined)).toBe(DEFAULT_THEME);
  });

  it("returns default theme for unknown id", () => {
    expect(getThemeById("nonexistent")).toBe(DEFAULT_THEME);
  });

  it("can find all builtin themes by id", () => {
    for (const t of BUILTIN_THEMES) {
      expect(getThemeById(t.id).id).toBe(t.id);
    }
  });
});

// ---------------------------------------------------------------------------
// themeToCssVars
// ---------------------------------------------------------------------------

describe("themeToCssVars", () => {
  it("returns all expected CSS custom property keys", () => {
    const vars = themeToCssVars(DEFAULT_THEME);
    const expectedKeys = [
      "--deck-bg",
      "--deck-surface",
      "--deck-primary",
      "--deck-secondary",
      "--deck-accent",
      "--deck-text",
      "--deck-muted",
      "--deck-heading-font",
      "--deck-body-font",
      "--deck-scale",
      "--deck-radius",
      "--deck-shadow",
      "--deck-section-gap",
    ];
    for (const k of expectedKeys) {
      expect(vars).toHaveProperty(k);
    }
  });

  it("maps color tokens to the theme's hex values", () => {
    const vars = themeToCssVars(DEFAULT_THEME);
    expect(vars["--deck-bg"]).toBe(DEFAULT_THEME.colors.background);
    expect(vars["--deck-primary"]).toBe(DEFAULT_THEME.colors.primary);
  });

  it("maps radius enum to pixel values", () => {
    const vars = themeToCssVars(DEFAULT_THEME);
    // DEFAULT_THEME radius is "md" -> "12px"
    expect(vars["--deck-radius"]).toBe("12px");
  });

  it("maps scale enum to numeric factor", () => {
    const vars = themeToCssVars(DEFAULT_THEME);
    // DEFAULT_THEME scale is "normal" -> "1"
    expect(vars["--deck-scale"]).toBe("1");
  });

  it("maps spacing enum to pixel values", () => {
    const vars = themeToCssVars(DEFAULT_THEME);
    // DEFAULT_THEME spacing is "normal" -> "64px"
    expect(vars["--deck-section-gap"]).toBe("64px");
  });

  it("handles dark-executive theme correctly", () => {
    const dark = getThemeById("dark-executive");
    const vars = themeToCssVars(dark);
    expect(vars["--deck-bg"]).toBe("#0f172a");
    expect(vars["--deck-radius"]).toBe("18px"); // lg
    expect(vars["--deck-shadow"]).toContain("12px"); // lg shadow
  });
});

// ---------------------------------------------------------------------------
// cssVarsToString
// ---------------------------------------------------------------------------

describe("cssVarsToString", () => {
  it("produces semicolon-delimited CSS custom properties", () => {
    const result = cssVarsToString({ "--a": "1", "--b": "2" });
    expect(result).toBe("--a:1;--b:2");
  });

  it("returns empty string for empty input", () => {
    expect(cssVarsToString({})).toBe("");
  });

  it("roundtrips with themeToCssVars", () => {
    const vars = themeToCssVars(DEFAULT_THEME);
    const str = cssVarsToString(vars);
    expect(str).toContain("--deck-bg:");
    expect(str).toContain("--deck-primary:");
  });
});
