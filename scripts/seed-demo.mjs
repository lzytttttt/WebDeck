// Seed demo projects into data/projects.json (spec 2 + 13.7).
//
// Standalone Node ESM — no TS runner or app imports, so `npm run seed:demo`
// works with a bare `node`. Deck theme is stored as a stub { id, colors:{} };
// lib/deck/normalize.ts re-resolves the full builtin theme by id on read.
//
// Demo projects use stable ids (proj_demo_<key>) and are replaced idempotently;
// any non-demo project in the store is preserved untouched.

import fs from "fs/promises";
import path from "path";

const DATA_DIR = path.join(process.cwd(), "data");
const DB_PATH = path.join(DATA_DIR, "projects.json");

const IMG = (seed) => `https://picsum.photos/seed/${seed}/1200/700`;
const theme = (id) => ({ id, colors: {} });
const iso = (dayOffset, hourOffset = 0) =>
  new Date(Date.UTC(2024, 11, 1) + dayOffset * 86_400_000 + hourOffset * 3_600_000).toISOString();

const SPECS = [
  {
    key: "company",
    themeId: "classic-business",
    themeName: "Classic Business",
    motion: { preset: "fade", transition: "fade" },
    published: true,
    title: { "zh-CN": "公司简介 Web Deck", en: "Company Profile Web Deck" },
    description: {
      "zh-CN": "精致的公司概览，包含关键指标、发展时间线与团队亮点。",
      en: "A polished company overview with metrics, timeline, and team highlights.",
    },
    sections: [
      {
        type: "hero",
        title: "Northwind Industries",
        subtitle: "Engineering reliable infrastructure since 2008.",
        eyebrow: "Company Profile",
        layout: "metrics",
        metrics: [
          { value: "16", label: "Years in business" },
          { value: "240+", label: "Enterprise clients" },
          { value: "38", label: "Countries served" },
        ],
      },
      {
        type: "agenda",
        title: "What we do",
        items: [
          { label: "Platform", description: "Cloud infrastructure and tooling." },
          { label: "Services", description: "Migration and managed operations." },
          { label: "Support", description: "24/7 global coverage." },
        ],
      },
      {
        type: "image",
        title: "Our headquarters",
        layout: "split-left",
        image: { url: IMG("office"), alt: "Modern office" },
        content: { title: "Built for scale", description: "Three regional hubs keep us close to every customer." },
      },
      {
        type: "timeline",
        title: "Milestones",
        items: [
          { time: "2008", title: "Founded", description: "Two engineers, one server rack." },
          { time: "2015", title: "Series B", description: "Expanded to EMEA." },
          { time: "2022", title: "Global", description: "Crossed 200 enterprise clients." },
        ],
      },
      {
        type: "chart",
        title: "Revenue growth",
        chartType: "bar",
        layout: "chart-with-insight",
        insight: "Revenue has grown 3x over the last four years.",
        data: {
          columns: ["Year", "Revenue"],
          rows: [
            { Year: "2021", Revenue: 42 },
            { Year: "2022", Revenue: 61 },
            { Year: "2023", Revenue: 98 },
            { Year: "2024", Revenue: 134 },
          ],
        },
        config: { xKey: "Year", yKeys: ["Revenue"], showLegend: true, showGrid: true },
      },
      {
        type: "cta",
        title: "Let's build together",
        description: "Talk to our team about your infrastructure roadmap.",
        primaryLabel: "Contact sales",
      },
    ],
  },
  {
    key: "product",
    themeId: "modern-saas",
    themeName: "Modern SaaS",
    motion: { preset: "slide-up", transition: "slide" },
    published: false,
    title: { "zh-CN": "产品发布 Web Deck", en: "Product Launch Web Deck" },
    description: {
      "zh-CN": "用 Hero、功能卡片、对比与有力的 CTA 发布一款产品。",
      en: "Announce a product with a hero, feature cards, comparison, and a strong CTA.",
    },
    sections: [
      {
        type: "hero",
        title: "Introducing Pulse 2.0",
        subtitle: "Real-time analytics that finally keep up with your team.",
        eyebrow: "Product Launch",
        layout: "split",
      },
      {
        type: "cards",
        title: "What's new",
        layout: "feature-list",
        cards: [
          { title: "Live dashboards", description: "Sub-second refresh across every metric.", tag: "New" },
          { title: "Smart alerts", description: "Anomaly detection without threshold tuning.", tag: "New" },
          { title: "Team spaces", description: "Shared views with role-based access." },
        ],
      },
      {
        type: "image",
        title: "The new dashboard",
        layout: "full-width",
        image: { url: IMG("dashboard"), alt: "Analytics dashboard" },
      },
      {
        type: "comparison",
        title: "Pulse vs. the old way",
        leftHeader: "Pulse 2.0",
        rightHeader: "Spreadsheets",
        rows: [
          { label: "Refresh rate", left: "Real-time", right: "Manual" },
          { label: "Alerts", left: "Automatic", right: "None" },
          { label: "Collaboration", left: "Built-in", right: "Email" },
        ],
      },
      {
        type: "cta",
        title: "Start your free trial",
        description: "No credit card required. Set up in minutes.",
        primaryLabel: "Try Pulse free",
        secondaryLabel: "Book a demo",
      },
    ],
  },
  {
    key: "investor",
    themeId: "dark-executive",
    themeName: "Dark Executive",
    motion: { preset: "scale", transition: "zoom" },
    published: false,
    title: { "zh-CN": "投资路演 Web Deck", en: "Investor Pitch Web Deck" },
    description: {
      "zh-CN": "融资叙事，包含市场图表、增长数据与融资诉求。",
      en: "A fundraising narrative with market charts, traction, and the ask.",
    },
    sections: [
      {
        type: "hero",
        title: "Ferry — the future of urban logistics",
        subtitle: "Seed round · $4M target",
        eyebrow: "Investor Pitch",
        layout: "centered",
      },
      {
        type: "chart",
        title: "Market size",
        chartType: "line",
        layout: "chart-with-insight",
        insight: "Our addressable market is compounding at 22% annually.",
        data: {
          columns: ["Year", "TAM"],
          rows: [
            { Year: "2023", TAM: 12 },
            { Year: "2024", TAM: 15 },
            { Year: "2025", TAM: 18 },
            { Year: "2026", TAM: 23 },
          ],
        },
        config: { xKey: "Year", yKeys: ["TAM"], showLegend: false, showGrid: true },
      },
      {
        type: "cards",
        title: "Traction",
        layout: "grid",
        cards: [
          { title: "$1.2M ARR", description: "Up 4x year over year." },
          { title: "18 cities", description: "Live across three regions." },
          { title: "92% retention", description: "Net revenue retention." },
        ],
      },
      {
        type: "chart",
        title: "Use of funds",
        chartType: "donut",
        layout: "card",
        data: {
          columns: ["Area", "Percent"],
          rows: [
            { Area: "Engineering", Percent: 45 },
            { Area: "Go-to-market", Percent: 35 },
            { Area: "Operations", Percent: 20 },
          ],
        },
        config: { xKey: "Area", yKeys: ["Percent"], showLegend: true },
      },
      {
        type: "quote",
        title: "Why now",
        quote: "Cities are re-regulating curb space — the winners will own the software layer.",
        author: "Ferry founding thesis",
      },
      {
        type: "cta",
        title: "The ask",
        description: "$4M to reach 50 cities and $5M ARR in 18 months.",
        primaryLabel: "Request data room",
      },
    ],
  },
  {
    key: "annual",
    themeId: "editorial",
    themeName: "Editorial",
    motion: { preset: "stagger", transition: "fade" },
    published: false,
    title: { "zh-CN": "年度回顾 Web Deck", en: "Annual Review Web Deck" },
    description: {
      "zh-CN": "年度总结，包含核心 KPI、业绩图表与里程碑图库。",
      en: "Year-in-review with KPIs, a results chart, and a gallery of milestones.",
    },
    sections: [
      {
        type: "hero",
        title: "2024 in review",
        subtitle: "A year of steady, deliberate growth.",
        eyebrow: "Annual Review",
        layout: "metrics",
        metrics: [
          { value: "+41%", label: "Revenue" },
          { value: "+12", label: "Team members" },
          { value: "99.98%", label: "Uptime" },
        ],
      },
      {
        type: "chart",
        title: "Quarterly results",
        chartType: "bar",
        layout: "full-width",
        data: {
          columns: ["Quarter", "Revenue", "Profit"],
          rows: [
            { Quarter: "Q1", Revenue: 30, Profit: 6 },
            { Quarter: "Q2", Revenue: 38, Profit: 9 },
            { Quarter: "Q3", Revenue: 45, Profit: 12 },
            { Quarter: "Q4", Revenue: 52, Profit: 16 },
          ],
        },
        config: { xKey: "Quarter", yKeys: ["Revenue", "Profit"], showLegend: true, showGrid: true },
      },
      {
        type: "gallery",
        title: "Moments from the year",
        layout: "grid",
        images: [
          { url: IMG("team1"), alt: "Team offsite", caption: "Spring offsite" },
          { url: IMG("launch"), alt: "Launch event", caption: "Product launch" },
          { url: IMG("award"), alt: "Award ceremony", caption: "Industry award" },
        ],
      },
      {
        type: "timeline",
        title: "Highlights",
        items: [
          { time: "Mar", title: "Raised Series A" },
          { time: "Jul", title: "Launched v3" },
          { time: "Nov", title: "Opened EMEA office" },
        ],
      },
      {
        type: "cta",
        title: "Onward to 2025",
        description: "Thank you to our team, customers, and partners.",
        primaryLabel: "Read the full report",
      },
    ],
  },
  {
    key: "training",
    themeId: "minimal-white",
    themeName: "Minimal White",
    motion: { preset: "none", transition: "none" },
    published: false,
    title: { "zh-CN": "培训课程 Web Deck", en: "Training Course Web Deck" },
    description: {
      "zh-CN": "课程大纲，包含议程、模块卡片、FAQ 与后续步骤。",
      en: "A course outline with agenda, module cards, an FAQ, and next steps.",
    },
    sections: [
      {
        type: "hero",
        title: "Foundations of Data Analysis",
        subtitle: "A four-module course for analysts and PMs.",
        eyebrow: "Training Course",
        layout: "centered",
      },
      {
        type: "agenda",
        title: "Course agenda",
        items: [
          { label: "Module 1", description: "Framing the question." },
          { label: "Module 2", description: "Cleaning and shaping data." },
          { label: "Module 3", description: "Visualizing findings." },
          { label: "Module 4", description: "Telling the story." },
        ],
      },
      {
        type: "cards",
        title: "What you'll learn",
        layout: "grid",
        cards: [
          { title: "Ask better questions", description: "Turn vague asks into testable hypotheses." },
          { title: "Trust your data", description: "Validate before you visualize." },
          { title: "Communicate clearly", description: "Charts that persuade, not confuse." },
        ],
      },
      {
        type: "faq",
        title: "Frequently asked",
        layout: "accordion",
        items: [
          { question: "Do I need coding experience?", answer: "No — we use spreadsheets and a no-code tool." },
          { question: "How long is the course?", answer: "About six hours across four modules." },
          { question: "Is there a certificate?", answer: "Yes, on completion of the final project." },
        ],
      },
      {
        type: "cta",
        title: "Enroll today",
        description: "Next cohort starts the first Monday of the month.",
        primaryLabel: "Reserve a seat",
      },
    ],
  },
];

