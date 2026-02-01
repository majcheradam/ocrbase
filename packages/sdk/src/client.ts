import type { App } from "server/src/app";

import { treaty } from "@elysiajs/eden";

import type {
  ExtractInput,
  JobResponse,
  ParseInput,
  SDKConfig,
  SDKHeaders,
} from "./types";

import { createHealthClient, type HealthClient } from "./domains/health";
import { createJobsClient, type JobsClient } from "./domains/jobs";
import { createSchemasClient, type SchemasClient } from "./domains/schemas";
import {
  createWebSocketClient,
  type WebSocketClient,
} from "./domains/websocket";
import { SDKError } from "./errors";

export type EdenClient = ReturnType<typeof treaty<App>>;

export interface OCRBaseClient {
  /** Parse a document to markdown */
  parse: (input: ParseInput) => Promise<JobResponse>;
  /** Extract structured data from a document */
  extract: (input: ExtractInput) => Promise<JobResponse>;
  /** Job management operations */
  jobs: JobsClient;
  /** Schema management operations */
  schemas: SchemasClient;
  /** Health check operations */
  health: HealthClient;
  /** WebSocket subscriptions */
  ws: WebSocketClient;
  /** Raw Eden Treaty client for advanced usage */
  _eden: EdenClient;
}

const mergeHeaders = (
  existing: SDKHeaders | undefined,
  apiKey: string | undefined
): SDKHeaders | undefined => {
  if (!apiKey) {
    return existing;
  }

  const authHeader = { Authorization: `Bearer ${apiKey}` };

  if (!existing) {
    return authHeader;
  }

  if (typeof existing === "function") {
    return (path, options) => ({
      ...authHeader,
      ...existing(path, options),
    });
  }

  if (
    Array.isArray(existing) &&
    existing.every((fn) => typeof fn === "function")
  ) {
    const fns = existing as ((
      path: string,
      options: RequestInit
    ) => HeadersInit | void)[];
    return (path, options) => {
      const headers = { ...authHeader };
      for (const fn of fns) {
        const fnHeaders = fn(path, options);
        if (fnHeaders) {
          Object.assign(headers, fnHeaders);
        }
      }
      return headers;
    };
  }

  // Plain object headers
  return { ...authHeader, ...(existing as Record<string, string>) };
};

const DEFAULT_BASE_URL = "https://api.ocrbase.dev";

export const createClient = (config: SDKConfig): OCRBaseClient => {
  const baseUrl = config.baseUrl ?? DEFAULT_BASE_URL;
  const headers = mergeHeaders(config.headers, config.apiKey);

  const eden = treaty<App>(baseUrl, {
    fetch: {
      credentials: config.credentials ?? "include",
    },
    headers,
    onRequest: config.onRequest,
    onResponse: config.onResponse,
  });

  const parse = async (input: ParseInput): Promise<JobResponse> => {
    const { data, error } = await eden.api.parse.post(input);

    if (error) {
      throw SDKError.fromEdenError(error);
    }

    return data as JobResponse;
  };

  const extract = async (input: ExtractInput): Promise<JobResponse> => {
    const { data, error } = await eden.api.extract.post(input);

    if (error) {
      throw SDKError.fromEdenError(error);
    }

    return data as JobResponse;
  };

  return {
    _eden: eden,
    extract,
    health: createHealthClient(eden),
    jobs: createJobsClient(eden),
    parse,
    schemas: createSchemasClient(eden),
    ws: createWebSocketClient(eden),
  };
};

/** @deprecated Use createClient instead */
export const createOCRBaseClient = createClient;
