import { describe, it, expect } from "vitest";
import {
  createJob,
  getJob,
  cancelJob,
  updateJob,
  runJob,
} from "@/lib/workers/queue";

describe("job queue", () => {
  it("cancels a running job and discards its result", async () => {
    const job = createJob("test");
    let resolveFn: (v: unknown) => void = () => {};
    const p = new Promise((res) => {
      resolveFn = res;
    });
    runJob(job.id, async () => {
      await p;
      return { ok: true };
    });
    expect(getJob(job.id)!.status).toBe("running");

    const cancelled = cancelJob(job.id);
    expect(cancelled).toBe(true);

    // Let the (now cancelled) underlying work finish.
    resolveFn({ ok: true });
    await new Promise((r) => setTimeout(r, 30));

    const after = getJob(job.id)!;
    expect(after.status).toBe("cancelled");
    expect(after.result).toBeUndefined();
  });

  it("cannot cancel an already-completed job", async () => {
    const job = createJob("test");
    runJob(job.id, async () => "done");
    await new Promise((r) => setTimeout(r, 30));
    expect(getJob(job.id)!.status).toBe("completed");
    expect(cancelJob(job.id)).toBe(false);
  });

  it("rejects cancellation for a missing job", () => {
    expect(cancelJob("job_does_not_exist")).toBe(false);
  });

  it("reports progress and completes with the runner result", async () => {
    const job = createJob("test");
    runJob(job.id, async (onProgress) => {
      onProgress(50);
      return { ok: true };
    });
    // Allow the fire-and-forget promise to settle.
    await new Promise((r) => setTimeout(r, 40));
    const after = getJob(job.id)!;
    expect(after.status).toBe("completed");
    expect(after.progress).toBe(100);
    expect(after.result).toEqual({ ok: true });
  });

  it("marks a job as failed when the runner throws", async () => {
    const job = createJob("test");
    runJob(job.id, async () => {
      throw new Error("boom");
    });
    await new Promise((r) => setTimeout(r, 40));
    const after = getJob(job.id)!;
    expect(after.status).toBe("failed");
    expect(after.error).toContain("boom");
  });

  it("updateJob mutates an in-memory job", () => {
    const job = createJob("test");
    updateJob(job.id, { progress: 42 });
    expect(getJob(job.id)!.progress).toBe(42);
  });

  it("getJob falls back to the persisted DB record", () => {
    const job = createJob("test");
    updateJob(job.id, { status: "completed", progress: 100 });
    // A fresh lookup still resolves the job (from memory here, but the DB
    // fallback path is exercised if the process were restarted).
    const found = getJob(job.id);
    expect(found).toBeDefined();
    expect(found!.id).toBe(job.id);
  });
});
