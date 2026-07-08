import { z } from "zod";

// ---------------------------------------------------------------------------
// Theme schemas
// ---------------------------------------------------------------------------

export const ThemeScaleSchema = z.enum(["compact", "normal", "large"]);
export const ThemeRadiusSchema = z.enum(["none", "sm", "md", "lg", "xl"]);
export const ThemeShadowSchema = z.enum(["none", "sm", "md", "lg"]);
export const ThemeSpacingSchema = z.enum(["compact", "normal", "spacious"]);

export const DeckThemeColorsSchema = z.object({
  background: z.string(),
  surface: z.string(),
  primary: z.string(),
  secondary: z.string(),
  accent: z.string(),
  text: z.string(),
  mutedText: z.string(),
});

export const DeckThemeTypographySchema = z.object({
  headingFont: z.string(),
  bodyFont: z.string(),
  scale: ThemeScaleSchema,
});

export const DeckThemeSchema = z.object({
  id: z.string(),
  name: z.string(),
  colors: DeckThemeColorsSchema,
  typography: DeckThemeTypographySchema,
  radius: ThemeRadiusSchema,
  shadow: ThemeShadowSchema,
  spacing: ThemeSpacingSchema,
});

// ---------------------------------------------------------------------------
// Motion schemas
// ---------------------------------------------------------------------------

export const MotionPresetSchema = z.enum(["none", "fade", "slide-up", "scale", "stagger"]);
export const SectionMotionPresetSchema = z.enum(["inherit", "none", "fade", "slide-up", "scale"]);
export const MotionTransitionSchema = z.enum(["none", "fade", "slide", "zoom"]);

export const DeckMotionSchema = z.object({
  preset: MotionPresetSchema,
  transition: MotionTransitionSchema,
});

export const SectionMotionSchema = z.object({
  preset: SectionMotionPresetSchema,
  delay: z.number().optional(),
  duration: z.number().optional(),
});

// ---------------------------------------------------------------------------
// Section base + discriminated union
// ---------------------------------------------------------------------------

export const DeckModeSchema = z.enum(["conservative", "enhanced"]);

const BaseSectionSchema = z.object({
  id: z.string(),
  type: z.string(),
  sourceSlideIndexes: z.array(z.number()),
  title: z.string(),
  summary: z.string().optional(),
  layout: z.string().optional(),
  motion: SectionMotionSchema.optional(),
  background: z
    .object({
      assetId: z.string().optional(),
      url: z.string(),
    })
    .optional(),
});

// Hero
export const HeroMetricSchema = z.object({ value: z.string(), label: z.string() });
export const HeroSectionSchema = BaseSectionSchema.extend({
  type: z.literal("hero"),
  subtitle: z.string().optional(),
  eyebrow: z.string().optional(),
  ctaLabel: z.string().optional(),
  metrics: z.array(HeroMetricSchema).optional(),
  layout: z.enum(["centered", "split", "background", "metrics"]).optional(),
});

// Agenda
export const AgendaItemSchema = z.object({ label: z.string(), description: z.string().optional() });
export const AgendaSectionSchema = BaseSectionSchema.extend({
  type: z.literal("agenda"),
  items: z.array(AgendaItemSchema),
});

// Slide (text)
export const SlideLikeSectionSchema = BaseSectionSchema.extend({
  type: z.literal("slide"),
  bullets: z.array(z.string()),
  body: z.string().optional(),
  notes: z.string().optional(),
});

// Cards
export const DeckCardSchema = z.object({
  title: z.string(),
  description: z.string(),
  tag: z.string().optional(),
});
export const CardsSectionSchema = BaseSectionSchema.extend({
  type: z.literal("cards"),
  cards: z.array(DeckCardSchema),
  layout: z.enum(["grid", "horizontal", "feature-list", "case-study"]).optional(),
});

// Timeline
export const TimelineItemSchema = z.object({
  time: z.string(),
  title: z.string(),
  description: z.string().optional(),
});
export const TimelineSectionSchema = BaseSectionSchema.extend({
  type: z.literal("timeline"),
  items: z.array(TimelineItemSchema),
});

// Comparison
export const ComparisonRowSchema = z.object({
  label: z.string(),
  left: z.string(),
  right: z.string(),
});
export const ComparisonSectionSchema = BaseSectionSchema.extend({
  type: z.literal("comparison"),
  leftHeader: z.string(),
  rightHeader: z.string(),
  rows: z.array(ComparisonRowSchema),
});

// FAQ
export const FAQItemSchema = z.object({ question: z.string(), answer: z.string() });
export const FAQSectionSchema = BaseSectionSchema.extend({
  type: z.literal("faq"),
  items: z.array(FAQItemSchema),
  layout: z.enum(["accordion", "two-column"]).optional(),
});

