import { NextRequest, NextResponse } from "next/server";
import { ensureDb } from "@/lib/storage/db";
import { listCustomThemes, saveCustomTheme } from "@/lib/deck/customThemes";
import type { DeckTheme } from "@/types/deck";

export const runtime = "nodejs";

/** GET /api/themes — list saved custom themes. */
export async function GET() {
  await ensureDb();
  return NextResponse.json({ themes: listCustomThemes() });
}

/**
 * POST /api/themes — save (upsert) a custom theme.
 * Body: { theme: DeckTheme }
 */
export async function POST(req: NextRequest) {
  await ensureDb();
  const body = (await req.json().catch(() => ({}))) as { theme?: DeckTheme };
  if (!body.theme || typeof body.theme.id !== "string") {
    return NextResponse.json({ error: "Invalid theme payload" }, { status: 400 });
  }
  const saved = saveCustomTheme(body.theme);
  return NextResponse.json({ theme: saved });
}
