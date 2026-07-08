"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Pencil,
  Play,
  Share2,
  Download,
  Copy,
  Trash2,
} from "lucide-react";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";
import type { AppLocale } from "@/lib/i18n/types";
import type { ProjectSummary } from "@/app/api/projects/route";

const STATUS_VARIANT: Record<
  ProjectSummary["status"],
  "default" | "accent" | "muted" | "outline"
> = {
  uploaded: "muted",
  parsed: "muted",
  generated: "outline",
  published: "accent",
};

export function ProjectCard({
  project,
  busy,
  locale,
  onDuplicate,
  onDelete,
}: {
  project: ProjectSummary;
  busy: boolean;
  locale: AppLocale;
  onDuplicate: () => void;
  onDelete: () => void;
}) {
  const { t } = useI18n();

  return (
    <div className="flex flex-col rounded-2xl border bg-card p-5 shadow-sm transition-shadow hover:shadow-md">
      <div className="mb-2 flex items-start justify-between gap-2">
        <h3 className="line-clamp-2 font-semibold text-foreground">{project.name}</h3>
        <Badge variant={STATUS_VARIANT[project.status]}>
          {t.dashboard.status[project.status]}
        </Badge>
      </div>

      <p className="truncate text-xs text-muted-foreground" title={project.sourceFileName}>
        {t.dashboard.sourceFile}: {project.sourceFileName}
      </p>

      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
        <span>{t.dashboard.sections(project.sectionCount)}</span>
        <span>{project.shared ? t.dashboard.shared : t.dashboard.notShared}</span>
      </div>
      <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
        <span>{t.dashboard.createdAt(formatDate(project.createdAt, locale))}</span>
        <span>{t.dashboard.updatedAt(formatDate(project.updatedAt, locale))}</span>
      </div>

      <div className="mt-4 flex flex-wrap gap-1.5 border-t pt-4">
        <Link href={`/projects/${project.id}/edit`} className="flex-1">
          <button className="flex w-full items-center justify-center gap-1.5 rounded-md bg-accent px-2 py-1.5 text-xs font-semibold text-accent-foreground hover:bg-accent/90">
            <Pencil className="h-3.5 w-3.5" />
            {t.common.edit}
          </button>
        </Link>
        <CardAction href={`/projects/${project.id}/present`} label={t.common.present}>
          <Play className="h-3.5 w-3.5" />
        </CardAction>
        {project.shared ? (
          <CardAction href={`/projects/${project.id}/edit`} label={t.common.share}>
            <Share2 className="h-3.5 w-3.5" />
          </CardAction>
        ) : null}
        <ExportDropdown projectId={project.id} t={t} />
        <button
          onClick={onDuplicate}
          disabled={busy}
          title={t.common.duplicate}
          className="flex items-center justify-center rounded-md border px-2 py-1.5 text-xs text-foreground hover:bg-secondary disabled:opacity-50"
        >
          <Copy className="h-3.5 w-3.5" />
        </button>
        <button
          onClick={onDelete}
          disabled={busy}
          title={t.common.delete}
          className="flex items-center justify-center rounded-md border border-destructive/30 px-2 py-1.5 text-xs text-destructive hover:bg-destructive/10 disabled:opacity-50"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}

function CardAction({
  href,
  label,
  children,
}: {
  href: string;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      title={label}
      className="flex items-center justify-center rounded-md border px-2 py-1.5 text-xs text-foreground hover:bg-secondary"
    >
      {children}
    </Link>
  );
}

function ExportDropdown({
  projectId,
  t,
}: {
  projectId: string;
  t: ReturnType<typeof useI18n>["t"];
}) {
  const [open, setOpen] = useState(false);

  const items = [
    { id: "html", label: t.common.exportHtml },
    { id: "pdf", label: t.common.exportPdf },
    { id: "pptx", label: t.common.exportPptx },
    { id: "markdown", label: t.common.exportMarkdown },
  ];

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        title={t.common.export}
        className="flex items-center justify-center rounded-md border px-2 py-1.5 text-xs text-foreground hover:bg-secondary"
      >
        <Download className="h-3.5 w-3.5" />
      </button>
      {open ? (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setOpen(false)}
          />
          <div className="absolute right-0 bottom-full z-50 mb-1 min-w-[140px] rounded-lg border bg-background shadow-lg">
            {items.map((item) => (
              <a
                key={item.id}
                href={`/api/projects/${projectId}/export-${item.id}`}
                download
                onClick={() => setOpen(false)}
                className="flex w-full items-center px-3 py-2 text-xs text-foreground hover:bg-secondary first:rounded-t-lg last:rounded-b-lg"
              >
                {item.label}
              </a>
            ))}
          </div>
        </>
      ) : null}
    </div>
  );
}
