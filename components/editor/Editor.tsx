"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import Link from "next/link";
import type { Project } from "@/types/project";
import type { WebDeck, DeckMode, DeckSection, DeckTheme } from "@/types/deck";
import type { DeckSectionType } from "@/types/deck";
import { EditableDeck } from "@/components/deck/DeckRenderer";
import { SectionsPanel } from "./SectionsPanel";
import { AddSectionModal } from "./AddSectionModal";
import { ModeSwitch } from "./ModeSwitch";
import { useDeckEditor } from "./useDeckEditor";
import { createSection } from "@/lib/deck/sectionFactory";
import { ContentInspector } from "./inspector/ContentInspector";
import { DesignInspector } from "./inspector/DesignInspector";
import { MediaInspector } from "./inspector/MediaInspector";
import { MotionInspector } from "./inspector/MotionInspector";
import { ImportQualityPanel } from "./ImportQualityPanel";
import { DevicePreviewSwitch, DEVICE_WIDTH } from "./DevicePreviewSwitch";
import type { DeviceMode } from "./DevicePreviewSwitch";
import { PublishChecklistModal } from "./PublishChecklistModal";
import { ExportCheckBadge } from "./ExportCheckBadge";
import { ProviderSettings } from "./ProviderSettings";
import { ShortcutsModal } from "./ShortcutsModal";
import { useEditorShortcuts } from "./useEditorShortcuts";
import { computePublishChecks } from "@/lib/deck/publishChecks";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { cn } from "@/lib/utils";

type Tab = "content" | "design" | "media" | "motion";

type PublishResponse = { shareId: string };
function isPublishResponse(v: unknown): v is PublishResponse {
  return (
    typeof v === "object" &&
    v !== null &&
    "shareId" in v &&
    typeof v.shareId === "string"
  );
}

/** Loading screen shown while AI generates the initial deck. */
function GeneratingOverlay({
  message,
  progress,
  error,
  onRetry,
  onCancel,
  cancelling,
}: {
  message: string;
  progress: number;
  error: string | null;
  onRetry: () => void;
  onCancel?: () => void;
  cancelling?: boolean;
}) {
  if (error) {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-4">
        <p className="text-lg font-medium text-destructive">{error}</p>
        <Button onClick={onRetry}>重试</Button>
        <Link href="/projects" className="text-sm text-muted-foreground hover:text-foreground">
          ← 返回项目列表
        </Link>
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col items-center justify-center gap-4">
      <div className="h-10 w-10 animate-spin rounded-full border-4 border-accent border-t-transparent" />
      <p className="text-lg font-medium text-foreground">{message}</p>
      <div className="w-64">
        <div className="mb-1 flex items-center justify-between text-xs text-muted-foreground">
          <span>AI 正在将您的 PPT 转换为交互式网页…</span>
          <span>{progress}%</span>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-secondary">
          <div
            className="h-full rounded-full bg-accent transition-all duration-500 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
      {onCancel ? (
        <button
          type="button"
          onClick={onCancel}
          disabled={cancelling}
          className="rounded-md border border-border px-4 py-1.5 text-sm font-medium transition-colors hover:bg-accent/10 disabled:opacity-50"
        >
          {cancelling ? "取消中…" : "取消生成"}
        </button>
      ) : null}
    </div>
  );
}

/** Poll a job until it completes or fails. Returns the result. */
function pollJob(
  jobId: string,
  onProgress: (p: number) => void,
): Promise<unknown> {
  return new Promise((resolve, reject) => {
    const poll = async () => {
      try {
        const res = await fetch(`/api/jobs/${jobId}`);
        if (!res.ok) throw new Error("Failed to poll job");
        const data = (await res.json()) as {
          status: string;
          progress: number;
          result?: unknown;
          error?: string;
        };
        onProgress(data.progress);
        if (data.status === "completed") {
          resolve(data.result);
        } else if (data.status === "failed") {
          reject(new Error(data.error || "Generation failed"));
        } else if (data.status === "cancelled") {
          reject(new Error("cancelled"));
        } else {
          setTimeout(poll, 2000);
        }
      } catch (err) {
        reject(err);
      }
    };
    poll();
  });
}

