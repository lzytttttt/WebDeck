"use client";

import type { WebDeck, DeckSection, DeckTheme } from "@/types/deck";
import { HeroSection } from "./HeroSection";
import { AgendaSection } from "./AgendaSection";
import { SlideLikeSection } from "./SlideLikeSection";
import { CardsSection } from "./CardsSection";
import { TimelineSection } from "./TimelineSection";
import { ComparisonSection } from "./ComparisonSection";
import { FAQSection } from "./FAQSection";
import { QuoteSection } from "./QuoteSection";
import { CTASection } from "./CTASection";
import { ImageSection } from "./ImageSection";
import { GallerySection } from "./GallerySection";
import { ChartSection } from "./ChartSection";
import { EditProvider, useMaybeEdit, type EditContextValue } from "./EditContext";
import { themeToCssVars } from "@/lib/deck/theme";
import { cn } from "@/lib/utils";

export function SectionSwitch({ section }: { section: DeckSection }) {
  switch (section.type) {
    case "hero":
      return <HeroSection section={section} />;
    case "agenda":
      return <AgendaSection section={section} />;
    case "slide":
      return <SlideLikeSection section={section} />;
    case "cards":
      return <CardsSection section={section} />;
    case "timeline":
      return <TimelineSection section={section} />;
    case "comparison":
      return <ComparisonSection section={section} />;
    case "faq":
      return <FAQSection section={section} />;
    case "quote":
      return <QuoteSection section={section} />;
    case "cta":
      return <CTASection section={section} />;
    case "image":
      return <ImageSection section={section} />;
    case "gallery":
      return <GallerySection section={section} />;
    case "chart":
      return <ChartSection section={section} />;
    default:
      return null;
  }
}

// Resolve the CSS animation class for a section given deck + section motion.
export function sectionMotionClass(deck: WebDeck, section: DeckSection): string {
  const own = section.motion?.preset;
  const preset =
    own && own !== "inherit"
      ? own
      : deck.motion.preset === "stagger"
        ? "slide-up"
        : deck.motion.preset;
  if (preset === "slide-up") return "deck-anim-slide-up";
  if (preset === "scale") return "deck-anim-scale";
  if (preset === "fade") return "deck-anim-fade";
  return "";
}

function SectionWrapper({
  deck,
  section,
  index,
  conservative,
}: {
  deck: WebDeck;
  section: DeckSection;
  index: number;
  conservative: boolean;
}) {
  const edit = useMaybeEdit();
  const selected = edit?.selectedId === section.id;
  const animClass = deck.motion.preset === "none" ? "" : sectionMotionClass(deck, section);
  // Stagger: cascade the per-section delay when the deck preset is stagger.
  const delayStyle =
    deck.motion.preset === "stagger"
      ? ({ "--deck-anim-delay": `${Math.min(index, 8) * 0.08}s` } as React.CSSProperties)
      : undefined;

  return (
    <section
      id={`section-${section.id}`}
      data-source-slides={section.sourceSlideIndexes.join(",")}
      onClick={edit?.editable ? () => edit.select(section.id) : undefined}
      className={cn(
        "scroll-mt-4 deck-section relative transition-shadow",
        animClass,
        conservative && "mx-auto my-6 max-w-4xl deck-card overflow-hidden",
        edit?.editable && "cursor-pointer",
        selected && "ring-2 ring-offset-2",
      )}
      style={{
        ...delayStyle,
        ...(selected ? { boxShadow: "0 0 0 2px var(--deck-accent)" } : {}),
      }}
    >
      <SectionSwitch section={section} />
    </section>
  );
}

// Renders the whole deck. In conservative mode each section is boxed like a
// discrete "page"; in enhanced mode sections flow into a continuous scroll.
// When an EditProvider is present above, sections become selectable/editable.
export function DeckRenderer({
  deck,
  className,
}: {
  deck: WebDeck;
  className?: string;
}) {
  const conservative = deck.mode === "conservative";
  return (
    <div
      className={cn("deck-root w-full", className)}
      style={themeToCssVars(deck.theme) as React.CSSProperties}
    >
      {deck.sections.map((section, i) => (
        <SectionWrapper
          key={section.id}
          deck={deck}
          section={section}
          index={i}
          conservative={conservative}
        />
      ))}
    </div>
  );
}

// Editor-facing wrapper: supplies the EditProvider + theme so the same
// DeckRenderer becomes an interactive canvas.
export function EditableDeck({
  deck,
  editValue,
  className,
}: {
  deck: WebDeck;
  editValue: Omit<EditContextValue, "theme">;
  className?: string;
}) {
  const value: EditContextValue = { ...editValue, theme: deck.theme };
  return (
    <EditProvider value={value}>
      <DeckRenderer deck={deck} className={className} />
    </EditProvider>
  );
}

export type { DeckTheme };
