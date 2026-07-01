import type { ParsedSlide } from "@/types/project";
import type {
  WebDeck,
  EnhancementSuggestion,
  DeckMode,
} from "@/types/deck";

export type GenerateWebDeckInput = {
  projectName: string;
  slides: ParsedSlide[];
  mode: DeckMode;
};

export type GenerateSuggestionsInput = {
  slides: ParsedSlide[];
};

export interface AIProvider {
  readonly name: string;
  generateWebDeck(input: GenerateWebDeckInput): Promise<WebDeck>;
  generateSuggestions(
    input: GenerateSuggestionsInput
  ): Promise<EnhancementSuggestion[]>;
}
