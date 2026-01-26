import type { JobStatus } from "@ocrbase/db/lib/enums";

import { env } from "@ocrbase/env/server";
import Redis from "ioredis";

export interface JobUpdateMessage {
  type: "status" | "completed" | "error";
  jobId: string;
  data: {
    status?: JobStatus;
    processingTimeMs?: number;
    error?: string;
    markdownResult?: string;
    jsonResult?: unknown;
  };
}

const getRedisUrl = (): string => env.REDIS_URL ?? "redis://localhost:6379";

const createRedisClient = (): Redis =>
  new Redis(getRedisUrl(), {
    enableReadyCheck: false,
    maxRetriesPerRequest: null,
  });

const publisher = createRedisClient();
const subscriber = createRedisClient();

const subscriptions = new Map<
  string,
  Set<(message: JobUpdateMessage) => void>
>();

const getChannelName = (jobId: string): string => `job:${jobId}`;

export const publishJobUpdate = async (
  jobId: string,
  message: JobUpdateMessage
): Promise<void> => {
  const channel = getChannelName(jobId);
  await publisher.publish(channel, JSON.stringify(message));
};

export const subscribeToJob = (
  jobId: string,
  handler: (message: JobUpdateMessage) => void
): void => {
  const channel = getChannelName(jobId);

  if (!subscriptions.has(channel)) {
    subscriptions.set(channel, new Set());
    subscriber.subscribe(channel);
  }

  subscriptions.get(channel)?.add(handler);
};

export const unsubscribeFromJob = (
  jobId: string,
  handler: (message: JobUpdateMessage) => void
): void => {
  const channel = getChannelName(jobId);
  const handlers = subscriptions.get(channel);

  if (handlers) {
    handlers.delete(handler);

    if (handlers.size === 0) {
      subscriptions.delete(channel);
      subscriber.unsubscribe(channel);
    }
  }
};

const initializeMessageHandler = (): void => {
  subscriber.on("message", (channel, messageStr) => {
    const handlers = subscriptions.get(channel);

    if (handlers) {
      try {
        const message = JSON.parse(messageStr) as JobUpdateMessage;

        for (const handler of handlers) {
          handler(message);
        }
      } catch {
        // Invalid message, ignore
      }
    }
  });
};

initializeMessageHandler();

export const closeWebSocketConnections = async (): Promise<void> => {
  subscriptions.clear();
  await Promise.all([publisher.quit(), subscriber.quit()]);
};
