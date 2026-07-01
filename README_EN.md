# Web Deck

> **PPT → HTML Transition Layer** — Transform your PowerPoint into an interactive web deck

**English** | [简体中文](./README.md)

---

## 🎯 What is Web Deck?

**Web Deck** is an open-source tool that converts traditional PowerPoint (`.pptx`) presentations into **interactive web decks** — fully functional, browser-native presentation experiences.

Imagine this: you've crafted a polished PPT, but every time you share it, you worry — *will they have PowerPoint installed? Will the layout break on their screen? Can they view it on mobile?* Web Deck eliminates all of that. Upload your PPT, let AI parse and understand the content structure, and get back a **browser-ready, shareable, presentable** web document.

**Keep the certainty of PPT. Unlock the interactivity of HTML.**

---

## ✨ Core Features

### 📑 Intelligent PPTX Parsing
Upload a `.pptx` file and Web Deck automatically extracts titles, body text, bullet points, speaker notes, and structural metadata from every slide. An import quality report gives you full visibility into what was captured.

### 🤖 AI-Powered Content Restructuring
Powered by Anthropic Claude, Web Deck doesn't just "screenshot your slides to web" — it **understands the semantic meaning** of your content and intelligently restructures it into native web components:

| In your PPT… | → In your Web Deck… |
|---|---|
| Title slide | 🏠 Hero section (with CTA button) |
| Table of contents | 📋 Agenda navigation |
| Bullet-point slides | 📝 Text / Cards / Timeline |
| Comparison tables | ⚖️ Comparison component |
| Q&A slides | ❓ FAQ accordion |
| Data charts | 📊 SVG charts (bar/line/pie/donut/KPI) |
| Closing slide | 🎯 Call-to-action section |

### 🎨 Two Conversion Modes

- **Conservative Mode** — One PPT slide = one section, preserving the original structure. Zero learning curve.
- **Enhanced Mode** — AI freely reorganizes content into web-native components: Hero, Cards, Timeline, Comparison, and more.

### 🖊️ Visual Editor
After conversion, a full-featured WYSIWYG editor awaits:

- **Content Panel** — Edit titles, body text, list items
- **Design Panel** — Switch themes, adjust border radius / shadows / spacing
- **Media Panel** — Manage images and galleries
- **Motion Panel** — Configure entrance animations and slide transitions
- **Device Preview** — Real-time preview across desktop / tablet / mobile
- **Keyboard Shortcuts** — Speed up your editing workflow
- **Publish Checklist** — Automated content completeness check before publishing

### 🎭 Rich Section Types

Web Deck supports **12 native section types**, covering virtually every presentation scenario:

| Section | Purpose |
|---|---|
| `hero` | Headline + key metrics |
| `agenda` | Content navigation |
| `slide` | Traditional text page |
| `cards` | Feature cards / case studies |
| `image` | Single image (full-width / split / framed) |
| `gallery` | Image gallery (grid / carousel / masonry) |
| `chart` | Data charts (bar / line / pie / donut / KPI / table) |
| `timeline` | Timeline |
| `comparison` | Side-by-side comparison |
| `faq` | Frequently asked questions |
| `quote` | Quote / testimonial |
| `cta` | Call to action |

### 🎪 Fullscreen Presentation Mode
Navigate with arrow keys, press `Esc` to exit, `N` to toggle speaker notes — just like a real presentation app. Supports Fade, Slide, and Zoom transition animations.

### 🔗 One-Click Sharing & Export
- **Link Sharing** — Publish and get a dedicated URL with Open Graph metadata for rich social previews
- **Static HTML Export** — Export a fully self-contained `.html` file with zero external dependencies — readable offline, deliverable anywhere

### 🌍 Bilingual Interface
Complete English and Chinese (简体中文) support with one-click language switching.

### 🔌 Works Offline
No API key? No problem. Web Deck ships with a built-in `MockAIProvider` so you can experience the full workflow without any external services.

---

## 🚀 Quick Start

### Prerequisites

- Node.js ≥ 18
- npm or yarn

### Installation

```bash
git clone https://github.com/your-username/web-deck.git
cd web-deck
npm install
```

### Configuration (Optional)

```bash
cp .env.local.example .env.local
```

Edit `.env.local` and add your Anthropic API key (leave blank for offline Mock mode):

