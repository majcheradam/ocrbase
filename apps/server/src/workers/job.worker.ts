import { type Job as BullJob, Worker } from "bullmq";

import {
  completeJob,
  failJob,
  getJobById,
  updateJobFileInfo,
  updateJobStatus,
} from "../lib/job-status";
import { type WorkerJobContext, workerLogger } from "../lib/worker-logger";
import { llmService } from "../services/llm";
import { parseDocument } from "../services/ocr";
import { type JobData, getWorkerConnection } from "../services/queue";
import { StorageService } from "../services/storage";

const runExtraction = async (
  jobId: string,
  markdown: string,
  schema: Record<string, unknown> | undefined,
  hints: string | null,
  pageCount: number,
  startTime: number
): Promise<void> => {
  await updateJobStatus(jobId, "extracting");

  const extractionResult = await llmService.processExtraction({
    hints: hints ?? undefined,
    markdown,
    schema,
  });

  const processingTimeMs = Date.now() - startTime;
  const tokenCount =
    extractionResult.usage.promptTokens +
    extractionResult.usage.completionTokens;

  await completeJob(jobId, {
    jsonResult: extractionResult.data,
    llmModel: extractionResult.model,
    llmUsage: extractionResult.usage,
    markdownResult: markdown,
    pageCount,
    processingTimeMs,
    tokenCount,
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

    // Download from URL if fileKey is not set
    let { fileKey } = job;
    let { mimeType } = job;

    if (!fileKey && job.sourceUrl) {
      const response = await fetch(job.sourceUrl);

      if (!response.ok) {
        throw new Error(
          `Failed to fetch file from URL: ${response.statusText}`
        );
      }

      const contentType =
        response.headers.get("content-type") ?? "application/octet-stream";
      const buffer = Buffer.from(await response.arrayBuffer());

      const urlParts = new URL(job.sourceUrl);
      const fileName =
        urlParts.pathname.split("/").pop() ?? `download-${Date.now()}`;

      fileKey = `${job.organizationId}/jobs/${job.id}/${fileName}`;
      mimeType = contentType;

      await StorageService.uploadFile(fileKey, buffer, contentType);
      await updateJobFileInfo(jobId, {
        fileKey,
        fileName,
        fileSize: buffer.length,
        mimeType: contentType,
      });
    }

    if (!fileKey) {
      throw new Error("No file or URL provided for job");
    }

    const fileBuffer = await StorageService.getFile(fileKey);
    const { markdown, pageCount } = await parseDocument(fileBuffer, mimeType);

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
        job.hints,
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
  connection: getWorkerConnection(),
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
