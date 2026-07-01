"use client";

import {
  createContext,
  useContext,
  type ElementType,
  type ReactNode,
} from "react";
import type { DeckSection, DeckTheme } from "@/types/deck";

// Shared editing surface. The same section components render in three places:
//  - static (share / present / export preview) -> editable = false
//  - the editor canvas -> editable = true, with selection + inline patching
// A context keeps the section components free of prop-drilling.

export type EditContextValue = {
  editable: boolean;
  selectedId: string | null;
  theme: DeckTheme;
  select: (id: string) => void;
  // Replace the section (matched by id) with a new value.
  updateSection: (section: DeckSection) => void;
};

const EditContext = createContext<EditContextValue | null>(null);

export function EditProvider({
  value,
  children,
}: {
  value: EditContextValue;
  children: ReactNode;
}) {
  return <EditContext.Provider value={value}>{children}</EditContext.Provider>;
}

// Non-editable default so section components work outside the editor.
const STATIC_CTX: Omit<EditContextValue, "theme"> = {
  editable: false,
  selectedId: null,
  select: () => {},
  updateSection: () => {},
};

export function useEdit(theme: DeckTheme): EditContextValue {
  const ctx = useContext(EditContext);
  return ctx ?? { ...STATIC_CTX, theme };
}

export function useMaybeEdit(): EditContextValue | null {
  return useContext(EditContext);
}

// ---------------------------------------------------------------------------
// InlineText: renders plain text when static, an inline-editable element when
// editing. Commits on blur (not per keystroke) so React never fights the
// caret. Empty values show a placeholder via CSS.
// ---------------------------------------------------------------------------

export function InlineText({
  as,
  value,
  onChange,
  className,
  placeholder,
  editable,
}: {
  as?: ElementType;
  value: string;
  onChange: (next: string) => void;
  className?: string;
  placeholder?: string;
  editable: boolean;
}) {
  const Tag = as ?? "span";
  if (!editable) {
    return <Tag className={className}>{value}</Tag>;
  }
  return (
    <Tag
      className={className}
      contentEditable
      suppressContentEditableWarning
      spellCheck={false}
      data-placeholder={placeholder}
      onClick={(e: React.MouseEvent) => e.stopPropagation()}
      onKeyDown={(e: React.KeyboardEvent) => {
        // Enter commits + blurs for single-line-ish fields; Shift+Enter allows
        // a newline. Escape cancels by restoring value + blurring.
        if (e.key === "Escape") {
          e.currentTarget.textContent = value;
          (e.currentTarget as HTMLElement).blur();
        }
      }}
      onBlur={(e: React.FocusEvent<HTMLElement>) => {
        const next = e.currentTarget.textContent ?? "";
        if (next !== value) onChange(next);
      }}
    >
      {value}
    </Tag>
  );
}
