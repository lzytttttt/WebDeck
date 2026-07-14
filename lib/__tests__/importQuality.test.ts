import { describe, it, expect } from "vitest";
import { buildImportQualityReport } from "@/lib/pptx/importQuality";

type SlideLike = {
  index: number;
  title?: string;
  rawText?: string;
  bullets?: string[];
  notes?: string;
  imageRefCount?: number;
  tableRefCount?: number;
};

function slide(p: SlideLike) {
  return p;
}

describe("buildImportQualityReport", () => {
  it("returns an empty, warning-free report for no slides", () => {
    const report = buildImportQualityReport([]);
    expect(report.slidesCount).toBe(0);
    expect(report.warningCount).toBe(0);
    expect(report.warnings).toEqual([]);
  });

  it("flags a slide with no text as empty-slide", () => {
    const report = buildImportQualityReport([slide({ index: 0 })]);
    expect(report.emptySlidesCount).toBe(1);
    expect(report.warnings[0].type).toBe("empty-slide");
    expect(report.warnings[0].severity).toBe("warning");
  });

  it("does not attach a missing-title warning to an empty slide", () => {
    const report = buildImportQualityReport([slide({ index: 0 })]);
    expect(report.warnings.every((w) => w.type !== "missing-title")).toBe(true);
  });

  it("detects a missing title on a text slide", () => {
    const report = buildImportQualityReport([
      slide({ index: 0, title: "ab", rawText: "Some body text that is long enough." }),
    ]);
    expect(report.warnings.some((w) => w.type === "missing-title")).toBe(true);
  });

  it("treats 'Untitled slide' as a missing title", () => {
    const report = buildImportQualityReport([
      slide({ index: 0, title: "Untitled slide", rawText: "Body text here." }),
    ]);
    expect(report.warnings.some((w) => w.type === "missing-title")).toBe(true);
  });

  it("counts a valid title as detected", () => {
    const report = buildImportQualityReport([
      slide({ index: 0, title: "Quarterly Results", rawText: "Body text here." }),
    ]);
    expect(report.detectedTitlesCount).toBe(1);
    expect(report.warnings.some((w) => w.type === "missing-title")).toBe(false);
  });

  it("flags too much text", () => {
    const long = "word ".repeat(400); // > 600 chars
    const report = buildImportQualityReport([slide({ index: 0, title: "Title", rawText: long })]);
    expect(report.warnings.some((w) => w.type === "too-much-text")).toBe(true);
  });

  it("flags low text density for short body without images", () => {
    const report = buildImportQualityReport([
      slide({ index: 0, title: "Title", rawText: "Hi" }),
    ]);
    expect(report.warnings.some((w) => w.type === "low-text-density")).toBe(true);
  });

  it("flags a possible screenshot (little text + image)", () => {
    const report = buildImportQualityReport([
      slide({ index: 0, title: "Title", rawText: "Hi", imageRefCount: 1 }),
    ]);
    expect(report.warnings.some((w) => w.type === "possible-screenshot")).toBe(true);
  });

  it("flags image-heavy when multiple images and moderate text", () => {
    const report = buildImportQualityReport([
      slide({ index: 0, title: "Title", rawText: "A moderate amount of text here.", imageRefCount: 3 }),
    ]);
    expect(report.warnings.some((w) => w.type === "image-heavy")).toBe(true);
  });

  it("counts images and tables detected across slides", () => {
    const report = buildImportQualityReport([
      slide({ index: 0, title: "A", rawText: "Body text.", imageRefCount: 2, tableRefCount: 1 }),
      slide({ index: 1, title: "B", rawText: "Body text.", imageRefCount: 1, tableRefCount: 2 }),
    ]);
    expect(report.imagesDetectedCount).toBe(3);
    expect(report.tablesDetectedCount).toBe(3);
    expect(report.bulletsCount).toBe(0);
  });

  it("counts bullets and notes", () => {
    const report = buildImportQualityReport([
      slide({ index: 0, title: "A", rawText: "Body", bullets: ["one", "two"], notes: "remember" }),
    ]);
    expect(report.bulletsCount).toBe(2);
    expect(report.notesCount).toBe(1);
  });
});
