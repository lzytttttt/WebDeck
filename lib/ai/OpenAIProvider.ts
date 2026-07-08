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

const DEFAULT_MODEL = "gpt-4o";
const DEFAULT_BASE_URL = "https://api.openai.com/v1";

// Re-extractJson — identical logic to AnthropicAIProvider. Kept local so each
// provider file is self-contained and can be tree-shaken independently.
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

export class OpenAIProvider implements AIProvider {
  readonly name = "openai";
  readonly capabilities = {
    streaming: true,
    maxSlides: 100,
  };

  private apiKey: string;
  private baseUrl: string;
  private model: string;

  constructor(
    apiKey: string,
    model = process.env.OPENAI_MODEL || DEFAULT_MODEL,
    baseUrl = process.env.OPENAI_BASE_URL || DEFAULT_BASE_URL,
  ) {
    this.apiKey = apiKey;
    this.baseUrl = baseUrl.replace(/\/+$/, "");
    this.model = model;
  }

  private async complete(system: string, user: string): Promise<string> {
    const res = await fetch(`${this.baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: this.model,
        max_tokens: 4096,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: system },
          { role: "user", content: user },
        ],
      }),
    });

    if (!res.ok) {
      const body = await res.text().catch(() => "");
      throw new Error(`OpenAI API error ${res.status}: ${body}`);
    }

    const data = (await res.json()) as {
      choices?: { message?: { content?: string } }[];
    };
    return data.choices?.[0]?.message?.content ?? "";
  }

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
      console.error("[OpenAIProvider] generateWebDeck failed, falling back:", err);
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
        "[OpenAIProvider] generateSuggestions failed, falling back:",
        err,
      );
    }
    return mockProvider.generateSuggestions(input);
  }
}
