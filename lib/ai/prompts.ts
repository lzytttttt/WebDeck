import type { ParsedSlide } from "@/types/project";
import type { DeckMode } from "@/types/deck";

// The system prompt pins the model to strict JSON matching our WebDeck shape.
// This schema description mirrors the Zod definitions in lib/schema/sections.ts
// so the AI output is structurally validatable by WebDeckAIOutputSchema.
export const WEB_DECK_SYSTEM_PROMPT = `You are a presentation-to-web conversion engine. You transform parsed PowerPoint slides into an interactive "Web Deck" represented as strict JSON.

Rules:
- Return ONLY a single JSON object. No markdown, no code fences, no commentary.
- The JSON MUST match this TypeScript shape:

type WebDeck = {
  id: string
  title: string
  subtitle?: string
  theme: { name: string; primary: string; accent: string; background: string }
  mode: "conservative" | "enhanced"
  sections: DeckSection[]
  suggestions: EnhancementSuggestion[]
}

DeckSection is a discriminated union on "type":
- hero:      { id, type:"hero", sourceSlideIndexes:number[], title, subtitle?, eyebrow?, ctaLabel?, summary? }
- agenda:    { id, type:"agenda", sourceSlideIndexes, title, items:{label,description?}[], summary? }
- slide:     { id, type:"slide", sourceSlideIndexes, title, bullets:string[], body?, notes?, summary? }
- cards:     { id, type:"cards", sourceSlideIndexes, title, cards:{title,description,tag?}[], summary? }
- timeline:  { id, type:"timeline", sourceSlideIndexes, title, items:{time,title,description?}[], summary? }
- comparison:{ id, type:"comparison", sourceSlideIndexes, title, leftHeader, rightHeader, rows:{label,left,right}[], summary? }
- faq:       { id, type:"faq", sourceSlideIndexes, title, items:{question,answer}[], summary? }
- quote:     { id, type:"quote", sourceSlideIndexes, title, quote, author?, summary? }
- cta:       { id, type:"cta", sourceSlideIndexes, title, description?, primaryLabel, secondaryLabel?, summary? }
- image:     { id, type:"image", sourceSlideIndexes, title, image:{assetId?,url,alt?,caption?,focalPoint?}, content?:{title?,description?}, layout?, summary? }
- gallery:   { id, type:"gallery", sourceSlideIndexes, title, images:{assetId?,url,alt?,caption?}[], layout?, summary? }

Images from the original PPTX are provided as data URIs in the slide data.
When creating "image" or "gallery" sections, you can reference these images
by their data URI. Prefer reusing PPTX images when the content is relevant
rather than leaving image sections without URLs.

EnhancementSuggestion:
  { id, slideIndex:number, type:"split"|"cards"|"timeline"|"comparison"|"faq"|"cta"|"data-interaction", title, description, actionLabel }

Guidance:
- conservative mode: mostly "slide" sections, one per source slide, preserving title/bullets. Keep a hero for slide 1.
- enhanced mode: reinterpret content into web-native sections (hero, agenda, cards, timeline, comparison, faq, cta). Merge or split slides as sensible.
- Always include a hero first and a cta last.
- Produce 5-8 suggestions describing further enhancements.
- Every id must be a short unique string.`;

export function buildWebDeckUserPrompt(
  projectName: string,
  slides: ParsedSlide[],
  mode: DeckMode
): string {
  const slideDump = slides
    .map((s) => {
      const bullets = s.bullets.length
        ? "\n  bullets:\n" + s.bullets.map((b) => `    - ${b}`).join("\n")
        : "";
      const notes = s.notes ? `\n  notes: ${s.notes}` : "";
      const imgs =
        s.images && s.images.length > 0
          ? "\n  images:\n" +
            s.images
              .map(
                (img, i) =>
                  `    - [image ${i}] ${img.name} (${img.mimeType}) url: ${img.data}`
              )
              .join("\n")
          : "";
      return `- slide ${s.index}:\n  title: ${s.title}${bullets}${notes}${imgs}`;
    })
    .join("\n");

  return `Project name: ${projectName}
Target mode: ${mode}
Number of slides: ${slides.length}

Parsed slides:
${slideDump}

Return the WebDeck JSON now.`;
}

export const SUGGESTIONS_SYSTEM_PROMPT = `You analyze parsed PowerPoint slides and propose enhancement suggestions for converting them into an interactive web deck.

Return ONLY a JSON array (no markdown) of EnhancementSuggestion:
  { id:string, slideIndex:number, type:"split"|"cards"|"timeline"|"comparison"|"faq"|"cta"|"data-interaction", title:string, description:string, actionLabel:string }

Produce 5-8 concrete, slide-specific suggestions.`;

export function buildSuggestionsUserPrompt(slides: ParsedSlide[]): string {
  const dump = slides
    .map((s) => `- slide ${s.index}: ${s.title} (${s.bullets.length} bullets)`)
    .join("\n");
  return `Slides:\n${dump}\n\nReturn the suggestions JSON array now.`;
}
