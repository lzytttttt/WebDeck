import { XMLParser } from "fast-xml-parser";
import type { SlideTextBlock } from "./types";

// fast-xml-parser config: preserve order isn't needed, but we must keep
// text nodes and traverse arbitrary namespaced tags (a:p, a:r, a:t).
const parser = new XMLParser({
  ignoreAttributes: true,
  removeNSPrefix: true, // strip "a:" / "p:" so we can match on local names
  parseTagValue: false,
  trimValues: true,
});

// Recursively collect every string found under <t> text nodes, grouped by
// their nearest <p> (paragraph) ancestor so we can reconstruct bullets.
function collectParagraphs(node: unknown, out: string[][], current: string[]): void {
  if (node == null) return;

  if (typeof node === "string") {
    const trimmed = node.trim();
    if (trimmed) current.push(trimmed);
    return;
  }

  if (Array.isArray(node)) {
    for (const child of node) collectParagraphs(child, out, current);
    return;
  }

  if (typeof node === "object") {
    const obj = node as Record<string, unknown>;
    for (const [key, value] of Object.entries(obj)) {
      if (key === "p") {
        // Each paragraph gets a fresh run buffer.
        const paras = Array.isArray(value) ? value : [value];
        for (const para of paras) {
          const buf: string[] = [];
          collectParagraphs(para, out, buf);
          if (buf.length) out.push(buf);
        }
      } else if (key === "t") {
        const texts = Array.isArray(value) ? value : [value];
        for (const t of texts) {
          if (typeof t === "string") {
            const trimmed = t.trim();
            if (trimmed) current.push(trimmed);
          }
        }
      } else {
        collectParagraphs(value, out, current);
      }
    }
  }
}

// Parse a single slide (or notes) XML string into ordered text blocks.
// One block == one paragraph, with its runs joined.
export function extractSlideText(xml: string): SlideTextBlock[] {
  const doc = parser.parse(xml);
  const paragraphs: string[][] = [];
  collectParagraphs(doc, paragraphs, []);

  const blocks: SlideTextBlock[] = [];
  for (const runs of paragraphs) {
    const text = runs.join(" ").replace(/\s+/g, " ").trim();
    if (text) blocks.push({ text, runCount: runs.length });
  }
  return blocks;
}

// Notes slides wrap text the same way; extract and join to a single string.
export function extractNotesText(xml: string): string {
  const blocks = extractSlideText(xml);
  return blocks.map((b) => b.text).join("\n").trim();
}

// Count embedded-media references in raw slide XML. `<p:pic>` (pictures) and
// `<a:blip>` (image fills) are the reliable image markers; `<a:tbl>` marks a
// table. Prefixes are intact in the raw string (we regex before parsing), so
// we tolerate any namespace with a `:pic` / `blip` / `:tbl` local name.
export function countImageRefs(xml: string): number {
  const pics = xml.match(/<[a-z]*:?pic\b/gi)?.length ?? 0;
  const blips = xml.match(/<[a-z]*:?blip\b/gi)?.length ?? 0;
  return Math.max(pics, blips);
}

export function countTableRefs(xml: string): number {
  return xml.match(/<[a-z]*:?tbl\b/gi)?.length ?? 0;
}
