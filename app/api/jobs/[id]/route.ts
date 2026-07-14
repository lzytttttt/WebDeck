import { NextRequest, NextResponse } from "next/server";
import { getJob, cancelJob } from "@/lib/workers/queue";

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

/**
 * DELETE /api/jobs/[id] — cancel a pending/running job.
 * Terminal jobs (completed/failed/cancelled) cannot be cancelled.
 */
export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const job = getJob(params.id);
  if (!job) {
    return NextResponse.json({ error: "Job not found" }, { status: 404 });
  }
  const cancelled = cancelJob(params.id);
  if (!cancelled) {
    return NextResponse.json(
      { status: job.status, error: "Job cannot be cancelled" },
      { status: 409 },
    );
  }
  return NextResponse.json({ status: "cancelled" });
}
