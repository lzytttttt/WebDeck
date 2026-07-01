// PPTX parsing types. Kept separate so the parser can evolve independently
// of the app-level ParsedSlide (which lives in types/project.ts).

export type SlideTextBlock = {
  // A paragraph's worth of text, joined from its runs.
  text: string;
  // Number of runs merged; a rough signal of emphasis/length.
  runCount: number;
};

export type ExtractedSlide = {
  index: number; // 1-based, in slide file order
  blocks: SlideTextBlock[];
  notes?: string;
  imageRefCount: number;
  tableRefCount: number;
};
