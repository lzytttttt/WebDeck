import { describe, it, expect } from "vitest";
import {
  getColorForIndex,
  PALETTE,
  PALETTE_EXTENDED,
  toNum,
  toLabel,
  resolveYKeys,
  computeGridLines,
  formatValue,
  computeBarLayout,
  computeLineLayout,
  computePieLayout,
  computeDonutLayout,
  computeKpiLayout,
  computeTableLayout,
} from "@/lib/chart/core";
import type { ChartData, ChartConfig } from "@/types/deck";

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const sampleData: ChartData = {
  columns: ["Month", "Revenue", "Cost"],
  rows: [
    { Month: "Jan", Revenue: 120, Cost: 80 },
    { Month: "Feb", Revenue: 150, Cost: 90 },
    { Month: "Mar", Revenue: 180, Cost: 100 },
  ],
};

const singleRowData: ChartData = {
  columns: ["Label", "Value"],
  rows: [{ Label: "Only", Value: 42 }],
};

const emptyData: ChartData = { columns: ["A", "B"], rows: [] };

const configWithKeys: ChartConfig = {
  xKey: "Month",
  yKeys: ["Revenue", "Cost"],
  showLegend: true,
  showGrid: true,
};

const configAuto: ChartConfig = {};

// ---------------------------------------------------------------------------
// getColorForIndex
// ---------------------------------------------------------------------------

describe("getColorForIndex", () => {
  it("returns the colour at the given index", () => {
    expect(getColorForIndex(0)).toBe(PALETTE[0]);
    expect(getColorForIndex(2)).toBe(PALETTE[2]);
  });

  it("wraps around when index >= palette length", () => {
    const len = PALETTE.length;
    expect(getColorForIndex(len)).toBe(PALETTE[0]);
    expect(getColorForIndex(len + 1)).toBe(PALETTE[1]);
  });

  it("handles negative indices", () => {
    expect(getColorForIndex(-1)).toBe(PALETTE[PALETTE.length - 1]);
    expect(getColorForIndex(-PALETTE.length)).toBe(PALETTE[0]);
  });

  it("uses custom palette when provided", () => {
    const custom = ["red", "green", "blue"];
    expect(getColorForIndex(0, custom)).toBe("red");
    expect(getColorForIndex(3, custom)).toBe("red"); // wraps
  });

  it("PALETTE_EXTENDED has more entries than PALETTE", () => {
    expect(PALETTE_EXTENDED.length).toBeGreaterThan(PALETTE.length);
  });
});

// ---------------------------------------------------------------------------
// toNum / toLabel / formatValue
// ---------------------------------------------------------------------------

describe("toNum", () => {
  it("converts numeric strings", () => {
    expect(toNum("42")).toBe(42);
    expect(toNum("3.14")).toBe(3.14);
  });

  it("passes through numbers", () => {
    expect(toNum(100)).toBe(100);
  });

  it("returns 0 for non-numeric or undefined", () => {
    expect(toNum(undefined)).toBe(0);
    expect(toNum("abc")).toBe(0);
    expect(toNum(Number.NaN)).toBe(0);
  });
});

describe("toLabel", () => {
  it("converts values to string", () => {
    expect(toLabel(42)).toBe("42");
    expect(toLabel("hello")).toBe("hello");
  });

  it("returns empty string for null/undefined", () => {
    expect(toLabel(undefined)).toBe("");
    expect(toLabel(null as unknown as undefined)).toBe("");
  });
});

describe("formatValue", () => {
  it("is equivalent to toLabel", () => {
    expect(formatValue(42)).toBe("42");
    expect(formatValue(undefined)).toBe("");
  });
});

// ---------------------------------------------------------------------------
// resolveYKeys
// ---------------------------------------------------------------------------

