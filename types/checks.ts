import type { ImportWarningType } from "./project";

// v0.3 pre-delivery checks. Results are locale-independent: each carries a
// stable `id` (+ optional sectionIndex) that the UI localizes at render time,
// so the same computed result serves both zh-CN and en.

// ---------------------------------------------------------------------------
// Publish checklist
// ---------------------------------------------------------------------------

export type PublishCheckId =
  | "title"
  | "empty-sections"
  | "empty-titles"
  | "image-missing"
  | "chart-empty"
  | "faq-empty"
  | "min-sections"
  | "mobile-width"
  | "exportable";

export type PublishCheckStatus = "pass" | "warning" | "fail";

export type PublishCheck = {
  id: PublishCheckId;
  status: PublishCheckStatus;
  // 1-based section position for messages that reference a specific section.
  sectionIndex?: number;
};

// ---------------------------------------------------------------------------
// Export check
// ---------------------------------------------------------------------------

export type ExportWarningId =
  | "noSections"
  | "missingImage"
  | "emptyChart"
  | "noTitle"
  | "largeSize";

export type ExportWarning = {
  id: ExportWarningId;
  sectionIndex?: number;
};

export type ExportCheck = {
  canExport: boolean;
  warnings: ExportWarning[];
  estimatedSizeKb: number;
  includesImages: boolean;
  includesCharts: boolean;
};

// Re-export so consumers import check + warning types from one module.
export type { ImportWarningType };
