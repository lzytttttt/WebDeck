import { describe, it, expect } from "vitest";
import { exportMarkdown } from "@/lib/export/exportMarkdown";
import { exportStaticHtml } from "@/lib/export/exportStaticHtml";
import { exportPptx } from "@/lib/export/exportPptx";
import type {
  WebDeck,
  DeckTheme,
  HeroSection,
  AgendaSection,
  SlideLikeSection,
  CardsSection,
  TimelineSection,
  ComparisonSection,
  FAQSection,
  QuoteSection,
  CTASection,
  ImageSection,
  ChartSection,
} from "@/types/deck";
import { DEFAULT_MOTION } from "@/types/deck";
import { DEFAULT_THEME } from "@/lib/deck/theme";

// ---------------------------------------------------------------------------
// Test helpers
// ---------------------------------------------------------------------------

function makeDeck(sections: WebDeck["sections"]): WebDeck {
  return {
    id: "test-deck",
    title: "Test Deck",
    subtitle: "A test subtitle",
    theme: DEFAULT_THEME,
    mode: "conservative",
    motion: { ...DEFAULT_MOTION },
    sections,
    suggestions: [],
  };
}

// ---------------------------------------------------------------------------
// exportMarkdown
// ---------------------------------------------------------------------------

describe("exportMarkdown", () => {
  it("renders a deck title and subtitle when first section is not hero", () => {
    const deck = makeDeck([
      {
        id: "s1",
        type: "slide",
        sourceSlideIndexes: [],
        title: "First Slide",
        bullets: ["Point 1"],
      },
    ]);
    const md = exportMarkdown(deck);
    expect(md).toContain("# Test Deck");
    expect(md).toContain("A test subtitle");
  });

  it("does not add a separate deck title when first section is hero", () => {
    const deck = makeDeck([
      {
        id: "s1",
        type: "hero",
        sourceSlideIndexes: [],
        title: "Hero Title",
        subtitle: "Hero Subtitle",
      },
    ]);
    const md = exportMarkdown(deck);
    // Should have the hero title but not a separate "# Test Deck"
    expect(md).toContain("# Hero Title");
    expect(md).toContain("## Hero Subtitle");
    // Count occurrences of "# Test Deck" — should be 0
    expect(md.match(/# Test Deck/g)).toBeNull();
  });

  it("renders hero with eyebrow, metrics, and CTA", () => {
    const hero: HeroSection = {
      id: "h1",
      type: "hero",
      sourceSlideIndexes: [],
      title: "Welcome",
      subtitle: "To our platform",
      eyebrow: "INTRODUCING",
      ctaLabel: "Get Started",
      metrics: [
        { value: "10K+", label: "Users" },
        { value: "99%", label: "Uptime" },
      ],
    };
    const md = exportMarkdown(makeDeck([hero]));
    expect(md).toContain("*INTRODUCING*");
    expect(md).toContain("# Welcome");
    expect(md).toContain("## To our platform");
    expect(md).toContain("**10K+**");
    expect(md).toContain("Users");
    expect(md).toContain("**[Get Started]**");
  });

  it("renders agenda items as numbered list", () => {
    const agenda: AgendaSection = {
      id: "a1",
      type: "agenda",
      sourceSlideIndexes: [],
      title: "Today's Agenda",
      items: [
        { label: "Introduction", description: "Brief overview" },
        { label: "Deep Dive", description: "Technical details" },
        { label: "Q&A" },
      ],
    };
    const md = exportMarkdown(makeDeck([agenda]));
    expect(md).toContain("## Today's Agenda");
    expect(md).toContain("1. **Introduction** — Brief overview");
    expect(md).toContain("2. **Deep Dive** — Technical details");
    expect(md).toContain("3. **Q&A**");
  });

  it("renders slide with body and bullets", () => {
    const slide: SlideLikeSection = {
      id: "s1",
      type: "slide",
      sourceSlideIndexes: [],
      title: "Key Points",
      body: "Here are the main takeaways:",
      bullets: ["First point", "Second point"],
      notes: "Remember to elaborate",
    };
    const md = exportMarkdown(makeDeck([slide]));
    expect(md).toContain("## Key Points");
    expect(md).toContain("Here are the main takeaways:");
    expect(md).toContain("- First point");
    expect(md).toContain("- Second point");
    expect(md).toContain("*Notes: Remember to elaborate*");
  });

  it("renders cards with tags", () => {
    const cards: CardsSection = {
      id: "c1",
      type: "cards",
      sourceSlideIndexes: [],
      title: "Features",
      cards: [
        { title: "Fast", description: "Lightning quick", tag: "NEW" },
        { title: "Secure", description: "Enterprise grade" },
      ],
    };
    const md = exportMarkdown(makeDeck([cards]));
    expect(md).toContain("## Features");
    expect(md).toContain("`NEW`");
    expect(md).toContain("### Fast");
    expect(md).toContain("Lightning quick");
    expect(md).toContain("### Secure");
    expect(md).toContain("Enterprise grade");
  });

  it("renders image with alt and caption", () => {
    const img: ImageSection = {
      id: "i1",
      type: "image",
      sourceSlideIndexes: [],
      title: "Screenshot",
      image: {
        url: "https://example.com/img.png",
        alt: "App screenshot",
        caption: "Figure 1",
      },
    };
    const md = exportMarkdown(makeDeck([img]));
    expect(md).toContain("## Screenshot");
    expect(md).toContain("![App screenshot](https://example.com/img.png)");
    expect(md).toContain("*Figure 1*");
  });

  it("renders chart data as a markdown table", () => {
    const chart: ChartSection = {
      id: "ch1",
      type: "chart",
      sourceSlideIndexes: [],
      title: "Revenue",
      chartType: "bar",
      data: {
        columns: ["Month", "Revenue"],
        rows: [
          { Month: "Jan", Revenue: 100 },
          { Month: "Feb", Revenue: 150 },
        ],
      },
      config: {},
      insight: "Revenue is growing steadily",
    };
    const md = exportMarkdown(makeDeck([chart]));
    expect(md).toContain("## Revenue");
    expect(md).toContain("| Month | Revenue |");
    expect(md).toContain("| --- | --- |");
    expect(md).toContain("| Jan | 100 |");
    expect(md).toContain("| Feb | 150 |");
    expect(md).toContain("💡 Revenue is growing steadily");
  });

  it("renders timeline items", () => {
    const tl: TimelineSection = {
      id: "t1",
      type: "timeline",
      sourceSlideIndexes: [],
      title: "Milestones",
      items: [
        { time: "2023 Q1", title: "Launch", description: "v1.0 released" },
        { time: "2023 Q2", title: "Growth" },
      ],
    };
    const md = exportMarkdown(makeDeck([tl]));
    expect(md).toContain("## Milestones");
    expect(md).toContain("- **2023 Q1** — Launch");
    expect(md).toContain("v1.0 released");
    expect(md).toContain("- **2023 Q2** — Growth");
  });

  it("renders comparison as a table", () => {
    const cmp: ComparisonSection = {
      id: "cmp1",
      type: "comparison",
      sourceSlideIndexes: [],
      title: "Us vs Them",
      leftHeader: "Our Product",
      rightHeader: "Competitor",
      rows: [
        { label: "Price", left: "$9/mo", right: "$19/mo" },
        { label: "Speed", left: "Fast", right: "Slow" },
      ],
    };
    const md = exportMarkdown(makeDeck([cmp]));
    expect(md).toContain("## Us vs Them");
    expect(md).toContain("| | Our Product | Competitor |");
    expect(md).toContain("| **Price** | $9/mo | $19/mo |");
    expect(md).toContain("| **Speed** | Fast | Slow |");
  });

  it("renders FAQ items", () => {
    const faq: FAQSection = {
      id: "f1",
      type: "faq",
      sourceSlideIndexes: [],
      title: "FAQ",
      items: [
        { question: "Is it free?", answer: "Yes, for individuals." },
        { question: "Support?", answer: "24/7 via email." },
      ],
    };
    const md = exportMarkdown(makeDeck([faq]));
    expect(md).toContain("## FAQ");
    expect(md).toContain("### Q: Is it free?");
    expect(md).toContain("A: Yes, for individuals.");
    expect(md).toContain("### Q: Support?");
    expect(md).toContain("A: 24/7 via email.");
  });

  it("renders quote with author", () => {
    const quote: QuoteSection = {
      id: "q1",
      type: "quote",
      sourceSlideIndexes: [],
      title: "Testimonial",
      quote: "This product changed my life.",
      author: "Happy Customer",
    };
    const md = exportMarkdown(makeDeck([quote]));
    expect(md).toContain("> This product changed my life.");
    expect(md).toContain("— *Happy Customer*");
  });

  it("renders CTA with primary and secondary labels", () => {
    const cta: CTASection = {
      id: "ct1",
      type: "cta",
      sourceSlideIndexes: [],
      title: "Get Started Today",
      description: "Join thousands of satisfied users.",
      primaryLabel: "Sign Up Free",
      secondaryLabel: "Learn More",
    };
    const md = exportMarkdown(makeDeck([cta]));
    expect(md).toContain("## Get Started Today");
    expect(md).toContain("Join thousands of satisfied users.");
    expect(md).toContain("**Sign Up Free**");
    expect(md).toContain("**Learn More**");
  });

  it("separates sections with horizontal rules", () => {
    const deck = makeDeck([
      {
        id: "s1",
        type: "slide",
        sourceSlideIndexes: [],
        title: "First",
        bullets: [],
      },
      {
        id: "s2",
        type: "slide",
        sourceSlideIndexes: [],
        title: "Second",
        bullets: [],
      },
    ]);
    const md = exportMarkdown(deck);
    // Should have at least 2 horizontal rules (one between sections, one before footer)
    const hrCount = (md.match(/^---$/gm) || []).length;
    expect(hrCount).toBeGreaterThanOrEqual(2);
  });

  it("ends with the Web Deck footer", () => {
    const md = exportMarkdown(makeDeck([]));
    expect(md).toContain("*Created with Web Deck*");
  });

  it("handles empty sections array", () => {
    const md = exportMarkdown(makeDeck([]));
    expect(md).toContain("# Test Deck");
    expect(md).toContain("*Created with Web Deck*");
  });

  it("escapes pipe characters in table cells", () => {
    const cmp: ComparisonSection = {
      id: "cmp1",
      type: "comparison",
      sourceSlideIndexes: [],
      title: "Test",
      leftHeader: "A",
      rightHeader: "B",
      rows: [{ label: "Row", left: "foo | bar", right: "baz" }],
    };
    const md = exportMarkdown(makeDeck([cmp]));
    expect(md).toContain("foo \\| bar");
  });
});

// ---------------------------------------------------------------------------
// exportStaticHtml
// ---------------------------------------------------------------------------

describe("exportStaticHtml", () => {
  it("uses inlined theme colors from the design inspector (not re-resolved by id)", () => {
    const deck = makeDeck([
      {
        id: "s1",
        type: "slide",
        sourceSlideIndexes: [],
        title: "Hello",
        bullets: ["a"],
      },
    ]);
    // A built-in id but with a user-tweaked accent color.
    deck.theme = {
      ...DEFAULT_THEME,
      id: "classic-business",
      colors: { ...DEFAULT_THEME.colors, accent: "#ff5ca8" },
    };
    const html = exportStaticHtml(deck);
    expect(html).toContain("--deck-accent:#ff5ca8");
  });

  it("still resolves a built-in theme by id when only a stub is present", () => {
    const deck = makeDeck([
      {
        id: "s1",
        type: "slide",
        sourceSlideIndexes: [],
        title: "Hello",
        bullets: ["a"],
      },
    ]);
    deck.theme = { id: "classic-business", colors: {} } as typeof deck.theme;
    const html = exportStaticHtml(deck);
    expect(html).toContain("--deck-accent:");
  });
});

// ---------------------------------------------------------------------------
// exportPptx
// ---------------------------------------------------------------------------

describe("exportPptx", () => {
  const PNG_1X1 =
    "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+M8AAAMBAQAY3Y2wAAAAAElFTkSuQmCC";

  it("embeds inline base64 images (P2.1 extracted media) as pptx media", async () => {
    const img: ImageSection = {
      id: "i1",
      type: "image",
      sourceSlideIndexes: [],
      title: "Shot",
      image: { url: PNG_1X1, alt: "screenshot" },
    };
    const buf = await exportPptx(makeDeck([img]));
    expect(buf.length).toBeGreaterThan(0);
    // Zip stores entry names in clear text; an embedded image shows up here.
    expect(buf.toString("latin1")).toContain("ppt/media");
  });
});
