import type { WebDeck, DeckSection } from "@/types/deck";
import { themeToCssVars, cssVarsToString, getThemeById, getGoogleFontsUrl, buildCustomCss } from "@/lib/deck/theme";
import { getSection } from "@/lib/deck/sections";
import { esc } from "@/lib/deck/htmlUtils";

function renderSection(section: DeckSection): string {
  const def = getSection(section.type);
  return def ? def.renderStatic(section) : "";
}

const STYLE = `
:root{--ink:#0f172a;--muted:#64748b;--accent:#14b8a6;--border:#e2e8f0;--bg:#ffffff;--soft:#f8fafc;}
*{box-sizing:border-box;}
/* Legacy palette names alias the deck theme vars set inline on <body>, so the
   whole export follows the chosen theme with the existing selectors intact. */
body{--ink:var(--deck-text,#0f172a);--muted:var(--deck-muted,#64748b);--accent:var(--deck-accent,#14b8a6);--border:color-mix(in srgb, var(--deck-text,#0f172a) 14%, transparent);--bg:var(--deck-surface,#ffffff);--soft:var(--deck-bg,#f8fafc);margin:0;font-family:var(--deck-body-font,-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Arial,"PingFang SC","Microsoft YaHei",sans-serif);color:var(--ink);background:var(--soft);line-height:1.6;font-size:calc(1rem * var(--deck-scale,1));}
h1,h2,h3{font-family:var(--deck-heading-font,inherit);}
.wrap{max-width:900px;margin:0 auto;padding:0 20px 80px;}
.hero{padding:96px 0 64px;text-align:center;}
.hero .eyebrow{color:var(--accent);font-weight:600;letter-spacing:.08em;text-transform:uppercase;font-size:13px;margin-bottom:16px;}
.hero h1{font-size:44px;line-height:1.15;margin:0 0 16px;}
.hero .subtitle{font-size:20px;color:var(--muted);max-width:640px;margin:0 auto;}
.block{background:var(--bg);border:1px solid var(--border);border-radius:16px;padding:36px;margin:24px 0;}
.block h2{font-size:26px;margin:0 0 20px;}
.block h3{font-size:18px;margin:0 0 8px;}
.block ul,.block ol{padding-left:22px;margin:0;}
.block li{margin:8px 0;}
.agenda{list-style:decimal;}
.agenda .a-label{font-weight:600;}
.agenda .a-desc{display:block;color:var(--muted);font-size:14px;}
.cards{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:16px;}
.card{border:1px solid var(--border);border-radius:12px;padding:20px;background:var(--soft);}
.card .tag{display:inline-block;background:rgba(20,184,166,.12);color:var(--accent);font-size:12px;font-weight:600;padding:2px 10px;border-radius:999px;margin-bottom:10px;}
.timeline{position:relative;border-left:2px solid var(--border);margin-left:8px;}
.tl-item{position:relative;padding:0 0 24px 24px;}
.tl-item::before{content:"";position:absolute;left:-7px;top:4px;width:12px;height:12px;border-radius:50%;background:var(--accent);}
.tl-time{font-size:13px;color:var(--accent);font-weight:600;}
.cmp{width:100%;border-collapse:collapse;}
.cmp th,.cmp td{border:1px solid var(--border);padding:12px 14px;text-align:left;}
.cmp thead th{background:var(--soft);}
.cmp .r-label{font-weight:600;}
.faq details{border:1px solid var(--border);border-radius:12px;padding:14px 18px;margin-bottom:12px;background:var(--soft);}
.faq summary{cursor:pointer;font-weight:600;}
.quote blockquote{font-size:24px;font-style:italic;margin:0 0 12px;}
.quote cite{color:var(--muted);}
.cta{text-align:center;background:var(--ink);color:#fff;border:none;}
.cta h2{color:#fff;}
.cta p{color:#cbd5e1;}
.cta-actions{margin-top:20px;display:flex;gap:12px;justify-content:center;flex-wrap:wrap;}
.btn{display:inline-block;padding:12px 24px;border-radius:10px;font-weight:600;border:1px solid rgba(255,255,255,.3);}
.btn.primary{background:var(--accent);border-color:var(--accent);}
.footer{text-align:center;color:var(--muted);font-size:13px;padding:40px 0;}
/* Image sections */
.img-figure{margin:0;}
.img-figure img{width:100%;height:auto;display:block;border-radius:12px;object-fit:cover;}
.img-full{overflow:hidden;}
.img-framed .img-figure img{border:1px solid var(--border);padding:8px;background:var(--soft);}
.img-cap{color:var(--muted);font-size:13px;margin-top:8px;text-align:center;}
.img-text{margin-top:16px;}
.img-text h2{margin:0 0 8px;}
.img-split{display:grid;grid-template-columns:1fr 1fr;gap:24px;align-items:center;}
.img-split .img-text{margin-top:0;}
.img-empty{border:1px dashed var(--border);border-radius:12px;padding:48px;text-align:center;color:var(--muted);}
@media(max-width:640px){.img-split{grid-template-columns:1fr;}}
/* Gallery */
.gallery-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:12px;}
.gallery-carousel{display:flex;gap:12px;overflow-x:auto;padding-bottom:8px;}
.gallery-carousel .gallery-item{flex:0 0 280px;}
.gallery-masonry{columns:3;column-gap:12px;}
.gallery-masonry .gallery-item{break-inside:avoid;margin-bottom:12px;}
@media(max-width:640px){.gallery-masonry{columns:2;}}
.gallery-item{margin:0;}
.gallery-item img{width:100%;height:auto;display:block;border-radius:10px;object-fit:cover;}
/* Charts */
.chart-desc{color:var(--muted);margin:0 0 16px;}
.chart-graphic{width:100%;}
.chart-svg{width:100%;height:auto;display:block;}
.chart-pie{max-width:320px;margin:0 auto;}
.chart-grid{stroke:var(--border);stroke-width:1;}
.chart-axis{fill:var(--muted);font-size:11px;}
.chart-legend{display:flex;flex-wrap:wrap;gap:12px;justify-content:center;margin-top:12px;font-size:13px;color:var(--muted);}
.chart-legend-item{display:inline-flex;align-items:center;gap:6px;}
.chart-swatch{width:12px;height:12px;border-radius:3px;display:inline-block;}
.chart-insight{margin-top:16px;padding:14px 18px;border-left:3px solid var(--accent);background:var(--soft);border-radius:0 8px 8px 0;color:var(--ink);}
.chart-split{display:grid;grid-template-columns:1.6fr 1fr;gap:20px;align-items:center;}
.chart-split .chart-insight{margin-top:0;}
@media(max-width:640px){.chart-split{grid-template-columns:1fr;}}
.chart-empty{border:1px dashed var(--border);border-radius:12px;padding:40px;text-align:center;color:var(--muted);}
.chart-table{width:100%;border-collapse:collapse;font-size:14px;}
.chart-table th,.chart-table td{border:1px solid var(--border);padding:8px 12px;text-align:left;}
.chart-table thead th{background:var(--soft);}
.kpi-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:16px;}
.kpi-card{border:1px solid var(--border);border-radius:12px;padding:20px;text-align:center;background:var(--soft);}
.kpi-value{font-size:34px;font-weight:700;line-height:1.1;}
.kpi-label{color:var(--muted);font-size:13px;margin-top:6px;}
/* Motion */
@keyframes deck-fade{from{opacity:0}to{opacity:1}}
@keyframes deck-slide-up{from{opacity:0;transform:translateY(24px)}to{opacity:1;transform:none}}
@keyframes deck-scale{from{opacity:0;transform:scale(.96)}to{opacity:1;transform:none}}
.anim-fade{animation:deck-fade .5s ease both;}
.anim-slide-up{animation:deck-slide-up .5s ease both;}
.anim-scale{animation:deck-scale .5s ease both;}
@media(prefers-reduced-motion:reduce){.anim-fade,.anim-slide-up,.anim-scale{animation:none;}}
`;

