"use client";

import { useState } from "react";
import type { DeckSection } from "@/types/deck";
import { cn } from "@/lib/utils";
import { useI18n } from "@/lib/i18n/I18nProvider";


export function SectionsPanel({
  sections,
  selectedId,
  onSelect,
  onMove,
  onDuplicate,
  onDelete,
  onAdd,
}: {
  sections: DeckSection[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onMove: (from: number, to: number) => void;
  onDuplicate: (index: number) => void;
  onDelete: (index: number) => void;
  onAdd: () => void;
}) {
  const { t } = useI18n();
  const p = t.sectionsPanel;
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [overIndex, setOverIndex] = useState<number | null>(null);
  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b px-4 py-3">
        <h2 className="text-sm font-semibold text-foreground">{p.title}</h2>
        <button
          onClick={onAdd}
          className="rounded-md bg-accent px-2.5 py-1 text-xs font-semibold text-accent-foreground hover:bg-accent/90"
        >
          + {p.add}
        </button>
      </div>
      <div className="flex-1 space-y-1.5 overflow-y-auto p-3">
        {sections.map((section, index) => {
          const selected = section.id === selectedId;
          return (
            <div
              key={section.id}
              draggable
              onDragStart={() => setDragIndex(index)}
              onDragOver={(e) => {
                e.preventDefault();
                setOverIndex(index);
              }}
              onDrop={(e) => {
                e.preventDefault();
                if (dragIndex !== null && dragIndex !== index) {
                  onMove(dragIndex, index);
                }
                setDragIndex(null);
                setOverIndex(null);
              }}
              onDragEnd={() => {
                setDragIndex(null);
                setOverIndex(null);
              }}
              onClick={() => onSelect(section.id)}
              className={cn(
                "group cursor-pointer rounded-lg border p-2.5 transition-colors",
                selected
                  ? "border-accent bg-accent/5"
                  : "border-border bg-card hover:border-accent/50",
                overIndex === index && dragIndex !== null && "border-accent border-dashed",
              )}
            >
              <div className="flex items-center gap-2">
                <span className="cursor-grab select-none text-muted-foreground" aria-hidden>
                  ⠿
                </span>
                <span className="flex h-5 shrink-0 items-center rounded bg-secondary px-1.5 text-[10px] font-semibold uppercase text-muted-foreground">
                  {t.sections[section.type as keyof typeof t.sections] ?? section.type}
                </span>
                <span className="flex-1 truncate text-xs font-medium text-foreground">
                  {section.title || p.untitled}
                </span>
              </div>
              <div className="mt-1.5 flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                <IconBtn
                  label={p.moveUp}
                  disabled={index === 0}
                  onClick={(e) => {
                    e.stopPropagation();
                    onMove(index, index - 1);
                  }}
                >
                  ↑
                </IconBtn>
                <IconBtn
                  label={p.moveDown}
                  disabled={index === sections.length - 1}
                  onClick={(e) => {
                    e.stopPropagation();
                    onMove(index, index + 1);
                  }}
                >
                  ↓
                </IconBtn>
                <IconBtn
                  label={p.duplicate}
                  onClick={(e) => {
                    e.stopPropagation();
                    onDuplicate(index);
                  }}
                >
                  ⎘
                </IconBtn>
                <IconBtn
                  label={p.delete}
                  disabled={sections.length <= 1}
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(index);
                  }}
                >
                  🗑
                </IconBtn>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function IconBtn({
  children,
  label,
  disabled,
  onClick,
}: {
  children: React.ReactNode;
  label: string;
  disabled?: boolean;
  onClick: (e: React.MouseEvent) => void;
}) {
  return (
    <button
      aria-label={label}
      title={label}
      disabled={disabled}
      onClick={onClick}
      className="flex h-6 w-6 items-center justify-center rounded border border-border bg-background text-xs text-muted-foreground hover:border-accent hover:text-foreground disabled:opacity-30"
    >
      {children}
    </button>
  );
}
