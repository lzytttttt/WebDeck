import type { AIProvider, GenerateWebDeckInput, GenerateSuggestionsInput } from "./AIProvider";
import type { WebDeck, EnhancementSuggestion } from "@/types/deck";
import { mockProvider } from "./MockAIProvider";
import {
  validateWebDeck,
  validateWebDeckWithZod,
  validateSuggestions,
  validateSuggestionsWithZod,
} from "./schema";
import {
  WEB_DECK_SYSTEM_PROMPT,
  buildWebDeckUserPrompt,
  SUGGESTIONS_SYSTEM_PROMPT,
  buildSuggestionsUserPrompt,
} from "./prompts";
import { uid } from "@/lib/utils";

const DEFAULT_BASE_URL = "http://localhost:11434";
const DEFAULT_MODEL = "llama3";

// Shared JSON extractor — see OpenAIProvider / AnthropicAIProvider.
function extractJson(text: string): unknown {
  const trimmed = text
    .trim()
    .replace(/^```(?:json)?/i, "")
    .replace(/```$/, "")
    .trim();
  try {
    return JSON.parse(trimmed);
  } catch {
    const start = trimmed.search(/[[{]/);
    if (start === -1) return null;
    const open = trimmed[start];
    const close = open === "{" ? "}" : "]";
    let depth = 0;
    for (let i = start; i < trimmed.length; i += 1) {
      if (trimmed[i] === open) depth += 1;
      else if (trimmed[i] === close) {
        depth -= 1;
        if (depth === 0) {
          try {
            return JSON.parse(trimmed.slice(start, i + 1));
          } catch {
            return null;
          }
        }
      }
    }
    return null;
  }
}

/**
 * Ollama provider — talks to a local Ollama instance via its OpenAI-compatible
 * `/v1/chat/completions` endpoint (Ollama ≥ 0.1.24) or the native `/api/chat`
 * endpoint as fallback.
 *
 * Default base URL: http://localhost:11434
 *
 * Environment variables:
 *   OLLAMA_BASE_URL  – base URL (default http://localhost:11434)
 *   OLLAMA_MODEL     – model name (default "llama3")
 */
export class OllamaProvider implements AIProvider {
  readonly name = "ollama";
  readonly capabilities = {
    streaming: false,
    maxSlides: 30,
  };

  private baseUrl: string;
  private model: string;

  constructor(
    baseUrl = process.env.OLLAMA_BASE_URL || DEFAULT_BASE_URL,
    model = process.env.OLLAMA_MODEL || DEFAULT_MODEL,
  ) {
    this.baseUrl = baseUrl.replace(/\/+$/, "");
    this.model = model;
  }

  // ---- helpers --------------------------------------------------------------

  /** Try the OpenAI-compatible endpoint first; fall back to native /api/chat. */
  private async complete(system: string, user: string): Promise<string> {
    // Attempt OpenAI-compatible endpoint.
    try {
      return await this.completeOpenAICompat(system, user);
    } catch {
      // Fall through to native endpoint.
    }
    return this.completeNative(system, user);
  }

  private async completeOpenAICompat(system: string, user: string): Promise<string> {
    const res = await fetch(`${this.baseUrl}/v1/chat/completions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: this.model,
        messages: [
          { role: "system", content: system },
          { role: "user", content: user },
        ],
        stream: false,
      }),
    });
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      throw new Error(`Ollama OpenAI-compat error ${res.status}: ${body}`);
    }
    const data = (await res.json()) as {
      choices?: { message?: { content?: string } }[];
    };
    return data.choices?.[0]?.message?.content ?? "";
  }

  private async completeNative(system: string, user: string): Promise<string> {
    const res = await fetch(`${this.baseUrl}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: this.model,
        messages: [
          { role: "system", content: system },
          { role: "user", content: user },
        ],
        stream: false,
      }),
    });
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      throw new Error(`Ollama native error ${res.status}: ${body}`);
    }
    // Native Ollama returns streaming NDJSON even with stream:false in some
    // versions. Concatenate all message.content fields.
    const text = await res.text();
    // Try parsing as a single JSON object first.
    try {
      const obj = JSON.parse(text) as { message?: { content?: string } };
      if (obj.message?.content) return obj.message.content;
    } catch {
      // NDJSON — one JSON object per line.
      const chunks: string[] = [];
      for (const line of text.split("\n")) {
        if (!line.trim()) continue;
        try {
          const obj = JSON.parse(line) as { message?: { content?: string } };
          if (obj.message?.content) chunks.push(obj.message.content);
        } catch {
          // skip malformed lines
        }
      }
      if (chunks.length > 0) return chunks.join("");
    }
    return "";
  }

  // ---- public API -----------------------------------------------------------

  async generateWebDeck(input: GenerateWebDeckInput): Promise<WebDeck> {
    const { onProgress } = input;
    try {
      onProgress?.(10);
      const text = await this.complete(
        WEB_DECK_SYSTEM_PROMPT,
        buildWebDeckUserPrompt(input.projectName, input.slides, input.mode),
      );
      onProgress?.(50);
      const parsed = extractJson(text);
      const deck = validateWebDeckWithZod(parsed) ?? validateWebDeck(parsed);
      if (deck) {
        onProgress?.(70);
        deck.id = deck.id || uid("deck_");
        deck.mode = input.mode;
        if (!deck.suggestions.length) {
          onProgress?.(80);
          deck.suggestions = await mockProvider.generateSuggestions({
            slides: input.slides,
          });
        }
        onProgress?.(95);
        return deck;
      }
    } catch (err) {
      console.error("[OllamaProvider] generateWebDeck failed, falling back:", err);
    }
    return mockProvider.generateWebDeck(input);
  }

  async generateSuggestions(
    input: GenerateSuggestionsInput,
  ): Promise<EnhancementSuggestion[]> {
    try {
      const text = await this.complete(
        SUGGESTIONS_SYSTEM_PROMPT,
        buildSuggestionsUserPrompt(input.slides),
      );
      const parsed = extractJson(text);
      const suggestions =
        validateSuggestionsWithZod(parsed) ?? validateSuggestions(parsed);
      if (suggestions) return suggestions;
    } catch (err) {
      console.error(
        "[OllamaProvider] generateSuggestions failed, falling back:",
        err,
      );
    }
    return mockProvider.generateSuggestions(input);
  }

  // ---- discovery -----------------------------------------------------------

  /**
   * List models available on the Ollama instance. Calls GET /api/tags.
   * Returns an empty array when the instance is unreachable.
   */
  async listModels(): Promise<string[]> {
    try {
      const res = await fetch(`${this.baseUrl}/api/tags`);
      if (!res.ok) return [];
      const data = (await res.json()) as { models?: { name: string }[] };
      return (data.models ?? []).map((m) => m.name);
    } catch {
      return [];
    }
  }
}
