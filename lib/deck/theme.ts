import type {
  DeckTheme,
  ThemeRadius,
  ThemeShadow,
  ThemeSpacing,
  ThemeScale,
} from "@/types/deck";

// ---------------------------------------------------------------------------
// Built-in themes. Colors are plain CSS color strings (hex) so they can be
// injected verbatim into inline styles for both the React preview and the
// exported static HTML without a Tailwind rebuild.
// ---------------------------------------------------------------------------

export const BUILTIN_THEMES: DeckTheme[] = [
  {
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
      headingFont: "Georgia, 'Times New Roman', serif",
      bodyFont: "-apple-system, 'Segoe UI', Roboto, sans-serif",
      scale: "normal",
    },
    radius: "md",
    shadow: "sm",
    spacing: "normal",
  },
  {
    id: "modern-saas",
    name: "Modern SaaS",
    colors: {
      background: "#ffffff",
      surface: "#f9fafb",
      primary: "#4f46e5",
      secondary: "#6366f1",
      accent: "#06b6d4",
      text: "#111827",
      mutedText: "#6b7280",
    },
    typography: {
      headingFont: "'Inter', -apple-system, 'Segoe UI', sans-serif",
      bodyFont: "'Inter', -apple-system, 'Segoe UI', sans-serif",
      scale: "normal",
    },
    radius: "xl",
    shadow: "md",
    spacing: "spacious",
  },
  {
    id: "editorial",
    name: "Editorial",
    colors: {
      background: "#fdfcfb",
      surface: "#ffffff",
      primary: "#1a1a1a",
      secondary: "#8b5e3c",
      accent: "#c2410c",
      text: "#1a1a1a",
      mutedText: "#78716c",
    },
    typography: {
      headingFont: "'Playfair Display', Georgia, serif",
      bodyFont: "Georgia, 'Times New Roman', serif",
      scale: "large",
    },
    radius: "none",
    shadow: "none",
    spacing: "spacious",
  },
  {
    id: "dark-executive",
    name: "Dark Executive",
    colors: {
      background: "#0f172a",
      surface: "#1e293b",
      primary: "#e2e8f0",
      secondary: "#94a3b8",
      accent: "#38bdf8",
      text: "#f1f5f9",
      mutedText: "#94a3b8",
    },
    typography: {
      headingFont: "-apple-system, 'Segoe UI', Roboto, sans-serif",
      bodyFont: "-apple-system, 'Segoe UI', Roboto, sans-serif",
      scale: "normal",
    },
    radius: "lg",
    shadow: "lg",
    spacing: "normal",
  },
  {
    id: "minimal-white",
    name: "Minimal White",
    colors: {
      background: "#ffffff",
      surface: "#ffffff",
      primary: "#111111",
      secondary: "#555555",
      accent: "#111111",
      text: "#111111",
      mutedText: "#999999",
    },
    typography: {
      headingFont: "-apple-system, 'Segoe UI', Roboto, sans-serif",
      bodyFont: "-apple-system, 'Segoe UI', Roboto, sans-serif",
      scale: "compact",
    },
    radius: "sm",
    shadow: "none",
    spacing: "compact",
  },
];

export const DEFAULT_THEME: DeckTheme = BUILTIN_THEMES[0];

export function getThemeById(id: string | undefined): DeckTheme {
  return BUILTIN_THEMES.find((t) => t.id === id) ?? DEFAULT_THEME;
}

// ---------------------------------------------------------------------------
// Token maps: turn the enum-ish theme fields into concrete CSS values.
// ---------------------------------------------------------------------------

const RADIUS_PX: Record<ThemeRadius, string> = {
  none: "0px",
  sm: "6px",
  md: "12px",
  lg: "18px",
  xl: "26px",
};

const SHADOW_CSS: Record<ThemeShadow, string> = {
  none: "none",
  sm: "0 1px 2px rgba(0,0,0,0.06)",
  md: "0 4px 16px rgba(0,0,0,0.08)",
  lg: "0 12px 40px rgba(0,0,0,0.14)",
};

const SPACING_PX: Record<ThemeSpacing, string> = {
  compact: "40px",
  normal: "64px",
  spacious: "88px",
};

const SCALE_FACTOR: Record<ThemeScale, string> = {
  compact: "0.92",
  normal: "1",
  large: "1.12",
};

// Map a DeckTheme to a flat record of CSS custom properties. Shared by the
// React preview (inline style on a wrapper) and the static HTML export.
export function themeToCssVars(theme: DeckTheme): Record<string, string> {
  const c = theme.colors;
  return {
    "--deck-bg": c.background,
    "--deck-surface": c.surface,
    "--deck-primary": c.primary,
    "--deck-secondary": c.secondary,
    "--deck-accent": c.accent,
    "--deck-text": c.text,
    "--deck-muted": c.mutedText,
    "--deck-heading-font": theme.typography.headingFont,
    "--deck-body-font": theme.typography.bodyFont,
    "--deck-scale": SCALE_FACTOR[theme.typography.scale],
    "--deck-radius": RADIUS_PX[theme.radius],
    "--deck-shadow": SHADOW_CSS[theme.shadow],
    "--deck-section-gap": SPACING_PX[theme.spacing],
  };
}

// Serialize CSS vars into an inline style string (for static HTML export).
export function cssVarsToString(vars: Record<string, string>): string {
  return Object.entries(vars)
    .map(([k, v]) => `${k}:${v}`)
    .join(";");
}
