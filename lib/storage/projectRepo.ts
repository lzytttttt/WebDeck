import fs from "fs/promises";
import path from "path";
import type { Project } from "@/types/project";
import { uid } from "@/lib/utils";
import { getDb } from "./db";

// Keep the same uploads dir for file storage (not going into SQLite)
const DATA_DIR = path.join(process.cwd(), "data");
export const UPLOADS_DIR = path.join(DATA_DIR, "uploads");

async function ensureUploadsDir(): Promise<void> {
  await fs.mkdir(UPLOADS_DIR, { recursive: true });
}

// ---------------------------------------------------------------------------
// Row <-> Project mapping
// ---------------------------------------------------------------------------

interface ProjectRow {
  id: string;
  name: string;
  source_file_name: string;
  source_file_path: string | null;
  status: string;
  slides_json: string | null;
  web_deck_json: string | null;
  assets_json: string | null;
  import_quality_json: string | null;
  share_json: string | null;
  is_demo: number;
  demo_meta_json: string | null;
  created_at: string;
  updated_at: string;
}

function rowToProject(row: ProjectRow): Project {
  return {
    id: row.id,
    name: row.name,
    sourceFileName: row.source_file_name,
    sourceFilePath: row.source_file_path ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    status: row.status as Project["status"],
    slides: row.slides_json ? JSON.parse(row.slides_json) : [],
    webDeck: row.web_deck_json ? JSON.parse(row.web_deck_json) : undefined,
    assets: row.assets_json ? JSON.parse(row.assets_json) : undefined,
    share: row.share_json ? JSON.parse(row.share_json) : undefined,
    importQualityReport: row.import_quality_json
      ? JSON.parse(row.import_quality_json)
      : undefined,
    isDemo: row.is_demo === 1,
    demoMeta: row.demo_meta_json ? JSON.parse(row.demo_meta_json) : undefined,
  };
}

function projectToParams(p: Project): Record<string, unknown> {
  return {
    id: p.id,
    name: p.name,
    sourceFileName: p.sourceFileName,
    sourceFilePath: p.sourceFilePath ?? null,
    status: p.status,
    slidesJson: p.slides ? JSON.stringify(p.slides) : null,
    webDeckJson: p.webDeck ? JSON.stringify(p.webDeck) : null,
    assetsJson: p.assets ? JSON.stringify(p.assets) : null,
    importQualityJson: p.importQualityReport
      ? JSON.stringify(p.importQualityReport)
      : null,
    shareJson: p.share ? JSON.stringify(p.share) : null,
    isDemo: p.isDemo ? 1 : 0,
    demoMetaJson: p.demoMeta ? JSON.stringify(p.demoMeta) : null,
    createdAt: p.createdAt,
    updatedAt: p.updatedAt,
  };
}

// ---------------------------------------------------------------------------
// Public API — same shape as projectStore.ts
// ---------------------------------------------------------------------------

export async function listProjects(): Promise<Project[]> {
  const db = getDb();
  const rows = db
    .prepare("SELECT * FROM projects ORDER BY created_at DESC")
    .all() as ProjectRow[];
  return rows.map(rowToProject);
}

export async function getProject(id: string): Promise<Project | undefined> {
  const db = getDb();
  const row = db.prepare("SELECT * FROM projects WHERE id = ?").get(id) as
    | ProjectRow
    | undefined;
  return row ? rowToProject(row) : undefined;
}

export async function getProjectByShareId(
  shareId: string,
): Promise<Project | undefined> {
  const db = getDb();
  // share_json contains the shareId; we filter in SQL via LIKE and verify in JS
  // Index on share_json helps with prefix scans.
  const rows = db
    .prepare("SELECT * FROM projects WHERE share_json IS NOT NULL")
    .all() as ProjectRow[];
  for (const row of rows) {
    const project = rowToProject(row);
    if (project.share?.shareId === shareId) return project;
  }
  return undefined;
}

export async function createProject(project: Project): Promise<Project> {
  const db = getDb();
  const params = projectToParams(project);
  db.prepare(
    `INSERT INTO projects (id, name, source_file_name, source_file_path, status,
      slides_json, web_deck_json, assets_json, import_quality_json, share_json,
      is_demo, demo_meta_json, created_at, updated_at)
    VALUES (@id, @name, @sourceFileName, @sourceFilePath, @status,
      @slidesJson, @webDeckJson, @assetsJson, @importQualityJson, @shareJson,
      @isDemo, @demoMetaJson, @createdAt, @updatedAt)`,
  ).run(params);
  return project;
}

export async function updateProject(
  id: string,
  patch: Partial<Project>,
): Promise<Project | undefined> {
  const existing = await getProject(id);
  if (!existing) return undefined;

  const updated: Project = {
    ...existing,
    ...patch,
    id, // id is immutable
    updatedAt: new Date().toISOString(),
  };

  const db = getDb();
  const params = projectToParams(updated);
  db.prepare(
    `UPDATE projects SET
      name = @name,
      source_file_name = @sourceFileName,
      source_file_path = @sourceFilePath,
      status = @status,
      slides_json = @slidesJson,
      web_deck_json = @webDeckJson,
      assets_json = @assetsJson,
      import_quality_json = @importQualityJson,
      share_json = @shareJson,
      is_demo = @isDemo,
      demo_meta_json = @demoMetaJson,
      created_at = @createdAt,
      updated_at = @updatedAt
    WHERE id = @id`,
  ).run(params);

  return updated;
}

export async function deleteProject(id: string): Promise<boolean> {
  const db = getDb();
  const result = db.prepare("DELETE FROM projects WHERE id = ?").run(id);
  return result.changes > 0;
}

export async function duplicateProject(
  id: string,
): Promise<Project | undefined> {
  const src = await getProject(id);
  if (!src) return undefined;

  const now = new Date().toISOString();
  const newId = uid("proj_");
  const clone: Project = {
    ...(JSON.parse(JSON.stringify(src)) as Project),
    id: newId,
    name: `${src.name} copy`,
    createdAt: now,
    updatedAt: now,
    status: "generated",
    share: undefined,
    isDemo: false,
    demoMeta: undefined,
  };
  if (clone.webDeck) {
    clone.webDeck.sections = clone.webDeck.sections.map((s) => ({
      ...s,
      id: uid("sec_"),
    }));
  }

  await createProject(clone);
  return clone;
}

// Persist an uploaded .pptx and return its absolute path.
export async function saveUpload(
  projectId: string,
  fileName: string,
  data: Buffer,
): Promise<string> {
  await ensureUploadsDir();
  const safeName = fileName.replace(/[^a-zA-Z0-9._-]/g, "_");
  const dest = path.join(UPLOADS_DIR, `${projectId}__${safeName}`);
  await fs.writeFile(dest, data);
  return dest;
}
