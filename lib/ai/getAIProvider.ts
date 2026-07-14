import type { AIProvider } from "./AIProvider";
import { mockProvider } from "./MockAIProvider";
import { AnthropicAIProvider } from "./AnthropicAIProvider";
import { OpenAIProvider } from "./OpenAIProvider";
import { OllamaProvider } from "./OllamaProvider";

export type ProviderName = "anthropic" | "openai" | "ollama" | "mock";

/**
 * Optional overrides for provider selection. When supplied (e.g. from the
 * user-saved settings), these take precedence over environment variables.
 */
export interface ProviderOptions {
  provider?: ProviderName;
  anthropicKey?: string;
  openaiKey?: string;
  openaiModel?: string;
  ollamaUrl?: string;
}

/**
 * Resolve the desired provider, preferring an explicit override, then the
 * AI_PROVIDER env var, then auto-detecting from available API keys.
 */
function resolveRequestedProvider(opts?: ProviderOptions): ProviderName {
  const raw = (opts?.provider ?? (process.env.AI_PROVIDER || "")).trim().toLowerCase();
  if (raw === "anthropic" || raw === "openai" || raw === "ollama" || raw === "mock") {
    return raw;
  }
  // Legacy behaviour: auto-detect from available keys.
  if (process.env.ANTHROPIC_API_KEY?.trim()) return "anthropic";
  if (process.env.OPENAI_API_KEY?.trim()) return "openai";
  return "mock";
}

function createProvider(name: ProviderName, opts?: ProviderOptions): AIProvider | null {
  switch (name) {
    case "anthropic": {
      const key = opts?.anthropicKey ?? process.env.ANTHROPIC_API_KEY?.trim();
      if (!key) return null;
      return new AnthropicAIProvider(key, process.env.ANTHROPIC_MODEL);
    }
    case "openai": {
      const key = opts?.openaiKey ?? process.env.OPENAI_API_KEY?.trim();
      if (!key) return null;
      return new OpenAIProvider(key, opts?.openaiModel || undefined);
    }
    case "ollama": {
      return new OllamaProvider(opts?.ollamaUrl || undefined);
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
 *   1. explicit `opts` (user-saved settings) or AI_PROVIDER env var
 *   2. Auto-detect from available API keys (legacy)
 *   3. MockAIProvider (offline default)
 *
 * Fallback: if the requested provider creation fails (e.g. missing key),
 * the function tries mock as a last resort so the user always gets a deck.
 */
export function getAIProvider(opts?: ProviderOptions): AIProvider {
  const requested = resolveRequestedProvider(opts);
  const provider = createProvider(requested, opts);
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
