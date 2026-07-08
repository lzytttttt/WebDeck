import { NextRequest, NextResponse } from "next/server";
import { getProjectByShareId } from "@/lib/storage/projectRepo";
import { ensureDb } from "@/lib/storage/db";

export const runtime = "nodejs";

export async function GET(
  _req: NextRequest,
  { params }: { params: { shareId: string } }
) {
  await ensureDb();
  const project = await getProjectByShareId(params.shareId);
  if (!project || !project.share?.isPublished) {
    return NextResponse.json({ error: "分享页面不存在或已下线" }, { status: 404 });
  }

  // MVP: no password enforcement, but the field is preserved on ShareConfig.
  // Public payload: only what the share page needs.
  return NextResponse.json({
    title: project.name,
    webDeck: project.webDeck,
    share: project.share,
  });
}
