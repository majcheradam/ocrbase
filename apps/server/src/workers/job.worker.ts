import { type Job as BullJob, Worker } from "bullmq";

import {
  completeJob,
  failJob,
  getJobById,
  updateJobStatus,
} from "../lib/job-status";
import { type WorkerJobContext, workerLogger } from "../lib/worker-logger";
import { llmService } from "../services/llm";
import { parseDocument } from "../services/ocr";
import { type JobData, connection } from "../services/queue";
import { StorageService } from "../services/storage";

const runExtraction = async (
  jobId: string,
  markdown: string,
  schema: Record<string, unknown> | undefined,
  llmModel: string | null,
  llmProvider: string | null,
  pageCount: number,
  startTime: number
): Promise<void> => {
  await updateJobStatus(jobId, "extracting");

  const jsonResult = await llmService.processExtraction({
    markdown,
    model: llmModel ?? undefined,
    provider: llmProvider ?? undefined,
    schema,
  });

  const processingTimeMs = Date.now() - startTime;

  await completeJob(jobId, {
    jsonResult,
    markdownResult: markdown,
    pageCount,
    processingTimeMs,
  });
};

const finishParseJob = async (
  jobId: string,
  markdown: string,
  pageCount: number,
  startTime: number
): Promise<void> => {
  const processingTimeMs = Date.now() - startTime;

  await completeJob(jobId, {
    markdownResult: markdown,
    pageCount,
    processingTimeMs,
  });
};

const processJob = async (bullJob: BullJob<JobData>): Promise<void> => {
  const { jobId } = bullJob.data;
  const startTime = Date.now();

  const eventContext: WorkerJobContext = {
    bullJobId: bullJob.id,
    jobId,
  };

  try {
    const job = await getJobById(jobId);

    if (!job) {
      throw new Error(`Job not found: ${jobId}`);
    }

    eventContext.type = job.type;
    eventContext.fileSize = job.fileSize;
    eventContext.mimeType = job.mimeType;
    eventContext.userId = job.userId;
    eventContext.organizationId = job.organizationId;

    await updateJobStatus(jobId, "processing", { startedAt: new Date() });

    const fileBuffer = await StorageService.getFile(job.fileKey);
    const { markdown, pageCount } = await parseDocument(
      fileBuffer,
      job.mimeType
    );

    eventContext.pageCount = pageCount;

    await updateJobStatus(jobId, "processing", {
      markdownResult: markdown,
      pageCount,
    });

    if (job.type === "extract") {
      const schema = job.schema?.jsonSchema as
        | Record<string, unknown>
        | undefined;
      await runExtraction(
        jobId,
        markdown,
        schema,
        job.llmModel,
        job.llmProvider,
        pageCount,
        startTime
      );
    } else {
      await finishParseJob(jobId, markdown, pageCount, startTime);
    }

    eventContext.status = "completed";
    eventContext.outcome = "success";
  } catch (error) {
    eventContext.status = "failed";
    eventContext.outcome = "error";

    const isError = error instanceof Error;
    eventContext.error = {
      code: isError ? error.name : "UNKNOWN_ERROR",
      message: isError ? error.message : String(error),
      stack: isError ? error.stack : undefined,
    };

    throw error;
  } finally {
    eventContext.durationMs = Date.now() - startTime;
    workerLogger.info(eventContext, "job_processing");
  }
};

const worker = new Worker<JobData>("ocr-jobs", processJob, {
  concurrency: 5,
  connection,
});

worker.on("failed", async (job, error) => {
  const jobId = job?.data.jobId;

  if (jobId) {
    const errorCode = error.name || "PROCESSING_ERROR";
    const errorMessage = error.message || "Unknown error occurred";
    const attempts = job?.attemptsMade ?? 0;
    const maxAttempts = job?.opts.attempts ?? 3;
    const shouldRetry = attempts < maxAttempts;

    await failJob(jobId, errorCode, errorMessage, shouldRetry);
  }
});

worker.on("error", (error) => {
  workerLogger.error(
    {
      error: {
        code: error.name,
        message: error.message,
        stack: error.stack,
      },
    },
    "worker_error"
  );
});

const shutdown = async (): Promise<void> => {
  workerLogger.info({ event: "shutdown" }, "worker_lifecycle");
  await worker.close();
  process.exit(0);
};

process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);

workerLogger.info({ event: "startup" }, "worker_lifecycle");
