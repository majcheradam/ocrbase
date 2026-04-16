import IORedis from "ioredis";
import { Queue, QueueEvents } from "bullmq";
import { env } from "../env";

function createBullMqResources() {
  if (!env.REDIS_URL) {
    return {};
  }

  const redis = new IORedis(env.REDIS_URL, { maxRetriesPerRequest: null });

  return {
    extractQueue: new Queue("extract", { connection: redis }),
    extractQueueEvents: new QueueEvents("extract", { connection: redis }),
    parseQueue: new Queue("parse", { connection: redis }),
    parseQueueEvents: new QueueEvents("parse", { connection: redis }),
    redis,
  };
}

export const { extractQueue, extractQueueEvents, parseQueue, parseQueueEvents, redis } =
  createBullMqResources();
