"use client";

import { useState, useMemo } from "react";
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

export function Editor({ project }: { project: Project }) {
  const { t } = useI18n();
  const initialDeck = project.webDeck!;
  const ed = useDeckEditor(project.id, initialDeck, project.assets ?? []);
  const [tab, setTab] = useState<Tab>("content");
  const [adding, setAdding] = useState(false);
  const [switchingMode, setSwitchingMode] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [checklistOpen, setChecklistOpen] = useState(false);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);
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
      const updated: Project = await res.json();
      if (updated.webDeck) ed.commit(updated.webDeck);
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
          <div className="flex flex-col items-end gap-0.5">
            <a href={`/api/projects/${project.id}/export-html`} download>
              <Button variant="accent" size="sm">
                {t.nav.exportHtml}
              </Button>
            </a>
            <ExportCheckBadge projectId={project.id} />
          </div>
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
    </div>
  );
}
