"use client";

import type { HeroSection as HeroSectionType } from "@/types/deck";
import { InlineText, useMaybeEdit } from "./EditContext";
import { cn } from "@/lib/utils";

export function HeroSection({ section }: { section: HeroSectionType }) {
  const edit = useMaybeEdit();
  const editable = edit?.editable ?? false;
  const layout = section.layout ?? "centered";

  // Patch one field of the section through the edit context.
  const patch = (next: Partial<HeroSectionType>) =>
    edit?.updateSection({ ...section, ...next });

  const hasBg = layout === "background" && section.background?.url;
  const split = layout === "split";

  const eyebrow =
    section.eyebrow || editable ? (
      <div className="mb-4 text-sm font-semibold uppercase tracking-widest deck-accent">
        <InlineText
          editable={editable}
          value={section.eyebrow ?? ""}
          placeholder="Eyebrow"
          onChange={(v) => patch({ eyebrow: v })}
        />
      </div>
    ) : null;

  const heading = (
    <InlineText
      as="h1"
      editable={editable}
      value={section.title}
      placeholder="Hero title"
      onChange={(v) => patch({ title: v })}
      className="deck-heading text-4xl font-bold leading-tight sm:text-5xl"
    />
  );

  const subtitle =
    section.subtitle || editable ? (
      <InlineText
        as="p"
        editable={editable}
        value={section.subtitle ?? ""}
        placeholder="Subtitle"
        onChange={(v) => patch({ subtitle: v })}
        className="mt-5 max-w-2xl text-lg deck-muted"
      />
    ) : null;

  const cta =
    section.ctaLabel || editable ? (
      <div className="mt-8">
        <span className="inline-flex items-center rounded-lg deck-bg-accent px-6 py-3 font-semibold deck-radius">
          <InlineText
            editable={editable}
            value={section.ctaLabel ?? ""}
            placeholder="CTA"
            onChange={(v) => patch({ ctaLabel: v })}
          />
        </span>
      </div>
    ) : null;

  const metrics =
    layout === "metrics" && section.metrics?.length ? (
      <div className="mx-auto mt-10 grid max-w-3xl grid-cols-2 gap-6 sm:grid-cols-4">
        {section.metrics.map((m, i) => (
          <div key={i} className="text-center">
            <div className="text-3xl font-bold deck-accent">{m.value}</div>
            <div className="mt-1 text-sm deck-muted">{m.label}</div>
          </div>
        ))}
      </div>
    ) : null;

  if (split) {
    return (
      <div className="mx-auto grid max-w-5xl items-center gap-10 px-6 py-16 md:grid-cols-2">
        <div>
          {eyebrow}
          {heading}
          {subtitle}
          {cta}
        </div>
        <div className="deck-card aspect-[4/3] overflow-hidden">
          {section.background?.url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={section.background.url}
              alt=""
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full items-center justify-center deck-muted text-sm">
              Split image
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "relative px-6 py-20 text-center",
        hasBg && "overflow-hidden",
      )}
      style={
        hasBg
          ? {
              backgroundImage: `linear-gradient(rgba(0,0,0,0.45),rgba(0,0,0,0.45)), url(${section.background!.url})`,
              backgroundSize: "cover",
              backgroundPosition: "center",
              color: "#fff",
            }
          : undefined
      }
    >
      <div className={cn("mx-auto max-w-3xl", hasBg && "text-white [&_*]:!text-white")}>
        {eyebrow}
        {heading}
        {subtitle}
        {metrics}
        {cta}
      </div>
    </div>
  );
}
