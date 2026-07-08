import type {
  WebDeck,
  DeckSection,
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

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function escMd(s: string | undefined): string {
  if (!s) return "";
  // Escape markdown special chars that could break formatting
  return s.replace(/[|\\]/g, "\\$&");
}

// ---------------------------------------------------------------------------
// Section renderers
// ---------------------------------------------------------------------------

function renderHero(s: HeroSection): string {
  const lines: string[] = [];
  if (s.eyebrow) lines.push(`*${escMd(s.eyebrow)}*`, "");
  lines.push(`# ${escMd(s.title)}`);
  if (s.subtitle) {
    lines.push("", `## ${escMd(s.subtitle)}`);
  }
  if (s.metrics && s.metrics.length > 0) {
    lines.push("");
    for (const m of s.metrics) {
      lines.push(`- **${escMd(m.value)}** — ${escMd(m.label)}`);
    }
  }
  if (s.ctaLabel) {
    lines.push("", `**[${escMd(s.ctaLabel)}]**`);
  }
  return lines.join("\n");
}

function renderAgenda(s: AgendaSection): string {
  const lines: string[] = [];
  lines.push(`## ${escMd(s.title)}`);
  lines.push("");
  s.items.forEach((item, i) => {
    const desc = item.description ? ` — ${escMd(item.description)}` : "";
    lines.push(`${i + 1}. **${escMd(item.label)}**${desc}`);
  });
  return lines.join("\n");
}

function renderSlide(s: SlideLikeSection): string {
  const lines: string[] = [];
  lines.push(`## ${escMd(s.title)}`);
  if (s.body) {
    lines.push("", escMd(s.body));
  }
  if (s.bullets && s.bullets.length > 0) {
    lines.push("");
    for (const b of s.bullets) {
      lines.push(`- ${escMd(b)}`);
    }
  }
  if (s.notes) {
    lines.push("", `> *Notes: ${escMd(s.notes)}*`);
  }
  return lines.join("\n");
}

function renderCards(s: CardsSection): string {
  const lines: string[] = [];
  lines.push(`## ${escMd(s.title)}`);
  for (const card of s.cards) {
    lines.push("");
    if (card.tag) lines.push(`\`${escMd(card.tag)}\``);
    lines.push(`### ${escMd(card.title)}`);
    lines.push("", escMd(card.description));
  }
  return lines.join("\n");
}

function renderImage(s: ImageSection): string {
  const lines: string[] = [];
  if (s.title) lines.push(`## ${escMd(s.title)}`);
  const alt = s.image.alt || s.title || "image";
  lines.push("", `![${escMd(alt)}](${s.image.url})`);
  if (s.image.caption) {
    lines.push("", `*${escMd(s.image.caption)}*`);
  }
  if (s.content?.description) {
    lines.push("", escMd(s.content.description));
  }
  return lines.join("\n");
}

function renderGallery(s: GallerySection): string {
  const lines: string[] = [];
  lines.push(`## ${escMd(s.title)}`);
  for (const img of s.images) {
    const alt = img.alt || "image";
    lines.push("", `![${escMd(alt)}](${img.url})`);
    if (img.caption) lines.push(`*${escMd(img.caption)}*`);
  }
  return lines.join("\n");
}

function renderChart(s: ChartSection): string {
  const lines: string[] = [];
  lines.push(`## ${escMd(s.title)}`);
  if (s.description) {
    lines.push("", escMd(s.description));
  }

  const { columns, rows } = s.data;
  if (columns.length > 0 && rows.length > 0) {
    lines.push("");
    // Header row
    lines.push(`| ${columns.map(escMd).join(" | ")} |`);
    lines.push(`| ${columns.map(() => "---").join(" | ")} |`);
    // Data rows
    for (const row of rows) {
      const cells = columns.map((col) => {
        const val = row[col];
        return escMd(String(val ?? ""));
      });
      lines.push(`| ${cells.join(" | ")} |`);
    }
  }

  if (s.insight) {
    lines.push("", `> 💡 ${escMd(s.insight)}`);
  }
  return lines.join("\n");
}

function renderTimeline(s: TimelineSection): string {
  const lines: string[] = [];
  lines.push(`## ${escMd(s.title)}`);
  lines.push("");
  for (const item of s.items) {
    lines.push(`- **${escMd(item.time)}** — ${escMd(item.title)}`);
    if (item.description) {
      lines.push(`  ${escMd(item.description)}`);
    }
  }
  return lines.join("\n");
}

function renderComparison(s: ComparisonSection): string {
  const lines: string[] = [];
  lines.push(`## ${escMd(s.title)}`);
  lines.push("");
  lines.push(`| | ${escMd(s.leftHeader)} | ${escMd(s.rightHeader)} |`);
  lines.push("| --- | --- | --- |");
  for (const row of s.rows) {
    lines.push(
      `| **${escMd(row.label)}** | ${escMd(row.left)} | ${escMd(row.right)} |`,
    );
  }
  return lines.join("\n");
}

function renderFAQ(s: FAQSection): string {
  const lines: string[] = [];
  lines.push(`## ${escMd(s.title)}`);
  for (const item of s.items) {
    lines.push("");
    lines.push(`### Q: ${escMd(item.question)}`);
    lines.push("", `A: ${escMd(item.answer)}`);
  }
  return lines.join("\n");
}

function renderQuote(s: QuoteSection): string {
  const lines: string[] = [];
  lines.push(`## ${escMd(s.title)}`);
  lines.push("");
  lines.push(`> ${escMd(s.quote)}`);
  if (s.author) {
    lines.push(`> `, `> — *${escMd(s.author)}*`);
  }
  return lines.join("\n");
}

function renderCTA(s: CTASection): string {
  const lines: string[] = [];
  lines.push(`## ${escMd(s.title)}`);
  if (s.description) {
    lines.push("", escMd(s.description));
  }
  lines.push("");
  lines.push(`**${escMd(s.primaryLabel)}**`);
  if (s.secondaryLabel) {
    lines.push(`**${escMd(s.secondaryLabel)}**`);
  }
  return lines.join("\n");
}

// ---------------------------------------------------------------------------
// Dispatcher
// ---------------------------------------------------------------------------

function renderSection(section: DeckSection): string {
  switch (section.type) {
    case "hero":
      return renderHero(section);
    case "agenda":
      return renderAgenda(section);
    case "slide":
      return renderSlide(section);
    case "cards":
      return renderCards(section);
    case "image":
      return renderImage(section);
    case "gallery":
      return renderGallery(section);
    case "chart":
      return renderChart(section);
    case "timeline":
      return renderTimeline(section);
    case "comparison":
      return renderComparison(section);
    case "faq":
      return renderFAQ(section);
    case "quote":
      return renderQuote(section);
    case "cta":
      return renderCTA(section);
    default:
      return `## ${(section as DeckSection).title}`;
  }
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Convert a WebDeck into a Markdown string. Each section becomes a Markdown
 * block separated by blank lines.
 */
export function exportMarkdown(deck: WebDeck): string {
  const parts: string[] = [];

  // Document title (only if there's no hero section as the first section)
  const firstType = deck.sections[0]?.type;
  if (firstType !== "hero") {
    parts.push(`# ${escMd(deck.title)}`);
    if (deck.subtitle) {
      parts.push("", escMd(deck.subtitle));
    }
    parts.push("");
  }

  for (const section of deck.sections) {
    parts.push(renderSection(section));
    parts.push("", "---", "");
  }

  parts.push("*Created with Web Deck*");

  return parts.join("\n");
}