// Resolve the entrance animation class for a section (mirrors DeckRenderer).
function motionClass(deck: WebDeck, section: DeckSection): string {
  if (deck.motion.preset === "none") return "";
  const own = section.motion?.preset;
  const preset =
    own && own !== "inherit"
      ? own
      : deck.motion.preset === "stagger"
        ? "slide-up"
        : deck.motion.preset;
  if (preset === "slide-up") return "anim-slide-up";
  if (preset === "scale") return "anim-scale";
  if (preset === "fade") return "anim-fade";
  return "";
}

// Build a fully self-contained, offline-readable HTML document from a deck.
export type ExportMeta = {
  projectId?: string;
  description?: string;
};

export function exportStaticHtml(deck: WebDeck, meta: ExportMeta = {}): string {
  // Prefer the inlined theme when it carries real colors — this is what the
  // design inspector produces after a user tweaks colors/shape in place.
  // Otherwise fall back to resolving the built-in theme by id, so seed stubs
  // like { id, colors: {} } still render with a complete palette.
  const theme =
    deck.theme?.colors && Object.keys(deck.theme.colors).length > 0
      ? deck.theme
      : getThemeById(deck.theme?.id);
  const themeStyle = cssVarsToString(themeToCssVars(theme));
  const googleFontsUrl = getGoogleFontsUrl(theme);
  const customCss = buildCustomCss(theme);
  const generatedAt = new Date().toISOString();
  const description =
    meta.description ?? deck.subtitle ?? "An interactive web deck created with Web Deck.";
  const sectionsHtml = deck.sections
    .map((section) => {
      const anim = motionClass(deck, section);
      const html = renderSection(section);
      return anim ? `<div class="${anim}">${html}</div>` : html;
    })
    .join("\n");
  // Graceful fallback when a deck has no renderable sections.
  const body =
    sectionsHtml.trim() ||
    `<section class="block"><h2>${esc(deck.title)}</h2><p>This deck has no content yet.</p></section>`;
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<meta name="description" content="${esc(description)}"/>
<meta name="generator" content="Web Deck"/>
<meta property="og:title" content="${esc(deck.title)}"/>
<meta property="og:description" content="${esc(description)}"/>
<meta property="og:type" content="website"/>
${meta.projectId ? `<meta name="web-deck:source-project" content="${esc(meta.projectId)}"/>` : ""}
<meta name="web-deck:generated-at" content="${generatedAt}"/>
<title>${esc(deck.title)}</title>
<style>${STYLE}</style>
${googleFontsUrl ? `<link rel="stylesheet" href="${googleFontsUrl}"/>` : ""}
${customCss ? `<style>${customCss}</style>` : ""}
</head>
<body style="${themeStyle}">
<div class="wrap">
${body}
<div class="footer">Created with Web Deck</div>
</div>
<script type="application/json" id="web-deck-data">${JSON.stringify(deck).replace(
    /</g,
    "\\u003c",
  )}</script>
</body>
</html>`;
}