// Quote
export const QuoteSectionSchema = BaseSectionSchema.extend({
  type: z.literal("quote"),
  quote: z.string(),
  author: z.string().optional(),
});

// CTA
export const CTASectionSchema = BaseSectionSchema.extend({
  type: z.literal("cta"),
  description: z.string().optional(),
  primaryLabel: z.string(),
  secondaryLabel: z.string().optional(),
});

// Image
export const ImageSectionSchema = BaseSectionSchema.extend({
  type: z.literal("image"),
  image: z.object({
    assetId: z.string().optional(),
    url: z.string(),
    alt: z.string().optional(),
    caption: z.string().optional(),
    focalPoint: z.object({ x: z.number(), y: z.number() }).optional(),
  }),
  content: z
    .object({
      title: z.string().optional(),
      description: z.string().optional(),
    })
    .optional(),
  layout: z.enum(["full-width", "split-left", "split-right", "framed"]).optional(),
});

// Gallery
export const GalleryImageSchema = z.object({
  assetId: z.string().optional(),
  url: z.string(),
  alt: z.string().optional(),
  caption: z.string().optional(),
});
export const GallerySectionSchema = BaseSectionSchema.extend({
  type: z.literal("gallery"),
  images: z.array(GalleryImageSchema),
  layout: z.enum(["grid", "carousel", "masonry"]).optional(),
});

// Chart
export const ChartDataSchema = z.object({
  columns: z.array(z.string()),
  rows: z.array(z.record(z.string(), z.union([z.string(), z.number()]))),
});
export const ChartConfigSchema = z.object({
  xKey: z.string().optional(),
  yKeys: z.array(z.string()).optional(),
  showLegend: z.boolean().optional(),
  showGrid: z.boolean().optional(),
});
export const ChartSectionSchema = BaseSectionSchema.extend({
  type: z.literal("chart"),
  chartType: z.enum(["bar", "line", "pie", "donut", "kpi", "table"]),
  description: z.string().optional(),
  insight: z.string().optional(),
  data: ChartDataSchema,
  config: ChartConfigSchema,
  layout: z.enum(["card", "full-width", "chart-with-insight"]).optional(),
});

// Discriminated union
export const DeckSectionSchema = z.discriminatedUnion("type", [
  HeroSectionSchema,
  AgendaSectionSchema,
  SlideLikeSectionSchema,
  CardsSectionSchema,
  TimelineSectionSchema,
  ComparisonSectionSchema,
  FAQSectionSchema,
  QuoteSectionSchema,
  CTASectionSchema,
  ImageSectionSchema,
  GallerySectionSchema,
  ChartSectionSchema,
]);

// ---------------------------------------------------------------------------
// Suggestion
// ---------------------------------------------------------------------------

export const SuggestionTypeSchema = z.enum([
  "split",
  "cards",
  "timeline",
  "comparison",
  "faq",
  "cta",
  "data-interaction",
]);

export const EnhancementSuggestionSchema = z.object({
  id: z.string(),
  slideIndex: z.number(),
  type: SuggestionTypeSchema,
  title: z.string(),
  description: z.string(),
  actionLabel: z.string(),
});

// ---------------------------------------------------------------------------
// Full WebDeck
// ---------------------------------------------------------------------------

export const WebDeckSchema = z.object({
  id: z.string(),
  title: z.string(),
  subtitle: z.string().optional(),
  theme: DeckThemeSchema,
  mode: DeckModeSchema,
  motion: DeckMotionSchema,
  sections: z.array(DeckSectionSchema).min(1),
  suggestions: z.array(EnhancementSuggestionSchema),
});

// Relaxed schema for AI output validation: allows missing theme/motion/etc
// which get filled in by defaults during validation.
export const WebDeckAIOutputSchema = z.object({
  id: z.string().optional(),
  title: z.string(),
  subtitle: z.string().optional(),
  theme: z
    .object({
      id: z.string().optional(),
      name: z.string().optional(),
      primary: z.string().optional(),
      accent: z.string().optional(),
      background: z.string().optional(),
    })
    .optional(),
  mode: z.enum(["conservative", "enhanced"]).optional(),
  sections: z
    .array(
      z.object({
        id: z.string(),
        type: z.string(),
        sourceSlideIndexes: z.array(z.number()),
        title: z.string(),
        summary: z.string().optional(),
        // Other fields are section-type-specific and loosely validated
      }),
    )
    .min(1),
  suggestions: z
    .array(
      z.object({
        id: z.string(),
        slideIndex: z.number(),
        type: z.string(),
        title: z.string(),
        description: z.string(),
        actionLabel: z.string(),
      }),
    )
    .optional(),
});
