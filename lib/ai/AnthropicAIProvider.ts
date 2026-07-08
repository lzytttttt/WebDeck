import Anthropic from "@anthropic-ai/sdk";
import type { AIProvider, GenerateWebDeckInput, GenerateSuggestionsInput } from "./AIProvider";
import type { WebDeck, EnhancementSuggestion } from "@/types/deck";
import { mockProvider } from "./MockAIProvider";
import { validateWebDeck, validateWebDeckWithZod, validateSuggestions, validateSuggestionsWithZod } from "./schema";
import {
  WEB_DECK_SYSTEM_PROMPT,
  buildWebDeckUserPrompt,
  SUGGESTIONS_SYSTEM_PROMPT,
  buildSuggestionsUserPrompt,
} from "./prompts";
import { uid } from "@/lib/utils";

const DEFAULT_MODEL = "claude-3-5-sonnet-20240620";

// Pull the first {...} or [...] JSON blob out of a model response, tolerating
// stray prose or code fences the model may add despite instructions.
function extractJson(text: string): unknown {
  const trimmed = text.trim().replace(/^```(?:json)?/i, "").replace(/```$/, "").trim();
  try {
    return JSON.parse(trimmed);
  } catch {
    // Find the first balanced object/array by bracket matching.
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

export class AnthropicAIProvider implements AIProvider {
  readonly name = "anthropic";
  private client: Anthropic;
  private model: string;

  constructor(apiKey: string, model = process.env.ANTHROPIC_MODEL || DEFAULT_MODEL) {
    this.client = new Anthropic({ apiKey });
    this.model = model;
  }

  private async complete(system: string, user: string): Promise<string> {
    const res = await this.client.messages.create({
      model: this.model,
      max_tokens: 4096,
      system,
      messages: [{ role: "user", content: user }],
    });
    const block = res.content.find((b) => b.type === "text");
    return block && block.type === "text" ? block.text : "";
  }

  async generateWebDeck(input: GenerateWebDeckInput): Promise<WebDeck> {
    try {
      const text = await this.complete(
        WEB_DECK_SYSTEM_PROMPT,
        buildWebDeckUserPrompt(input.projectName, input.slides, input.mode)
      );
      const parsed = extractJson(text);
      const deck = validateWebDeckWithZod(parsed) ?? validateWebDeck(parsed);
      if (deck) {
        // Ensure ids and mode are consistent with the request.
        deck.id = deck.id || uid("deck_");
        deck.mode = input.mode;
        if (!deck.suggestions.length) {
          deck.suggestions = await mockProvider.generateSuggestions({
            slides: input.slides,
          });
        }
        return deck;
      }
    } catch (err) {
      console.error("[AnthropicAIProvider] generateWebDeck failed, falling back:", err);
    }
    // Fallback: never leave the user without a deck.
    return mockProvider.generateWebDeck(input);
  }

  async generateSuggestions(
    input: GenerateSuggestionsInput
  ): Promise<EnhancementSuggestion[]> {
    try {
      const text = await this.complete(
        SUGGESTIONS_SYSTEM_PROMPT,
        buildSuggestionsUserPrompt(input.slides)
      );
      const parsed = extractJson(text);
      const suggestions = validateSuggestions(parsed);
      if (suggestions) return suggestions;
    } catch (err) {
      console.error("[AnthropicAIProvider] generateSuggestions failed, falling back:", err);
    }
    return mockProvider.generateSuggestions(input);
  }
}
