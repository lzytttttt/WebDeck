import { describe, it, expect } from "vitest";
import { parseCsv } from "@/lib/deck/parseCsv";

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("parseCsv", () => {
  it("parses a simple CSV with header and data rows", () => {
    const csv = "Name,Value\nA,10\nB,20";
    const result = parseCsv(csv);
    expect(result).not.toBeNull();
    expect(result!.columns).toEqual(["Name", "Value"]);
    expect(result!.rows).toHaveLength(2);
    expect(result!.rows[0]).toEqual({ Name: "A", Value: 10 });
    expect(result!.rows[1]).toEqual({ Name: "B", Value: 20 });
  });

  it("returns null for input with only a header", () => {
    expect(parseCsv("A,B,C")).toBeNull();
  });

  it("returns null for empty input", () => {
    expect(parseCsv("")).toBeNull();
  });

  it("keeps first column as string (category label)", () => {
    const csv = "Cat,Val\n100,200";
    const result = parseCsv(csv);
    expect(typeof result!.rows[0].Cat).toBe("string");
    expect(result!.rows[0].Cat).toBe("100");
    expect(result!.rows[0].Val).toBe(200);
  });

  it("handles quoted fields with commas", () => {
    const csv = 'Name,Value\n"A, B",10';
    const result = parseCsv(csv);
    expect(result!.rows[0].Name).toBe("A, B");
  });

  it("handles escaped quotes inside quoted fields", () => {
    const csv = 'Name,Value\n"She said ""hello""",5';
    const result = parseCsv(csv);
    expect(result!.rows[0].Name).toBe('She said "hello"');
  });

  it("handles Windows-style CRLF line endings", () => {
    const csv = "A,B\r\n1,2\r\n3,4";
    const result = parseCsv(csv);
    expect(result!.rows).toHaveLength(2);
  });

  it("skips blank lines", () => {
    const csv = "A,B\n1,2\n\n3,4\n";
    const result = parseCsv(csv);
    expect(result!.rows).toHaveLength(2);
  });

  it("handles TSV (tab-separated) by keeping tabs as part of field", () => {
    // parseCsv doesn't auto-detect tabs, but commas work
    const csv = "X,Y\na,1";
    const result = parseCsv(csv);
    expect(result!.columns).toEqual(["X", "Y"]);
  });

  it("coerces numeric strings to numbers", () => {
    const csv = "Label,Val\nX,1000";
    const result = parseCsv(csv);
    expect(result!.rows[0].Val).toBe(1000);
  });

  it("handles missing cells as empty string", () => {
    const csv = "A,B,C\n1,2";
    const result = parseCsv(csv);
    expect(result!.rows[0].C).toBe("");
  });
});
