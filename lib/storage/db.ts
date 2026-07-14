import Database from "better-sqlite3";
import fs from "fs/promises";
import path from "path";

const DATA_DIR = path.join(process.cwd(), "data");
const DB_PATH = path.join(DATA_DIR, "webdeck.db");

let _db: Database.Database | null = null;
let _initialized = false;

export function getDb(): Database.Database {
  if (!_db) {
    throw new Error("Database not initialized. Call initDb() first.");
  }
  return _db;
}

/**
 * Lazy initialization: initializes the DB and runs JSON migration on first call.
 * Safe to call from every route handler — subsequent calls are no-ops.
 */
export async function ensureDb(): Promise<void> {
  if (_initialized) return;
  await initDb();
  await migrateFromJsonIfEmpty();
  _initialized = true;
}

export async function initDb(): Promise<Database.Database> {
  if (_db) return _db;

  await fs.mkdir(DATA_DIR, { recursive: true });

  _db = new Database(DB_PATH);
  _db.pragma("journal_mode = WAL");
  _db.pragma("foreign_keys = ON");

  migrate(_db);

  return _db;
}

function migrate(db: Database.Database): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS projects (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      source_file_name TEXT NOT NULL,
      source_file_path TEXT,
      status TEXT NOT NULL DEFAULT 'uploaded',
      slides_json TEXT,
      web_deck_json TEXT,
      assets_json TEXT,
      import_quality_json TEXT,
      share_json TEXT,
      is_demo INTEGER NOT NULL DEFAULT 0,
      demo_meta_json TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_projects_share
      ON projects(share_json);

    CREATE TABLE IF NOT EXISTS schema_version (
      version INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS custom_themes (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      theme_json TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS jobs (
      id TEXT PRIMARY KEY,
      type TEXT NOT NULL,
      status TEXT NOT NULL,
      progress INTEGER NOT NULL DEFAULT 0,
      error TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
  `);

  // Seed schema version row if missing
  const row = db.prepare("SELECT version FROM schema_version LIMIT 1").get() as
    | { version: number }
    | undefined;
  if (!row) {
    db.prepare("INSERT INTO schema_version (version) VALUES (1)").run();
  }
}

/**
 * One-time migration: if data/projects.json exists and the projects table is
 * empty, import all projects into SQLite and rename the JSON file to .bak.
 */
export async function migrateFromJsonIfEmpty(): Promise<void> {
  const db = getDb();
  const jsonPath = path.join(DATA_DIR, "projects.json");

  try {
    await fs.access(jsonPath);
  } catch {
    return; // no JSON file — nothing to do
  }

  const count = (db.prepare("SELECT COUNT(*) as c FROM projects").get() as { c: number }).c;
  if (count > 0) return; // already has data — skip

  let raw: string;
  try {
    raw = await fs.readFile(jsonPath, "utf8");
  } catch {
    return;
  }

  let parsed: { projects?: Array<Record<string, unknown>> };
  try {
    parsed = JSON.parse(raw);
  } catch {
    return;
  }

  if (!parsed.projects || !Array.isArray(parsed.projects) || parsed.projects.length === 0) {
    return;
  }

  const insert = db.prepare(`
    INSERT INTO projects (id, name, source_file_name, source_file_path, status,
      slides_json, web_deck_json, assets_json, import_quality_json, share_json,
      is_demo, demo_meta_json, created_at, updated_at)
    VALUES (@id, @name, @sourceFileName, @sourceFilePath, @status,
      @slidesJson, @webDeckJson, @assetsJson, @importQualityJson, @shareJson,
      @isDemo, @demoMetaJson, @createdAt, @updatedAt)
  `);

  const insertMany = db.transaction((projects: Array<Record<string, unknown>>) => {
    for (const p of projects) {
      insert.run({
        id: p.id as string,
        name: p.name as string,
        sourceFileName: p.sourceFileName as string,
        sourceFilePath: (p.sourceFilePath as string) ?? null,
        status: p.status as string,
        slidesJson: p.slides ? JSON.stringify(p.slides) : null,
        webDeckJson: p.webDeck ? JSON.stringify(p.webDeck) : null,
        assetsJson: p.assets ? JSON.stringify(p.assets) : null,
        importQualityJson: p.importQualityReport ? JSON.stringify(p.importQualityReport) : null,
        shareJson: p.share ? JSON.stringify(p.share) : null,
        isDemo: p.isDemo ? 1 : 0,
        demoMetaJson: p.demoMeta ? JSON.stringify(p.demoMeta) : null,
        createdAt: p.createdAt as string,
        updatedAt: p.updatedAt as string,
      });
    }
  });

  insertMany(parsed.projects);

  // Rename the JSON file to .bak so it's not re-imported
  await fs.rename(jsonPath, jsonPath + ".bak");
}
