import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname),
    },
  },
  test: {
    globals: true,
    environment: "node",
    include: ["**/__tests__/**/*.test.ts"],
    coverage: {
      provider: "v8",
      include: [
        // AI
        "lib/ai/schema.ts",
        "lib/ai/MockAIProvider.ts",
        "lib/ai/AnthropicAIProvider.ts",
        "lib/ai/OpenAIProvider.ts",
        "lib/ai/OllamaProvider.ts",
        "lib/ai/getAIProvider.ts",
        "lib/ai/prompts.ts",
        // Deck core
        "lib/deck/normalize.ts",
        "lib/deck/theme.ts",
        "lib/deck/parseCsv.ts",
        "lib/deck/publishChecks.ts",
        "lib/deck/sectionRegistry.ts",
        // PPTX parsing
        "lib/pptx/parsePptx.ts",
        "lib/pptx/extractSlideText.ts",
        "lib/pptx/extractImages.ts",
        "lib/pptx/importQuality.ts",
        // Export
        "lib/export/exportStaticHtml.ts",
        "lib/export/exportPptx.ts",
        "lib/export/exportMarkdown.ts",
        "lib/export/exportPdf.ts",
        "lib/export/renderChartStatic.ts",
        // Chart
        "lib/chart/core.ts",
        // Async pipeline
        "lib/workers/queue.ts",
        // Storage
        "lib/storage/db.ts",
        "lib/storage/projectRepo.ts",
      ],
      // Coverage gate (vitest exits non-zero if any threshold is unmet), so a
      // regression in coverage fails CI. Thresholds are set slightly below the
      // v0.4 measured baseline to act as a ratchet: raise them as coverage grows.
      thresholds: {
        statements: 65,
        branches: 55,
        functions: 70,
        lines: 65,
      },
    },
  },
});
