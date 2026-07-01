import type {
  DeckSection,
  DeckSectionType,
  ChartData,
} from "@/types/deck";
import { uid } from "@/lib/utils";

// Blank-section factory for the "Add Section" flow. Each new section gets
// sensible placeholder content so the canvas never renders an empty void.

const SAMPLE_CHART_DATA: ChartData = {
  columns: ["Month", "Revenue", "Cost"],
  rows: [
    { Month: "Jan", Revenue: 120, Cost: 80 },
    { Month: "Feb", Revenue: 150, Cost: 90 },
    { Month: "Mar", Revenue: 180, Cost: 100 },
  ],
};

export const ADDABLE_SECTIONS: { type: DeckSectionType; label: string }[] = [
  { type: "hero", label: "Hero" },
  { type: "slide", label: "Text" },
  { type: "cards", label: "Cards" },
  { type: "image", label: "Image" },
  { type: "gallery", label: "Gallery" },
  { type: "chart", label: "Chart" },
  { type: "timeline", label: "Timeline" },
  { type: "comparison", label: "Comparison" },
  { type: "faq", label: "FAQ" },
  { type: "cta", label: "CTA" },
];

export function createSection(type: DeckSectionType): DeckSection {
  const id = uid("sec_");
  const base = { id, sourceSlideIndexes: [] as number[] };
  switch (type) {
    case "hero":
      return {
        ...base,
        type: "hero",
        title: "New Hero Title",
        subtitle: "Add a compelling subtitle here.",
        eyebrow: "Web Deck",
        layout: "centered",
      };
    case "agenda":
      return {
        ...base,
        type: "agenda",
        title: "Agenda",
        items: [{ label: "First topic" }, { label: "Second topic" }],
      };
    case "slide":
      return {
        ...base,
        type: "slide",
        title: "New Section",
        bullets: ["First point", "Second point"],
      };
    case "cards":
      return {
        ...base,
        type: "cards",
        title: "Highlights",
        layout: "grid",
        cards: [
          { title: "Card one", description: "Describe this item." },
          { title: "Card two", description: "Describe this item." },
          { title: "Card three", description: "Describe this item." },
        ],
      };
    case "timeline":
      return {
        ...base,
        type: "timeline",
        title: "Timeline",
        items: [
          { time: "2024", title: "Milestone one" },
          { time: "2025", title: "Milestone two" },
        ],
      };
    case "comparison":
      return {
        ...base,
        type: "comparison",
        title: "Comparison",
        leftHeader: "Option A",
        rightHeader: "Option B",
        rows: [
          { label: "Feature", left: "Yes", right: "No" },
          { label: "Price", left: "$", right: "$$" },
        ],
      };
    case "faq":
      return {
        ...base,
        type: "faq",
        title: "FAQ",
        layout: "accordion",
        items: [
          { question: "Your question?", answer: "Your answer." },
        ],
      };
    case "quote":
      return {
        ...base,
        type: "quote",
        title: "Quote",
        quote: "An inspiring statement.",
      };
    case "cta":
      return {
        ...base,
        type: "cta",
        title: "Ready to start?",
        description: "Add a short call to action.",
        primaryLabel: "Get started",
      };
    case "image":
      return {
        ...base,
        type: "image",
        title: "Image",
        layout: "full-width",
        image: { url: "", alt: "" },
        content: { title: "", description: "" },
      };
    case "gallery":
      return {
        ...base,
        type: "gallery",
        title: "Gallery",
        layout: "grid",
        images: [],
      };
    case "chart":
      return {
        ...base,
        type: "chart",
        title: "Chart",
        chartType: "bar",
        layout: "chart-with-insight",
        insight: "",
        data: {
          columns: [...SAMPLE_CHART_DATA.columns],
          rows: SAMPLE_CHART_DATA.rows.map((r) => ({ ...r })),
        },
        config: {
          xKey: "Month",
          yKeys: ["Revenue", "Cost"],
          showLegend: true,
          showGrid: true,
        },
      };
    default:
      return {
        ...base,
        type: "slide",
        title: "New Section",
        bullets: [],
      };
  }
}

// Deep-clone a section for duplication, minting a fresh id.
export function duplicateSection(section: DeckSection): DeckSection {
  const clone: DeckSection = JSON.parse(JSON.stringify(section));
  clone.id = uid("sec_");
  return clone;
}
