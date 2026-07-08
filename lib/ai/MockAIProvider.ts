import type { AIProvider, GenerateWebDeckInput, GenerateSuggestionsInput } from "./AIProvider";
import type {
  WebDeck,
  DeckSection,
  HeroSection,
  AgendaSection,
  SlideLikeSection,
  FAQSection,
  CTASection,
  EnhancementSuggestion,
  SuggestionType,
} from "@/types/deck";
import { DEFAULT_THEME } from "@/lib/deck/theme";
import { DEFAULT_MOTION } from "@/types/deck";
import type { ParsedSlide } from "@/types/project";
import { uid } from "@/lib/utils";

// Deterministic, dependency-free deck generation. This is both the offline
// default and the fallback when the Anthropic call fails or returns junk.

function summarize(text: string, max = 120): string {
  const clean = text.replace(/\s+/g, " ").trim();
  if (clean.length <= max) return clean;
  return clean.slice(0, max - 1).trimEnd() + "…";
}

function buildHero(slides: ParsedSlide[], projectName: string): HeroSection {
  const first = slides[0];
  return {
    id: uid("sec_"),
    type: "hero",
    sourceSlideIndexes: first ? [first.index] : [],
    eyebrow: "Web Deck",
    title: first?.title || projectName,
    subtitle:
      first?.bullets[0] || first?.rawText
        ? summarize(first?.bullets[0] || first?.rawText || "", 140)
        : "由 PPT 升级而来的可交互网页版汇报材料。",
    summary: "开场页",
    ctaLabel: "开始浏览",
  };
}

function buildAgenda(slides: ParsedSlide[]): AgendaSection | null {
  // Use the first handful of slide titles as an agenda.
  const source = slides.slice(0, Math.min(6, slides.length));
  if (source.length < 2) return null;
  return {
    id: uid("sec_"),
    type: "agenda",
    sourceSlideIndexes: source.map((s) => s.index),
    title: "内容概览",
    summary: "本次汇报的主要议题",
    items: source.map((s) => ({
      label: s.title,
      description: s.bullets[0] ? summarize(s.bullets[0], 80) : undefined,
    })),
  };
}

function buildSlideLike(slide: ParsedSlide): SlideLikeSection {
  const body =
    slide.bullets.length === 0 && slide.rawText
      ? summarize(slide.rawText, 400)
      : undefined;
  return {
    id: uid("sec_"),
    type: "slide",
    sourceSlideIndexes: [slide.index],
    title: slide.title,
    summary: slide.bullets[0] ? summarize(slide.bullets[0], 90) : undefined,
    bullets: slide.bullets,
    body,
    notes: slide.notes,
  };
}

function buildFAQ(slides: ParsedSlide[]): FAQSection {
  // Derive mock Q&A from slide titles; keep it plausible for a proposal.
  const picks = slides.filter((s) => s.title && s.title !== "Untitled slide").slice(0, 5);
  const items =
    picks.length > 0
      ? picks.map((s) => ({
          question: `关于「${s.title}」，我需要了解什么？`,
          answer:
            s.bullets[0] || summarize(s.rawText || "详见对应章节。", 160) || "详见对应章节。",
        }))
      : [
          {
            question: "这份材料的核心目标是什么？",
            answer: "帮助团队快速理解方案要点并推动决策。",
          },
        ];
  return {
    id: uid("sec_"),
    type: "faq",
    sourceSlideIndexes: picks.map((s) => s.index),
    title: "常见问题",
    summary: "对关键议题的快速解答",
    items,
  };
}

function buildCTA(slides: ParsedSlide[]): CTASection {
  const last = slides[slides.length - 1];
  return {
    id: uid("sec_"),
    type: "cta",
    sourceSlideIndexes: last ? [last.index] : [],
    title: last?.title && last.title !== "Untitled slide" ? last.title : "下一步",
    description:
      last?.bullets[0] ||
      "把这份 Web Deck 分享给相关方，或导出静态 HTML 离线存档。",
    primaryLabel: "联系我们",
    secondaryLabel: "预约演示",
  };
}

