import { NextRequest, NextResponse } from "next/server";
import { getProject } from "@/lib/storage/projectStore";
import { exportStaticHtml } from "@/lib/export/exportStaticHtml";
import { normalizeDeck } from "@/lib/deck/normalize";

export const runtime = "nodejs";

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const project = await getProject(params.id);
  if (!project) {
    return NextResponse.json({ error: "项目不存在" }, { status: 404 });
  }
  if (!project.webDeck) {
    return NextResponse.json(
      { error: "该项目尚未生成 Web Deck" },
      { status: 409 }
    );
  }

  const html = exportStaticHtml(normalizeDeck(project.webDeck), {
    projectId: project.id,
    description: project.webDeck.subtitle,
  });
  const safe = project.name.replace(/[^a-zA-Z0-9._-]/g, "-") || "web-deck";

  return new NextResponse(html, {
    status: 200,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Content-Disposition": `attachment; filename="${safe}-web-deck.html"`,
    },
  });
}
