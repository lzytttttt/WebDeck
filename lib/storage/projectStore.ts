import fs from "fs/promises";
import path from "path";
import type { Project } from "@/types/project";
import { uid } from "@/lib/utils";

// MVP persistence: a single JSON file plus an uploads dir. Deliberately
// simple; swap for SQLite later behind this same async surface.
const DATA_DIR = path.join(process.cwd(), "data");
const DB_PATH = path.join(DATA_DIR, "projects.json");
export const UPLOADS_DIR = path.join(DATA_DIR, "uploads");

type Db = { projects: Project[] };

async function ensureDirs(): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.mkdir(UPLOADS_DIR, { recursive: true });
}

async function readDb(): Promise<Db> {
  await ensureDirs();
  try {
    const raw = await fs.readFile(DB_PATH, "utf8");
    const parsed = JSON.parse(raw) as Db;
    if (!parsed.projects) return { projects: [] };
    return parsed;
  } catch (err: unknown) {
    if ((err as NodeJS.ErrnoException).code === "ENOENT") {
      return { projects: [] };
    }
    throw err;
  }
}

async function writeDb(db: Db): Promise<void> {
  await ensureDirs();
  await fs.writeFile(DB_PATH, JSON.stringify(db, null, 2), "utf8");
}

export async function listProjects(): Promise<Project[]> {
  const db = await readDb();
  return db.projects;
}

export async function getProject(id: string): Promise<Project | undefined> {
  const db = await readDb();
  return db.projects.find((p) => p.id === id);
}

export async function getProjectByShareId(
  shareId: string
): Promise<Project | undefined> {
  const db = await readDb();
  return db.projects.find((p) => p.share?.shareId === shareId);
}

export async function createProject(project: Project): Promise<Project> {
  const db = await readDb();
  db.projects.push(project);
  await writeDb(db);
  return project;
}

export async function updateProject(
  id: string,
  patch: Partial<Project>
): Promise<Project | undefined> {
  const db = await readDb();
  const idx = db.projects.findIndex((p) => p.id === id);
  if (idx === -1) return undefined;
  const updated: Project = {
    ...db.projects[idx],
    ...patch,
    id,
    updatedAt: new Date().toISOString(),
  };
  db.projects[idx] = updated;
  await writeDb(db);
  return updated;
}

// Remove a project from the store. Returns whether a row was deleted. The
// uploaded .pptx (if any) is left on disk — cheap, and avoids a partial-delete
// window; a future GC can sweep orphaned uploads.
export async function deleteProject(id: string): Promise<boolean> {
  const db = await readDb();
  const next = db.projects.filter((p) => p.id !== id);
  if (next.length === db.projects.length) return false;
  await writeDb({ projects: next });
  return true;
}

// Duplicate a project's deck/assets/slides under a fresh id. Status resets to
// "generated" and any share config is dropped (a copy is unpublished). Section
// ids are re-minted so the two decks never alias the same section on edit.
export async function duplicateProject(
  id: string,
): Promise<Project | undefined> {
  const db = await readDb();
  const src = db.projects.find((p) => p.id === id);
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
  db.projects.push(clone);
  await writeDb(db);
  return clone;
}

// Persist an uploaded .pptx and return its absolute path.
export async function saveUpload(
  projectId: string,
  fileName: string,
  data: Buffer
): Promise<string> {
  await ensureDirs();
  const safeName = fileName.replace(/[^a-zA-Z0-9._-]/g, "_");
  const dest = path.join(UPLOADS_DIR, `${projectId}__${safeName}`);
  await fs.writeFile(dest, data);
  return dest;
}