export function Editor({ project }: { project: Project }) {
  const { t } = useI18n();

  // --- Generation state: handle "parsed" projects that need AI generation ---
  const needsGeneration = project.status === "parsed" || !project.webDeck;
  const [generatedDeck, setGeneratedDeck] = useState<WebDeck | null>(null);
  const [generating, setGenerating] = useState(false);
  const [generateError, setGenerateError] = useState<string | null>(null);
  const [generateProgress, setGenerateProgress] = useState(0);
  const [jobId, setJobId] = useState<string | null>(null);
  const [cancelling, setCancelling] = useState(false);

  const triggerGenerate = useCallback(async () => {
    setGenerating(true);
    setGenerateError(null);
    setGenerateProgress(0);
    setJobId(null);
    try {
      // Step 1: kick off async job
      const res = await fetch(`/api/projects/${project.id}/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: "conservative", regenerate: true }),
      });
      if (!res.ok) throw new Error("Generation failed to start");
      const { jobId: jid } = (await res.json()) as { jobId: string; status: string };
      setJobId(jid);

      // Step 2: poll for completion
      const result = await pollJob(jid, setGenerateProgress);
      const projectResult = result as Project;
      if (projectResult.webDeck) {
        setGeneratedDeck(projectResult.webDeck);
      } else {
        setGenerateError("生成失败，请重试");
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "";
      if (msg === "cancelled") {
        setGenerateError(t.editor.generationCancelled);
      } else {
        setGenerateError("生成失败，请重试");
      }
    } finally {
      setGenerating(false);
      setJobId(null);
    }
  }, [project.id, t]);

  const cancelGenerate = useCallback(async () => {
    if (!jobId) return;
    setCancelling(true);
    try {
      await fetch(`/api/jobs/${jobId}`, { method: "DELETE" });
    } catch {
      // Network errors are non-fatal; the server-side cancel still applies.
    }
    setGenerating(false);
    setGenerateError(t.editor.generationCancelled);
    setCancelling(false);
  }, [jobId, t]);

  useEffect(() => {
    if (needsGeneration && !generatedDeck && !generating && !generateError) {
      triggerGenerate();
    }
  }, [needsGeneration, generatedDeck, generating, generateError, triggerGenerate]);

  // Show loading/error state for projects that need generation
  if (needsGeneration && !generatedDeck) {
    return (
      <GeneratingOverlay
        message="正在生成 Web Deck…"
        progress={generateProgress}
        error={generateError}
        onRetry={triggerGenerate}
        onCancel={generating && jobId ? cancelGenerate : undefined}
        cancelling={cancelling}
      />
    );
  }

  return <EditorInner project={project} overrideDeck={generatedDeck} />;
}

/** The actual editor, rendered once a deck is available. */
function EditorInner({
  project,
  overrideDeck,
}: {
  project: Project;
  overrideDeck: WebDeck | null;
}) {
  const { t } = useI18n();
  const initialDeck = overrideDeck ?? project.webDeck!;
  const ed = useDeckEditor(project.id, initialDeck, project.assets ?? []);
  const [tab, setTab] = useState<Tab>("content");
  const [adding, setAdding] = useState(false);
  const [switchingMode, setSwitchingMode] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [checklistOpen, setChecklistOpen] = useState(false);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [device, setDevice] = useState<DeviceMode>("desktop");
  const [shareId, setShareId] = useState<string | null>(
    project.share?.shareId ?? null,
  );
  const [notice, setNotice] = useState<string | null>(null);

  const { deck } = ed;

  const TABS: { id: Tab; label: string }[] = [
    { id: "content", label: t.editor.tabs.content },
    { id: "design", label: t.editor.tabs.design },
    { id: "media", label: t.editor.tabs.media },
    { id: "motion", label: t.editor.tabs.motion },
  ];

  const SAVE_LABEL: Record<string, string> = {
    idle: "",
    saving: t.editor.save.saving,
    saved: t.editor.save.saved,
    error: t.editor.save.error,
  };

  const publishChecks = useMemo(
    () => (checklistOpen ? computePublishChecks(deck) : []),
    [checklistOpen, deck],
  );

  const handleModeChange = async (mode: DeckMode) => {
    if (deck.mode === mode || switchingMode) return;
    setSwitchingMode(true);
    setNotice(null);
    try {
      const res = await fetch(`/api/projects/${project.id}/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode, regenerate: true }),
      });
      if (!res.ok) throw new Error("Generation failed to start");
      const { jobId } = (await res.json()) as { jobId: string; status: string };
      const result = (await pollJob(jobId, () => {})) as Project;
      if (result.webDeck) ed.commit(result.webDeck);
    } catch {
      setNotice(t.editor.mode.switchFailed);
    } finally {
      setSwitchingMode(false);
    }
  };

  const doPublish = async () => {
    setPublishing(true);
    setNotice(null);
    try {
      const res = await fetch(`/api/projects/${project.id}/publish`, {
        method: "POST",
      });
      const data: unknown = await res.json();
      if (isPublishResponse(data)) {
        setShareId(data.shareId);
        setNotice(t.editor.published(data.shareId));
        setChecklistOpen(false);
      } else {
        setNotice(t.editor.publishFailed);
      }
    } catch {
      setNotice(t.editor.publishFailed);
    } finally {
      setPublishing(false);
    }
  };

  const addSection = (type: DeckSectionType) => {
    ed.insertSection(createSection(type));
    setAdding(false);
    setTab("content");
  };

  useEditorShortcuts({
    onSave: ed.flushNow,
    onUndo: ed.undo,
    onRedo: ed.redo,
    onDuplicate: () => {
      const i = deck.sections.findIndex((s) => s.id === ed.selectedId);
      if (i >= 0) ed.duplicateAt(i);
    },
    onDelete: () => {
      const i = deck.sections.findIndex((s) => s.id === ed.selectedId);
      if (i >= 0) ed.deleteAt(i);
    },
    onPresent: () => {
      window.location.href = `/projects/${project.id}/present`;
    },
    onEscape: () => {
      if (adding) setAdding(false);
      else if (checklistOpen) setChecklistOpen(false);
      else if (shortcutsOpen) setShortcutsOpen(false);
      else ed.select(null);
    },
    onHelp: () => setShortcutsOpen((v) => !v),
  });

  return (
    <div className="flex h-screen flex-col">
      {/* Top toolbar */}
      <header className="flex flex-wrap items-center justify-between gap-3 border-b bg-background px-5 py-2.5">
        <div className="flex items-center gap-3">
          <Link
            href="/projects"
            className="text-sm font-semibold text-muted-foreground hover:text-foreground"
          >
            ←
          </Link>
          <div>
            <h1 className="text-sm font-semibold text-foreground">
              {project.name}
            </h1>
            <p className="text-xs text-muted-foreground">
              {t.editor.sections(deck.sections.length)}
              {ed.saveStatus !== "idle" ? (
                <span
                  className={cn(
                    "ml-2",
                    ed.saveStatus === "error" && "text-red-500",
                    ed.saveStatus === "saved" && "text-accent",
                  )}
                >
                  · {SAVE_LABEL[ed.saveStatus]}
                </span>
              ) : null}
            </p>
          </div>
        </div>

        {/* Tab switch */}
        <div className="flex items-center gap-1 rounded-lg border bg-secondary/40 p-0.5">
          {TABS.map((tb) => (
            <button
              key={tb.id}
              onClick={() => setTab(tb.id)}
              className={cn(
                "rounded-md px-3 py-1 text-xs font-semibold transition-colors",
                tab === tb.id
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {tb.label}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <DevicePreviewSwitch mode={device} onChange={setDevice} />
          <button
            onClick={ed.undo}
            disabled={!ed.canUndo}
            title={t.editor.undo}
            className="flex h-8 w-8 items-center justify-center rounded-md border text-sm text-foreground hover:bg-secondary disabled:opacity-30"
          >
            ↶
          </button>
          <button
            onClick={ed.redo}
            disabled={!ed.canRedo}
            title={t.editor.redo}
            className="flex h-8 w-8 items-center justify-center rounded-md border text-sm text-foreground hover:bg-secondary disabled:opacity-30"
          >
            ↷
          </button>
          <ModeSwitch
            mode={deck.mode}
            onChange={handleModeChange}
            disabled={switchingMode}
          />
          <Link href={`/projects/${project.id}/present`}>
            <Button variant="outline" size="sm">
              {t.nav.present}
            </Button>
          </Link>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setChecklistOpen(true)}
            disabled={publishing}
          >
            {t.common.publish}
          </Button>
          <ExportMenu projectId={project.id} t={t} />
          <button
            type="button"
            onClick={() => setSettingsOpen(true)}
            title={t.settings.title}
            aria-label={t.settings.title}
            className="flex h-8 items-center gap-1.5 rounded-md border px-2.5 text-sm text-muted-foreground hover:bg-secondary"
          >
            {t.settings.title}
          </button>
          <ExportCheckBadge projectId={project.id} />
          <button
            onClick={() => setShortcutsOpen(true)}
            title={t.shortcuts.title}
            aria-label={t.shortcuts.title}
            className="flex h-8 w-8 items-center justify-center rounded-md border text-sm text-muted-foreground hover:bg-secondary"
          >
            ?
          </button>
        </div>
      </header>

      {project.importQualityReport ? (
        <ImportQualityPanel report={project.importQualityReport} />
      ) : null}

      {notice ? (
        <div className="flex items-center justify-between gap-4 border-b bg-accent/10 px-5 py-2 text-sm text-foreground">
          <span>{notice}</span>
          {shareId ? (
            <Link
              href={`/share/${shareId}`}
              className="font-semibold text-accent hover:underline"
              target="_blank"
            >
              {t.editor.openShare} →
            </Link>
          ) : null}
        </div>
      ) : null}

      {/* Three-pane body */}
      <div className="grid flex-1 grid-cols-[240px_1fr_320px] overflow-hidden">
        <aside className="overflow-hidden border-r bg-secondary/30">
          <SectionsPanel
            sections={deck.sections}
            selectedId={ed.selectedId}
            onSelect={ed.select}
            onMove={ed.moveSection}
            onDuplicate={ed.duplicateAt}
            onDelete={ed.deleteAt}
            onAdd={() => setAdding(true)}
          />
        </aside>

        <main
          className="overflow-y-auto bg-secondary/20 py-6"
          onClick={() => ed.select(null)}
        >
          {switchingMode ? (
            <div className="flex h-full items-center justify-center text-muted-foreground">
              {t.editor.mode.switching}
            </div>
          ) : (
            <div
              className="mx-auto transition-[max-width] duration-300"
              style={{ maxWidth: DEVICE_WIDTH[device] }}
              onClick={(e) => e.stopPropagation()}
            >
              <EditableDeck
                deck={deck}
                editValue={{
                  editable: true,
                  selectedId: ed.selectedId,
                  select: ed.select,
                  updateSection: ed.updateSection,
                }}
              />
            </div>
          )}
        </main>

        <aside className="overflow-y-auto border-l bg-background">
          {tab === "content" ? (
            <ContentInspector
              section={ed.selectedSection}
              onChange={ed.updateSection}
            />
          ) : null}
          {tab === "design" ? (
            <DesignInspector
              deck={deck}
              section={ed.selectedSection}
              onTheme={(theme: DeckTheme) => ed.commit({ ...deck, theme })}
              onSection={ed.updateSection}
            />
          ) : null}
          {tab === "media" ? (
            <MediaInspector
              projectId={project.id}
              assets={ed.assets}
              extractedImages={project.slides.flatMap(
                (s) => s.images?.map((img) => ({ ...img, slideIndex: s.index })) ?? []
              )}
              selectedSection={ed.selectedSection}
              onAssetsChange={ed.setAssets}
              onInsertSection={(s: DeckSection) => ed.insertSection(s)}
              onUpdateSection={ed.updateSection}
            />
          ) : null}
          {tab === "motion" ? (
            <MotionInspector
              deck={deck}
              section={ed.selectedSection}
              onDeckMotion={(motion) => ed.commit({ ...deck, motion })}
              onSection={ed.updateSection}
            />
          ) : null}
        </aside>
      </div>

      {adding ? (
        <AddSectionModal onPick={addSection} onClose={() => setAdding(false)} />
      ) : null}

      {checklistOpen ? (
        <PublishChecklistModal
          checks={publishChecks}
          publishing={publishing}
          onConfirm={doPublish}
          onClose={() => setChecklistOpen(false)}
        />
      ) : null}

      {shortcutsOpen ? (
        <ShortcutsModal onClose={() => setShortcutsOpen(false)} />
      ) : null}

      {settingsOpen ? (
        <ProviderSettings onClose={() => setSettingsOpen(false)} />
      ) : null}
    </div>
  );
}

/** Export dropdown menu with HTML, PDF, PPTX, and Markdown options. */
function ExportMenu({ projectId, t }: { projectId: string; t: ReturnType<typeof useI18n>["t"] }) {
  const [open, setOpen] = useState(false);
  const [exporting, setExporting] = useState<string | null>(null);

  const handleExport = async (format: string) => {
    setExporting(format);
    setOpen(false);
    try {
      const res = await fetch(`/api/projects/${projectId}/export-${format}`);
      if (!res.ok) throw new Error(`Export failed: ${res.status}`);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch {
      // Surface failure instead of silently dropping the download.
      alert(t.errors.exportFailed);
    } finally {
      setExporting(null);
    }
  };

  const items = [
    { id: "html", label: t.common.exportHtml },
    { id: "pdf", label: t.common.exportPdf },
    { id: "pptx", label: t.common.exportPptx },
    { id: "markdown", label: t.common.exportMarkdown },
  ];

  return (
    <div className="relative">
      <Button
        variant="accent"
        size="sm"
        onClick={() => setOpen((v) => !v)}
        disabled={exporting !== null}
      >
        {exporting ? t.common.loading : t.common.export} ▾
      </Button>
      {open ? (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setOpen(false)}
          />
          <div className="absolute right-0 top-full z-50 mt-1 min-w-[160px] rounded-lg border bg-background shadow-lg">
            {items.map((item) => (
              <button
                key={item.id}
                onClick={() => handleExport(item.id)}
                className="flex w-full items-center gap-2 px-3 py-2 text-sm text-foreground hover:bg-secondary first:rounded-t-lg last:rounded-b-lg"
              >
                {item.label}
              </button>
            ))}
          </div>
        </>
      ) : null}
    </div>
  );
}
