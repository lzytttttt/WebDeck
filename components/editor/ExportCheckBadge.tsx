"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, AlertTriangle } from "lucide-react";
import { useI18n } from "@/lib/i18n/I18nProvider";
import type { ExportCheck, ExportWarning } from "@/types/checks";
import type { Dictionary } from "@/lib/i18n/types";
import { cn } from "@/lib/utils";

// Small readiness badge next to the Export button (spec 7). Fetches the
// export-check summary and shows "Ready to export" or "N warnings".
export function ExportCheckBadge({ projectId }: { projectId: string }) {
  const { t } = useI18n();
  const [check, setCheck] = useState<ExportCheck | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let alive = true;
    fetch(`/api/projects/${projectId}/export-check`)
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error("check"))))
      .then((d: ExportCheck) => {
        if (alive) setCheck(d);
      })
      .catch(() => {
        if (alive) setFailed(true);
      });
    return () => {
      alive = false;
    };
  }, [projectId]);

  if (failed) {
    return <span className="text-xs text-muted-foreground">{t.exportCheck.loadError}</span>;
  }
  if (!check) return null;

  const warnCount = check.warnings.length;
  const ok = check.canExport && warnCount === 0;

  return (
    <span
      title={check.warnings.map((w) => warningText(w, t)).join("\n") || undefined}
      className={cn(
        "flex items-center gap-1 text-xs",
        ok ? "text-accent" : "text-amber-600",
      )}
    >
      {ok ? (
        <CheckCircle2 className="h-3.5 w-3.5" />
      ) : (
        <AlertTriangle className="h-3.5 w-3.5" />
      )}
      {!check.canExport
        ? t.exportCheck.cannotExport
        : ok
          ? t.exportCheck.ready
          : t.exportCheck.warnings(warnCount)}
    </span>
  );
}

function warningText(w: ExportWarning, t: Dictionary): string {
  const wl = t.exportCheck.warningList;
  const n = w.sectionIndex ?? 0;
  switch (w.id) {
    case "noSections":
      return wl.noSections;
    case "missingImage":
      return wl.missingImage(n);
    case "emptyChart":
      return wl.emptyChart(n);
    case "noTitle":
      return wl.noTitle;
    case "largeSize":
      return wl.largeSize;
  }
}
