import { uid } from "@/lib/utils";

export type JobStatus = "pending" | "running" | "completed" | "failed";

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
  return job;
}

export function getJob(id: string): Job | undefined {
  return jobs.get(id);
}

export function updateJob(id: string, updates: Partial<Job>): void {
  const job = jobs.get(id);
  if (!job) return;
  Object.assign(job, updates, { updatedAt: new Date().toISOString() });
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
    updateJob(id, { progress: Math.min(100, Math.max(0, Math.round(progress))) });
  };

  fn(onProgress)
    .then((result) => {
      updateJob(id, { status: "completed", progress: 100, result });
    })
    .catch((err: unknown) => {
      const message = err instanceof Error ? err.message : String(err);
      updateJob(id, { status: "failed", error: message });
    });
}
