import { env } from "@ocrbase/env/server";
import { Queue, type ConnectionOptions } from "bullmq";

// Job retention: 1 day for completed, 7 days for failed
const DEFAULT_JOB_RETENTION_COMPLETE = 86_400;
const DEFAULT_JOB_RETENTION_FAIL = 604_800;
const MAX_COMPLETED_JOBS = 1000;
const DEFAULT_BACKOFF_DELAY = 1000;
const DEFAULT_JOB_ATTEMPTS = 3;

export interface JobData {
  jobId: string;
  organizationId: string;
  userId: string;
}

const getRedisConnection = (): ConnectionOptions => {
  if (!env.REDIS_URL) {
    return { host: "localhost", port: 6379 };
  }
  const url = new URL(env.REDIS_URL);
  return {
    host: url.hostname,
    password: url.password || undefined,
    port: Number(url.port) || 6379,
    username: url.username || undefined,
  };
};

export const connection: ConnectionOptions = getRedisConnection();

export const jobQueue = new Queue<JobData>("ocr-jobs", {
  connection,
  defaultJobOptions: {
    attempts: DEFAULT_JOB_ATTEMPTS,
    backoff: {
      delay: DEFAULT_BACKOFF_DELAY,
      type: "exponential",
    },
    removeOnComplete: {
      age: DEFAULT_JOB_RETENTION_COMPLETE,
      count: MAX_COMPLETED_JOBS,
    },
    removeOnFail: {
      age: DEFAULT_JOB_RETENTION_FAIL,
    },
  },
});

export const addJob = async (data: JobData): Promise<string> => {
  const job = await jobQueue.add("process-document", data, {
    jobId: data.jobId,
  });
  return job.id ?? data.jobId;
};

export const checkQueueHealth = async (): Promise<boolean> => {
  try {
    await jobQueue.getJobCounts();
    return true;
  } catch {
    return false;
  }
};
