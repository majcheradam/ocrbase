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

export const getRedisConnection = (): ConnectionOptions | null => {
  if (!env.REDIS_URL) {
    return null;
  }
  const url = new URL(env.REDIS_URL);
  return {
    host: url.hostname,
    password: url.password || undefined,
    port: Number(url.port) || 6379,
    username: url.username || undefined,
  };
};

// Lazy-init for build-time safety (no Redis connection at import)
let _jobQueue: Queue<JobData> | null = null;

const getJobQueue = (): Queue<JobData> | null => {
  if (_jobQueue) {
    return _jobQueue;
  }
  const connection = getRedisConnection();
  if (!connection) {
    return null;
  }
  _jobQueue = new Queue<JobData>("ocr-jobs", {
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
  return _jobQueue;
};

export const addJob = async (data: JobData): Promise<string> => {
  const queue = getJobQueue();
  if (!queue) {
    throw new Error("Redis not configured");
  }
  const job = await queue.add("process-document", data, {
    jobId: data.jobId,
  });
  return job.id ?? data.jobId;
};

export const checkQueueHealth = async (): Promise<boolean> => {
  try {
    const queue = getJobQueue();
    if (!queue) {
      return false;
    }
    await queue.getJobCounts();
    return true;
  } catch {
    return false;
  }
};

// For worker process - will throw if Redis not configured
export const getWorkerConnection = (): ConnectionOptions => {
  const conn = getRedisConnection();
  if (!conn) {
    throw new Error("REDIS_URL is required for worker");
  }
  return conn;
};
