"use client";

import { Check, AlertTriangle, X } from "lucide-react";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import type { PublishCheck } from "@/types/checks";
import { cn } from "@/lib/utils";

// Pre-publish checklist modal (spec 5 + 13.9). Renders locale-independent
// check results through i18n. A `fail` blocks publishing; `warning` allows
// publish after explicit confirmation.
export function PublishChecklistModal({
  checks,
  publishing,
  onConfirm,
  onClose,
}: {
  checks: PublishCheck[];
  publishing: boolean;
  onConfirm: () => void;
  onClose: () => void;
}) {
  const { t } = useI18n();
  const pc = t.publishChecklist;

  const hasFail = checks.some((c) => c.status === "fail");
  const hasWarning = checks.some((c) => c.status === "warning");

  const label = (c: PublishCheck): string => {
    const n = c.sectionIndex ?? 0;
    switch (c.id) {
      case "title":
        return c.status === "pass" ? pc.checks.title : pc.checks.titleFail;
      case "empty-sections":
        return c.status === "pass" ? pc.checks.noEmptySections : pc.checks.emptySection(n);
      case "empty-titles":
        return c.status === "pass" ? pc.checks.noEmptyTitles : pc.checks.emptyTitle(n);
      case "image-missing":
        return c.status === "pass" ? pc.checks.imageAssets : pc.checks.imageMissing(n);
      case "chart-empty":
        return c.status === "pass" ? pc.checks.chartData : pc.checks.chartEmpty(n);
      case "faq-empty":
        return c.status === "pass" ? pc.checks.faqAnswers : pc.checks.faqEmpty(n);
      case "min-sections":
        return c.status === "pass" ? pc.checks.minSections : pc.checks.minSectionsFail(n);
      case "mobile-width":
        return c.status === "pass" ? pc.checks.mobileWidth : pc.checks.mobileWide;
      case "exportable":
        return c.status === "pass" ? pc.checks.exportable : pc.checks.exportFail;
    }
  };

  return (
    <Modal
      open
      title={pc.title}
      subtitle={pc.subtitle}
      onClose={onClose}
      footer={
        <>
          <Button variant="outline" size="sm" onClick={onClose}>
            {pc.cancel}
          </Button>
          <Button
            size="sm"
            variant={hasWarning && !hasFail ? "accent" : "default"}
            disabled={hasFail || publishing}
            onClick={onConfirm}
          >
            {publishing
              ? t.editor.publishing
              : hasWarning
                ? pc.publishAnyway
                : pc.publish}
          </Button>
        </>
      }
    >
      <ul className="space-y-2">
        {checks.map((c, i) => (
          <li key={i} className="flex items-start gap-2.5 text-sm">
            <StatusIcon status={c.status} />
            <span
              className={cn(
                c.status === "fail" && "text-destructive",
                c.status === "warning" && "text-amber-700",
                c.status === "pass" && "text-foreground",
              )}
            >
              {label(c)}
            </span>
          </li>
        ))}
      </ul>
      <p className="mt-4 text-xs text-muted-foreground">
        {hasFail ? pc.hasFail : hasWarning ? pc.hasWarning : pc.allPass}
      </p>
    </Modal>
  );
}

function StatusIcon({ status }: { status: PublishCheck["status"] }) {
  if (status === "pass") {
    return <Check className="mt-0.5 h-4 w-4 shrink-0 text-accent" />;
  }
  if (status === "warning") {
    return <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />;
  }
  return <X className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />;
}
