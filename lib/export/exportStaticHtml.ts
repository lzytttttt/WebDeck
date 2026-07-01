import type {
  WebDeck,
  DeckSection,
  ImageSection,
  GallerySection,
  ChartSection,
} from "@/types/deck";
import { themeToCssVars, cssVarsToString, getThemeById } from "@/lib/deck/theme";
import { renderChartStatic } from "./renderChartStatic";

// Escape user/AI text for safe embedding in HTML.
function esc(s: string | undefined): string {
  if (!s) return "";
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function renderSection(section: DeckSection): string {
  switch (section.type) {
    case "hero":
      return `<section class="hero">
        ${section.eyebrow ? `<div class="eyebrow">${esc(section.eyebrow)}</div>` : ""}
        <h1>${esc(section.title)}</h1>
        ${section.subtitle ? `<p class="subtitle">${esc(section.subtitle)}</p>` : ""}
      </section>`;

    case "agenda":
      return `<section class="block">
        <h2>${esc(section.title)}</h2>
        <ol class="agenda">
          ${section.items
            .map(
              (it) =>
                `<li><span class="a-label">${esc(it.label)}</span>${
                  it.description ? `<span class="a-desc">${esc(it.description)}</span>` : ""
                }</li>`
            )
            .join("")}
        </ol>
      </section>`;

    case "slide":
      return `<section class="block slide-like">
        <h2>${esc(section.title)}</h2>
        ${section.body ? `<p>${esc(section.body)}</p>` : ""}
        ${
          section.bullets.length
            ? `<ul>${section.bullets.map((b) => `<li>${esc(b)}</li>`).join("")}</ul>`
            : ""
        }
      </section>`;

    case "cards":
      return `<section class="block">
        <h2>${esc(section.title)}</h2>
        <div class="cards">
          ${section.cards
            .map(
              (c) =>
                `<div class="card">${
                  c.tag ? `<span class="tag">${esc(c.tag)}</span>` : ""
                }<h3>${esc(c.title)}</h3><p>${esc(c.description)}</p></div>`
            )
            .join("")}
        </div>
      </section>`;

    case "timeline":
      return `<section class="block">
        <h2>${esc(section.title)}</h2>
        <div class="timeline">
          ${section.items
            .map(
              (it) =>
                `<div class="tl-item"><div class="tl-time">${esc(it.time)}</div><div class="tl-body"><h3>${esc(
                  it.title
                )}</h3>${it.description ? `<p>${esc(it.description)}</p>` : ""}</div></div>`
            )
            .join("")}
        </div>
      </section>`;

    case "comparison":
      return `<section class="block">
        <h2>${esc(section.title)}</h2>
        <table class="cmp">
          <thead><tr><th></th><th>${esc(section.leftHeader)}</th><th>${esc(
        section.rightHeader
      )}</th></tr></thead>
          <tbody>
            ${section.rows
              .map(
                (r) =>
                  `<tr><td class="r-label">${esc(r.label)}</td><td>${esc(r.left)}</td><td>${esc(
                    r.right
                  )}</td></tr>`
              )
              .join("")}
          </tbody>
        </table>
      </section>`;

    case "faq":
      return `<section class="block">
        <h2>${esc(section.title)}</h2>
        <div class="faq">
          ${section.items
            .map(
              (it) =>
                `<details><summary>${esc(it.question)}</summary><p>${esc(it.answer)}</p></details>`
            )
            .join("")}
        </div>
      </section>`;

    case "quote":
      return `<section class="block quote">
        <blockquote>${esc(section.quote)}</blockquote>
        ${section.author ? `<cite>— ${esc(section.author)}</cite>` : ""}
      </section>`;

    case "cta":
      return `<section class="block cta">
        <h2>${esc(section.title)}</h2>
        ${section.description ? `<p>${esc(section.description)}</p>` : ""}
        <div class="cta-actions">
          <span class="btn primary">${esc(section.primaryLabel)}</span>
          ${section.secondaryLabel ? `<span class="btn">${esc(section.secondaryLabel)}</span>` : ""}
        </div>
      </section>`;

    case "image":
      return renderImage(section);

    case "gallery":
      return renderGallery(section);

    case "chart":
      return renderChart(section);

    default:
      return "";
  }
}

// eslint-disable-next-line — <img> is intentional for a static, framework-free file.
function img(url: string, alt: string, extra = ""): string {
  if (!url) return `<div class="img-empty">No image</div>`;
  return `<img src="${esc(url)}" alt="${esc(alt)}" loading="lazy" ${extra}/>`;
}

function renderImage(section: ImageSection): string {
  const layout = section.layout ?? "full-width";
  const alt = section.image.alt ?? section.title ?? "";
  const caption = section.image.caption
    ? `<figcaption class="img-cap">${esc(section.image.caption)}</figcaption>`
    : "";
  const fp = section.image.focalPoint;
  const pos = fp ? ` style="object-position:${fp.x * 100}% ${fp.y * 100}%"` : "";
  const picture = `<figure class="img-figure">${img(
    section.image.url,
    alt,
    pos,
  )}${caption}</figure>`;
  const text =
    section.content?.title || section.content?.description
      ? `<div class="img-text">${
          section.content?.title ? `<h2>${esc(section.content.title)}</h2>` : ""
        }${
          section.content?.description
            ? `<p>${esc(section.content.description)}</p>`
            : ""
        }</div>`
      : "";
  if (layout === "split-left") {
    return `<section class="block img-split">${picture}${text}</section>`;
  }
  if (layout === "split-right") {
    return `<section class="block img-split">${text}${picture}</section>`;
  }
  const framed = layout === "framed" ? " img-framed" : "";
  return `<section class="block img-full${framed}">${picture}${text}</section>`;
}

function renderGallery(section: GallerySection): string {
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

function renderChart(section: ChartSection): string {
  const insight = section.insight
    ? `<p class="chart-insight">${esc(section.insight)}</p>`
    : "";
  const desc = section.description
    ? `<p class="chart-desc">${esc(section.description)}</p>`
    : "";
  const graphic = renderChartStatic(section);
  const withInsight = section.layout === "chart-with-insight" && insight;
  const body = withInsight
    ? `<div class="chart-split"><div class="chart-graphic">${graphic}</div><div class="chart-side">${insight}</div></div>`
    : `<div class="chart-graphic">${graphic}</div>${insight}`;
  return `<section class="block"><h2>${esc(section.title)}</h2>${desc}${body}</section>`;
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
  const theme = getThemeById(deck.theme?.id);
  const themeStyle = cssVarsToString(themeToCssVars(theme));
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
</head>
<body style="${themeStyle}">
<div class="wrap">
${body}
<div class="footer">Created with Web Deck</div>
</div>
<script type="application/json" id="web-deck-data">${JSON.stringify(deck).replace(
    /</g,
    "\\u003c"
  )}</script>
</body>
</html>`;
}
