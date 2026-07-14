"use client";

import { useEffect, useState } from "react";

const HEX_RE = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;

/**
 * Compact color editor: a native swatch picker plus a hex text field.
 * The text field is the source of truth for free typing; a valid hex value
 * is pushed upward via onChange, while the swatch always reflects a valid color.
 */
export function ColorPicker({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (hex: string) => void;
}) {
  const [text, setText] = useState(value);

  // Keep the text field in sync when the value changes from elsewhere
  // (e.g. applying a template or switching themes).
  useEffect(() => {
    setText(value);
  }, [value]);

  const swatchValue = HEX_RE.test(text) ? text : value;

  return (
    <div className="flex items-center justify-between gap-2">
      <span className="text-xs text-muted-foreground">{label}</span>
      <div className="flex items-center gap-1.5">
        <input
          type="color"
          aria-label={label}
          value={swatchValue}
          onChange={(e) => {
            setText(e.target.value);
            onChange(e.target.value);
          }}
          className="h-7 w-7 cursor-pointer rounded-md border border-border bg-transparent p-0.5"
        />
        <input
          type="text"
          value={text}
          spellCheck={false}
          onChange={(e) => {
            const next = e.target.value;
            setText(next);
            if (HEX_RE.test(next)) onChange(next);
          }}
          className="w-[88px] rounded-md border border-border bg-background px-2 py-1 font-mono text-xs text-foreground outline-none focus:border-accent"
        />
      </div>
    </div>
  );
}
