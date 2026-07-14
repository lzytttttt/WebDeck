// Extract PPTX animation hints from a slide's raw XML.
//
// Two distinct animation sources exist in a .pptx:
//   - Slide transitions:  <p:transition> at the slide root. Names the effect
//     used when navigating *to* this slide (fade / push / zoom / …).
//   - Entrance animations: <p:timing> containing <p:animEffect> elements that
//     animate shapes/paragraphs *within* the slide as it appears.
//
// We only harvest the raw effect name here; the mapping to Web Deck's Motion
// vocabulary lives in lib/deck/animationMap so this module stays XML-focused
// and testable in isolation. Missing/garbled XML degrades to `undefined`
// (meaning "no animation"), never throws.

// Strip a namespace prefix (e.g. "p:fade" -> "fade") and lowercase.
function localEffect(xml: string): string | undefined {
  const m = xml.match(/<(?:[\w]+:)?(\w+)\b/);
  if (!m) return undefined;
  return m[1].toLowerCase();
}

/**
 * Read the slide-transition effect name, or undefined if none.
 * Handles both the <p:prstTrans prst="..."> form and the legacy
 * <p:transition><p:fade/></p:transition> child-element form.
 */
export function extractSlideTransition(xml: string): string | undefined {
  const m = xml.match(/<p:transition\b[^>]*>([\s\S]*?)<\/p:transition>/i);
  if (!m) return undefined;
  const inner = m[1];

  const prst = inner.match(/prst\s*=\s*["']([^"']+)["']/i);
  if (prst) return prst[1].toLowerCase();

  const child = localEffect(inner);
  return child;
}

/**
 * Read the primary entrance-animation effect name, or undefined if none.
 * Detects staggered (bullet-by-bullet) reveals via repeated entrance-type
 * timenodes, otherwise returns the first recognized effect.
 */
export function extractSlideEntrance(xml: string): string | undefined {
  const m = xml.match(/<p:timing\b[^>]*>([\s\S]*?)<\/p:timing>/i);
  if (!m) return undefined;
  const inner = m[1];

  // Paragraph-level staggered reveals: multiple entrance timenodes.
  const entrTn = inner.match(/presetClass\s*=\s*["']entr["']/gi);
  const animEffects = inner.match(/<p:animEffect\b/gi);
  if ((entrTn && entrTn.length > 1) || (animEffects && animEffects.length > 2)) {
    return "stagger";
  }

  // First recognized animEffect child decides the effect type.
  const effect = inner.match(
    /<p:animEffect\b[^>]*>([\s\S]*?)<\/p:animEffect>|<p:animEffect\b[^>]*\/>/i,
  );
  if (!effect) {
    // A <p:timing> exists but no recognizable <p:animEffect>: treat as a
    // default fade so the slide still gets a subtle entrance.
    return "fade";
  }
  const block = effect[0];
  const child = block.match(/<(?:[\w]+:)?(fade|fly|zoom|filter|flip|wipe|spinner)\b/i);
  if (child) return child[1].toLowerCase();
  return "fade";
}
