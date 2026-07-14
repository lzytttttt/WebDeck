import type {
  WebDeck,
  DeckSection,
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
  GallerySection,
  ChartSection,
} from "@/types/deck";

// pptxgenjs is a CommonJS module; import dynamically in Node only.
// The type import keeps compile-time checking without bundling the heavy dep
// into client code.
import type PptxGenJS from "pptxgenjs";

// ---------------------------------------------------------------------------
// Theme → PPTX color mapping
// ---------------------------------------------------------------------------

function hexToRgb(hex: string): string {
  // Strip leading # and return 6-char hex (pptxgenjs expects hex without #)
  return hex.replace(/^#/, "");
}

/**
 * Build the pptxgenjs image source options for an image URL.
 *
 * pptxgenjs' `addImage` only accepts a real URL / file path via `path`, but a
 * WebDeck may embed images as base64 data URIs — most notably the images
 * extracted from a source .pptx in P2.1. For those we pass the stripped
 * base64 string via the `data` option instead, so the picture is embedded in
 * the .pptx rather than silently dropped to a placeholder.
 */
function imageSource(url: string): { path?: string; data?: string } {
  if (/^data:/i.test(url)) {
    return { data: url.slice(5) }; // drop the leading "data:" prefix
  }
  return { path: url };
}

interface PptxTheme {
  background: string;
  color: string;
  titleColor: string;
  accent: string;
  fontFace: string;
  titleFontFace: string;
}

function themeToPptx(t: DeckTheme): PptxTheme {
  return {
    background: hexToRgb(t.colors.background),
    color: hexToRgb(t.colors.text),
    titleColor: hexToRgb(t.colors.primary),
    accent: hexToRgb(t.colors.accent),
    fontFace: extractFirstFont(t.typography.bodyFont),
    titleFontFace: extractFirstFont(t.typography.headingFont),
  };
}

function extractFirstFont(stack: string): string {
  const match = stack.match(/^['"]?([^'",]+)/);
  if (!match) return "Arial";
  const name = match[1].trim();
  // System font stacks → fallback to Arial
  if (
    name.startsWith("-") ||
    /apple|Segoe|system|BlinkMac|Helvetica|Arial|Georgia|Times|Courier|Verdana|Tahoma|Impact/i.test(
      name,
    )
  ) {
    return "Arial";
  }
  return name;
}

// ---------------------------------------------------------------------------
// Section renderers — each adds one or more slides to the presentation
// ---------------------------------------------------------------------------

type SlideOpts = {
  pt: PptxGenJS;
  theme: PptxTheme;
  deckTitle: string;
};

function addHero(pt: PptxGenJS, s: HeroSection, th: PptxTheme) {
  const slide = pt.addSlide();
  slide.background = { color: th.background };

  // Eyebrow
  if (s.eyebrow) {
    slide.addText(s.eyebrow, {
      x: 0.8,
      y: 1.2,
      w: 8.4,
      fontSize: 12,
      color: th.accent,
      fontFace: th.fontFace,
      bold: true,
    });
  }

  // Title
  slide.addText(s.title, {
    x: 0.8,
    y: s.eyebrow ? 1.8 : 2.0,
    w: 8.4,
    h: 1.5,
    fontSize: 36,
    color: th.titleColor,
    fontFace: th.titleFontFace,
    bold: true,
    align: "left",
    valign: "middle",
  });

  // Subtitle
  if (s.subtitle) {
    slide.addText(s.subtitle, {
      x: 0.8,
      y: 3.5,
      w: 8.4,
      fontSize: 18,
      color: th.color,
      fontFace: th.fontFace,
    });
  }

  // Metrics
  if (s.metrics && s.metrics.length > 0) {
    const metricsText = s.metrics
      .map((m) => `${m.value}  ${m.label}`)
      .join("    ");
    slide.addText(metricsText, {
      x: 0.8,
      y: 4.5,
      w: 8.4,
      fontSize: 14,
      color: th.color,
      fontFace: th.fontFace,
    });
  }

  // CTA label
  if (s.ctaLabel) {
    slide.addText(s.ctaLabel, {
      x: 0.8,
      y: 5.0,
      w: 8.4,
      fontSize: 14,
      color: th.accent,
      fontFace: th.fontFace,
      bold: true,
    });
  }
}

function addAgenda(pt: PptxGenJS, s: AgendaSection, th: PptxTheme) {
  const slide = pt.addSlide();
  slide.background = { color: th.background };

  slide.addText(s.title, {
    x: 0.8,
    y: 0.4,
    w: 8.4,
    fontSize: 28,
    color: th.titleColor,
    fontFace: th.titleFontFace,
    bold: true,
  });

  const rows = s.items.map((item, i) => ({
    text: `${i + 1}.  ${item.label}${item.description ? " — " + item.description : ""}`,
    options: {
      fontSize: 16,
      color: th.color,
      fontFace: th.fontFace,
      bullet: false,
      breakLine: true,
      paraSpaceAfter: 8,
    },
  }));

  slide.addText(
    rows.map((r) => ({
      text: r.text,
      options: r.options,
    })),
    {
      x: 0.8,
      y: 1.5,
      w: 8.4,
      h: 5.0,
      valign: "top",
    },
  );
}

function addSlide(pt: PptxGenJS, s: SlideLikeSection, th: PptxTheme) {
  const slide = pt.addSlide();
  slide.background = { color: th.background };

  slide.addText(s.title, {
    x: 0.8,
    y: 0.4,
    w: 8.4,
    fontSize: 28,
    color: th.titleColor,
    fontFace: th.titleFontFace,
    bold: true,
  });

  const content: Array<{ text: string; options: Record<string, unknown> }> = [];

  if (s.body) {
    content.push({
      text: s.body,
      options: {
        fontSize: 14,
        color: th.color,
        fontFace: th.fontFace,
        breakLine: true,
        paraSpaceAfter: 12,
      },
    });
  }

  if (s.bullets && s.bullets.length > 0) {
    for (const b of s.bullets) {
      content.push({
        text: b,
        options: {
          fontSize: 14,
          color: th.color,
          fontFace: th.fontFace,
          bullet: true,
          breakLine: true,
          paraSpaceAfter: 6,
        },
      });
    }
  }

  if (content.length > 0) {
    slide.addText(content, {
      x: 0.8,
      y: 1.5,
      w: 8.4,
      h: 5.0,
      valign: "top",
    });
  }
}

function addCards(pt: PptxGenJS, s: CardsSection, th: PptxTheme) {
  const slide = pt.addSlide();
  slide.background = { color: th.background };

  slide.addText(s.title, {
    x: 0.8,
    y: 0.4,
    w: 8.4,
    fontSize: 28,
    color: th.titleColor,
    fontFace: th.titleFontFace,
    bold: true,
  });

  const cols = Math.min(s.cards.length, 3);
  const colW = 2.6;
  const gap = 0.2;
  const startX = 0.8;

  s.cards.slice(0, 6).forEach((card, i) => {
    const col = i % cols;
    const row = Math.floor(i / cols);
    const x = startX + col * (colW + gap);
    const y = 1.5 + row * 2.6;

    // Card background rectangle
    slide.addShape(pt.ShapeType?.rect ?? "rect", {
      x,
      y,
      w: colW,
      h: 2.3,
      fill: { color: th.background === "ffffff" ? "f5f5f5" : "2a2a2a" },
      rectRadius: 0.1,
    });

    // Tag
    if (card.tag) {
      slide.addText(card.tag, {
        x: x + 0.15,
        y: y + 0.15,
        w: colW - 0.3,
        fontSize: 10,
        color: th.accent,
        fontFace: th.fontFace,
        bold: true,
      });
    }

    // Card title
    slide.addText(card.title, {
      x: x + 0.15,
      y: y + (card.tag ? 0.55 : 0.2),
      w: colW - 0.3,
      fontSize: 14,
      color: th.titleColor,
      fontFace: th.titleFontFace,
      bold: true,
    });

    // Card description
    slide.addText(card.description, {
      x: x + 0.15,
      y: y + (card.tag ? 1.0 : 0.65),
      w: colW - 0.3,
      h: 1.1,
      fontSize: 11,
      color: th.color,
      fontFace: th.fontFace,
      valign: "top",
    });
  });
}

function addImage(pt: PptxGenJS, s: ImageSection, th: PptxTheme) {
  const slide = pt.addSlide();
  slide.background = { color: th.background };

  if (s.title) {
    slide.addText(s.title, {
      x: 0.8,
      y: 0.4,
      w: 8.4,
      fontSize: 28,
      color: th.titleColor,
      fontFace: th.titleFontFace,
      bold: true,
    });
  }

  // Add image if URL is present (http/https or inline base64 data URI)
  if (s.image.url) {
    try {
      slide.addImage({
        ...imageSource(s.image.url),
        x: 0.8,
        y: s.title ? 1.5 : 0.5,
        w: 8.4,
        h: 4.5,
        sizing: { type: "contain", w: 8.4, h: 4.5 },
      });
    } catch {
      // Fallback: show URL as text
      slide.addText(`[Image: ${s.image.url}]`, {
        x: 0.8,
        y: 2.5,
        w: 8.4,
        fontSize: 14,
        color: th.color,
        fontFace: th.fontFace,
        align: "center",
      });
    }
  } else {
    slide.addText(`[Image placeholder]`, {
      x: 0.8,
      y: 2.5,
      w: 8.4,
      fontSize: 14,
      color: th.color,
      fontFace: th.fontFace,
      align: "center",
    });
  }

  if (s.image.caption) {
    slide.addText(s.image.caption, {
      x: 0.8,
      y: 6.2,
      w: 8.4,
      fontSize: 11,
      color: th.color,
      fontFace: th.fontFace,
      align: "center",
      italic: true,
    });
  }
}

function addGallery(pt: PptxGenJS, s: GallerySection, th: PptxTheme) {
  // Gallery → multiple images on one slide (up to 4)
  const slide = pt.addSlide();
  slide.background = { color: th.background };

  slide.addText(s.title, {
    x: 0.8,
    y: 0.3,
    w: 8.4,
    fontSize: 28,
    color: th.titleColor,
    fontFace: th.titleFontFace,
    bold: true,
  });

  const images = s.images.slice(0, 4);
  const positions = [
    { x: 0.8, y: 1.5, w: 4.0, h: 2.2 },
    { x: 5.2, y: 1.5, w: 4.0, h: 2.2 },
    { x: 0.8, y: 4.0, w: 4.0, h: 2.2 },
    { x: 5.2, y: 4.0, w: 4.0, h: 2.2 },
  ];

  images.forEach((img, i) => {
    const pos = positions[i];
    if (img.url) {
      try {
        slide.addImage({
          ...imageSource(img.url),
          ...pos,
          sizing: { type: "contain", w: pos.w, h: pos.h },
        });
      } catch {
        slide.addText(`[Image ${i + 1}]`, {
          ...pos,
          fontSize: 12,
          color: th.color,
          fontFace: th.fontFace,
          align: "center",
          valign: "middle",
        });
      }
    } else {
      slide.addText(`[Image ${i + 1}]`, {
        ...pos,
        fontSize: 12,
        color: th.color,
        fontFace: th.fontFace,
        align: "center",
        valign: "middle",
      });
    }
  });
}

function addChart(pt: PptxGenJS, s: ChartSection, th: PptxTheme) {
  const slide = pt.addSlide();
  slide.background = { color: th.background };

  slide.addText(s.title, {
    x: 0.8,
    y: 0.4,
    w: 8.4,
    fontSize: 28,
    color: th.titleColor,
    fontFace: th.titleFontFace,
    bold: true,
  });

  // For charts with data, create a table representation
  const { columns, rows } = s.data;
  if (columns.length > 0 && rows.length > 0) {
    const tableRows: Array<
      Array<{ text: string; options?: Record<string, unknown> }>
    > = [];

    // Header
    tableRows.push(
      columns.map((col) => ({
        text: col,
        options: {
          bold: true,
          color: "FFFFFF",
          fill: { color: th.accent },
          fontSize: 12,
          fontFace: th.fontFace,
        },
      })),
    );

    // Data
    for (const row of rows) {
      tableRows.push(
        columns.map((col) => ({
          text: String(row[col] ?? ""),
          options: {
            fontSize: 11,
            fontFace: th.fontFace,
            color: th.color,
          },
        })),
      );
    }

    slide.addTable(tableRows, {
      x: 0.8,
      y: 1.5,
      w: 8.4,
      border: { pt: 0.5, color: "CCCCCC" },
      colW: columns.map(() => 8.4 / columns.length),
    });
  }

  if (s.insight) {
    slide.addText(`💡 ${s.insight}`, {
      x: 0.8,
      y: 5.5,
      w: 8.4,
      fontSize: 13,
      color: th.accent,
      fontFace: th.fontFace,
      italic: true,
    });
  }
}

function addTimeline(pt: PptxGenJS, s: TimelineSection, th: PptxTheme) {
  const slide = pt.addSlide();
  slide.background = { color: th.background };

  slide.addText(s.title, {
    x: 0.8,
    y: 0.4,
    w: 8.4,
    fontSize: 28,
    color: th.titleColor,
    fontFace: th.titleFontFace,
    bold: true,
  });

  const rows: Array<{ text: string; options: Record<string, unknown> }> = [];
  for (const item of s.items) {
    rows.push({
      text: `${item.time}  —  ${item.title}`,
      options: {
        fontSize: 16,
        color: th.accent,
        fontFace: th.fontFace,
        bold: true,
        breakLine: true,
        paraSpaceAfter: 4,
      },
    });
    if (item.description) {
      rows.push({
        text: item.description,
        options: {
          fontSize: 12,
          color: th.color,
          fontFace: th.fontFace,
          breakLine: true,
          paraSpaceAfter: 12,
        },
      });
    }
  }

  slide.addText(rows, {
    x: 0.8,
    y: 1.5,
    w: 8.4,
    h: 5.0,
    valign: "top",
  });
}

function addComparison(pt: PptxGenJS, s: ComparisonSection, th: PptxTheme) {
  const slide = pt.addSlide();
  slide.background = { color: th.background };

  slide.addText(s.title, {
    x: 0.8,
    y: 0.4,
    w: 8.4,
    fontSize: 28,
    color: th.titleColor,
    fontFace: th.titleFontFace,
    bold: true,
  });

  const tableRows: Array<
    Array<{ text: string; options?: Record<string, unknown> }>
  > = [];

  // Header
  tableRows.push([
    { text: "", options: { bold: true, fontSize: 13, fontFace: th.fontFace } },
    {
      text: s.leftHeader,
      options: {
        bold: true,
        color: "FFFFFF",
        fill: { color: th.accent },
        fontSize: 13,
        fontFace: th.fontFace,
      },
    },
    {
      text: s.rightHeader,
      options: {
        bold: true,
        color: "FFFFFF",
        fill: { color: th.titleColor },
        fontSize: 13,
        fontFace: th.fontFace,
      },
    },
  ]);

  for (const row of s.rows) {
    tableRows.push([
      {
        text: row.label,
        options: { bold: true, fontSize: 12, fontFace: th.fontFace, color: th.color },
      },
      { text: row.left, options: { fontSize: 12, fontFace: th.fontFace, color: th.color } },
      { text: row.right, options: { fontSize: 12, fontFace: th.fontFace, color: th.color } },
    ]);
  }

  slide.addTable(tableRows, {
    x: 0.8,
    y: 1.5,
    w: 8.4,
    border: { pt: 0.5, color: "CCCCCC" },
    colW: [2.4, 3.0, 3.0],
  });
}

function addFAQ(pt: PptxGenJS, s: FAQSection, th: PptxTheme) {
  const slide = pt.addSlide();
  slide.background = { color: th.background };

  slide.addText(s.title, {
    x: 0.8,
    y: 0.4,
    w: 8.4,
    fontSize: 28,
    color: th.titleColor,
    fontFace: th.titleFontFace,
    bold: true,
  });

  const rows: Array<{ text: string; options: Record<string, unknown> }> = [];
  for (const item of s.items) {
    rows.push({
      text: `Q: ${item.question}`,
      options: {
        fontSize: 15,
        color: th.titleColor,
        fontFace: th.fontFace,
        bold: true,
        breakLine: true,
        paraSpaceAfter: 2,
      },
    });
    rows.push({
      text: `A: ${item.answer}`,
      options: {
        fontSize: 13,
        color: th.color,
        fontFace: th.fontFace,
        breakLine: true,
        paraSpaceAfter: 14,
      },
    });
  }

  slide.addText(rows, {
    x: 0.8,
    y: 1.5,
    w: 8.4,
    h: 5.0,
    valign: "top",
  });
}

function addQuote(pt: PptxGenJS, s: QuoteSection, th: PptxTheme) {
  const slide = pt.addSlide();
  slide.background = { color: th.background };

  slide.addText(`"${s.quote}"`, {
    x: 1.2,
    y: 1.5,
    w: 7.6,
    h: 3.0,
    fontSize: 24,
    color: th.titleColor,
    fontFace: th.titleFontFace,
    italic: true,
    align: "center",
    valign: "middle",
  });

  if (s.author) {
    slide.addText(`— ${s.author}`, {
      x: 1.2,
      y: 4.8,
      w: 7.6,
      fontSize: 16,
      color: th.color,
      fontFace: th.fontFace,
      align: "center",
    });
  }
}

function addCTA(pt: PptxGenJS, s: CTASection, th: PptxTheme) {
  const slide = pt.addSlide();
  // Dark background for CTA
  slide.background = { color: "1a1a2e" };

  slide.addText(s.title, {
    x: 0.8,
    y: 1.5,
    w: 8.4,
    h: 1.5,
    fontSize: 32,
    color: "FFFFFF",
    fontFace: th.titleFontFace,
    bold: true,
    align: "center",
    valign: "middle",
  });

  if (s.description) {
    slide.addText(s.description, {
      x: 0.8,
      y: 3.2,
      w: 8.4,
      fontSize: 16,
      color: "CBD5E1",
      fontFace: th.fontFace,
      align: "center",
    });
  }

  // Primary button text
  slide.addShape(pt.ShapeType?.rect ?? "rect", {
    x: 3.5,
    y: 4.5,
    w: 3.0,
    h: 0.7,
    fill: { color: th.accent },
    rectRadius: 0.1,
  });
  slide.addText(s.primaryLabel, {
    x: 3.5,
    y: 4.5,
    w: 3.0,
    h: 0.7,
    fontSize: 16,
    color: "FFFFFF",
    fontFace: th.fontFace,
    bold: true,
    align: "center",
    valign: "middle",
  });

  if (s.secondaryLabel) {
    slide.addText(s.secondaryLabel, {
      x: 3.5,
      y: 5.4,
      w: 3.0,
      h: 0.5,
      fontSize: 14,
      color: "94A3B8",
      fontFace: th.fontFace,
      align: "center",
    });
  }
}

// ---------------------------------------------------------------------------
// Dispatcher
// ---------------------------------------------------------------------------

function addSection(
  pt: PptxGenJS,
  section: DeckSection,
  th: PptxTheme,
): void {
  switch (section.type) {
    case "hero":
      return addHero(pt, section, th);
    case "agenda":
      return addAgenda(pt, section, th);
    case "slide":
      return addSlide(pt, section, th);
    case "cards":
      return addCards(pt, section, th);
    case "image":
      return addImage(pt, section, th);
    case "gallery":
      return addGallery(pt, section, th);
    case "chart":
      return addChart(pt, section, th);
    case "timeline":
      return addTimeline(pt, section, th);
    case "comparison":
      return addComparison(pt, section, th);
    case "faq":
      return addFAQ(pt, section, th);
    case "quote":
      return addQuote(pt, section, th);
    case "cta":
      return addCTA(pt, section, th);
    default:
      // Fallback: title slide
      {
        const s = pt.addSlide();
        s.background = { color: th.background };
        s.addText((section as DeckSection).title, {
          x: 0.8,
          y: 2.5,
          w: 8.4,
          fontSize: 28,
          color: th.titleColor,
          fontFace: th.titleFontFace,
          bold: true,
          align: "center",
        });
      }
  }
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Convert a WebDeck into a .pptx Buffer.
 *
 * Layout fidelity is intentionally limited — the goal is a reasonable
 * representation, not pixel-perfect reproduction.
 */
export async function exportPptx(deck: WebDeck): Promise<Buffer> {
  // Dynamic import to keep the heavy dependency out of client bundles
  const PptxGenJSModule = await import("pptxgenjs");
  const PptxGenJS = PptxGenJSModule.default ?? PptxGenJSModule;

  const pt = new PptxGenJS();
  pt.layout = "LAYOUT_WIDE"; // 16:9
  pt.author = "Web Deck";
  pt.title = deck.title;
  pt.subject = deck.subtitle || "";

  const th = themeToPptx(deck.theme);

  for (const section of deck.sections) {
    addSection(pt, section, th);
  }

  // pptxgenjs .write returns different types depending on outputType.
  // "arraybuffer" gives an ArrayBuffer which we convert to Buffer.
  const result: unknown = await pt.write({ outputType: "arraybuffer" });
  if (result instanceof ArrayBuffer) {
    return Buffer.from(new Uint8Array(result));
  }
  if (result instanceof Uint8Array) {
    return Buffer.from(result);
  }
  // Fallback — shouldn't happen
  return Buffer.from(result as Buffer);
}
