import { NextRequest, NextResponse } from "next/server";
import { getProject } from "@/lib/storage/projectRepo";
import { ensureDb } from "@/lib/storage/db";
import { exportPptx } from "@/lib/export/exportPptx";
import { normalizeDeck } from "@/lib/deck/normalize";

export const runtime = "nodejs";

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
      { error: "该项目尚未生成 Web Deck" },
      { status: 409 },
    );
  }

  try {
    const buffer = await exportPptx(normalizeDeck(project.webDeck));
    const safe = project.name.replace(/[^a-zA-Z0-9._-]/g, "-") || "web-deck";

    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.presentationml.presentation",
        "Content-Disposition": `attachment; filename="${safe}-web-deck.pptx"`,
      },
    });
  } catch (err) {
    console.error("PPTX export failed:", err);
    return NextResponse.json(
      { error: "导出 PPTX 失败" },
      { status: 500 },
    );
  }
}
