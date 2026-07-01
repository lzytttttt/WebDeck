"use client";

import type { ImageSection as ImageSectionType } from "@/types/deck";
import { InlineText, useMaybeEdit } from "./EditContext";
import { cn } from "@/lib/utils";

export function ImageSection({ section }: { section: ImageSectionType }) {
  const edit = useMaybeEdit();
  const editable = edit?.editable ?? false;
  const layout = section.layout ?? "full-width";

  const patch = (next: Partial<ImageSectionType>) =>
    edit?.updateSection({ ...section, ...next });

  const { url, alt, caption, focalPoint } = section.image;
  const objectPosition = focalPoint
    ? `${focalPoint.x * 100}% ${focalPoint.y * 100}%`
    : undefined;

  const setImage = (next: Partial<ImageSectionType["image"]>) =>
    patch({ image: { ...section.image, ...next } });
  const setContent = (next: Partial<NonNullable<ImageSectionType["content"]>>) =>
    patch({ content: { ...section.content, ...next } });

  const placeholder = (
    <div className="flex aspect-video w-full items-center justify-center border-2 border-dashed deck-border deck-radius deck-muted text-sm">
      No image — add one from the Media panel
    </div>
  );

  const img = url ? (
    <>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={url}
        alt={alt ?? ""}
        style={objectPosition ? { objectPosition } : undefined}
        className="h-full w-full object-cover deck-radius"
      />
    </>
  ) : (
    placeholder
  );

  const captionEl =
    caption || editable ? (
      <InlineText
        as="p"
        editable={editable}
        value={caption ?? ""}
        placeholder="Add a caption"
        onChange={(v) => setImage({ caption: v })}
        className="mt-3 text-center text-sm deck-muted"
      />
    ) : null;

  const contentTitle =
    section.content?.title || editable ? (
      <InlineText
        as="h2"
        editable={editable}
        value={section.content?.title ?? ""}
        placeholder="Heading"
        onChange={(v) => setContent({ title: v })}
        className="deck-heading text-2xl font-bold"
      />
    ) : null;

  const contentDescription =
    section.content?.description || editable ? (
      <InlineText
        as="p"
        editable={editable}
        value={section.content?.description ?? ""}
        placeholder="Description"
        onChange={(v) => setContent({ description: v })}
        className="mt-3 deck-muted"
      />
    ) : null;

  if (layout === "split-left" || layout === "split-right") {
    const imageBlock = (
      <div key="image" className="overflow-hidden deck-radius">
        {img}
      </div>
    );
    const contentBlock = (
      <div key="content" className="flex flex-col justify-center">
        {contentTitle}
        {contentDescription}
      </div>
    );
    const order =
      layout === "split-left"
        ? [imageBlock, contentBlock]
        : [contentBlock, imageBlock];
    return (
      <div className="mx-auto max-w-5xl px-6 py-8">
        <div className="grid items-center gap-8 md:grid-cols-2">{order}</div>
      </div>
    );
  }

  if (layout === "framed") {
    return (
      <div className="mx-auto max-w-4xl px-6 py-8">
        <div className="deck-card mx-auto p-4">
          <div className="overflow-hidden deck-radius">{img}</div>
        </div>
        {captionEl}
      </div>
    );
  }

  // full-width
  return (
    <div className={cn("mx-auto max-w-5xl px-6 py-8")}>
      <div className="overflow-hidden deck-radius">{img}</div>
      {captionEl}
      {contentTitle || contentDescription ? (
        <div className="mt-6">
          {contentTitle}
          {contentDescription}
        </div>
      ) : null}
    </div>
  );
}
