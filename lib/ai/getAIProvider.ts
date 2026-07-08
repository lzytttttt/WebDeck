import type { AIProvider } from "./AIProvider";
import { mockProvider } from "./MockAIProvider";
import { AnthropicAIProvider } from "./AnthropicAIProvider";
import { OpenAIProvider } from "./OpenAIProvider";
import { OllamaProvider } from "./OllamaProvider";

export type ProviderName = "anthropic" | "openai" | "ollama" | "mock";

/**
 * Resolve the desired provider from the AI_PROVIDER env var.
 * Falls back to "anthropic" when a key is present, otherwise "mock".
 */
function resolveRequestedProvider(): ProviderName {
  const raw = (process.env.AI_PROVIDER || "").trim().toLowerCase();
  if (raw === "anthropic" || raw === "openai" || raw === "ollama" || raw === "mock") {
    return raw;
  }
  // Legacy behaviour: auto-detect from available keys.
  if (process.env.ANTHROPIC_API_KEY?.trim()) return "anthropic";
  if (process.env.OPENAI_API_KEY?.trim()) return "openai";
  return "mock";
}

function createProvider(name: ProviderName): AIProvider | null {
  switch (name) {
    case "anthropic": {
      const key = process.env.ANTHROPIC_API_KEY?.trim();
      if (!key) return null;
      return new AnthropicAIProvider(key);
    }
    case "openai": {
      const key = process.env.OPENAI_API_KEY?.trim();
      if (!key) return null;
      return new OpenAIProvider(key);
    }
    case "ollama": {
      return new OllamaProvider();
    }
    case "mock":
      return mockProvider;
    default:
      return null;
  }
}

/**
 * Multi-provider factory with automatic fallback.
 *
 * Selection order:
 *   1. AI_PROVIDER env var (explicit choice)
 *   2. Auto-detect from available API keys (legacy)
 *   3. MockAIProvider (offline default)
 *
 * Fallback: if the requested provider creation fails (e.g. missing key),
 * the function tries mock as a last resort so the user always gets a deck.
 */
export function getAIProvider(): AIProvider {
  const requested = resolveRequestedProvider();
  const provider = createProvider(requested);
  if (provider) return provider;

  // Fallback chain: requested → mock.
  console.warn(
    `[getAIProvider] "${requested}" provider unavailable (missing API key?). Falling back to mock.`,
  );
  return mockProvider;
}

/**
 * Wraps a provider with fallback logic: if the primary provider's
 * generateWebDeck throws, the fallback provider is used instead.
 */
export function withFallback(primary: AIProvider, fallback: AIProvider): AIProvider {
  return {
    get name() {
      return primary.name;
    },
    get capabilities() {
      return primary.capabilities;
    },
    async generateWebDeck(input) {
      try {
        return await primary.generateWebDeck(input);
      } catch (err) {
        console.error(
          `[withFallback] ${primary.name} failed, falling back to ${fallback.name}:`,
          err,
        );
        return fallback.generateWebDeck(input);
      }
    },
    async generateSuggestions(input) {
      try {
        return await primary.generateSuggestions(input);
      } catch (err) {
        console.error(
          `[withFallback] ${primary.name} failed, falling back to ${fallback.name}:`,
          err,
        );
        return fallback.generateSuggestions(input);
      }
    },
  };
}
