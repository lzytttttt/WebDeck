// Web Deck domain types: the AI-generated interactive deck representation.

// ---------------------------------------------------------------------------
// Theme
// ---------------------------------------------------------------------------

export type ThemeScale = "compact" | "normal" | "large";
export type ThemeRadius = "none" | "sm" | "md" | "lg" | "xl";
export type ThemeShadow = "none" | "sm" | "md" | "lg";
export type ThemeSpacing = "compact" | "normal" | "spacious";

export type DeckThemeColors = {
  background: string;
  surface: string;
  primary: string;
  secondary: string;
  accent: string;
  text: string;
  mutedText: string;
};

export type DeckThemeTypography = {
  headingFont: string;
  bodyFont: string;
  scale: ThemeScale;
};

export type DeckTheme = {
  id: string;
  name: string;
  colors: DeckThemeColors;
  typography: DeckThemeTypography;
  radius: ThemeRadius;
  shadow: ThemeShadow;
  spacing: ThemeSpacing;
};

// ---------------------------------------------------------------------------
// Motion
// ---------------------------------------------------------------------------

export type MotionPreset = "none" | "fade" | "slide-up" | "scale" | "stagger";
export type SectionMotionPreset = "inherit" | "none" | "fade" | "slide-up" | "scale";
export type MotionTransition = "none" | "fade" | "slide" | "zoom";

export type DeckMotion = {
  preset: MotionPreset;
  transition: MotionTransition;
};

export type SectionMotion = {
  preset: SectionMotionPreset;
  delay?: number;
  duration?: number;
};

// ---------------------------------------------------------------------------
// Sections
// ---------------------------------------------------------------------------

export type DeckMode = "conservative" | "enhanced";

export type SectionLayout = string;

export type BaseSection = {
  id: string;
  type: string;
  sourceSlideIndexes: number[];
  title: string;
  summary?: string;
  layout?: SectionLayout;
  motion?: SectionMotion;
  background?: {
    assetId?: string;
    url: string;
  };
};

export type HeroLayout = "centered" | "split" | "background" | "metrics";
export type HeroMetric = { value: string; label: string };
export type HeroSection = BaseSection & {
  type: "hero";
  subtitle?: string;
  eyebrow?: string;
  ctaLabel?: string;
  metrics?: HeroMetric[];
  layout?: HeroLayout;
};

export type AgendaItem = { label: string; description?: string };
export type AgendaSection = BaseSection & {
  type: "agenda";
  items: AgendaItem[];
};

// The "Text" section in the UI. Retains the "slide" type for back-compat.
export type SlideLikeSection = BaseSection & {
  type: "slide";
  bullets: string[];
  body?: string;
  notes?: string;
};

export type CardsLayout = "grid" | "horizontal" | "feature-list" | "case-study";
export type DeckCard = { title: string; description: string; tag?: string };
export type CardsSection = BaseSection & {
  type: "cards";
  cards: DeckCard[];
  layout?: CardsLayout;
};

export type TimelineItem = { time: string; title: string; description?: string };
export type TimelineSection = BaseSection & {
  type: "timeline";
  items: TimelineItem[];
};

export type ComparisonRow = { label: string; left: string; right: string };
export type ComparisonSection = BaseSection & {
  type: "comparison";
  leftHeader: string;
  rightHeader: string;
  rows: ComparisonRow[];
};

export type FAQLayout = "accordion" | "two-column";
export type FAQItem = { question: string; answer: string };
export type FAQSection = BaseSection & {
  type: "faq";
  items: FAQItem[];
  layout?: FAQLayout;
};

export type QuoteSection = BaseSection & {
  type: "quote";
  quote: string;
  author?: string;
};

export type CTASection = BaseSection & {
  type: "cta";
  description?: string;
  primaryLabel: string;
  secondaryLabel?: string;
};

export type ImageLayout = "full-width" | "split-left" | "split-right" | "framed";
export type ImageSection = BaseSection & {
  type: "image";
  image: {
    assetId?: string;
    url: string;
    alt?: string;
    caption?: string;
    focalPoint?: { x: number; y: number };
  };
  content?: {
    title?: string;
    description?: string;
  };
  layout?: ImageLayout;
};

export type GalleryLayout = "grid" | "carousel" | "masonry";
export type GalleryImage = {
  assetId?: string;
  url: string;
  alt?: string;
  caption?: string;
};
export type GallerySection = BaseSection & {
  type: "gallery";
  images: GalleryImage[];
  layout?: GalleryLayout;
};

export type ChartType = "bar" | "line" | "pie" | "donut" | "kpi" | "table";
export type ChartLayout = "card" | "full-width" | "chart-with-insight";
export type ChartData = {
  columns: string[];
  rows: Array<Record<string, string | number>>;
};
export type ChartConfig = {
  xKey?: string;
  yKeys?: string[];
  showLegend?: boolean;
  showGrid?: boolean;
};
export type ChartSection = BaseSection & {
  type: "chart";
  chartType: ChartType;
  description?: string;
  insight?: string;
  data: ChartData;
  config: ChartConfig;
  layout?: ChartLayout;
};

export type DeckSection =
  | HeroSection
  | AgendaSection
  | SlideLikeSection
  | CardsSection
  | TimelineSection
  | ComparisonSection
  | FAQSection
  | QuoteSection
  | CTASection
  | ImageSection
  | GallerySection
  | ChartSection;

export type DeckSectionType = DeckSection["type"];

// ---------------------------------------------------------------------------
// Suggestions
// ---------------------------------------------------------------------------

export type SuggestionType =
  | "split"
  | "cards"
  | "timeline"
  | "comparison"
  | "faq"
  | "cta"
  | "data-interaction";

export type EnhancementSuggestion = {
  id: string;
  slideIndex: number;
  type: SuggestionType;
  title: string;
  description: string;
  actionLabel: string;
};

// ---------------------------------------------------------------------------
// Deck
// ---------------------------------------------------------------------------

export type WebDeck = {
  id: string;
  title: string;
  subtitle?: string;
  theme: DeckTheme;
  mode: DeckMode;
  motion: DeckMotion;
  sections: DeckSection[];
  suggestions: EnhancementSuggestion[];
};

export const DEFAULT_MOTION: DeckMotion = {
  preset: "fade",
  transition: "fade",
};
