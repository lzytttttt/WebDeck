import { NextRequest, NextResponse } from "next/server";
import { getProject } from "@/lib/storage/projectRepo";
import { ensureDb } from "@/lib/storage/db";
import { exportPdf } from "@/lib/export/exportPdf";
import { normalizeDeck } from "@/lib/deck/normalize";

export const runtime = "nodejs";

export async function GET(
  req: NextRequest,
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

  const format = req.nextUrl.searchParams.get("format");
  const pdfFormat = format === "16:9" ? "16:9" : "A4";

  try {
    const buffer = await exportPdf(normalizeDeck(project.webDeck), {
      format: pdfFormat,
    });
    const safe = project.name.replace(/[^a-zA-Z0-9._-]/g, "-") || "web-deck";

    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${safe}-web-deck.pdf"`,
      },
    });
  } catch (err) {
    console.error("PDF export failed:", err);
    return NextResponse.json(
      { error: "导出 PDF 失败" },
      { status: 500 },
    );
  }
}
