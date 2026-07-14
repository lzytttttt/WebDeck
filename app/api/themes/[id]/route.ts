import { NextRequest, NextResponse } from "next/server";
import { ensureDb } from "@/lib/storage/db";
import { deleteCustomTheme } from "@/lib/deck/customThemes";

export const runtime = "nodejs";

/** DELETE /api/themes/[id] — remove a saved custom theme. */
export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } },
) {
  await ensureDb();
  const removed = deleteCustomTheme(params.id);
  if (!removed) {
    return NextResponse.json({ error: "Theme not found" }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}
