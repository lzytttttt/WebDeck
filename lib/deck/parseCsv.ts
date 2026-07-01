import type { ChartData } from "@/types/deck";

// Minimal CSV parser for the chart data-paste flow. Handles quoted fields,
// escaped quotes ("") and commas inside quotes. Numeric-looking cells are
// coerced to numbers so charts get real values, not strings.

function parseLine(line: string): string[] {
  const out: string[] = [];
  let cur = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i += 1) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"') {
        if (line[i + 1] === '"') {
          cur += '"';
          i += 1;
        } else {
          inQuotes = false;
        }
      } else {
        cur += ch;
      }
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === ",") {
      out.push(cur);
      cur = "";
    } else {
      cur += ch;
    }
  }
  out.push(cur);
  return out.map((c) => c.trim());
}

function coerce(value: string): string | number {
  if (value === "") return value;
  // Strip common thousands separators / percent for the numeric test.
  const cleaned = value.replace(/,/g, "");
  const num = Number(cleaned);
  if (!Number.isNaN(num) && /^-?\d*\.?\d+%?$/.test(value.replace(/,/g, ""))) {
    return num;
  }
  return value;
}

// Parse a CSV/TSV string into ChartData. Returns null when there is no
// usable header + at least one data row.
export function parseCsv(text: string): ChartData | null {
  const lines = text
    .replace(/\r\n?/g, "\n")
    .split("\n")
    .filter((l) => l.trim().length > 0);
  if (lines.length < 2) return null;

  const columns = parseLine(lines[0]).filter((c) => c.length > 0);
  if (columns.length === 0) return null;

  const rows: Array<Record<string, string | number>> = [];
  for (let i = 1; i < lines.length; i += 1) {
    const cells = parseLine(lines[i]);
    const row: Record<string, string | number> = {};
    columns.forEach((col, ci) => {
      const raw = cells[ci] ?? "";
      // First column is treated as the category/label (keep as string).
      row[col] = ci === 0 ? raw : coerce(raw);
    });
    rows.push(row);
  }
  return { columns, rows };
}