function buildProject(spec, i) {
  const createdAt = iso(i);
  const updatedAt = iso(i, 1);
  const sections = spec.sections.map((s, j) => ({
    id: `sec_demo_${spec.key}_${j + 1}`,
    sourceSlideIndexes: [],
    ...s,
  }));
  const webDeck = {
    id: `deck_demo_${spec.key}`,
    title: spec.title.en,
    subtitle: spec.description.en,
    theme: theme(spec.themeId),
    mode: "enhanced",
    motion: spec.motion,
    sections,
    suggestions: [],
  };
  return {
    id: `proj_demo_${spec.key}`,
    name: spec.title.en,
    sourceFileName: `${spec.key}-demo.pptx`,
    createdAt,
    updatedAt,
    status: spec.published ? "published" : "generated",
    slides: [],
    webDeck,
    isDemo: true,
    demoMeta: {
      key: spec.key,
      theme: spec.themeName,
      title: spec.title,
      description: spec.description,
    },
    share: spec.published
      ? { shareId: `share_demo_${spec.key}`, isPublished: true, createdAt }
      : undefined,
  };
}

async function main() {
  await fs.mkdir(DATA_DIR, { recursive: true });
  let db = { projects: [] };
  try {
    db = JSON.parse(await fs.readFile(DB_PATH, "utf8"));
    if (!Array.isArray(db.projects)) db = { projects: [] };
  } catch {
    db = { projects: [] };
  }
  const demos = SPECS.map(buildProject);
  const demoIds = new Set(demos.map((d) => d.id));
  const kept = db.projects.filter((p) => !demoIds.has(p.id));
  db.projects = [...kept, ...demos];
  await fs.writeFile(DB_PATH, JSON.stringify(db, null, 2), "utf8");
  console.log(`Seeded ${demos.length} demo projects (${kept.length} existing projects preserved).`);
}

main().catch((err) => {
  console.error("seed:demo failed:", err);
  process.exit(1);
});
