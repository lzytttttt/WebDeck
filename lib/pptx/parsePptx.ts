import JSZip from "jszip";
import { extractSlideText, extractNotesText, countImageRefs, countTableRefs } from "./extractSlideText";
import type { ExtractedSlide } from "./types";
import type { ParsedSlide } from "@/types/project";
import { uid } from "@/lib/utils";

// slideN.xml -> N. Used to sort slides into presentation order.
function slideNumber(path: string): number {
  const match = path.match(/slide(\d+)\.xml$/);
  return match ? parseInt(match[1], 10) : Number.MAX_SAFE_INTEGER;
}

// notesSlideN.xml -> N, so we can pair notes back to their slide index.
function notesNumber(path: string): number {
  const match = path.match(/notesSlide(\d+)\.xml$/);
  return match ? parseInt(match[1], 10) : -1;
}

// Read raw ordered text out of a .pptx buffer. This stays close to the
// zip/XML layer; higher-level shaping into ParsedSlide happens below.
export async function extractSlides(buffer: Buffer | ArrayBuffer): Promise<ExtractedSlide[]> {
  const zip = await JSZip.loadAsync(buffer);

  const slidePaths = Object.keys(zip.files)
    .filter((p) => /^ppt\/slides\/slide\d+\.xml$/.test(p))
    .sort((a, b) => slideNumber(a) - slideNumber(b));

  // Map notes by their slideN index where the note file name matches.
  const notesByIndex = new Map<number, string>();
  const notesPaths = Object.keys(zip.files).filter((p) =>
    /^ppt\/notesSlides\/notesSlide\d+\.xml$/.test(p)
  );
  for (const notePath of notesPaths) {
    const n = notesNumber(notePath);
    if (n < 0) continue;
    const file = zip.file(notePath);
    if (!file) continue;
    const xml = await file.async("string");
    const text = extractNotesText(xml);
    if (text) notesByIndex.set(n, text);
  }

  const slides: ExtractedSlide[] = [];
  let i = 0;
  for (const path of slidePaths) {
    i += 1;
    const file = zip.file(path);
    if (!file) continue;
    const xml = await file.async("string");
    const blocks = extractSlideText(xml);
    // Notes file numbering does not strictly track slide order, but the
    // common 1:1 case (notesSlideN <-> slideN) is handled by index N.
    const notes = notesByIndex.get(slideNumber(path));
    slides.push({
      index: i,
      blocks,
      notes,
      imageRefCount: countImageRefs(xml),
      tableRefCount: countTableRefs(xml),
    });
  }

  return slides;
}

// Heuristic: pick the slide title. Prefer the first short-ish block
// (titles are typically brief); fall back to the first block.
function pickTitle(texts: string[]): { title: string; rest: string[] } {
  if (texts.length === 0) return { title: "Untitled slide", rest: [] };

  let titleIdx = 0;
  for (let idx = 0; idx < texts.length; idx += 1) {
    if (texts[idx].length <= 60) {
      titleIdx = idx;
      break;
    }
  }
  const title = texts[titleIdx];
  const rest = texts.filter((_, idx) => idx !== titleIdx);
  return { title, rest };
}

// Shape extracted text into the app-level ParsedSlide[] the rest of the
// system consumes. This is where title/bullet heuristics live.
export function toParsedSlides(extracted: ExtractedSlide[]): ParsedSlide[] {
  return extracted.map((slide) => {
    const texts = slide.blocks.map((b) => b.text).filter(Boolean);
    const { title, rest } = pickTitle(texts);
    return {
      id: uid("slide_"),
      index: slide.index,
      title,
      rawText: texts.join("\n"),
      bullets: rest,
      notes: slide.notes,
      imageRefCount: slide.imageRefCount,
      tableRefCount: slide.tableRefCount,
    };
  });
}

// One-shot: .pptx buffer -> ParsedSlide[].
export async function parsePptx(buffer: Buffer | ArrayBuffer): Promise<ParsedSlide[]> {
  const extracted = await extractSlides(buffer);
  return toParsedSlides(extracted);
}
