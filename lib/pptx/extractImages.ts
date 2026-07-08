/**
 * PPTX image extraction: maps slide XML blip references to actual media
 * files inside the PPTX ZIP, converts them to base64 data URIs, and
 * optionally compresses oversized images.
 */
import JSZip from "jszip";
import type { ExtractedImage } from "./types";

// Allowed MIME types. EMF/WMF are Windows-only vector formats that browsers
// cannot render, so we silently skip them.
const ALLOWED_MIME: Record<string, string> = {
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  gif: "image/gif",
  svg: "image/svg+xml",
  webp: "image/webp",
};

const BLOCKED_EXTENSIONS = new Set(["emf", "wmf", "tiff", "tif", "bmp"]);

// Max raw size (bytes) before we attempt compression.
const COMPRESS_THRESHOLD = 500 * 1024; // 500 KB
const MAX_DIMENSION = 1200; // px

function extFromPath(p: string): string {
  const dot = p.lastIndexOf(".");
  return dot >= 0 ? p.slice(dot + 1).toLowerCase() : "";
}

function mimeForPath(p: string): string | null {
  const ext = extFromPath(p);
  if (BLOCKED_EXTENSIONS.has(ext)) return null;
  return ALLOWED_MIME[ext] ?? null;
}

/**
 * Parse slideN.xml.rels to build a map from rId → media path.
 *
 * A typical rels entry looks like:
 *   <Relationship Id="rId2" Type="...image" Target="../media/image1.png"/>
 *
 * The Target is relative to the *part* (the slide file), not the rels file.
 * Since the rels file is at ppt/slides/_rels/slideN.xml.rels, the part
 * directory is ppt/slides/, so ../media/image1.png → ppt/media/image1.png.
 */
function parseRels(xml: string, slidePath: string): Map<string, string> {
  const map = new Map<string, string>();
  // The part directory: ppt/slides/slide1.xml → ppt/slides
  const partDir = slidePath.replace(/\/[^/]+$/, "");

  // Simple regex is fine — rels XML is small and well-structured.
  const re =
    /Id="([^"]+)"[^>]*Type="[^"]*image[^"]*"[^>]*Target="([^"]+)"/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(xml)) !== null) {
    const rId = m[1];
    const target = m[2].replace(/\\/g, "/"); // normalise backslashes

    // Resolve relative path from the part directory.
    // ../media/image1.png from ppt/slides/ → ppt/media/image1.png
    let resolved: string;
    if (target.startsWith("../")) {
      // Go up one level from partDir
      const parentDir = partDir.replace(/\/[^/]+$/, "");
      resolved = parentDir + "/" + target.slice(3);
    } else if (target.startsWith("/")) {
      resolved = target.slice(1); // absolute within the ZIP
    } else {
      resolved = partDir + "/" + target;
    }

    map.set(rId, resolved);
  }
  return map;
}

/**
 * Extract r:embed attributes from the slide XML (the blip references that
 * point to images via the rels file).
 */
function extractEmbedIds(xml: string): Set<string> {
  const ids = new Set<string>();
  // Match r:embed="rIdN" or embed="rIdN" (namespace-stripped)
  const re = /(?:r:)?embed="([^"]+)"/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(xml)) !== null) {
    ids.add(m[1]);
  }
  return ids;
}

/**
 * Try to compress/resize a PNG or JPEG image if it exceeds the threshold.
 * Returns the original buffer unchanged on failure or for unsupported formats.
 */
