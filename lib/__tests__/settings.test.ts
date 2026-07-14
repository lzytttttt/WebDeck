import { describe, it, expect, beforeAll } from "vitest";
import { ensureDb, getDb } from "@/lib/storage/db";
import { getAIConfig, setAIConfig } from "@/lib/storage/settings";

describe("AI settings store", () => {
  beforeAll(async () => {
    await ensureDb();
  });

  it("falls back to mock when nothing is configured", () => {
    getDb().prepare("DELETE FROM settings").run();
    delete process.env.AI_PROVIDER;
    delete process.env.ANTHROPIC_API_KEY;
    delete process.env.OPENAI_API_KEY;

    expect(getAIConfig().provider).toBe("mock");
  });

  it("round-trips a saved provider configuration", () => {
    const saved = setAIConfig({
      provider: "openai",
      openaiKey: "sk-test",
      openaiModel: "gpt-4o",
    });
    expect(saved.provider).toBe("openai");
    expect(saved.openaiKey).toBe("sk-test");
    expect(saved.openaiModel).toBe("gpt-4o");

    const cfg = getAIConfig();
    expect(cfg.provider).toBe("openai");
    expect(cfg.openaiKey).toBe("sk-test");
    expect(cfg.openaiModel).toBe("gpt-4o");
  });

  it("prefers saved settings over environment fallbacks", () => {
    setAIConfig({ provider: "ollama", ollamaUrl: "http://localhost:11434" });
    process.env.AI_PROVIDER = "anthropic";
    process.env.ANTHROPIC_API_KEY = "sk-env";
    expect(getAIConfig().provider).toBe("ollama");
    delete process.env.AI_PROVIDER;
    delete process.env.ANTHROPIC_API_KEY;
  });

  it("rejects an unknown provider", () => {
    expect(() => setAIConfig({ provider: "nope" as never })).toThrow();
  });
});
