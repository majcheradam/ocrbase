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

const getRedisUrl = (): string | null => env.REDIS_URL ?? null;

const createRedisClient = (): Redis | null => {
  const url = getRedisUrl();
  if (!url) {
    return null;
  }
  return new Redis(url, {
    enableReadyCheck: false,
    maxRetriesPerRequest: null,
  });
};

let publisher: Redis | null = null;
let subscriber: Redis | null = null;

const getPublisher = (): Redis | null => {
  if (!publisher) {
    publisher = createRedisClient();
  }
  return publisher;
};

const getSubscriber = (): Redis | null => {
  if (!subscriber) {
    subscriber = createRedisClient();
  }
  return subscriber;
};

const subscriptions = new Map<
  string,
  Set<(message: JobUpdateMessage) => void>
>();

const getChannelName = (jobId: string): string => `job:${jobId}`;

export const publishJobUpdate = async (
  jobId: string,
  message: JobUpdateMessage
): Promise<void> => {
  const pub = getPublisher();
  if (!pub) {
    return;
  }
  const channel = getChannelName(jobId);
  await pub.publish(channel, JSON.stringify(message));
};

export const subscribeToJob = (
  jobId: string,
  handler: (message: JobUpdateMessage) => void
): void => {
  const sub = getSubscriber();
  if (!sub) {
    return;
  }

  initializeMessageHandler();
  const channel = getChannelName(jobId);

  if (!subscriptions.has(channel)) {
    subscriptions.set(channel, new Set());
    sub.subscribe(channel);
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
      subscriber?.unsubscribe(channel);
    }
  }
};

let messageHandlerInitialized = false;

const initializeMessageHandler = (): void => {
  if (messageHandlerInitialized) {
    return;
  }
  const sub = getSubscriber();
  if (!sub) {
    return;
  }
  messageHandlerInitialized = true;

  sub.on("message", (channel, messageStr) => {
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

export const closeWebSocketConnections = async (): Promise<void> => {
  subscriptions.clear();
  const promises: Promise<string>[] = [];
  if (publisher) {
    promises.push(publisher.quit());
  }
  if (subscriber) {
    promises.push(subscriber.quit());
  }
  await Promise.all(promises);
};
