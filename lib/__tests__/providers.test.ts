import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// We import the factory and providers under test. Tests manipulate
// process.env to exercise different provider-selection branches.

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeSlides(n: number) {
  return Array.from({ length: n }, (_, i) => ({
    id: `slide-${i}`,
    index: i,
    title: `Slide ${i}`,
    rawText: `Content of slide ${i}`,
    bullets: [`Bullet ${i}-1`, `Bullet ${i}-2`],
  }));
}

// ---------------------------------------------------------------------------
// Provider selection (getAIProvider)
// ---------------------------------------------------------------------------

describe("getAIProvider", () => {
  const origEnv = { ...process.env };

  beforeEach(() => {
    // Clear relevant env vars before each test.
    delete process.env.AI_PROVIDER;
    delete process.env.ANTHROPIC_API_KEY;
    delete process.env.OPENAI_API_KEY;
    delete process.env.OLLAMA_BASE_URL;
  });

  afterEach(() => {
    // Restore original env.
    process.env = { ...origEnv };
    vi.restoreAllMocks();
  });

  it("returns mock when no env vars are set", async () => {
    const { getAIProvider } = await import("@/lib/ai/getAIProvider");
    const provider = getAIProvider();
    expect(provider.name).toBe("mock");
  });

  it("returns anthropic when AI_PROVIDER=anthropic and key is set", async () => {
    process.env.AI_PROVIDER = "anthropic";
    process.env.ANTHROPIC_API_KEY = "test-key";
    const { getAIProvider } = await import("@/lib/ai/getAIProvider");
    const provider = getAIProvider();
    expect(provider.name).toBe("anthropic");
  });

  it("returns openai when AI_PROVIDER=openai and key is set", async () => {
    process.env.AI_PROVIDER = "openai";
    process.env.OPENAI_API_KEY = "test-key";
    const { getAIProvider } = await import("@/lib/ai/getAIProvider");
    const provider = getAIProvider();
    expect(provider.name).toBe("openai");
  });

  it("returns ollama when AI_PROVIDER=ollama", async () => {
    process.env.AI_PROVIDER = "ollama";
    const { getAIProvider } = await import("@/lib/ai/getAIProvider");
    const provider = getAIProvider();
    expect(provider.name).toBe("ollama");
  });

  it("returns mock when AI_PROVIDER=mock", async () => {
    process.env.AI_PROVIDER = "mock";
    const { getAIProvider } = await import("@/lib/ai/getAIProvider");
    const provider = getAIProvider();
    expect(provider.name).toBe("mock");
  });

  it("falls back to mock when AI_PROVIDER=anthropic but no key", async () => {
    process.env.AI_PROVIDER = "anthropic";
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    const { getAIProvider } = await import("@/lib/ai/getAIProvider");
    const provider = getAIProvider();
    expect(provider.name).toBe("mock");
    expect(warnSpy).toHaveBeenCalled();
  });

  it("falls back to mock when AI_PROVIDER=openai but no key", async () => {
    process.env.AI_PROVIDER = "openai";
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    const { getAIProvider } = await import("@/lib/ai/getAIProvider");
    const provider = getAIProvider();
    expect(provider.name).toBe("mock");
    expect(warnSpy).toHaveBeenCalled();
  });

  it("auto-detects anthropic from ANTHROPIC_API_KEY when AI_PROVIDER is unset", async () => {
    process.env.ANTHROPIC_API_KEY = "sk-test";
    const { getAIProvider } = await import("@/lib/ai/getAIProvider");
    const provider = getAIProvider();
    expect(provider.name).toBe("anthropic");
  });

  it("auto-detects openai from OPENAI_API_KEY when AI_PROVIDER is unset", async () => {
    process.env.OPENAI_API_KEY = "sk-test";
    const { getAIProvider } = await import("@/lib/ai/getAIProvider");
    const provider = getAIProvider();
    expect(provider.name).toBe("openai");
  });
});

// ---------------------------------------------------------------------------
// withFallback
// ---------------------------------------------------------------------------

