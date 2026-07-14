// Map raw PPTX animation hints onto Web Deck's Motion vocabulary.
//
// Pure + dependency-free so it can be unit-tested and reused by both the
// Mock provider (deterministic default) and the AI prompt builder. Input is
// the `transition`/`entrance` strings harvested by lib/pptx/extractAnimations.

import type {
  DeckMotion,
  MotionPreset,
  MotionTransition,
  SectionMotionPreset,
} from "@/types/deck";
import { DEFAULT_MOTION } from "@/types/deck";

export type PptxAnimationInput = {
  transition?: string;
  entrance?: string;
};

export type PptxAnimationMap = {
  deckMotion: DeckMotion;
  // Section motion presets, index-aligned to the input slides array.
  // "inherit" means "follow the deck-level preset".
  sectionMotions: SectionMotionPreset[];
};

// Map a PPTX slide-transition effect name to a MotionTransition.
function mapTransition(raw?: string): MotionTransition {
  if (!raw) return DEFAULT_MOTION.transition;
  const t = raw.toLowerCase();
  if (t === "none") return "none";
  if (t === "fade" || t === "dissolve") return "fade";
  if (
    t === "push" ||
    t === "wipe" ||
    t === "split" ||
    t === "cover" ||
    t === "uncover" ||
    t === "comb" ||
    t === "blinds" ||
    t === "checker" ||
    t === "randombar" ||
    t === "strip" ||
    t === "wheel" ||
    t === "circle" ||
    t === "diamond" ||
    t === "plus" ||
    t === "rings" ||
    t === "newsflash" ||
    t === "shape" ||
    t === "shred" ||
    t === "flash"
  ) {
    return "slide";
  }
  if (
    t === "zoom" ||
    t === "cube" ||
    t === "flip" ||
    t === "rotate" ||
    t === "fall"
  ) {
    return "zoom";
  }
  // Unknown but present -> keep a gentle fade rather than none.
  return "fade";
}

// Map a PPTX entrance effect name to a SectionMotionPreset, or undefined when
// there is nothing to map (caller should use "inherit").
function mapEntrance(raw?: string): SectionMotionPreset | undefined {
  if (!raw) return undefined;
  const t = raw.toLowerCase();
  if (t === "fade" || t === "filter" || t === "dissolve") return "fade";
  if (t === "fly" || t === "wipe") return "slide-up";
  if (t === "zoom") return "scale";
  // "stagger"/"appear" reveal content bullet-by-bullet. SectionMotionPreset
  // has no stagger value, so we approximate with a fade reveal (the deck-level
  // MotionPreset still carries "stagger" where supported).
  if (t === "stagger" || t === "appear") return "fade";
  if (t === "none") return undefined;
  // Unknown entrance -> subtle fade reveal.
  return "fade";
}

// Map a PPTX entrance effect name to a deck-level MotionPreset. Unlike the
// section mapper, the deck preset CAN express "stagger" (bullet-by-bullet
// reveal of the opening slide's content).
function mapDeckPreset(raw?: string): MotionPreset {
  if (!raw) return DEFAULT_MOTION.preset;
  const t = raw.toLowerCase();
  if (t === "fade" || t === "filter" || t === "dissolve") return "fade";
  if (t === "fly" || t === "wipe") return "slide-up";
  if (t === "zoom") return "scale";
  if (t === "stagger" || t === "appear") return "stagger";
  if (t === "none") return DEFAULT_MOTION.preset;
  return "fade";
}

export function mapPptxAnimation(slides: PptxAnimationInput[]): PptxAnimationMap {
  // Deck-level transition: the opening slide's transition is the most
  // representative of the deck's navigational feel.
  const deckTransition = mapTransition(slides[0]?.transition);
  const deckPreset: MotionPreset = mapDeckPreset(slides[0]?.entrance);

  const deckMotion: DeckMotion = {
    preset: deckPreset,
    transition: deckTransition,
  };

  const sectionMotions: SectionMotionPreset[] = slides.map((s) => {
    const preset = mapEntrance(s.entrance);
    return preset ?? "inherit";
  });

  return { deckMotion, sectionMotions };
}
