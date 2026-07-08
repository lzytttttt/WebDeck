import { NextRequest, NextResponse } from "next/server";
import { getProject } from "@/lib/storage/projectRepo";
import { ensureDb } from "@/lib/storage/db";
import { exportMarkdown } from "@/lib/export/exportMarkdown";
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

  const markdown = exportMarkdown(normalizeDeck(project.webDeck));
  const safe = project.name.replace(/[^a-zA-Z0-9._-]/g, "-") || "web-deck";

  return new NextResponse(markdown, {
    status: 200,
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
      "Content-Disposition": `attachment; filename="${safe}-web-deck.md"`,
    },
  });
}
