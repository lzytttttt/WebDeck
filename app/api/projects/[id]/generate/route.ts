import { NextRequest, NextResponse } from "next/server";
import { getProject, updateProject } from "@/lib/storage/projectRepo";
import { ensureDb } from "@/lib/storage/db";
import { getAIProvider } from "@/lib/ai/getAIProvider";
import type { DeckMode, WebDeck } from "@/types/deck";

export const runtime = "nodejs";

// Two jobs behind one endpoint:
//  1) { webDeck }        -> persist client-side edits (mode switch, applied suggestions)
//  2) { mode, regenerate:true } -> re-run the AI provider for that mode
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  await ensureDb();
  const project = await getProject(params.id);
  if (!project) {
    return NextResponse.json({ error: "项目不存在" }, { status: 404 });
  }

  let body: { mode?: DeckMode; webDeck?: WebDeck; regenerate?: boolean } = {};
  try {
    body = await req.json();
  } catch {
    // empty body is allowed -> defaults to regenerate current mode
  }

  // Persist an already-computed deck from the client.
  if (body.webDeck && !body.regenerate) {
    const updated = await updateProject(params.id, {
      webDeck: body.webDeck,
      status: project.status === "published" ? "published" : "generated",
    });
    return NextResponse.json(updated);
  }

  // Regenerate via the AI provider.
  const mode: DeckMode = body.mode || project.webDeck?.mode || "conservative";
  const provider = getAIProvider();
  const webDeck = await provider.generateWebDeck({
    projectName: project.name,
    slides: project.slides,
    mode,
  });

  const updated = await updateProject(params.id, {
    webDeck,
    status: project.status === "published" ? "published" : "generated",
  });
  return NextResponse.json(updated);
}
