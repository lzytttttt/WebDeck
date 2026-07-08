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
        "lib/ai/schema.ts",
        "lib/deck/normalize.ts",
        "lib/deck/theme.ts",
        "lib/deck/parseCsv.ts",
        "lib/deck/publishChecks.ts",
        "lib/pptx/extractSlideText.ts",
      ],
    },
  },
});
