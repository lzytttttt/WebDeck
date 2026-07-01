import { NextRequest, NextResponse } from "next/server";
import { duplicateProject } from "@/lib/storage/projectStore";

export const runtime = "nodejs";

// POST /api/projects/[id]/duplicate -> copy deck/assets/slides under a new id.
export async function POST(
  _req: NextRequest,
  { params }: { params: { id: string } },
) {
  const clone = await duplicateProject(params.id);
  if (!clone) {
    return NextResponse.json({ error: "项目不存在" }, { status: 404 });
  }
  return NextResponse.json({ id: clone.id, project: clone }, { status: 201 });
}
