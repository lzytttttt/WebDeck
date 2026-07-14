import { describe, it, expect } from "vitest";
import {
  extractSlideTransition,
  extractSlideEntrance,
} from "@/lib/pptx/extractAnimations";
import { mapPptxAnimation } from "@/lib/deck/animationMap";
import { MockAIProvider } from "@/lib/ai/MockAIProvider";
import type { ParsedSlide } from "@/types/project";

// ---------------------------------------------------------------------------
// Transition extraction
// ---------------------------------------------------------------------------

describe("extractSlideTransition", () => {
  it("returns undefined when no <p:transition> is present", () => {
    expect(extractSlideTransition("<p:sld></p:sld>")).toBeUndefined();
  });

  it("reads the child element name as the effect", () => {
    expect(extractSlideTransition("<p:sld><p:transition><p:fade/></p:transition></p:sld>")).toBe("fade");
    expect(extractSlideTransition("<p:sld><p:transition><p:push/></p:transition></p:sld>")).toBe("push");
    expect(extractSlideTransition("<p:sld><p:transition><p:zoom/></p:transition></p:sld>")).toBe("zoom");
  });

  it("reads the prst attribute when present", () => {
    expect(
      extractSlideTransition('<p:sld><p:transition><p:prstTrans prst="wipe"/></p:transition></p:sld>'),
    ).toBe("wipe");
  });
});

// ---------------------------------------------------------------------------
// Entrance extraction
// ---------------------------------------------------------------------------

describe("extractSlideEntrance", () => {
  it("returns undefined when no <p:timing> is present", () => {
    expect(extractSlideEntrance("<p:sld></p:sld>")).toBeUndefined();
  });

  it("maps a single animEffect to its effect", () => {
    const xml =
      "<p:timing><p:tnLst><p:par><p:cTn><p:childTnLst>" +
      "<p:animEffect><p:fly/></p:animEffect>" +
      "</p:childTnLst></p:cTn></p:par></p:tnLst></p:timing>";
    expect(extractSlideEntrance(xml)).toBe("fly");
  });

  it("maps zoom and fade effects", () => {
    const zoom =
      "<p:timing><p:animEffect><p:zoom/></p:animEffect></p:timing>";
    const fade =
      "<p:timing><p:animEffect><p:fade/></p:animEffect></p:timing>";
    expect(extractSlideEntrance(zoom)).toBe("zoom");
    expect(extractSlideEntrance(fade)).toBe("fade");
  });

  it("detects staggered (bullet-by-bullet) reveals", () => {
    const xml =
      "<p:timing><p:tnLst>" +
      '<p:tn presetClass="entr"></p:tn>' +
      '<p:tn presetClass="entr"></p:tn>' +
      '<p:tn presetClass="entr"></p:tn>' +
      "</p:tnLst></p:timing>";
    expect(extractSlideEntrance(xml)).toBe("stagger");
  });

  it("defaults to fade when timing exists without a recognized effect", () => {
    expect(extractSlideEntrance("<p:timing><p:tnLst></p:tnLst></p:timing>")).toBe("fade");
  });
});

// ---------------------------------------------------------------------------
// mapPptxAnimation
// ---------------------------------------------------------------------------

describe("mapPptxAnimation", () => {
  it("maps the first slide's transition/entrance to deck motion", () => {
    const { deckMotion } = mapPptxAnimation([
      { transition: "zoom", entrance: "fly" },
      { transition: "push", entrance: "fade" },
    ]);
    expect(deckMotion.transition).toBe("zoom");
    expect(deckMotion.preset).toBe("slide-up");
  });

  it("aligns section motions to slides, defaulting to inherit", () => {
    const { sectionMotions } = mapPptxAnimation([
      { transition: "fade", entrance: "fly" }, // slide-up
      { transition: "push", entrance: "fade" }, // fade
      { transition: "none", entrance: "" }, // inherit (no entrance)
    ]);
    expect(sectionMotions).toEqual(["slide-up", "fade", "inherit"]);
  });

  it("falls back to defaults when nothing is present", () => {
    const { deckMotion, sectionMotions } = mapPptxAnimation([{}, {}]);
    expect(deckMotion.transition).toBe("fade"); // DEFAULT_MOTION.transition
    expect(deckMotion.preset).toBe("fade"); // DEFAULT_MOTION.preset
    expect(sectionMotions).toEqual(["inherit", "inherit"]);
  });
});

// ---------------------------------------------------------------------------
// End-to-end: Mock provider applies PPTX animation hints
// ---------------------------------------------------------------------------

describe("MockAIProvider applies PPTX animation", () => {
  function slide(p: Partial<ParsedSlide> & { index: number }): ParsedSlide {
    return {
      id: `slide_${p.index}`,
      title: p.title ?? `Slide ${p.index}`,
      rawText: p.rawText ?? "body",
      bullets: p.bullets ?? [],
      index: p.index,
      ...p,
    } as ParsedSlide;
  }

  it("reflects transition/entrance in deck motion and per-section motion", async () => {
    const provider = new MockAIProvider();
    const slides = [
      slide({ index: 0, title: "Cover", transition: "zoom", entrance: "fly" }),
      slide({ index: 1, title: "Point 1", transition: "push", entrance: "fade" }),
      slide({ index: 2, title: "Point 2", entrance: "" }),
    ];
    const deck = await provider.generateWebDeck({
      projectName: "Demo",
      slides,
      mode: "conservative",
    });

    // Deck-level motion from the opening slide.
    expect(deck.motion.transition).toBe("zoom");
    expect(deck.motion.preset).toBe("slide-up");

    // sections: hero, slide(Point1), slide(Point2), cta
    const hero = deck.sections[0];
    const point1 = deck.sections[1];
    const point2 = deck.sections[2];

    expect(hero.motion?.preset).toBe("slide-up");
    expect(point1.motion?.preset).toBe("fade");
    // Slide 2 had no entrance -> inherits deck preset.
    expect(point2.motion?.preset).toBe("inherit");
  });

  it("produces a stable deck when no animation hints exist", async () => {
    const provider = new MockAIProvider();
    const slides = [
      slide({ index: 0, title: "Cover" }),
      slide({ index: 1, title: "Point 1" }),
    ];
    const deck = await provider.generateWebDeck({
      projectName: "Demo",
      slides,
      mode: "conservative",
    });
    expect(deck.motion.transition).toBe("fade");
    expect(deck.sections[1].motion?.preset).toBe("inherit");
  });
});
