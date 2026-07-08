import { NextResponse } from "next/server";
import { listProjects } from "@/lib/storage/projectRepo";
import { ensureDb } from "@/lib/storage/db";
import type { Project } from "@/types/project";

export const runtime = "nodejs";

// Lightweight project summary for the dashboard/demo lists. Full decks can be
// megabytes; the list view only needs metadata, so we project here rather
// than ship every webDeck over the wire.
export type ProjectSummary = {
  id: string;
  name: string;
  sourceFileName: string;
  createdAt: string;
  updatedAt: string;
  status: Project["status"];
  sectionCount: number;
  shared: boolean;
  isDemo: boolean;
  demoMeta?: Project["demoMeta"];
  theme?: string;
};

function toSummary(p: Project): ProjectSummary {
  return {
    id: p.id,
    name: p.name,
    sourceFileName: p.sourceFileName,
    createdAt: p.createdAt,
    updatedAt: p.updatedAt,
    status: p.status,
    sectionCount: p.webDeck?.sections.length ?? 0,
    shared: Boolean(p.share?.isPublished),
    isDemo: Boolean(p.isDemo),
    demoMeta: p.demoMeta,
    theme: p.webDeck?.theme?.name,
  };
}

// GET /api/projects?demo=1 -> only demos; ?demo=0 -> only non-demos; default all.
export async function GET(req: Request) {
  await ensureDb();
  const url = new URL(req.url);
  const demo = url.searchParams.get("demo");
  let projects = await listProjects();
  if (demo === "1") projects = projects.filter((p) => p.isDemo);
  else if (demo === "0") projects = projects.filter((p) => !p.isDemo);
  const summaries = projects.map(toSummary);
  return NextResponse.json({ projects: summaries });
}
