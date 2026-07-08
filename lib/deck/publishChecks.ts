import type { WebDeck, DeckSection } from "@/types/deck";
import type { PublishCheck } from "@/types/checks";
import { exportStaticHtml } from "@/lib/export/exportStaticHtml";
import { getSection } from "@/lib/deck/sections";

// Does a section carry any renderable content beyond its title? Empty-section
// detection needs a per-type notion of "has body".
function sectionHasContent(s: DeckSection): boolean {
  const def = getSection(s.type);
  if (def) return def.hasContent(s);
  return true;
}

// Wide content likely to overflow a 390px mobile viewport: comparison tables
// and data tables with many columns are the usual culprits.
function isMobileWide(s: DeckSection): boolean {
  if (s.type === "comparison") return true;
  if (s.type === "chart" && s.chartType === "table") {
    return (s.data.columns?.length ?? 0) > 4;
  }
  return false;
}

// Compute the publish checklist. Locale-independent: each check is an id +
// status (+ optional sectionIndex) that the UI localizes.
export function computePublishChecks(deck: WebDeck): PublishCheck[] {
  const checks: PublishCheck[] = [];
  const sections = deck.sections;

  checks.push({ id: "title", status: deck.title?.trim() ? "pass" : "fail" });

  const emptyIdx = sections.findIndex((s) => !sectionHasContent(s));
  checks.push(
    emptyIdx === -1
      ? { id: "empty-sections", status: "pass" }
      : { id: "empty-sections", status: "warning", sectionIndex: emptyIdx + 1 },
  );

  const emptyTitleIdx = sections.findIndex((s) => !s.title?.trim());
  checks.push(
    emptyTitleIdx === -1
      ? { id: "empty-titles", status: "pass" }
      : { id: "empty-titles", status: "warning", sectionIndex: emptyTitleIdx + 1 },
  );

  const imageMissingIdx = sections.findIndex(
    (s) => s.type === "image" && !s.image?.url,
  );
  checks.push(
    imageMissingIdx === -1
      ? { id: "image-missing", status: "pass" }
      : { id: "image-missing", status: "fail", sectionIndex: imageMissingIdx + 1 },
  );

  const chartEmptyIdx = sections.findIndex(
    (s) => s.type === "chart" && s.data.rows.length === 0,
  );
  checks.push(
    chartEmptyIdx === -1
      ? { id: "chart-empty", status: "pass" }
      : { id: "chart-empty", status: "warning", sectionIndex: chartEmptyIdx + 1 },
  );

  const faqEmptyIdx = sections.findIndex(
    (s) => s.type === "faq" && s.items.some((it) => !it.answer?.trim()),
  );
  checks.push(
    faqEmptyIdx === -1
      ? { id: "faq-empty", status: "pass" }
      : { id: "faq-empty", status: "warning", sectionIndex: faqEmptyIdx + 1 },
  );

  checks.push({
    id: "min-sections",
    status: sections.length >= 3 ? "pass" : "warning",
  });

  const mobileWideIdx = sections.findIndex(isMobileWide);
  checks.push(
    mobileWideIdx === -1
      ? { id: "mobile-width", status: "pass" }
      : { id: "mobile-width", status: "warning", sectionIndex: mobileWideIdx + 1 },
  );

  let exportable = true;
  try {
    exportStaticHtml(deck);
  } catch {
    exportable = false;
  }
  checks.push({ id: "exportable", status: exportable ? "pass" : "fail" });

  return checks;
}
