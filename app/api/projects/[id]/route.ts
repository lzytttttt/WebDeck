import { NextRequest, NextResponse } from "next/server";
import { getProject, updateProject, deleteProject } from "@/lib/storage/projectRepo";
import { ensureDb } from "@/lib/storage/db";
import type { Project } from "@/types/project";

export const runtime = "nodejs";

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  await ensureDb();
  const project = await getProject(params.id);
  if (!project) {
    return NextResponse.json({ error: "项目不存在" }, { status: 404 });
  }
  return NextResponse.json(project);
}

// Partial update of a project: webDeck / assets / name. updatedAt is set by
// the store. Used by the editor's debounced autosave.
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  await ensureDb();
  const project = await getProject(params.id);
  if (!project) {
    return NextResponse.json({ error: "项目不存在" }, { status: 404 });
  }

  let body: {
    webDeck?: Project["webDeck"];
    assets?: Project["assets"];
    name?: string;
  } = {};
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "无效的请求体" }, { status: 400 });
  }

  const patch: Partial<Project> = {};
  if (body.webDeck !== undefined) patch.webDeck = body.webDeck;
  if (body.assets !== undefined) patch.assets = body.assets;
  if (typeof body.name === "string" && body.name.trim()) patch.name = body.name;

  const updated = await updateProject(params.id, patch);
  return NextResponse.json(updated);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } },
) {
  await ensureDb();
  const ok = await deleteProject(params.id);
  if (!ok) {
    return NextResponse.json({ error: "项目不存在" }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}
