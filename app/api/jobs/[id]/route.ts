import { NextRequest, NextResponse } from "next/server";
import { getJob } from "@/lib/workers/queue";

export const runtime = "nodejs";

/**
 * GET /api/jobs/[id] — poll job status.
 * Returns { status, progress, result?, error? }
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const job = getJob(params.id);
  if (!job) {
    return NextResponse.json({ error: "Job not found" }, { status: 404 });
  }

  const body: Record<string, unknown> = {
    status: job.status,
    progress: job.progress,
  };
  if (job.status === "completed") body.result = job.result;
  if (job.status === "failed") body.error = job.error;

  return NextResponse.json(body);
}
