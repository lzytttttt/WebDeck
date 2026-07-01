"use client";

import { useI18n } from "@/lib/i18n/I18nProvider";
import { Modal } from "@/components/ui/modal";

// Keyboard shortcuts help (spec 8). Opened via the toolbar "?" button or the
// "?" / "Cmd/Ctrl+/" shortcut.

export function ShortcutsModal({ onClose }: { onClose: () => void }) {
  const { t } = useI18n();
  const s = t.shortcuts;

  const rows: { label: string; keys: string[] }[] = [
    { label: s.save, keys: ["Ctrl", "S"] },
    { label: s.undo, keys: ["Ctrl", "Z"] },
    { label: s.redo, keys: ["Ctrl", "Shift", "Z"] },
    { label: s.duplicate, keys: ["Ctrl", "D"] },
    { label: s.delete, keys: ["Delete"] },
    { label: s.present, keys: ["Ctrl", "Enter"] },
    { label: s.escape, keys: ["Esc"] },
    { label: s.help, keys: ["?"] },
  ];

  return (
    <Modal open title={s.title} onClose={onClose}>
      <ul className="space-y-2">
        {rows.map((r, i) => (
          <li key={i} className="flex items-center justify-between gap-6 text-sm">
            <span className="text-foreground">{r.label}</span>
            <span className="flex items-center gap-1">
              {r.keys.map((k) => (
                <kbd
                  key={k}
                  className="rounded border bg-secondary px-1.5 py-0.5 text-xs font-medium text-muted-foreground"
                >
                  {k}
                </kbd>
              ))}
            </span>
          </li>
        ))}
      </ul>
    </Modal>
  );
}
