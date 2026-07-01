import type {
  ParsedSlide,
  ImportQualityReport,
  ImportWarning,
  ImportWarningType,
} from "@/types/project";
import { uid } from "@/lib/utils";

// Heuristic thresholds for the import-quality warnings. Tuned to be
// conservative: prefer flagging a page for review over silent misses.
const TITLE_MIN_LEN = 3;
const TOO_MUCH_TEXT_CHARS = 600;
const LOW_TEXT_CHARS = 20;
const IMAGE_HEAVY_TEXT_CHARS = 40;

// Neutral fallback message stored on the warning. The UI localizes via
// `type` + `slideIndex` (spec 13.10); this string is only a non-UI fallback.
const FALLBACK_MESSAGE: Record<ImportWarningType, string> = {
  "empty-slide": "This slide appears to be empty.",
  "missing-title": "No clear title was detected.",
  "image-heavy": "This slide may be image-heavy.",
  "too-much-text": "This slide has a lot of text.",
  "low-text-density": "Very little text was found on this slide.",
  "possible-screenshot": "This slide may be a screenshot.",
};

const SEVERITY: Record<ImportWarningType, ImportWarning["severity"]> = {
  "empty-slide": "warning",
  "missing-title": "info",
  "image-heavy": "info",
  "too-much-text": "info",
  "low-text-density": "info",
  "possible-screenshot": "warning",
};

// Produce a per-project confidence report from the parsed slides. Detection:
//  - empty-slide:        no rawText at all
//  - missing-title:      title absent or shorter than TITLE_MIN_LEN
//  - image-heavy:        little text but image refs present in the slide XML
//  - too-much-text:      rawText over TOO_MUCH_TEXT_CHARS
//  - low-text-density:   rawText very short (but not fully empty)
//  - possible-screenshot: almost no text blocks yet images present
export function buildImportQualityReport(
  slides: ParsedSlide[],
): ImportQualityReport {
  const warnings: ImportWarning[] = [];
  let textBlocksCount = 0;
  let detectedTitlesCount = 0;
  let bulletsCount = 0;
  let notesCount = 0;
  let imagesDetectedCount = 0;
  let tablesDetectedCount = 0;
  let emptySlidesCount = 0;

  const push = (slideIndex: number, type: ImportWarningType) => {
    warnings.push({
      id: uid("warn_"),
      slideIndex,
      type,
      message: FALLBACK_MESSAGE[type],
      severity: SEVERITY[type],
    });
  };

  for (const slide of slides) {
    const rawText = (slide.rawText ?? "").trim();
    const blockCount = rawText ? rawText.split("\n").filter(Boolean).length : 0;
    const title = (slide.title ?? "").trim();
    const imageRefs = slide.imageRefCount ?? 0;
    const tableRefs = slide.tableRefCount ?? 0;

    textBlocksCount += blockCount;
    bulletsCount += slide.bullets?.length ?? 0;
    if (slide.notes && slide.notes.trim()) notesCount += 1;
    imagesDetectedCount += imageRefs;
    tablesDetectedCount += tableRefs;

    const hasTitle = title.length >= TITLE_MIN_LEN && title !== "Untitled slide";
    if (hasTitle) detectedTitlesCount += 1;

    // Order matters: emptiness dominates, then screenshot/image-heavy, then
    // density signals. At most a couple of warnings per slide keeps it useful.
    if (!rawText) {
      emptySlidesCount += 1;
      push(slide.index, "empty-slide");
      continue;
    }

    if (blockCount <= 1 && imageRefs >= 1 && rawText.length < LOW_TEXT_CHARS) {
      push(slide.index, "possible-screenshot");
    } else if (rawText.length < IMAGE_HEAVY_TEXT_CHARS && imageRefs >= 2) {
      push(slide.index, "image-heavy");
    } else if (rawText.length < LOW_TEXT_CHARS) {
      push(slide.index, "low-text-density");
    } else if (rawText.length > TOO_MUCH_TEXT_CHARS) {
      push(slide.index, "too-much-text");
    }

    if (!hasTitle) push(slide.index, "missing-title");
  }

  return {
    slidesCount: slides.length,
    textBlocksCount,
    detectedTitlesCount,
    bulletsCount,
    notesCount,
    imagesDetectedCount,
    tablesDetectedCount,
    emptySlidesCount,
    warningCount: warnings.length,
    warnings,
  };
}