async function maybeCompress(
  buf: ArrayBuffer,
  mime: string
): Promise<{ buffer: Buffer; width?: number; height?: number }> {
  if (buf.byteLength <= COMPRESS_THRESHOLD) {
    return { buffer: Buffer.from(buf) };
  }

  // Only compress PNG and JPEG (sharp handles both well).
  if (mime !== "image/png" && mime !== "image/jpeg") {
    return { buffer: Buffer.from(buf) };
  }

  try {
    // Dynamic import so tests can run without sharp installed.
    const sharp = (await import("sharp")).default;
    const image = sharp(Buffer.from(buf));
    const metadata = await image.metadata();
    const needsResize =
      (metadata.width && metadata.width > MAX_DIMENSION) ||
      (metadata.height && metadata.height > MAX_DIMENSION);

    let pipeline = image;
    if (needsResize) {
      pipeline = pipeline.resize({
        width: MAX_DIMENSION,
        height: MAX_DIMENSION,
        fit: "inside",
        withoutEnlargement: true,
      });
    }

    if (mime === "image/png") {
      pipeline = pipeline.png({ quality: 80, compressionLevel: 9 });
    } else {
      pipeline = pipeline.jpeg({ quality: 80 });
    }

    const out = await pipeline.toBuffer({ resolveWithObject: true });
    return {
      buffer: out.data,
      width: out.info.width,
      height: out.info.height,
    };
  } catch {
    // If sharp fails (e.g. corrupt image), return the original.
    return { buffer: Buffer.from(buf) };
  }
}

/**
 * Extract images from a PPTX ZIP that are referenced by a specific slide.
 *
 * @param zip      The loaded JSZip instance
 * @param slideXml The raw XML of the slide (to find r:embed references)
 * @param slideNum The 1-based slide number (to locate the .rels file)
 * @returns        Array of extracted images as base64 data URIs
 */
export async function extractSlideImages(
  zip: JSZip,
  slideXml: string,
  slideNum: number
): Promise<ExtractedImage[]> {
  // 1. Find which rIds this slide references.
  const embedIds = extractEmbedIds(slideXml);
  if (embedIds.size === 0) return [];

  // 2. Parse the slide's rels file.
  const relsPath = `ppt/slides/_rels/slide${slideNum}.xml.rels`;
  const slidePath = `ppt/slides/slide${slideNum}.xml`;
  const relsFile = zip.file(relsPath);
  if (!relsFile) return [];

  const relsXml = await relsFile.async("string");
  const rIdToMedia = parseRels(relsXml, slidePath);
  if (rIdToMedia.size === 0) return [];

  // 3. For each referenced rId, locate the media file and convert to base64.
  const images: ExtractedImage[] = [];
  const seen = new Set<string>(); // deduplicate by media path

  for (const rId of embedIds) {
    const mediaPath = rIdToMedia.get(rId);
    if (!mediaPath || seen.has(mediaPath)) continue;

    const mime = mimeForPath(mediaPath);
    if (!mime) continue; // skip EMF/WMF/etc.

    const mediaFile = zip.file(mediaPath);
    if (!mediaFile) continue;

    seen.add(mediaPath);
    const rawBuf = await mediaFile.async("arraybuffer");

    // Optionally compress large images.
    const { buffer, width, height } = await maybeCompress(rawBuf, mime);

    const base64 = buffer.toString("base64");
    const dataUri = `data:${mime};base64,${base64}`;

    const fileName = mediaPath.split("/").pop() ?? mediaPath;
    images.push({
      data: dataUri,
      mimeType: mime,
      fileName,
      width,
      height,
    });
  }

  return images;
}

/**
 * Extract ALL images from the PPTX ZIP (from ppt/media/*).
 * Useful for providing a complete media library to the editor.
 */
export async function extractAllMedia(zip: JSZip): Promise<ExtractedImage[]> {
  const mediaPaths = Object.keys(zip.files).filter((p) =>
    /^ppt\/media\/[^/]+$/.test(p)
  );

  const images: ExtractedImage[] = [];

  for (const mediaPath of mediaPaths) {
    const mime = mimeForPath(mediaPath);
    if (!mime) continue;

    const file = zip.file(mediaPath);
    if (!file) continue;

    const rawBuf = await file.async("arraybuffer");
    const { buffer, width, height } = await maybeCompress(rawBuf, mime);
    const base64 = buffer.toString("base64");
    const dataUri = `data:${mime};base64,${base64}`;
    const fileName = mediaPath.split("/").pop() ?? mediaPath;

    images.push({
      data: dataUri,
      mimeType: mime,
      fileName,
      width,
      height,
    });
  }

  return images;
}
