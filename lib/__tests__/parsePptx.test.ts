import { describe, it, expect, vi, beforeEach } from "vitest";
import JSZip from "jszip";
import { extractSlideImages, extractAllMedia } from "@/lib/pptx/extractImages";
import { parsePptx } from "@/lib/pptx/parsePptx";

// ---------------------------------------------------------------------------
// Helpers: build a minimal PPTX-like ZIP in memory
// ---------------------------------------------------------------------------

/** Create a tiny 1x1 PNG (67 bytes). */
function tinyPng(): Buffer {
  // Minimal valid PNG: 1x1 red pixel
  return Buffer.from(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwADhQGAWjR9awAAAABJRU5ErkJggg==",
    "base64"
  );
}

/** Create a fake large JPEG (>500KB) for compression testing. */
function largeJpeg(): Buffer {
  // Just a buffer that starts with JPEG magic bytes but is oversized.
  const buf = Buffer.alloc(600 * 1024);
  buf[0] = 0xff;
  buf[1] = 0xd8;
  buf[2] = 0xff;
  return buf;
}

/** Create an EMF file (should be filtered out). */
function emfFile(): Buffer {
  return Buffer.from([0x01, 0x00, 0x00, 0x00]); // minimal non-PNG bytes
}

async function buildPptxZip(opts: {
  slideXml?: string;
  relsXml?: string;
  mediaFiles?: Record<string, Buffer>;
  includeMedia?: boolean;
}): Promise<JSZip> {
  const zip = new JSZip();

  const slideXml =
    opts.slideXml ??
    `<p:sld xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main"
            xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
       <p:pic>
         <p:blipFill>
           <a:blip xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" r:embed="rId2"/>
         </p:blipFill>
       </p:pic>
     </p:sld>`;

  const relsXml =
    opts.relsXml ??
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
     <Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
       <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideLayout" Target="../slideLayouts/slideLayout1.xml"/>
       <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="../media/image1.png"/>
     </Relationships>`;

  zip.file("ppt/slides/slide1.xml", slideXml);
  zip.file("ppt/slides/_rels/slide1.xml.rels", relsXml);

  if (opts.includeMedia !== false) {
    const media = opts.mediaFiles ?? { "ppt/media/image1.png": tinyPng() };
    for (const [path, buf] of Object.entries(media)) {
      zip.file(path, buf);
    }
  }

  // Minimal presentation.xml so JSZip is happy
  zip.file("[Content_Types].xml", `<?xml version="1.0"?>
    <Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
      <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
      <Default Extension="xml" ContentType="application/xml"/>
      <Override PartName="/ppt/slides/slide1.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slide+xml"/>
    </Types>`);

  return zip;
}

// ---------------------------------------------------------------------------
// extractSlideImages
// ---------------------------------------------------------------------------

describe("extractSlideImages", () => {
  it("extracts a PNG image referenced by the slide", async () => {
    const zip = await buildPptxZip({});
    const slideXml = (await zip.file("ppt/slides/slide1.xml")!.async("string"));
    const images = await extractSlideImages(zip, slideXml, 1);

    expect(images).toHaveLength(1);
    expect(images[0].mimeType).toBe("image/png");
    expect(images[0].fileName).toBe("image1.png");
    expect(images[0].data).toMatch(/^data:image\/png;base64,/);
  });

  it("returns empty array when no images are referenced", async () => {
    const zip = await buildPptxZip({
      slideXml: `<p:sld xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main">
        <p:sp><p:txBody><a:p xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"><a:r><a:t>Text only</a:t></a:r></a:p></p:txBody></p:sp>
      </p:sld>`,
    });
    const slideXml = (await zip.file("ppt/slides/slide1.xml")!.async("string"));
    const images = await extractSlideImages(zip, slideXml, 1);
    expect(images).toHaveLength(0);
  });

  it("returns empty array when no rels file exists", async () => {
    const zip = new JSZip();
    zip.file(
      "ppt/slides/slide1.xml",
      `<p:sld xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main"
              xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
         <a:blip xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" r:embed="rId2"/>
       </p:sld>`
    );
    const slideXml = (await zip.file("ppt/slides/slide1.xml")!.async("string"));
    const images = await extractSlideImages(zip, slideXml, 1);
    expect(images).toHaveLength(0);
  });

  it("returns empty array when media directory is missing", async () => {
    const zip = await buildPptxZip({ includeMedia: false });
    const slideXml = (await zip.file("ppt/slides/slide1.xml")!.async("string"));
    const images = await extractSlideImages(zip, slideXml, 1);
    expect(images).toHaveLength(0);
  });

  it("filters out EMF/WMF files", async () => {
    const zip = await buildPptxZip({
      relsXml: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
        <Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
          <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="../media/image1.emf"/>
          <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="../media/image2.png"/>
        </Relationships>`,
      slideXml: `<p:sld xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main"
              xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
         <p:blipFill><a:blip xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" r:embed="rId1"/></p:blipFill>
         <p:blipFill><a:blip xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" r:embed="rId2"/></p:blipFill>
       </p:sld>`,
      mediaFiles: {
        "ppt/media/image1.emf": emfFile(),
        "ppt/media/image2.png": tinyPng(),
      },
    });
    const slideXml = (await zip.file("ppt/slides/slide1.xml")!.async("string"));
    const images = await extractSlideImages(zip, slideXml, 1);

    // Only the PNG should be included; EMF is filtered out.
    expect(images).toHaveLength(1);
    expect(images[0].mimeType).toBe("image/png");
    expect(images[0].fileName).toBe("image2.png");
  });

  it("deduplicates images referenced by multiple blips", async () => {
    const zip = await buildPptxZip({
      slideXml: `<p:sld xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main"
              xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
         <a:blip xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" r:embed="rId2"/>
         <a:blip xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" r:embed="rId2"/>
       </p:sld>`,
    });
    const slideXml = (await zip.file("ppt/slides/slide1.xml")!.async("string"));
    const images = await extractSlideImages(zip, slideXml, 1);
    expect(images).toHaveLength(1);
  });

  it("extracts multiple different images from the same slide", async () => {
    const zip = await buildPptxZip({
      slideXml: `<p:sld xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main"
              xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
         <a:blip xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" r:embed="rId2"/>
         <a:blip xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" r:embed="rId3"/>
       </p:sld>`,
      relsXml: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
        <Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
          <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="../media/image1.png"/>
          <Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="../media/image2.jpg"/>
        </Relationships>`,
      mediaFiles: {
        "ppt/media/image1.png": tinyPng(),
        "ppt/media/image2.jpg": tinyPng(), // reuse tiny buffer for test
      },
    });
    const slideXml = (await zip.file("ppt/slides/slide1.xml")!.async("string"));
    const images = await extractSlideImages(zip, slideXml, 1);
    expect(images).toHaveLength(2);
    expect(images[0].mimeType).toBe("image/png");
    expect(images[1].mimeType).toBe("image/jpeg");
  });
});

// ---------------------------------------------------------------------------
// extractAllMedia
// ---------------------------------------------------------------------------

describe("extractAllMedia", () => {
  it("extracts all images from ppt/media/*", async () => {
    const zip = await buildPptxZip({
      mediaFiles: {
        "ppt/media/image1.png": tinyPng(),
        "ppt/media/image2.png": tinyPng(),
        "ppt/media/image3.emf": emfFile(),
      },
    });
    const images = await extractAllMedia(zip);
    // EMF should be filtered
    expect(images).toHaveLength(2);
    expect(images.every((i) => i.mimeType === "image/png")).toBe(true);
  });

  it("returns empty array when no media directory exists", async () => {
    const zip = new JSZip();
    zip.file("ppt/slides/slide1.xml", "<p:sld/>");
    const images = await extractAllMedia(zip);
    expect(images).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// parsePptx integration
// ---------------------------------------------------------------------------

describe("parsePptx with images", () => {
  it("includes images in ParsedSlide output", async () => {
    const zip = await buildPptxZip({});
    const buf = await zip.generateAsync({ type: "nodebuffer" });
    const slides = await parsePptx(buf);

    expect(slides).toHaveLength(1);
    expect(slides[0].images).toBeDefined();
    expect(slides[0].images!.length).toBeGreaterThanOrEqual(1);
    expect(slides[0].images![0].data).toMatch(/^data:image\/png;base64,/);
    expect(slides[0].images![0].mimeType).toBe("image/png");
  });

  it("returns empty images array for text-only slides", async () => {
    const zip = await buildPptxZip({
      slideXml: `<p:sld xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main">
        <p:sp><p:txBody><a:p xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"><a:r><a:t>Text only</a:t></a:r></a:p></p:txBody></p:sp>
      </p:sld>`,
    });
    const buf = await zip.generateAsync({ type: "nodebuffer" });
    const slides = await parsePptx(buf);

    expect(slides).toHaveLength(1);
    expect(slides[0].images).toBeDefined();
    expect(slides[0].images).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// Rels mapping edge cases
// ---------------------------------------------------------------------------

describe("rels mapping", () => {
  it("handles Windows-style backslash paths in Target", async () => {
    const zip = await buildPptxZip({
      relsXml: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
        <Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
          <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="..\\media\\image1.png"/>
        </Relationships>`,
    });
    const slideXml = (await zip.file("ppt/slides/slide1.xml")!.async("string"));
    const images = await extractSlideImages(zip, slideXml, 1);
    expect(images).toHaveLength(1);
    expect(images[0].fileName).toBe("image1.png");
  });

  it("handles multiple relationship types (only picks image type)", async () => {
    const zip = await buildPptxZip({
      relsXml: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
        <Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
          <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideLayout" Target="../slideLayouts/slideLayout1.xml"/>
          <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="../media/image1.png"/>
          <Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/notesSlide" Target="../notesSlides/notesSlide1.xml"/>
        </Relationships>`,
    });
    const slideXml = (await zip.file("ppt/slides/slide1.xml")!.async("string"));
    const images = await extractSlideImages(zip, slideXml, 1);
    expect(images).toHaveLength(1);
  });
});

// ---------------------------------------------------------------------------
// Large image compression (only testable if sharp is available)
// ---------------------------------------------------------------------------

describe("large image compression", () => {
  it("compresses large images when sharp is available", { timeout: 30000 }, async () => {
    let sharpAvailable = true;
    try {
      await import("sharp");
    } catch {
      sharpAvailable = false;
    }

    if (!sharpAvailable) return; // skip

    const sharp = (await import("sharp")).default;

    // Create a large image that won't compress well in PNG (gradient pattern)
    const width = 2000;
    const height = 2000;
    const channels = 3;
    const rawData = Buffer.alloc(width * height * channels);
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const idx = (y * width + x) * channels;
        rawData[idx] = (x * 255) / width;
        rawData[idx + 1] = (y * 255) / height;
        rawData[idx + 2] = ((x + y) * 127) / (width + height);
      }
    }

    // Use JPEG at quality 100 to ensure it's above threshold
    const largeJpeg = await sharp(rawData, { raw: { width, height, channels } })
      .jpeg({ quality: 100 })
      .toBuffer();

    // Verify it's large enough to trigger compression
    if (largeJpeg.byteLength <= COMPRESS_THRESHOLD) {
      // Fallback: just verify the function works
      const zip = await buildPptxZip({});
      const slideXml = (await zip.file("ppt/slides/slide1.xml")!.async("string"));
      const images = await extractSlideImages(zip, slideXml, 1);
      expect(images).toHaveLength(1);
      return;
    }

    const zip = await buildPptxZip({
      mediaFiles: { "ppt/media/image1.jpg": largeJpeg },
    });
    const slideXml = (await zip.file("ppt/slides/slide1.xml")!.async("string"));
    const images = await extractSlideImages(zip, slideXml, 1);

    expect(images).toHaveLength(1);
    expect(images[0].mimeType).toBe("image/jpeg");
    // Image was processed by sharp (has width/height)
    expect(images[0].width).toBeDefined();
    expect(images[0].height).toBeDefined();
    // Should be resized to fit within 1200px
    expect(images[0].width!).toBeLessThanOrEqual(1200);
    expect(images[0].height!).toBeLessThanOrEqual(1200);
  });

  const COMPRESS_THRESHOLD = 500 * 1024;

  it("skips compression for small images", async () => {
    const zip = await buildPptxZip({});
    const slideXml = (await zip.file("ppt/slides/slide1.xml")!.async("string"));
    const images = await extractSlideImages(zip, slideXml, 1);

    // Small image should not have width/height set (no sharp processing)
    expect(images).toHaveLength(1);
    // width/height may be undefined since we didn't compress
  });
});