describe("withFallback", () => {
  it("delegates to primary on success", async () => {
    const { withFallback } = await import("@/lib/ai/getAIProvider");
    const { mockProvider } = await import("@/lib/ai/MockAIProvider");

    const primary = {
      name: "primary",
      capabilities: { streaming: false, maxSlides: 10 },
      generateWebDeck: vi.fn().mockResolvedValue({ id: "ok" }),
      generateSuggestions: vi.fn().mockResolvedValue([]),
    };

    const wrapped = withFallback(primary as any, mockProvider);
    const slides = makeSlides(3);
    const result = await wrapped.generateWebDeck({
      projectName: "test",
      slides,
      mode: "conservative",
    });
    expect(result).toEqual({ id: "ok" });
    expect(primary.generateWebDeck).toHaveBeenCalled();
  });

  it("falls back when primary throws", async () => {
    const { withFallback } = await import("@/lib/ai/getAIProvider");
    const { mockProvider } = await import("@/lib/ai/MockAIProvider");

    const primary = {
      name: "failing",
      capabilities: { streaming: false, maxSlides: 10 },
      generateWebDeck: vi.fn().mockRejectedValue(new Error("boom")),
      generateSuggestions: vi.fn().mockRejectedValue(new Error("boom")),
    };

    const errSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const wrapped = withFallback(primary as any, mockProvider);
    const slides = makeSlides(3);
    const result = await wrapped.generateWebDeck({
      projectName: "test",
      slides,
      mode: "conservative",
    });
    // Should have a valid deck from mock.
    expect(result.id).toBeTruthy();
    expect(result.sections.length).toBeGreaterThan(0);
    expect(errSpy).toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// MockAIProvider — interface compliance
// ---------------------------------------------------------------------------

describe("MockAIProvider", () => {
  it("implements capabilities", async () => {
    const { MockAIProvider } = await import("@/lib/ai/MockAIProvider");
    const provider = new MockAIProvider();
    expect(provider.capabilities).toBeDefined();
    expect(typeof provider.capabilities.streaming).toBe("boolean");
    expect(typeof provider.capabilities.maxSlides).toBe("number");
  });

  it("generates a valid deck from slides", async () => {
    const { MockAIProvider } = await import("@/lib/ai/MockAIProvider");
    const provider = new MockAIProvider();
    const slides = makeSlides(5);
    const deck = await provider.generateWebDeck({
      projectName: "Test",
      slides,
      mode: "enhanced",
    });
    expect(deck.title).toBeTruthy();
    expect(deck.sections.length).toBeGreaterThan(0);
    expect(deck.suggestions.length).toBeGreaterThan(0);
    expect(deck.mode).toBe("enhanced");
  });
});

// ---------------------------------------------------------------------------
// OpenAIProvider — interface compliance (no real HTTP)
// ---------------------------------------------------------------------------

describe("OpenAIProvider", () => {
  it("implements the AIProvider interface", async () => {
    const { OpenAIProvider } = await import("@/lib/ai/OpenAIProvider");
    const provider = new OpenAIProvider("test-key");
    expect(provider.name).toBe("openai");
    expect(provider.capabilities.streaming).toBe(true);
    expect(typeof provider.generateWebDeck).toBe("function");
    expect(typeof provider.generateSuggestions).toBe("function");
  });

  it("falls back to mock when fetch fails", async () => {
    const { OpenAIProvider } = await import("@/lib/ai/OpenAIProvider");
    const provider = new OpenAIProvider("test-key", "gpt-4o", "http://localhost:1");

    // fetch will fail (connection refused).
    const errSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const slides = makeSlides(3);
    const deck = await provider.generateWebDeck({
      projectName: "Test",
      slides,
      mode: "conservative",
    });
    // Should get a mock-generated deck as fallback.
    expect(deck.sections.length).toBeGreaterThan(0);
    expect(errSpy).toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// OllamaProvider — interface compliance
// ---------------------------------------------------------------------------

describe("OllamaProvider", () => {
  it("implements the AIProvider interface", async () => {
    const { OllamaProvider } = await import("@/lib/ai/OllamaProvider");
    const provider = new OllamaProvider("http://localhost:11434");
    expect(provider.name).toBe("ollama");
    expect(provider.capabilities.streaming).toBe(false);
    expect(typeof provider.generateWebDeck).toBe("function");
    expect(typeof provider.generateSuggestions).toBe("function");
    expect(typeof provider.listModels).toBe("function");
  });

  it("falls back to mock when Ollama is unreachable", async () => {
    const { OllamaProvider } = await import("@/lib/ai/OllamaProvider");
    const provider = new OllamaProvider("http://localhost:1");

    const errSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const slides = makeSlides(3);
    const deck = await provider.generateWebDeck({
      projectName: "Test",
      slides,
      mode: "conservative",
    });
    expect(deck.sections.length).toBeGreaterThan(0);
    expect(errSpy).toHaveBeenCalled();
  });

  it("listModels returns empty array when unreachable", async () => {
    const { OllamaProvider } = await import("@/lib/ai/OllamaProvider");
    const provider = new OllamaProvider("http://localhost:1");
    const models = await provider.listModels();
    expect(models).toEqual([]);
  });
});
