import type { WebDeck } from "@/types/deck";
import type { ExportCheck, ExportWarning } from "@/types/checks";
import { exportStaticHtml } from "@/lib/export/exportStaticHtml";

// Assess whether a deck can be exported and estimate the resulting file size.
// The static export inlines all styles + data, so its byte length is the
// authoritative size when generation succeeds.
export function computeExportCheck(deck: WebDeck): ExportCheck {
  const warnings: ExportWarning[] = [];
  const sections = deck.sections;

  if (sections.length === 0) warnings.push({ id: "noSections" });
  if (!deck.title?.trim()) warnings.push({ id: "noTitle" });

  let includesImages = false;
  let includesCharts = false;

  sections.forEach((s, i) => {
    if (s.type === "image") {
      includesImages = true;
      if (!s.image?.url) warnings.push({ id: "missingImage", sectionIndex: i + 1 });
    }
    if (s.type === "gallery") {
      includesImages = true;
    }
    if (s.type === "hero" && s.background?.url) includesImages = true;
    if (s.type === "chart") {
      includesCharts = true;
      if (s.data.rows.length === 0)
        warnings.push({ id: "emptyChart", sectionIndex: i + 1 });
    }
  });

  let canExport = true;
  let estimatedSizeKb = 0;
  try {
    const html = exportStaticHtml(deck);
    // Byte length of the UTF-8 document; images referenced by URL are not
    // inlined, so this reflects the actual downloaded HTML.
    estimatedSizeKb = Math.round(Buffer.byteLength(html, "utf8") / 1024);
  } catch {
    canExport = false;
  }

  if (estimatedSizeKb > 500) warnings.push({ id: "largeSize" });

  return {
    canExport,
    warnings,
    estimatedSizeKb,
    includesImages,
    includesCharts,
  };
}
