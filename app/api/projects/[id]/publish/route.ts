import { NextRequest, NextResponse } from "next/server";
import { getProject, updateProject } from "@/lib/storage/projectStore";
import type { ShareConfig } from "@/types/project";
import { uid } from "@/lib/utils";

export const runtime = "nodejs";

export async function POST(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const project = await getProject(params.id);
  if (!project) {
    return NextResponse.json({ error: "项目不存在" }, { status: 404 });
  }
  if (!project.webDeck) {
    return NextResponse.json(
      { error: "请先生成 Web Deck 再发布" },
      { status: 409 }
    );
  }

  // Reuse an existing shareId if already published; otherwise mint one.
  const share: ShareConfig = project.share
    ? { ...project.share, isPublished: true }
    : {
        shareId: uid("share_"),
        isPublished: true,
        createdAt: new Date().toISOString(),
      };

  const updated = await updateProject(params.id, {
    share,
    status: "published",
  });

  return NextResponse.json({ shareId: share.shareId, project: updated });
}
