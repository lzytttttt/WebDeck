import { describe, it, expect, vi } from "vitest";

// Mock exportStaticHtml — it doesn't exist as a module, so we provide a stub.
vi.mock("@/lib/export/exportStaticHtml", () => ({
  exportStaticHtml: vi.fn(() => "<html></html>"),
}));

import { computePublishChecks } from "@/lib/deck/publishChecks";
import type { WebDeck, DeckSection } from "@/types/deck";
import { DEFAULT_MOTION } from "@/types/deck";
import { exportStaticHtml } from "@/lib/export/exportStaticHtml";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeDeck(overrides: Partial<WebDeck> = {}): WebDeck {
  return {
    id: "d1",
    title: "Test Deck",
    theme: {
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
        headingFont: "Georgia, serif",
        bodyFont: "sans-serif",
        scale: "normal",
      },
      radius: "md",
      shadow: "sm",
      spacing: "normal",
    },
    mode: "conservative",
    motion: { ...DEFAULT_MOTION },
    sections: [],
    suggestions: [],
    ...overrides,
  };
}

function findCheck(checks: ReturnType<typeof computePublishChecks>, id: string) {
  return checks.find((c) => c.id === id)!;
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("computePublishChecks", () => {
  it("passes title check when deck has a title", () => {
    const checks = computePublishChecks(makeDeck());
    expect(findCheck(checks, "title").status).toBe("pass");
  });

  it("fails title check when title is empty", () => {
    const checks = computePublishChecks(makeDeck({ title: "" }));
    expect(findCheck(checks, "title").status).toBe("fail");
  });

  it("fails title check when title is only whitespace", () => {
    const checks = computePublishChecks(makeDeck({ title: "   " }));
    expect(findCheck(checks, "title").status).toBe("fail");
  });

  it("warns on empty sections when a section has no content", () => {
    const sections = [
      { id: "s1", type: "hero", title: "H", sourceSlideIndexes: [] } as DeckSection,
    ];
    const checks = computePublishChecks(makeDeck({ sections }));
    const check = findCheck(checks, "empty-sections");
    expect(check.status).toBe("warning");
    expect(check.sectionIndex).toBe(1);
  });

  it("passes empty-sections when all sections have content", () => {
    const sections = [
      {
        id: "s1",
        type: "hero",
        title: "H",
        subtitle: "Sub",
        sourceSlideIndexes: [],
      } as DeckSection,
    ];
    const checks = computePublishChecks(makeDeck({ sections }));
    expect(findCheck(checks, "empty-sections").status).toBe("pass");
  });

  it("warns on empty titles when a section title is blank", () => {
    const sections = [
      { id: "s1", type: "hero", title: "", sourceSlideIndexes: [], subtitle: "ok" } as DeckSection,
    ];
    const checks = computePublishChecks(makeDeck({ sections }));
    expect(findCheck(checks, "empty-titles").status).toBe("warning");
  });

  it("fails image-missing when an image section has no URL", () => {
    const sections = [
      {
        id: "s1",
        type: "image",
        title: "Img",
        sourceSlideIndexes: [],
        image: { url: "" },
      } as unknown as DeckSection,
    ];
    const checks = computePublishChecks(makeDeck({ sections }));
    expect(findCheck(checks, "image-missing").status).toBe("fail");
  });

  it("warns on chart-empty when chart has no rows", () => {
    const sections = [
      {
        id: "s1",
        type: "chart",
        title: "Chart",
        sourceSlideIndexes: [],
        chartType: "bar",
        data: { columns: ["A"], rows: [] },
        config: {},
      } as unknown as DeckSection,
    ];
    const checks = computePublishChecks(makeDeck({ sections }));
    expect(findCheck(checks, "chart-empty").status).toBe("warning");
  });

  it("warns on min-sections when fewer than 3 sections", () => {
    const checks = computePublishChecks(makeDeck({ sections: [] }));
    expect(findCheck(checks, "min-sections").status).toBe("warning");
  });

  it("passes min-sections with 3+ sections", () => {
    const sections = [
      { id: "s1", type: "hero", title: "A", subtitle: "x", sourceSlideIndexes: [] },
      { id: "s2", type: "hero", title: "B", subtitle: "x", sourceSlideIndexes: [] },
      { id: "s3", type: "hero", title: "C", subtitle: "x", sourceSlideIndexes: [] },
    ] as DeckSection[];
    const checks = computePublishChecks(makeDeck({ sections }));
    expect(findCheck(checks, "min-sections").status).toBe("pass");
  });

  it("warns on mobile-width for comparison sections", () => {
    const sections = [
      {
        id: "s1",
        type: "comparison",
        title: "C",
        sourceSlideIndexes: [],
        leftHeader: "L",
        rightHeader: "R",
        rows: [],
      } as unknown as DeckSection,
    ];
    const checks = computePublishChecks(makeDeck({ sections }));
    expect(findCheck(checks, "mobile-width").status).toBe("warning");
  });

  it("passes exportable check when exportStaticHtml succeeds", () => {
    const checks = computePublishChecks(makeDeck());
    expect(findCheck(checks, "exportable").status).toBe("pass");
  });

  it("fails exportable check when exportStaticHtml throws", () => {
    vi.mocked(exportStaticHtml).mockImplementationOnce(() => {
      throw new Error("fail");
    });
    const checks = computePublishChecks(makeDeck());
    expect(findCheck(checks, "exportable").status).toBe("fail");
  });
});
