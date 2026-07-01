"use client";

import { useState } from "react";
import { ChevronDown, ChevronRight, AlertTriangle, Info } from "lucide-react";
import { useI18n } from "@/lib/i18n/I18nProvider";
import type { ImportQualityReport } from "@/types/project";
import { cn } from "@/lib/utils";

// Collapsible import-quality panel (spec 3 + 13.10). Stats and warnings are
// rendered from the locale-independent report through i18n formatters, so the
// same stored report reads natively in zh-CN and en.
export function ImportQualityPanel({ report }: { report: ImportQualityReport }) {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const iq = t.importQuality;

  const stats: string[] = [
    iq.slidesDetected(report.slidesCount),
    iq.textBlocks(report.textBlocksCount),
    iq.titlesDetected(report.detectedTitlesCount),
  ];
  if (report.imagesDetectedCount) stats.push(iq.images(report.imagesDetectedCount));
  if (report.tablesDetectedCount) stats.push(iq.tables(report.tablesDetectedCount));

  return (
    <div className="border-b bg-secondary/20">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between px-5 py-2 text-sm"
      >
        <span className="flex items-center gap-2 font-medium text-foreground">
          {open ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          {iq.title}
          <span className="text-muted-foreground">· {iq.needReview(report.warningCount)}</span>
        </span>
        <span className="text-xs text-muted-foreground">{open ? iq.collapse : iq.expand}</span>
      </button>

      {open ? (
        <div className="px-5 pb-4">
          <div className="mb-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
            {stats.map((s, i) => (
              <span key={i}>{s}</span>
            ))}
          </div>
          {report.warnings.length === 0 ? (
            <p className="text-xs text-accent">{iq.noWarnings}</p>
          ) : (
            <ul className="space-y-1.5">
              {report.warnings.map((w) => {
                const critical = w.severity === "warning" || w.severity === "critical";
                return (
                  <li
                    key={w.id}
                    className={cn(
                      "flex items-start gap-2 rounded-md px-2 py-1.5 text-xs",
                      critical ? "bg-amber-500/10 text-amber-700" : "bg-secondary/50 text-muted-foreground",
                    )}
                  >
                    {critical ? (
                      <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                    ) : (
                      <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                    )}
                    <span>{iq.warnings[w.type](w.slideIndex)}</span>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      ) : null}
    </div>
  );
}
