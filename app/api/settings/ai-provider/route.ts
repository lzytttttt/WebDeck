import { NextRequest, NextResponse } from "next/server";
import { ensureDb } from "@/lib/storage/db";
import { getAIConfig, setAIConfig } from "@/lib/storage/settings";

export const runtime = "nodejs";

/**
 * GET /api/settings/ai-provider — return the effective AI configuration
 * (user-saved settings merged with env-var fallbacks).
 */
export async function GET() {
  await ensureDb();
  return NextResponse.json(getAIConfig());
}

/**
 * POST /api/settings/ai-provider — persist the user's AI provider choice.
 * Body may contain any subset of { provider, anthropicKey, openaiKey,
 * openaiModel, ollamaUrl }.
 */
export async function POST(req: NextRequest) {
  await ensureDb();
  let body: Record<string, unknown> = {};
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  try {
    const updated = setAIConfig({
      provider: body.provider as never,
      anthropicKey: body.anthropicKey as string | undefined,
      openaiKey: body.openaiKey as string | undefined,
      openaiModel: body.openaiModel as string | undefined,
      ollamaUrl: body.ollamaUrl as string | undefined,
    });
    return NextResponse.json(updated);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to save settings" },
      { status: 400 },
    );
  }
}
