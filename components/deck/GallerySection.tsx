"use client";

import type {
  GallerySection as GallerySectionType,
  GalleryImage,
} from "@/types/deck";
import { InlineText, useMaybeEdit } from "./EditContext";

export function GallerySection({ section }: { section: GallerySectionType }) {
  const edit = useMaybeEdit();
  const editable = edit?.editable ?? false;
  const layout = section.layout ?? "grid";

  const patch = (next: Partial<GallerySectionType>) =>
    edit?.updateSection({ ...section, ...next });

  const setCaption = (i: number, v: string) => {
    const images = section.images.map((img, j) =>
      j === i ? { ...img, caption: v } : img,
    );
    patch({ images });
  };

  const title =
    section.title || editable ? (
      <InlineText
        as="h2"
        editable={editable}
        value={section.title}
        placeholder="Gallery title"
        onChange={(v) => patch({ title: v })}
        className="deck-heading mb-6 text-2xl font-bold"
      />
    ) : null;

  const tile = (img: GalleryImage, i: number) => {
    const media = img.url ? (
      <>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={img.url}
          alt={img.alt ?? ""}
          className="h-full w-full object-cover deck-radius"
        />
      </>
    ) : (
      <div className="flex aspect-video w-full items-center justify-center border-2 border-dashed deck-border deck-radius deck-muted text-xs">
        No image
      </div>
    );

    const caption =
      img.caption || editable ? (
        <InlineText
          as="p"
          editable={editable}
          value={img.caption ?? ""}
          placeholder="Caption"
          onChange={(v) => setCaption(i, v)}
          className="mt-2 text-sm deck-muted"
        />
      ) : null;

    return { media, caption };
  };

  if (!section.images.length) {
    return (
      <div className="mx-auto max-w-5xl px-6 py-8">
        {title}
        <p className="deck-muted">No images yet</p>
      </div>
    );
  }

  if (layout === "carousel") {
    return (
      <div className="mx-auto max-w-6xl px-6 py-8">
        {title}
        <div className="flex gap-4 overflow-x-auto pb-2">
          {section.images.map((img, i) => {
            const { media, caption } = tile(img, i);
            return (
              <div key={i} className="w-[280px] shrink-0">
                <div className="aspect-video overflow-hidden deck-radius">
                  {media}
                </div>
                {caption}
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  if (layout === "masonry") {
    return (
      <div className="mx-auto max-w-6xl px-6 py-8">
        {title}
        <div className="columns-2 gap-4 md:columns-3">
          {section.images.map((img, i) => {
            const { media, caption } = tile(img, i);
            return (
              <div key={i} className="mb-4 break-inside-avoid">
                <div className="overflow-hidden deck-radius">{media}</div>
                {caption}
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // grid
  return (
    <div className="mx-auto max-w-6xl px-6 py-8">
      {title}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {section.images.map((img, i) => {
          const { media, caption } = tile(img, i);
          return (
            <div key={i}>
              <div className="aspect-video overflow-hidden deck-radius">
                {media}
              </div>
              {caption}
            </div>
          );
        })}
      </div>
    </div>
  );
}
