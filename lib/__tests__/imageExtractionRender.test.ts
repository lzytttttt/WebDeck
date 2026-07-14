import { describe, it, expect } from "vitest";
import JSZip from "jszip";
import { extractSlideImages } from "@/lib/pptx/extractImages";
import { renderStatic as renderImage } from "@/lib/deck/sections/image";
import { renderStatic as renderGallery } from "@/lib/deck/sections/gallery";
import type { ImageSection, GallerySection } from "@/types/deck";

// 1x1 transparent PNG (valid base64 image bytes for extraction tests).
const TINY_PNG_B64 =
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+M8AAAMBAQAY3Y2wAAAAAElFTkSuQmCC";

function tinyPng(): Uint8Array {
  return Uint8Array.from(Buffer.from(TINY_PNG_B64, "base64"));
}

// Build a minimal PPTX-like ZIP with two media files and a rels mapping rIds
// to those media files (mirroring how parsePptx invokes extractSlideImages).
function buildZip(): JSZip {
  const zip = new JSZip();
  zip.file("ppt/media/image1.png", tinyPng());
  zip.file("ppt/media/image2.jpg", tinyPng());
  zip.file(
    "ppt/slides/_rels/slide1.xml.rels",
    `<Relationships>` +
      `<Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="../media/image1.png"/>` +
      `<Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="../media/image2.jpg"/>` +
      `</Relationships>`,
  );
  return zip;
}

const SLIDE_XML =
  `<xml><pic><blip r:embed="rId2"/></pic><pic><blip r:embed="rId3"/></pic></xml>`;

describe("image extraction → render pipeline (P2.1 end-to-end)", () => {
  it("renders an extracted base64 image inside an ImageSection", async () => {
    const zip = buildZip();
    const images = await extractSlideImages(zip, SLIDE_XML, 1);
    expect(images.length).toBeGreaterThanOrEqual(1);
    expect(images[0].data).toMatch(/^data:image\/png;base64,/);

    const section: ImageSection = {
      id: "i1",
      type: "image",
      sourceSlideIndexes: [],
      title: "Extracted shot",
      layout: "full-width",
      image: { url: images[0].data, alt: "extracted" },
      content: { title: "", description: "" },
    };
    const html = renderImage(section);
    expect(html).toContain(`src="${images[0].data}"`);
  });

  it("renders multiple extracted images inside a GallerySection", async () => {
    const zip = buildZip();
    const images = await extractSlideImages(zip, SLIDE_XML, 1);
    expect(images.length).toBe(2);

    const section: GallerySection = {
      id: "g1",
      type: "gallery",
      sourceSlideIndexes: [],
      title: "Extracted gallery",
      layout: "grid",
      images: images.map((im) => ({ url: im.data, alt: "extracted" })),
    };
    const html = renderGallery(section);
    for (const im of images) {
      expect(html).toContain(`src="${im.data}"`);
    }
  });
});
