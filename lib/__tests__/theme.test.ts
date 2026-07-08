import { describe, it, expect } from "vitest";
import {
  themeToCssVars,
  cssVarsToString,
  getThemeById,
  BUILTIN_THEMES,
  DEFAULT_THEME,
  GOOGLE_FONTS_PRESET,
  getGoogleFontsUrl,
  exportTheme,
  importTheme,
  buildCustomCss,
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

// ---------------------------------------------------------------------------
// GOOGLE_FONTS_PRESET
// ---------------------------------------------------------------------------

describe("GOOGLE_FONTS_PRESET", () => {
  it("contains at least 10 entries", () => {
    expect(GOOGLE_FONTS_PRESET.length).toBeGreaterThanOrEqual(10);
  });

  it("contains popular fonts like Inter and Roboto", () => {
    expect(GOOGLE_FONTS_PRESET).toContain("Inter");
    expect(GOOGLE_FONTS_PRESET).toContain("Roboto");
    expect(GOOGLE_FONTS_PRESET).toContain("Poppins");
  });
});

// ---------------------------------------------------------------------------
// getGoogleFontsUrl
// ---------------------------------------------------------------------------

describe("getGoogleFontsUrl", () => {
  it("returns a URL for themes with Google Fonts", () => {
    const theme: DeckTheme = {
      ...DEFAULT_THEME,
      typography: {
        headingFont: "'Inter', sans-serif",
        bodyFont: "'Roboto', sans-serif",
        scale: "normal",
      },
    };
    const url = getGoogleFontsUrl(theme);
    expect(url).toBeTruthy();
    expect(url).toContain("fonts.googleapis.com");
    expect(url).toContain("Inter");
    expect(url).toContain("Roboto");
    expect(url).toContain("display=swap");
  });

  it("returns undefined for system-font themes", () => {
    // DEFAULT_THEME uses system fonts
    const url = getGoogleFontsUrl(DEFAULT_THEME);
    expect(url).toBeUndefined();
  });

  it("includes customFonts families", () => {
    const theme: DeckTheme = {
      ...DEFAULT_THEME,
      customFonts: [{ family: "Fira Code", url: "https://example.com" }],
    };
    const url = getGoogleFontsUrl(theme);
    expect(url).toBeTruthy();
    expect(url).toContain("Fira%20Code");
  });

  it("deduplicates font families", () => {
    const theme: DeckTheme = {
      ...DEFAULT_THEME,
      typography: {
        headingFont: "'Inter', sans-serif",
        bodyFont: "'Inter', sans-serif",
        scale: "normal",
      },
    };
    const url = getGoogleFontsUrl(theme);
    // "Inter" should appear only once
    const matches = url!.match(/family=Inter/g);
    expect(matches?.length).toBe(1);
  });
});

// ---------------------------------------------------------------------------
// exportTheme / importTheme
// ---------------------------------------------------------------------------

describe("exportTheme / importTheme", () => {
  it("roundtrips a complete theme", () => {
    const theme: DeckTheme = {
      ...DEFAULT_THEME,
      customCss: "--deck-accent: red;",
      customFonts: [{ family: "Fira Code", url: "https://example.com" }],
    };
    const json = exportTheme(theme);
    expect(typeof json).toBe("string");
    const parsed = importTheme(json);
    expect(parsed).not.toBeNull();
    expect(parsed!.id).toBe(theme.id);
    expect(parsed!.customCss).toBe("--deck-accent: red;");
    expect(parsed!.customFonts).toHaveLength(1);
  });

  it("returns null for invalid JSON", () => {
    expect(importTheme("not json")).toBeNull();
    expect(importTheme("{}")).toBeNull(); // missing required fields
  });

  it("returns null for non-object input", () => {
    expect(importTheme('"hello"')).toBeNull();
    expect(importTheme("null")).toBeNull();
  });

  it("preserves all builtin theme properties", () => {
    for (const theme of BUILTIN_THEMES) {
      const json = exportTheme(theme);
      const parsed = importTheme(json);
      expect(parsed).not.toBeNull();
      expect(parsed!.id).toBe(theme.id);
      expect(parsed!.name).toBe(theme.name);
      expect(parsed!.colors).toEqual(theme.colors);
      expect(parsed!.typography).toEqual(theme.typography);
    }
  });
});

// ---------------------------------------------------------------------------
// buildCustomCss
// ---------------------------------------------------------------------------

describe("buildCustomCss", () => {
  it("returns undefined when customCss is empty", () => {
    expect(buildCustomCss(DEFAULT_THEME)).toBeUndefined();
  });

  it("returns undefined when customCss is whitespace", () => {
    const theme: DeckTheme = { ...DEFAULT_THEME, customCss: "   " };
    expect(buildCustomCss(theme)).toBeUndefined();
  });

  it("returns the customCss string when present", () => {
    const css = ".hero h1 { color: red; }";
    const theme: DeckTheme = { ...DEFAULT_THEME, customCss: css };
    expect(buildCustomCss(theme)).toBe(css);
  });
});
