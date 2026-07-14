# Changelog

All notable changes to Web Deck are documented in this file. The project follows
semantic versioning, but version numbers are aligned to the published Roadmap
milestones (`v0.2` / `v0.3` / `v0.4` / …) rather than strict SemVer.

## [v0.4.0]

### Quality baseline (this release)
- **CI/CD**: added GitHub Actions workflow (`.github/workflows/ci.yml`) running
  `lint` → `build` → `test` as required gates on every push/PR.
- **Test coverage gate**: expanded Vitest coverage collection to core `lib/`
  modules (AI, deck, pptx, export, chart, async queue, storage) and added a
  coverage threshold so regressions in coverage fail CI.
- **Version governance**: aligned `package.json` to `0.4.0` and introduced this
  changelog. Previously the version was stuck at `0.1.0` despite multiple
  completed phases.
- **Lint setup**: added `eslint` + `eslint-config-next` and `.eslintrc.json`
  (`next/core-web-vitals`). Fixed two malformed `eslint-disable` comments that
  used an em-dash instead of `--`.

### Animation mapping (this release)
- Parses PPTX slide transitions (`<p:transition>`) and entrance animations
  (`<p:timing>`) and maps them onto the existing `Motion` vocabulary
  (fade / slide-up / scale / stagger), preserving PPT motion in the generated
  deck, editor preview, and static HTML export.

## [v0.3.0] (Phase 2)
- Multi AI Provider support: Anthropic / OpenAI / Ollama / Mock, switchable from
  the editor UI with persistence.
- Custom theme system (colors, typography, radius, shadow, spacing) with
  save/load.
- Async generation pipeline (job queue with progress, cancel, retry).
- PPTX re-export (WebDeck → `.pptx`), closing the PPT → Web → PPT loop.

## [v0.2.0] (Phase 2)
- PPTX image extraction and inlining (base64) into the generated HTML.

## [v0.1.0] (Phase 1)
- Initial release: PPT → interactive Web Deck converter with AI-powered content
  restructuring, visual editor, fullscreen presenter, static HTML export, and
  bilingual (EN/ZH) support.
- Phase 1 architecture-debt fixes: test infrastructure, section registry,
  SQLite storage, error boundary, security hardening, upload split, and Zod
  schemas.
