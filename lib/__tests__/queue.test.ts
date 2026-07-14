import { describe, it, expect } from "vitest";
import {
  createJob,
  getJob,
  cancelJob,
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
});
