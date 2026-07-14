import type { ImageSection } from "@/types/deck";
import { registerSection } from "@/lib/deck/sectionRegistry";
import { ImageSection as ImageSectionComponent } from "@/components/deck/ImageSection";
import { esc } from "@/lib/deck/htmlUtils";

// eslint-disable-next-line @next/next/no-img-element -- <img> is intentional for a static, framework-free file.
function img(url: string, alt: string, extra = ""): string {
  if (!url) return `<div class="img-empty">No image</div>`;
  return `<img src="${esc(url)}" alt="${esc(alt)}" loading="lazy" ${extra}/>`;
}

function create(): ImageSection {
  return {
    id: "",
    type: "image",
    sourceSlideIndexes: [],
    title: "Image",
    layout: "full-width",
    image: { url: "", alt: "" },
    content: { title: "", description: "" },
  };
}

function hasContent(s: ImageSection): boolean {
  return Boolean(s.image?.url);
}

function renderStatic(section: ImageSection): string {
  const layout = section.layout ?? "full-width";
  const alt = section.image.alt ?? section.title ?? "";
  const caption = section.image.caption
    ? `<figcaption class="img-cap">${esc(section.image.caption)}</figcaption>`
    : "";
  const fp = section.image.focalPoint;
  const pos = fp ? ` style="object-position:${fp.x * 100}% ${fp.y * 100}%"` : "";
  const picture = `<figure class="img-figure">${img(
    section.image.url,
    alt,
    pos,
  )}${caption}</figure>`;
  const text =
    section.content?.title || section.content?.description
      ? `<div class="img-text">${
          section.content?.title ? `<h2>${esc(section.content.title)}</h2>` : ""
        }${
          section.content?.description
            ? `<p>${esc(section.content.description)}</p>`
            : ""
        }</div>`
      : "";
  if (layout === "split-left") {
    return `<section class="block img-split">${picture}${text}</section>`;
  }
  if (layout === "split-right") {
    return `<section class="block img-split">${text}${picture}</section>`;
  }
  const framed = layout === "framed" ? " img-framed" : "";
  return `<section class="block img-full${framed}">${picture}${text}</section>`;
}

registerSection({
  type: "image",
  label: "Image",
  create,
  Component: ImageSectionComponent,
  renderStatic,
  hasContent,
  schemaHint:
    "image: { id, type:\"image\", sourceSlideIndexes, title, image:{url,alt?,caption?,focalPoint?}, content?:{title?,description?}, layout?, summary? }",
});

export { ImageSectionComponent as Component, create, hasContent, renderStatic };