// Conservative mode: hero + one slide-like section per PPT page + CTA.
// Enhanced mode: hero + agenda + slide sections + FAQ + CTA (more web-native).
function buildSections(slides: ParsedSlide[], projectName: string, mode: WebDeck["mode"]): DeckSection[] {
  const sections: DeckSection[] = [];
  sections.push(buildHero(slides, projectName));

  if (mode === "enhanced") {
    const agenda = buildAgenda(slides);
    if (agenda) sections.push(agenda);
  }

  // Skip slide 1 in the body since it became the hero.
  const bodySlides = slides.slice(1);
  for (const slide of bodySlides) {
    sections.push(buildSlideLike(slide));
  }

  if (mode === "enhanced") {
    sections.push(buildFAQ(slides));
  }

  sections.push(buildCTA(slides));
  return sections;
}

// Heuristic suggestions: flag overloaded slides, propose section transforms.
function buildSuggestions(slides: ParsedSlide[]): EnhancementSuggestion[] {
  const out: EnhancementSuggestion[] = [];
  const add = (
    slideIndex: number,
    type: SuggestionType,
    title: string,
    description: string,
    actionLabel: string
  ) => {
    out.push({ id: uid("sug_"), slideIndex, type, title, description, actionLabel });
  };

  slides.forEach((slide) => {
    const bulletCount = slide.bullets.length;

    if (bulletCount >= 6) {
      add(
        slide.index,
        "split",
        `第 ${slide.index} 页信息过载`,
        `该页有 ${bulletCount} 个要点，建议拆分为两个 section 以提升可读性。`,
        "Split"
      );
    } else if (bulletCount >= 3) {
      add(
        slide.index,
        "cards",
        `第 ${slide.index} 页适合卡片化`,
        "将要点转换为卡片布局，更符合网页浏览习惯。",
        "Apply"
      );
    }

    // Titles hinting at time/steps -> timeline.
    if (/时间|计划|路线|步骤|阶段|roadmap|timeline|phase/i.test(slide.title)) {
      add(
        slide.index,
        "timeline",
        `第 ${slide.index} 页适合时间线`,
        "该页内容具有阶段性，建议转换为时间线展示。",
        "Apply"
      );
    }

    // Titles hinting at comparison.
    if (/对比|比较|vs|versus|优劣|差异/i.test(slide.title)) {
      add(
        slide.index,
        "comparison",
        `第 ${slide.index} 页适合对比表`,
        "将差异点整理为左右对比结构。",
        "Apply"
      );
    }
  });

  // Always propose an FAQ and a closing CTA.
  const midIndex = slides[Math.floor(slides.length / 2)]?.index ?? 1;
  add(
    midIndex,
    "faq",
    "生成常见问题",
    "根据全文自动生成一个 FAQ section，回答受众最可能提出的问题。",
    "Apply"
  );
  const lastIndex = slides[slides.length - 1]?.index ?? 1;
  add(
    lastIndex,
    "cta",
    "添加结尾 CTA",
    "在结尾添加行动号召，引导受众进入下一步。",
    "Apply"
  );

  // Keep 5-8 suggestions.
  return out.slice(0, 8);
}

export class MockAIProvider implements AIProvider {
  readonly name = "mock";
  readonly capabilities = {
    streaming: false,
    maxSlides: 50,
  };

  async generateWebDeck(input: GenerateWebDeckInput): Promise<WebDeck> {
    const { slides, projectName, mode, onProgress } = input;
    onProgress?.(10);
    // Simulate small delay for mock to make progress visible
    await new Promise((r) => setTimeout(r, 300));
    onProgress?.(50);
    const deck: WebDeck = {
      id: uid("deck_"),
      title: slides[0]?.title || projectName,
      subtitle: slides[0]?.bullets[0]
        ? summarize(slides[0].bullets[0], 140)
        : "PPT → HTML Web Deck",
      theme: DEFAULT_THEME,
      mode,
      motion: { ...DEFAULT_MOTION },
      sections: buildSections(slides, projectName, mode),
      suggestions: buildSuggestions(slides),
    };
    onProgress?.(90);
    return deck;
  }

  async generateSuggestions(
    input: GenerateSuggestionsInput
  ): Promise<EnhancementSuggestion[]> {
    return buildSuggestions(input.slides);
  }
}

export const mockProvider = new MockAIProvider();
