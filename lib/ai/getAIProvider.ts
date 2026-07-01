import type { AIProvider } from "./AIProvider";
import { mockProvider } from "./MockAIProvider";
import { AnthropicAIProvider } from "./AnthropicAIProvider";

// Provider selection: use Anthropic when a key is present, otherwise the
// offline mock. Kept as a function so env is read at call time (server only).
export function getAIProvider(): AIProvider {
  const key = process.env.ANTHROPIC_API_KEY;
  if (key && key.trim().length > 0) {
    return new AnthropicAIProvider(key.trim());
  }
  return mockProvider;
}
