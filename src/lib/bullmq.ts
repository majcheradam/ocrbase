import IORedis from "ioredis";
import { Queue, QueueEvents } from "bullmq";
import { env } from "../env";

export const redis = env.REDIS_URL
  ? new IORedis(env.REDIS_URL, { maxRetriesPerRequest: null })
  : null;

export const parseQueue = redis ? new Queue("parse", { connection: redis }) : null;

export const parseQueueEvents = redis ? new QueueEvents("parse", { connection: redis }) : null;
