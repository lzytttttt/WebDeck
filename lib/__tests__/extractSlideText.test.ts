import { describe, it, expect } from "vitest";
import {
  extractSlideText,
  extractNotesText,
  countImageRefs,
  countTableRefs,
} from "@/lib/pptx/extractSlideText";

// ---------------------------------------------------------------------------
// Minimal XML fixtures (PPTX slide XML snippets)
// ---------------------------------------------------------------------------

const simpleXml = `<?xml version="1.0"?>
<p:sld xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main"
       xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main">
  <p:cSld>
    <p:spTree>
      <p:sp>
        <p:txBody>
          <a:p><a:r><a:t>Hello World</a:t></a:r></a:p>
          <a:p><a:r><a:t>Second paragraph</a:t></a:r></a:p>
        </p:txBody>
      </p:sp>
    </p:spTree>
  </p:cSld>
</p:sld>`;

const multiRunXml = `<?xml version="1.0"?>
<p:sld xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main"
       xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main">
  <p:cSld>
    <p:spTree>
      <p:sp>
        <p:txBody>
          <a:p>
            <a:r><a:t>Part A</a:t></a:r>
            <a:r><a:t>Part B</a:t></a:r>
          </a:p>
        </p:txBody>
      </p:sp>
    </p:spTree>
  </p:cSld>
</p:sld>`;

const imageXml = `<p:sld xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main">
  <p:pic><p:nvPicPr/></p:pic>
  <a:blip/>
  <a:blip/>
</p:sld>`;

const tableXml = `<p:sld><a:tbl><a:tbl/></a:tbl></p:sld>`;

const emptyXml = `<?xml version="1.0"?>
<p:sld xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main"
       xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main">
  <p:cSld><p:spTree></p:spTree></p:cSld>
</p:sld>`;

// ---------------------------------------------------------------------------
// extractSlideText
// ---------------------------------------------------------------------------

describe("extractSlideText", () => {
  it("extracts paragraphs from simple XML", () => {
    const blocks = extractSlideText(simpleXml);
    expect(blocks).toHaveLength(2);
    expect(blocks[0].text).toBe("Hello World");
    expect(blocks[1].text).toBe("Second paragraph");
  });

  it("joins multiple runs within a paragraph", () => {
    const blocks = extractSlideText(multiRunXml);
    expect(blocks).toHaveLength(1);
    expect(blocks[0].text).toBe("Part A Part B");
    expect(blocks[0].runCount).toBe(2);
  });

  it("returns empty array for empty slide", () => {
    const blocks = extractSlideText(emptyXml);
    expect(blocks).toEqual([]);
  });

  it("handles XML with only whitespace text nodes", () => {
    const xml = `<p:sld xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main">
      <a:p><a:r><a:t>   </a:t></a:r></a:p>
    </p:sld>`;
    const blocks = extractSlideText(xml);
    expect(blocks).toHaveLength(0);
  });

  it("trims and normalizes whitespace", () => {
    const xml = `<p:sld xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main">
      <a:p><a:r><a:t>  Hello   World  </a:t></a:r></a:p>
    </p:sld>`;
    const blocks = extractSlideText(xml);
    expect(blocks[0].text).toBe("Hello World");
  });
});

// ---------------------------------------------------------------------------
// extractNotesText
// ---------------------------------------------------------------------------

describe("extractNotesText", () => {
  it("joins paragraphs with newlines", () => {
    const result = extractNotesText(simpleXml);
    expect(result).toBe("Hello World\nSecond paragraph");
  });

  it("returns empty string for empty slide", () => {
    expect(extractNotesText(emptyXml)).toBe("");
  });

  it("trims trailing newlines", () => {
    const result = extractNotesText(simpleXml);
    expect(result).not.toMatch(/\n$/);
  });
});

// ---------------------------------------------------------------------------
// countImageRefs
// ---------------------------------------------------------------------------

describe("countImageRefs", () => {
  it("counts p:pic and a:blip references, returns max", () => {
    expect(countImageRefs(imageXml)).toBe(2); // 1 pic, 2 blips -> max 2
  });

  it("returns 0 for XML with no images", () => {
    expect(countImageRefs(simpleXml)).toBe(0);
  });

  it("handles namespaced variations", () => {
    const xml = `<p:pic/><p:pic/><a:blip/>`;
    expect(countImageRefs(xml)).toBe(2);
  });
});

// ---------------------------------------------------------------------------
// countTableRefs
// ---------------------------------------------------------------------------

describe("countTableRefs", () => {
  it("counts tbl references", () => {
    expect(countTableRefs(tableXml)).toBe(2);
  });

  it("returns 0 for XML with no tables", () => {
    expect(countTableRefs(simpleXml)).toBe(0);
  });
});
