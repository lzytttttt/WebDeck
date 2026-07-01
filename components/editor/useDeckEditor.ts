"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { WebDeck, DeckSection } from "@/types/deck";
import type { Asset } from "@/types/project";

export type SaveStatus = "idle" | "saving" | "saved" | "error";

export type DeckEditorApi = {
  deck: WebDeck;
  assets: Asset[];
  selectedId: string | null;
  selectedSection: DeckSection | null;
  saveStatus: SaveStatus;
  canUndo: boolean;
  canRedo: boolean;
  select: (id: string | null) => void;
  // Mutate the whole deck (records history + schedules autosave).
  commit: (next: WebDeck) => void;
  // Replace one section by id.
  updateSection: (section: DeckSection) => void;
  // Structural ops.
  moveSection: (from: number, to: number) => void;
  duplicateAt: (index: number) => void;
  deleteAt: (index: number) => void;
  insertSection: (section: DeckSection, atIndex?: number) => void;
  setAssets: (assets: Asset[]) => void;
  undo: () => void;
  redo: () => void;
  // Force an immediate save of the current deck/assets (Cmd/Ctrl+S).
  flushNow: () => void;
};

const DEBOUNCE_MS = 800;
const MAX_HISTORY = 50;

// Deck-level editing state machine: an undo/redo history stack over WebDeck,
// plus debounced autosave to PATCH /api/projects/[id]. History is in-memory
// only (not persisted across refresh), per spec.
export function useDeckEditor(
  projectId: string,
  initialDeck: WebDeck,
  initialAssets: Asset[],
): DeckEditorApi {
  const [deck, setDeck] = useState<WebDeck>(initialDeck);
  const [assets, setAssetsState] = useState<Asset[]>(initialAssets);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const past = useRef<WebDeck[]>([]);
  const future = useRef<WebDeck[]>([]);
  const [histVersion, setHistVersion] = useState(0);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Latest values to persist; a single trailing-edge PATCH flushes them.
  const pending = useRef<{ deck: WebDeck; assets: Asset[] } | null>(null);

  const flush = useCallback(async () => {
    if (!pending.current) return;
    const payload = pending.current;
    pending.current = null;
    setSaveStatus("saving");
    try {
      const res = await fetch(`/api/projects/${projectId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          webDeck: payload.deck,
          assets: payload.assets,
        }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setSaveStatus("saved");
    } catch {
      setSaveStatus("error");
    }
  }, [projectId]);

  const schedule = useCallback(
    (nextDeck: WebDeck, nextAssets: Asset[]) => {
      pending.current = { deck: nextDeck, assets: nextAssets };
      clearTimeout(timer.current ?? undefined);
      setSaveStatus("saving");
      timer.current = setTimeout(() => {
        void flush();
      }, DEBOUNCE_MS);
    },
    [flush],
  );

  // Flush any pending save on unmount.
  useEffect(() => {
    return () => {
      clearTimeout(timer.current ?? undefined);
      void flush();
    };
  }, [flush]);

  const commit = useCallback(
    (next: WebDeck) => {
      setDeck((cur) => {
        past.current.push(cur);
        if (past.current.length > MAX_HISTORY) past.current.shift();
        future.current = [];
        setHistVersion((v) => v + 1);
        schedule(next, assets);
        return next;
      });
    },
    [assets, schedule],
  );

  const updateSection = useCallback(
    (section: DeckSection) => {
      setDeck((cur) => {
        const sections = cur.sections.map((s) =>
          s.id === section.id ? section : s,
        );
        const next = { ...cur, sections };
        past.current.push(cur);
        if (past.current.length > MAX_HISTORY) past.current.shift();
        future.current = [];
        setHistVersion((v) => v + 1);
        schedule(next, assets);
        return next;
      });
    },
    [assets, schedule],
  );

  const moveSection = useCallback(
    (from: number, to: number) => {
      setDeck((cur) => {
        if (from === to || from < 0 || to < 0) return cur;
        if (from >= cur.sections.length || to >= cur.sections.length) return cur;
        const sections = [...cur.sections];
        const [moved] = sections.splice(from, 1);
        sections.splice(to, 0, moved);
        const next = { ...cur, sections };
        past.current.push(cur);
        future.current = [];
        setHistVersion((v) => v + 1);
        schedule(next, assets);
        return next;
      });
    },
    [assets, schedule],
  );

  const duplicateAt = useCallback(
    (index: number) => {
      setDeck((cur) => {
        const src = cur.sections[index];
        if (!src) return cur;
        const clone: DeckSection = JSON.parse(JSON.stringify(src));
        clone.id = `sec_${Date.now().toString(36)}${Math.random()
          .toString(36)
          .slice(2, 8)}`;
        const sections = [...cur.sections];
        sections.splice(index + 1, 0, clone);
        const next = { ...cur, sections };
        past.current.push(cur);
        future.current = [];
        setHistVersion((v) => v + 1);
        schedule(next, assets);
        return next;
      });
    },
    [assets, schedule],
  );

  const deleteAt = useCallback(
    (index: number) => {
      setDeck((cur) => {
        if (cur.sections.length <= 1) return cur;
        const removed = cur.sections[index];
        const sections = cur.sections.filter((_, i) => i !== index);
        const next = { ...cur, sections };
        past.current.push(cur);
        future.current = [];
        setHistVersion((v) => v + 1);
        schedule(next, assets);
        if (removed && removed.id === selectedId) setSelectedId(null);
        return next;
      });
    },
    [assets, schedule, selectedId],
  );

  const insertSection = useCallback(
    (section: DeckSection, atIndex?: number) => {
      setDeck((cur) => {
        const sections = [...cur.sections];
        const at = atIndex ?? sections.length;
        sections.splice(at, 0, section);
        const next = { ...cur, sections };
        past.current.push(cur);
        future.current = [];
        setHistVersion((v) => v + 1);
        schedule(next, assets);
        return next;
      });
      setSelectedId(section.id);
    },
    [assets, schedule],
  );

  const setAssets = useCallback(
    (nextAssets: Asset[]) => {
      setAssetsState(nextAssets);
      schedule(deck, nextAssets);
    },
    [deck, schedule],
  );

  const undo = useCallback(() => {
    setDeck((cur) => {
      const prev = past.current.pop();
      if (!prev) return cur;
      future.current.push(cur);
      setHistVersion((v) => v + 1);
      schedule(prev, assets);
      return prev;
    });
  }, [assets, schedule]);

  const redo = useCallback(() => {
    setDeck((cur) => {
      const nxt = future.current.pop();
      if (!nxt) return cur;
      past.current.push(cur);
      setHistVersion((v) => v + 1);
      schedule(nxt, assets);
      return nxt;
    });
  }, [assets, schedule]);

  const flushNow = useCallback(() => {
    clearTimeout(timer.current ?? undefined);
    pending.current = { deck, assets };
    void flush();
  }, [deck, assets, flush]);

  const selectedSection =
    deck.sections.find((s) => s.id === selectedId) ?? null;

  // histVersion is only read to force canUndo/canRedo recomputation on stack change.
  void histVersion;

  return {
    deck,
    assets,
    selectedId,
    selectedSection,
    saveStatus,
    canUndo: past.current.length > 0,
    canRedo: future.current.length > 0,
    select: setSelectedId,
    commit,
    updateSection,
    moveSection,
    duplicateAt,
    deleteAt,
    insertSection,
    setAssets,
    undo,
    redo,
    flushNow,
  };
}
