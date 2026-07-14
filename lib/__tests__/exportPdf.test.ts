import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock puppeteer so the suite runs without downloading/launching Chromium.
// The dynamic `import("puppeteer")` inside exportPdf resolves to this mock.
const pdfMock = vi.fn().mockResolvedValue(Buffer.from("%%PDF-1.4 fake"));
const pageMock = {
  setViewport: vi.fn().mockResolvedValue(undefined),
  goto: vi.fn().mockResolvedValue(undefined),
  evaluate: vi.fn().mockResolvedValue(undefined),
  pdf: pdfMock,
};
const browserMock = {
  newPage: vi.fn().mockResolvedValue(pageMock),
  close: vi.fn().mockResolvedValue(undefined),
};
vi.mock("puppeteer", () => ({
  default: { launch: vi.fn().mockResolvedValue(browserMock) },
}));

import { exportPdf } from "@/lib/export/exportPdf";
import { exportStaticHtml } from "@/lib/export/exportStaticHtml";
import { DEFAULT_MOTION } from "@/types/deck";
import { DEFAULT_THEME } from "@/lib/deck/theme";
import type { WebDeck } from "@/types/deck";

function makeDeck(): WebDeck {
  return {
    id: "test-deck",
    title: "Test Deck",
    subtitle: "A test subtitle",
    theme: DEFAULT_THEME,
    mode: "conservative",
    motion: { ...DEFAULT_MOTION },
    sections: [
      { id: "s1", type: "slide", sourceSlideIndexes: [], title: "Hello", bullets: ["a"] },
    ],
    suggestions: [],
  };
}

beforeEach(() => {
  pdfMock.mockClear();
  pageMock.setViewport.mockClear();
  pageMock.goto.mockClear();
  pageMock.evaluate.mockClear();
  browserMock.close.mockClear();
});

describe("exportPdf", () => {
  it("produces a non-empty PDF buffer", async () => {
    const buf = await exportPdf(makeDeck());
    expect(Buffer.isBuffer(buf)).toBe(true);
    expect(buf.length).toBeGreaterThan(0);
  });

  it("launches a headless browser and calls page.pdf", async () => {
    await exportPdf(makeDeck());
    expect(browserMock.newPage).toHaveBeenCalled();
    expect(pageMock.goto).toHaveBeenCalled();
    expect(pdfMock).toHaveBeenCalled();
    expect(browserMock.close).toHaveBeenCalled();
  });

  it("sets a landscape viewport for 16:9 format", async () => {
    await exportPdf(makeDeck(), { format: "16:9" });
    const viewport = pageMock.setViewport.mock.calls[0][0];
    expect(viewport).toMatchObject({ width: 1920, height: 1080 });
  });

  it("uses A4 (portrait) as the default format", async () => {
    await exportPdf(makeDeck());
    const pdfOptions = pdfMock.mock.calls[0][0] as Record<string, unknown>;
    expect(pdfOptions.format).toBe("A4");
    expect(pdfOptions.landscape).toBeUndefined();
  });

  it("renders the deck to static HTML before loading it", async () => {
    const html = exportStaticHtml(makeDeck());
    await exportPdf(makeDeck());
    const dataUrl = pageMock.goto.mock.calls[0][0] as string;
    expect(dataUrl.startsWith("data:text/html")).toBe(true);
    // The loaded HTML must contain the same deck content the static export has.
    expect(dataUrl).toContain(encodeURIComponent(html.substring(0, 20)));
  });
});
