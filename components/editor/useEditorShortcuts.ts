"use client";

import { useEffect } from "react";

// Centralized editor keyboard shortcuts (spec 8). Registered once by the
// Editor. Text-editing targets (inputs, textareas, contentEditable) suppress
// the section-level shortcuts so typing never deletes a section or triggers
// present mode; Cmd/Ctrl+S and Escape still work everywhere.
export type EditorShortcutHandlers = {
  onSave: () => void;
  onUndo: () => void;
  onRedo: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
  onPresent: () => void;
  onEscape: () => void;
  onHelp: () => void;
};

function isTextTarget(el: EventTarget | null): boolean {
  if (!(el instanceof HTMLElement)) return false;
  return (
    el.isContentEditable ||
    el.tagName === "INPUT" ||
    el.tagName === "TEXTAREA" ||
    el.tagName === "SELECT"
  );
}

export function useEditorShortcuts(handlers: EditorShortcutHandlers): void {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const mod = e.metaKey || e.ctrlKey;
      const key = e.key.toLowerCase();
      const editing = isTextTarget(e.target);

      // Escape always works (deselect / close modal).
      if (e.key === "Escape") {
        handlers.onEscape();
        return;
      }

      if (mod) {
        switch (key) {
          case "s":
            e.preventDefault();
            handlers.onSave();
            return;
          case "z":
            if (editing) return;
            e.preventDefault();
            if (e.shiftKey) handlers.onRedo();
            else handlers.onUndo();
            return;
          case "d":
            if (editing) return;
            e.preventDefault();
            handlers.onDuplicate();
            return;
          case "enter":
            e.preventDefault();
            handlers.onPresent();
            return;
          default:
            return;
        }
      }

      // Non-modifier shortcuts are disabled while editing text.
      if (editing) return;

      if (e.key === "Delete" || e.key === "Backspace") {
        e.preventDefault();
        handlers.onDelete();
        return;
      }

      // "?" (Shift+/) or "/" opens the shortcuts help.
      if (key === "?" || (key === "/" && !mod)) {
        e.preventDefault();
        handlers.onHelp();
      }
    };

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [handlers]);
}
