import type { WebDeck } from "./deck";

export type Asset = {
  id: string;
  projectId: string;
  type: "image";
  fileName: string;
  mimeType: string;
  url: string;
  createdAt: string;
};

export type SlideImage = {
  id: string;
  name: string;
  // MVP: images are not extracted into binary; reference-only placeholder.
  alt?: string;
};

export type ParsedSlide = {
  id: string;
  index: number;
  title: string;
  rawText: string;
  bullets: string[];
  notes?: string;
  images?: SlideImage[];
  // v0.3 import-quality hints: counts of embedded media/table refs harvested
  // from the slide XML (see extractSlideText). Used by buildImportQualityReport.
  imageRefCount?: number;
  tableRefCount?: number;
};

// ---------------------------------------------------------------------------
// Import Quality Report (v0.3): a per-project confidence summary produced at
// upload time from the parsed slides + raw slide XML image/media hints.
// ---------------------------------------------------------------------------

export type ImportWarningType =
  | "empty-slide"
  | "missing-title"
  | "image-heavy"
  | "too-much-text"
  | "low-text-density"
  | "possible-screenshot";

export type ImportWarning = {
  id: string;
  slideIndex: number;
  type: ImportWarningType;
  message: string;
  severity: "info" | "warning" | "critical";
};

export type ImportQualityReport = {
  slidesCount: number;
  textBlocksCount: number;
  detectedTitlesCount: number;
  bulletsCount: number;
  notesCount: number;
  imagesDetectedCount?: number;
  tablesDetectedCount?: number;
  emptySlidesCount: number;
  warningCount: number;
  warnings: ImportWarning[];
};

export type ProjectStatus = "uploaded" | "parsed" | "generated" | "published";

export type ShareConfig = {
  shareId: string;
  isPublished: boolean;
  password?: string;
  expiresAt?: string;
  createdAt: string;
};

export type Project = {
  id: string;
  name: string;
  sourceFileName: string;
  sourceFilePath?: string;
  createdAt: string;
  updatedAt: string;
  status: ProjectStatus;
  slides: ParsedSlide[];
  webDeck?: WebDeck;
  assets?: Asset[];
  share?: ShareConfig;
  importQualityReport?: ImportQualityReport;
  // Seeded demo projects are flagged so /demo can list them and /projects can
  // optionally distinguish them.
  isDemo?: boolean;
  // Locale-aware demo card metadata (only set on demo projects).
  demoMeta?: DemoProjectMetadata;
};

// Demo card copy carries both locales so the gallery follows the UI language
// without translating the deck body itself (spec 13.7).
export type DemoProjectMetadata = {
  key: string;
  theme: string;
  title: { "zh-CN": string; en: string };
  description: { "zh-CN": string; en: string };
};
