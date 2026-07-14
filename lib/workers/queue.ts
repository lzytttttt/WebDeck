import { uid } from "@/lib/utils";
import { getDb } from "@/lib/storage/db";

export type JobStatus =
  | "pending"
  | "running"
  | "completed"
  | "failed"
  | "cancelled";

export interface Job {
  id: string;
  type: string;
  status: JobStatus;
  progress: number; // 0-100
  result?: unknown;
  error?: string;
  createdAt: string;
  updatedAt: string;
}

const jobs = new Map<string, Job>();

// ---------------------------------------------------------------------------
// Persistence (status only — the heavy result lives on the project row)
// ---------------------------------------------------------------------------
// Jobs are kept in memory during their lifetime. We additionally mirror the
// lightweight status to SQLite so a process restart can still report a
// terminal state instead of a silent "not found".

function persist(job: Job): void {
  try {
    const db = getDb();
    db.prepare(
      `INSERT INTO jobs (id, type, status, progress, error, created_at, updated_at)
       VALUES (@id, @type, @status, @progress, @error, @createdAt, @updatedAt)
       ON CONFLICT(id) DO UPDATE SET
         status = @status,
         progress = @progress,
         error = @error,
         updated_at = @updatedAt`,
    ).run({
      id: job.id,
      type: job.type,
      status: job.status,
      progress: job.progress,
      error: job.error ?? null,
      createdAt: job.createdAt,
      updatedAt: job.updatedAt,
    });
  } catch {
    // Persistence is best-effort; in-memory state stays authoritative.
  }
}

export function createJob(type: string): Job {
  const now = new Date().toISOString();
  const job: Job = {
    id: uid("job_"),
    type,
    status: "pending",
    progress: 0,
    createdAt: now,
    updatedAt: now,
  };
  jobs.set(job.id, job);
  persist(job);
  return job;
}

export function getJob(id: string): Job | undefined {
  const mem = jobs.get(id);
  if (mem) return mem;
  // Fall back to the DB for jobs created in a previous process lifetime.
  try {
    const row = getDb()
      .prepare("SELECT * FROM jobs WHERE id = ?")
      .get(id) as
      | {
          id: string;
          type: string;
          status: JobStatus;
          progress: number;
          error: string | null;
          created_at: string;
          updated_at: string;
        }
      | undefined;
    if (!row) return undefined;
    return {
      id: row.id,
      type: row.type,
      status: row.status,
      progress: row.progress,
      error: row.error ?? undefined,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  } catch {
    return undefined;
  }
}

export function updateJob(id: string, updates: Partial<Job>): void {
  const job = jobs.get(id);
  if (!job) return;
  Object.assign(job, updates, { updatedAt: new Date().toISOString() });
  persist(job);
}

/** Mark a running/pending job as cancelled. Returns false if it can't be cancelled. */
export function cancelJob(id: string): boolean {
  const job = jobs.get(id);
  if (!job) return false;
  if (
    job.status === "completed" ||
    job.status === "failed" ||
    job.status === "cancelled"
  ) {
    return false;
  }
  job.status = "cancelled";
  job.updatedAt = new Date().toISOString();
  persist(job);
  return true;
}

/**
 * Fire-and-forget execution wrapper.
 * Runs `fn` asynchronously, updating job status/progress/result/error along the way.
 * The caller should invoke this without `await` so the HTTP response returns immediately.
 */
export function runJob(
  id: string,
  fn: (onProgress: (progress: number) => void) => Promise<unknown>,
): void {
  updateJob(id, { status: "running", progress: 0 });

  const onProgress = (progress: number) => {
    updateJob(id, {
      progress: Math.min(100, Math.max(0, Math.round(progress))),
    });
  };

  fn(onProgress)
    .then((result) => {
      // A cancellation requested while the job was running wins — drop the
      // result so a stale deck is never applied.
      if (jobs.get(id)?.status === "cancelled") return;
      updateJob(id, { status: "completed", progress: 100, result });
    })
    .catch((err: unknown) => {
      const message = err instanceof Error ? err.message : String(err);
      updateJob(id, { status: "failed", error: message });
    });
}
