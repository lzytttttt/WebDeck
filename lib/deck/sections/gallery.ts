import type { GallerySection } from "@/types/deck";
import { registerSection } from "@/lib/deck/sectionRegistry";
import { GallerySection as GallerySectionComponent } from "@/components/deck/GallerySection";
import { esc } from "@/lib/deck/htmlUtils";

// eslint-disable-next-line — <img> is intentional for a static, framework-free file.
function img(url: string, alt: string, extra = ""): string {
  if (!url) return `<div class="img-empty">No image</div>`;
  return `<img src="${esc(url)}" alt="${esc(alt)}" loading="lazy" ${extra}/>`;
}

function create(): GallerySection {
  return {
    id: "",
    type: "gallery",
    sourceSlideIndexes: [],
    title: "Gallery",
    layout: "grid",
    images: [],
  };
}

function hasContent(s: GallerySection): boolean {
  return s.images.length > 0;
}

function renderStatic(section: GallerySection): string {
  const layout = section.layout ?? "grid";
  const cls =
    layout === "carousel"
      ? "gallery-carousel"
      : layout === "masonry"
        ? "gallery-masonry"
        : "gallery-grid";
  if (!section.images.length) {
    return `<section class="block"><h2>${esc(section.title)}</h2><div class="img-empty">暂无图片</div></section>`;
  }
  const tiles = section.images
    .map(
      (im) =>
        `<figure class="gallery-item">${img(im.url, im.alt ?? "")}${
          im.caption ? `<figcaption class="img-cap">${esc(im.caption)}</figcaption>` : ""
        }</figure>`,
    )
    .join("");
  return `<section class="block"><h2>${esc(section.title)}</h2><div class="${cls}">${tiles}</div></section>`;
}

registerSection({
  type: "gallery",
  label: "Gallery",
  create,
  Component: GallerySectionComponent,
  renderStatic,
  hasContent,
  schemaHint:
    "gallery: { id, type:\"gallery\", sourceSlideIndexes, title, images:{url,alt?,caption?}[], layout?, summary? }",
});

export { GallerySectionComponent as Component, create, hasContent, renderStatic };
