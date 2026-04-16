import { Elysia, t } from "elysia";
import { parseQueue, extractQueue } from "../lib/bullmq";

export const jobModule = new Elysia().get(
  "/job/:job_id",
  async function getJob({ params, set }) {
    if (!parseQueue) {
      set.status = 503;
      return { error: "Queue not available" };
    }
    const job =
      (await parseQueue.getJob(params.job_id)) ??
      (await extractQueue?.getJob(params.job_id)) ??
      null;
    if (!job) {
      set.status = 404;
      return { error: "Job not found" };
    }
    const state = await job.getState();
    if (state === "completed") {
      return { job_id: job.id, result: job.returnvalue, status: state };
    }
    if (state === "failed") {
      return { error: job.failedReason, job_id: job.id, status: state };
    }
    return { job_id: job.id, status: state };
  },
  {
    detail: {
      summary: "Job",
    },
    params: t.Object({
      job_id: t.String(),
    }),
  },
);
