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
  /** Optional progress callback – reports 0-100. */
  onProgress?: (progress: number) => void;
};

export type GenerateSuggestionsInput = {
  slides: ParsedSlide[];
};

export interface AIProvider {
  readonly name: string;
  readonly capabilities: {
    streaming: boolean;
    maxSlides: number;
  };
  generateWebDeck(input: GenerateWebDeckInput): Promise<WebDeck>;
  generateSuggestions(
    input: GenerateSuggestionsInput
  ): Promise<EnhancementSuggestion[]>;
  streamGenerate?(input: GenerateWebDeckInput): AsyncIterable<Partial<WebDeck>>;
}
