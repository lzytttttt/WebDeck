import { NextRequest, NextResponse } from "next/server";
import { getProject } from "@/lib/storage/projectRepo";
import { ensureDb } from "@/lib/storage/db";
import { normalizeDeck } from "@/lib/deck/normalize";
import { computeExportCheck } from "@/lib/deck/exportCheck";

export const runtime = "nodejs";

// GET /api/projects/[id]/export-check -> ExportCheck for the Export button badge.
export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } },
) {
  await ensureDb();
  const project = await getProject(params.id);
  if (!project) {
    return NextResponse.json({ error: "项目不存在" }, { status: 404 });
  }
  if (!project.webDeck) {
    return NextResponse.json(
      {
        canExport: false,
        warnings: [{ id: "noSections" as const }],
        estimatedSizeKb: 0,
        includesImages: false,
        includesCharts: false,
      },
      { status: 200 },
    );
  }
  const check = computeExportCheck(normalizeDeck(project.webDeck));
  return NextResponse.json(check);
}