```env
ANTHROPIC_API_KEY=sk-ant-...
ANTHROPIC_MODEL=claude-3-5-sonnet-20240620
```

### Run

```bash
npm run dev
```

Open your browser at `http://localhost:3000` and start creating!

### Seed Demo Data

```bash
npm run seed:demo
```

This generates 5 built-in demo projects: Company Profile, Product Launch, Investor Pitch, Annual Review, and Training Course.

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────┐
│                    Web Deck                          │
├──────────┬──────────┬──────────┬────────────────────┤
│  Upload  │   AI     │  Visual  │   Share &          │
│  PPTX    │ Transform│  Editor  │   Export           │
│  Parser  │  Engine  │          │                    │
├──────────┴──────────┴──────────┴────────────────────┤
│                 Web Deck Data Layer                   │
│  (12 section types · theme system · motion · charts) │
├─────────────────────────────────────────────────────┤
│  Next.js 14 · React 18 · TypeScript · Tailwind CSS  │
│  Anthropic Claude · JSZip · fast-xml-parser          │
└─────────────────────────────────────────────────────┘
```

### Core Modules

| Module | Path | Description |
|---|---|---|
| PPTX Parser | `lib/pptx/` | JSZip-based `.pptx` decompression, XML text & structure extraction |
| AI Engine | `lib/ai/` | Anthropic Claude interface + Mock offline provider |
| Deck Engine | `lib/deck/` | Themes, motion, chart rendering, section factory, quality checks |
| Export Engine | `lib/export/` | Zero-dependency static HTML generation |
| Storage | `lib/storage/` | Project persistence (JSON file store) |
| Editor | `components/editor/` | WYSIWYG editor + Inspector panels |
| Deck Components | `components/deck/` | React renderers for all 12 section types |
| i18n | `lib/i18n/` | English & Chinese bilingual dictionaries |

---

## 📂 Project Structure

```
web-deck/
├── app/                          # Next.js App Router
│   ├── page.tsx                  # Landing page
│   ├── projects/                 # Project management
│   │   ├── new/                  # Upload PPT
│   │   └── [id]/
│   │       ├── edit/             # Visual editor
│   │       └── present/          # Fullscreen presenter
│   ├── demo/                     # Demo gallery
│   ├── share/[shareId]/          # Public share page
│   └── api/                      # API routes
├── components/
│   ├── deck/                     # Deck section renderers
│   ├── editor/                   # Editor components
│   ├── layout/                   # Layout components
│   └── ui/                       # Shared UI components
├── lib/
│   ├── ai/                       # AI providers (Anthropic + Mock)
│   ├── deck/                     # Deck core logic
│   ├── export/                   # Static HTML export
│   ├── i18n/                     # Internationalization
│   ├── pptx/                     # PPTX parsing
│   ├── storage/                  # Data storage
│   └── utils/                    # Utilities
├── types/                        # TypeScript type definitions
├── scripts/                      # Utility scripts
└── data/                         # Project data (git ignored)
```

---

## 📜 License

This project is licensed under the **[Creative Commons Attribution-NonCommercial-ShareAlike 4.0 International (CC BY-NC-SA 4.0)](https://creativecommons.org/licenses/by-nc-sa/4.0/)**.

**You are free to:**

- ✅ **Share** — Copy and redistribute the material in any medium or format
- ✅ **Adapt** — Remix, transform, and build upon the material

**Under the following terms:**

- 📝 **Attribution** — You must give appropriate credit, provide a link to the license, and indicate if changes were made
- 🚫 **NonCommercial** — You may not use the material for commercial purposes
- 🔄 **ShareAlike** — If you remix, transform, or build upon the material, you must distribute your contributions under the same license

> **For commercial licensing inquiries, please contact the project author.**

---

## 🤝 Contributing

Contributions are welcome! Issues and pull requests are appreciated.

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

---

## 🙏 Acknowledgements

- [Anthropic Claude](https://www.anthropic.com/) — AI content understanding & restructuring
- [Next.js](https://nextjs.org/) — Full-stack React framework
- [Tailwind CSS](https://tailwindcss.com/) — Utility-first CSS
- [JSZip](https://stuk.github.io/jszip/) — PPTX ZIP decompression
- [Lucide](https://lucide.dev/) — Icon library

---

<p align="center">
  <strong>Web Deck</strong> — Making every Presentations seen in the most modern way ✨
</p>

