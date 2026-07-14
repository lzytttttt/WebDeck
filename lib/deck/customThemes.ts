/**
 * Custom theme library (persisted user "design templates").
 *
 * These are full DeckTheme objects saved by the user from the editor. Applying
 * one simply copies the object into `deck.theme`, so the React preview and the
 * static export (which read `deck.theme` directly) pick it up with no extra
 * wiring. `getThemeById` is intentionally NOT changed — built-in resolution
 * stays synchronous and client-safe.
 *
 * Server-only: uses better-sqlite3 (synchronous API). Do not import from
 * client components; go through the /api/themes routes instead.
 */
import { getDb } from "@/lib/storage/db";
import type { DeckTheme } from "@/types/deck";

interface CustomThemeRow {
  id: string;
  name: string;
  theme_json: string;
  created_at: string;
  updated_at: string;
}

function rowToTheme(row: CustomThemeRow): DeckTheme {
  return JSON.parse(row.theme_json) as DeckTheme;
}

/** List all saved custom themes, newest first. */
export function listCustomThemes(): DeckTheme[] {
  const db = getDb();
  const rows = db
    .prepare("SELECT * FROM custom_themes ORDER BY created_at DESC")
    .all() as CustomThemeRow[];
  return rows.map(rowToTheme);
}

/** Fetch a single saved theme by id, or undefined if absent. */
export function getCustomThemeById(id: string): DeckTheme | undefined {
  const db = getDb();
  const row = db
    .prepare("SELECT * FROM custom_themes WHERE id = ?")
    .get(id) as CustomThemeRow | undefined;
  return row ? rowToTheme(row) : undefined;
}

/** Upsert a theme (matched by id). Returns the stored theme. */
export function saveCustomTheme(theme: DeckTheme): DeckTheme {
  const db = getDb();
  const now = new Date().toISOString();
  db.prepare(
    `INSERT INTO custom_themes (id, name, theme_json, created_at, updated_at)
     VALUES (@id, @name, @themeJson, @createdAt, @updatedAt)
     ON CONFLICT(id) DO UPDATE SET
       name = excluded.name,
       theme_json = excluded.theme_json,
       updated_at = excluded.updated_at`,
  ).run({
    id: theme.id,
    name: theme.name,
    themeJson: JSON.stringify(theme),
    createdAt: now,
    updatedAt: now,
  });
  return theme;
}

/** Delete a saved theme by id. Returns true if a row was removed. */
export function deleteCustomTheme(id: string): boolean {
  const db = getDb();
  const res = db.prepare("DELETE FROM custom_themes WHERE id = ?").run(id);
  return res.changes > 0;
}
