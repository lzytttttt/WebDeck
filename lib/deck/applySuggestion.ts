import type {
  WebDeck,
  DeckSection,
  EnhancementSuggestion,
  FAQSection,
  CTASection,
  CardsSection,
  TimelineSection,
} from "@/types/deck";
import type { ParsedSlide } from "@/types/project";
import { uid } from "@/lib/utils";

// Turn a suggestion into a concrete section and splice it into the deck.
// MVP scope: faq / cta / cards / timeline produce real sections; other
// types (split/comparison/data-interaction) append a cards section as a
// reasonable default so Apply always has a visible effect.
export function applySuggestion(
  deck: WebDeck,
  suggestion: EnhancementSuggestion,
  slides: ParsedSlide[]
): WebDeck {
  const slide = slides.find((s) => s.index === suggestion.slideIndex);
  const newSection = buildSectionForSuggestion(suggestion, slide);
  if (!newSection) return deck;

  // Insert before the trailing CTA if one exists, else append.
  const sections = [...deck.sections];
  const ctaIdx = sections.findIndex((s) => s.type === "cta");
  const insertAt = suggestion.type === "cta" ? sections.length : ctaIdx === -1 ? sections.length : ctaIdx;
  sections.splice(insertAt, 0, newSection);

  // Remove the applied suggestion from the list.
  const suggestions = deck.suggestions.filter((s) => s.id !== suggestion.id);

  return { ...deck, sections, suggestions };
}

function buildSectionForSuggestion(
  suggestion: EnhancementSuggestion,
  slide: ParsedSlide | undefined
): DeckSection | null {
  const src = slide ? [slide.index] : [];
  const bullets = slide?.bullets ?? [];

  switch (suggestion.type) {
    case "faq": {
      const items =
        bullets.length >= 2
          ? bullets.slice(0, 5).map((b, i) => ({
              question: `问题 ${i + 1}：${b.slice(0, 40)}${b.length > 40 ? "…" : ""}`,
              answer: b,
            }))
          : [
              { question: "这个方案解决什么问题？", answer: "帮助团队更高效地达成目标。" },
              { question: "如何开始使用？", answer: "上传 PPT，系统自动生成 Web Deck。" },
              { question: "是否支持离线查看？", answer: "支持，可导出静态 HTML。" },
            ];
      const section: FAQSection = {
        id: uid("sec_"),
        type: "faq",
        sourceSlideIndexes: src,
        title: slide?.title ? `${slide.title} · 常见问题` : "常见问题",
        items,
      };
      return section;
    }

    case "cta": {
      const section: CTASection = {
        id: uid("sec_"),
        type: "cta",
        sourceSlideIndexes: src,
        title: "准备好了吗？",
        description: "把这份 Web Deck 分享出去，或导出静态 HTML 存档。",
        primaryLabel: "立即分享",
        secondaryLabel: "预约演示",
      };
      return section;
    }

    case "timeline": {
      const items =
        bullets.length > 0
          ? bullets.slice(0, 6).map((b, i) => ({
              time: `阶段 ${i + 1}`,
              title: b.slice(0, 30) + (b.length > 30 ? "…" : ""),
              description: b,
            }))
          : [
              { time: "阶段 1", title: "调研", description: "明确需求与目标。" },
              { time: "阶段 2", title: "实施", description: "落地方案。" },
              { time: "阶段 3", title: "复盘", description: "评估结果并迭代。" },
            ];
      const section: TimelineSection = {
        id: uid("sec_"),
        type: "timeline",
        sourceSlideIndexes: src,
        title: slide?.title ? `${slide.title} · 时间线` : "时间线",
        items,
      };
      return section;
    }

    // cards + all remaining types default to a cards layout.
    default: {
      const cards =
        bullets.length > 0
          ? bullets.slice(0, 6).map((b) => ({
              title: b.slice(0, 24) + (b.length > 24 ? "…" : ""),
              description: b,
            }))
          : [
              { title: "要点一", description: "内容摘要。" },
              { title: "要点二", description: "内容摘要。" },
              { title: "要点三", description: "内容摘要。" },
            ];
      const section: CardsSection = {
        id: uid("sec_"),
        type: "cards",
        sourceSlideIndexes: src,
        title: slide?.title ? `${slide.title} · 卡片` : "要点卡片",
        cards,
      };
      return section;
    }
  }
}