describe("resolveYKeys", () => {
  it("returns explicit yKeys from config", () => {
    expect(resolveYKeys(sampleData, configWithKeys)).toEqual(["Revenue", "Cost"]);
  });

  it("auto-detects numeric columns when yKeys is absent", () => {
    const keys = resolveYKeys(sampleData, configAuto);
    expect(keys).toContain("Revenue");
    expect(keys).toContain("Cost");
    expect(keys).not.toContain("Month");
  });

  it("returns empty when no numeric columns exist", () => {
    const textOnly: ChartData = {
      columns: ["A", "B"],
      rows: [{ A: "x", B: "y" }],
    };
    expect(resolveYKeys(textOnly, {})).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// computeGridLines
// ---------------------------------------------------------------------------

describe("computeGridLines", () => {
  it("produces the requested number of lines", () => {
    const lines = computeGridLines(0, 300, 100, 4);
    expect(lines).toHaveLength(5); // steps + 1
  });

  it("starts at max and decreases to 0", () => {
    const lines = computeGridLines(0, 300, 100, 4);
    expect(lines[0].value).toBe(100);
    expect(lines[lines.length - 1].value).toBe(0);
  });

  it("computes y positions linearly", () => {
    const lines = computeGridLines(10, 200, 100, 2);
    expect(lines[0].y).toBe(10);
    expect(lines[1].y).toBe(110);
    expect(lines[2].y).toBe(210);
  });
});

// ---------------------------------------------------------------------------
// computeBarLayout
// ---------------------------------------------------------------------------

describe("computeBarLayout", () => {
  const dims = { W: 640, H: 360, padL: 44, padR: 16, padT: 16, padB: 44 };

  it("produces one bar per yKey per row", () => {
    const layout = computeBarLayout(sampleData, configWithKeys, dims);
    expect(layout.bars).toHaveLength(3 * 2); // 3 rows × 2 yKeys
  });

  it("groups bars by groupIndex", () => {
    const layout = computeBarLayout(sampleData, configWithKeys, dims);
    const group0 = layout.bars.filter((b) => b.groupIndex === 0);
    expect(group0).toHaveLength(2);
  });

  it("produces x-axis labels for each row", () => {
    const layout = computeBarLayout(sampleData, configWithKeys, dims);
    expect(layout.xAxis).toHaveLength(3);
    expect(layout.xAxis[0].label).toBe("Jan");
  });

  it("handles single row data", () => {
    const layout = computeBarLayout(singleRowData, {}, dims);
    expect(layout.bars).toHaveLength(1);
    expect(layout.xAxis).toHaveLength(1);
  });

  it("handles empty data", () => {
    const layout = computeBarLayout(emptyData, {}, dims);
    expect(layout.bars).toHaveLength(0);
    expect(layout.xAxis).toHaveLength(0);
  });

  it("bars have non-negative heights", () => {
    const layout = computeBarLayout(sampleData, configWithKeys, dims);
    layout.bars.forEach((b) => {
      expect(b.height).toBeGreaterThanOrEqual(0);
    });
  });

  it("respects barGap option", () => {
    const withGap = computeBarLayout(sampleData, configWithKeys, dims, { barGap: 4 });
    const withoutGap = computeBarLayout(sampleData, configWithKeys, dims, { barGap: 0 });
    // With gap, bars should be narrower
    expect(withGap.bars[0].width).toBeLessThan(withoutGap.bars[0].width);
  });
});

// ---------------------------------------------------------------------------
// computeLineLayout
// ---------------------------------------------------------------------------

describe("computeLineLayout", () => {
  const dims = { W: 640, H: 360, padL: 44, padR: 16, padT: 16, padB: 44 };

  it("produces one series per yKey", () => {
    const layout = computeLineLayout(sampleData, configWithKeys, dims);
    expect(layout.series).toHaveLength(2);
  });

  it("each series has one point per row", () => {
    const layout = computeLineLayout(sampleData, configWithKeys, dims);
    layout.series.forEach((s) => {
      expect(s.points).toHaveLength(3);
    });
  });

  it("polyline string has correct format", () => {
    const layout = computeLineLayout(sampleData, configWithKeys, dims);
    const parts = layout.series[0].polyline.split(" ");
    expect(parts).toHaveLength(3);
    parts.forEach((p) => {
      expect(p).toMatch(/^[\d.]+,[\d.]+$/);
    });
  });

  it("handles single data point", () => {
    const layout = computeLineLayout(singleRowData, {}, dims);
    expect(layout.series).toHaveLength(1);
    expect(layout.series[0].points).toHaveLength(1);
  });

  it("handles empty data", () => {
    const layout = computeLineLayout(emptyData, {}, dims);
    expect(layout.series).toHaveLength(0);
  });

  it("produces x-axis labels", () => {
    const layout = computeLineLayout(sampleData, configWithKeys, dims);
    expect(layout.xAxis).toHaveLength(3);
    expect(layout.xAxis.map((x) => x.label)).toEqual(["Jan", "Feb", "Mar"]);
  });
});

// ---------------------------------------------------------------------------
// computePieLayout / computeDonutLayout
// ---------------------------------------------------------------------------

describe("computePieLayout", () => {
  const dims = { W: 320, H: 320 };

  it("produces one slice per row", () => {
    const pieData: ChartData = {
      columns: ["Cat", "Val"],
      rows: [
        { Cat: "A", Val: 30 },
        { Cat: "B", Val: 70 },
      ],
    };
    const layout = computePieLayout(pieData, { xKey: "Cat", yKeys: ["Val"] }, dims);
    expect(layout.slices).toHaveLength(2);
  });

  it("slice paths are valid SVG path strings", () => {
    const pieData: ChartData = {
      columns: ["Cat", "Val"],
      rows: [
        { Cat: "A", Val: 30 },
        { Cat: "B", Val: 70 },
      ],
    };
    const layout = computePieLayout(pieData, { xKey: "Cat", yKeys: ["Val"] }, dims);
    layout.slices.forEach((s) => {
      expect(s.d).toMatch(/^M[\d.]+,[\d.]+/);
    });
  });

  it("sets center to half of dimensions", () => {
    const pieData: ChartData = {
      columns: ["Cat", "Val"],
      rows: [{ Cat: "A", Val: 100 }],
    };
    const layout = computePieLayout(pieData, { xKey: "Cat", yKeys: ["Val"] }, dims);
    expect(layout.cx).toBe(160);
    expect(layout.cy).toBe(160);
  });

  it("handles single slice (full circle)", () => {
    const pieData: ChartData = {
      columns: ["Cat", "Val"],
      rows: [{ Cat: "A", Val: 100 }],
    };
    const layout = computePieLayout(pieData, { xKey: "Cat", yKeys: ["Val"] }, dims);
    expect(layout.slices).toHaveLength(1);
    expect(layout.slices[0].value).toBe(100);
  });

  it("handles all-zero values without crashing", () => {
    const pieData: ChartData = {
      columns: ["Cat", "Val"],
      rows: [
        { Cat: "A", Val: 0 },
        { Cat: "B", Val: 0 },
      ],
    };
    const layout = computePieLayout(pieData, { xKey: "Cat", yKeys: ["Val"] }, dims);
    expect(layout.slices).toHaveLength(2);
    expect(layout.total).toBe(1); // safeTotal fallback
  });
});

describe("computeDonutLayout", () => {
  const dims = { W: 360, H: 360 };

  it("has a non-zero inner radius", () => {
    const pieData: ChartData = {
      columns: ["Cat", "Val"],
      rows: [
        { Cat: "A", Val: 30 },
        { Cat: "B", Val: 70 },
      ],
    };
    const layout = computeDonutLayout(pieData, { xKey: "Cat", yKeys: ["Val"] }, dims);
    expect(layout.innerRadius).toBeGreaterThan(0);
  });

  it("donut path includes inner arc commands", () => {
    const pieData: ChartData = {
      columns: ["Cat", "Val"],
      rows: [
        { Cat: "A", Val: 30 },
        { Cat: "B", Val: 70 },
      ],
    };
    const layout = computeDonutLayout(pieData, { xKey: "Cat", yKeys: ["Val"] }, dims);
    // Donut paths have an inner arc (A innerRadius ...)
    layout.slices.forEach((s) => {
      expect(s.d).toContain(`A${layout.innerRadius}`);
    });
  });

  it("respects innerRatio parameter", () => {
    const pieData: ChartData = {
      columns: ["Cat", "Val"],
      rows: [{ Cat: "A", Val: 100 }],
    };
    const small = computeDonutLayout(pieData, { xKey: "Cat", yKeys: ["Val"] }, dims, 0.3);
    const large = computeDonutLayout(pieData, { xKey: "Cat", yKeys: ["Val"] }, dims, 0.7);
    expect(small.innerRadius).toBeLessThan(large.innerRadius);
  });
});

// ---------------------------------------------------------------------------
// computeKpiLayout
// ---------------------------------------------------------------------------

describe("computeKpiLayout", () => {
  it("produces one metric per yKey", () => {
    const layout = computeKpiLayout(sampleData, configWithKeys);
    expect(layout.metrics).toHaveLength(2);
    expect(layout.metrics[0].label).toBe("Revenue");
    expect(layout.metrics[1].label).toBe("Cost");
  });

  it("uses first row values", () => {
    const layout = computeKpiLayout(sampleData, configWithKeys);
    expect(layout.metrics[0].value).toBe("120");
    expect(layout.metrics[1].value).toBe("80");
  });

  it("auto-detects yKeys when not specified", () => {
    const layout = computeKpiLayout(sampleData, configAuto);
    expect(layout.metrics.length).toBeGreaterThanOrEqual(2);
  });

  it("handles empty rows gracefully", () => {
    const layout = computeKpiLayout(emptyData, {});
    expect(layout.metrics).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// computeTableLayout
// ---------------------------------------------------------------------------

describe("computeTableLayout", () => {
  it("preserves columns", () => {
    const layout = computeTableLayout(sampleData);
    expect(layout.columns.map((c) => c.key)).toEqual(["Month", "Revenue", "Cost"]);
  });

  it("preserves all rows", () => {
    const layout = computeTableLayout(sampleData);
    expect(layout.rows).toHaveLength(3);
  });

  it("converts all cell values to strings", () => {
    const layout = computeTableLayout(sampleData);
    layout.rows.forEach((row) => {
      Object.values(row).forEach((v) => {
        expect(typeof v).toBe("string");
      });
    });
  });

  it("handles empty data", () => {
    const layout = computeTableLayout(emptyData);
    expect(layout.columns).toHaveLength(2);
    expect(layout.rows).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// Edge cases: large dataset
// ---------------------------------------------------------------------------

describe("large dataset", () => {
  const largeRows = Array.from({ length: 200 }, (_, i) => ({
    label: `Row ${i}`,
    val1: Math.random() * 1000,
    val2: Math.random() * 1000,
  }));
  const largeData: ChartData = {
    columns: ["label", "val1", "val2"],
    rows: largeRows,
  };

  it("bar layout handles 200 rows", () => {
    const dims = { W: 640, H: 360, padL: 44, padR: 16, padT: 16, padB: 44 };
    const layout = computeBarLayout(largeData, {}, dims);
    expect(layout.bars).toHaveLength(200 * 2);
    expect(layout.xAxis).toHaveLength(200);
  });

  it("line layout handles 200 rows", () => {
    const dims = { W: 640, H: 360, padL: 44, padR: 16, padT: 16, padB: 44 };
    const layout = computeLineLayout(largeData, {}, dims);
    expect(layout.series).toHaveLength(2);
    layout.series.forEach((s) => {
      expect(s.points).toHaveLength(200);
    });
  });

  it("pie layout handles 200 slices", () => {
    const dims = { W: 320, H: 320 };
    const layout = computePieLayout(largeData, { yKeys: ["val1"] }, dims);
    expect(layout.slices).toHaveLength(200);
  });
});
