import { env } from "@ocrbase/env/server";
import pino from "pino";

import { envContext } from "./env-context";

export interface WorkerJobContext {
  jobId: string;
  bullJobId?: string;
  type?: string;
  fileSize?: number;
  mimeType?: string;
  pageCount?: number;
  status?: string;
  userId?: string;
  organizationId?: string;
  durationMs?: number;
  outcome?: "success" | "error";
  error?: {
    code: string;
    message: string;
    stack?: string;
  };
}

export const workerLogger = pino(
  {
    base: {
      env: envContext,
      service: "ocrbase-worker",
    },
    level: env.NODE_ENV === "production" ? "info" : "debug",
  },
  pino.destination(1)
);

export const createJobLogger = (
  jobId: string,
  bullJobId?: string
): pino.Logger => workerLogger.child({ bullJobId, jobId });
