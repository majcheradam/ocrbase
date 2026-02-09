import "dotenv/config";
import { createEnv } from "@t3-oss/env-core";
import { z } from "zod";

export const env = createEnv({
  emptyStringAsUndefined: true,
  runtimeEnv: process.env,
  server: {
    BETTER_AUTH_SECRET: z.string().min(32),
    BETTER_AUTH_URL: z.url(),
    COMMIT_SHA: z.string().optional(),
    CORS_ORIGINS: z
      .string()
      .transform((s) => s.split(",").map((o) => o.trim()))
      .pipe(z.array(z.url())),
    DATABASE_URL: z.url(),
    DEPLOYMENT_ID: z.string().optional(),
    GITHUB_CLIENT_ID: z.string().optional(),
    GITHUB_CLIENT_SECRET: z.string().optional(),
    HOST: z.string().default("0.0.0.0"),
    NODE_ENV: z
      .enum(["development", "production", "test"])
      .default("development"),
    OPENROUTER_API_KEY: z.string().optional(),
    // The upstream `paddleocr-vl` client requires an API key value to be set.
    // For self-hosted PaddleOCR-VL instances that don't enforce auth, any
    // non-empty string is fine.
    PADDLEOCR_VL_API_KEY: z.string().default("local"),
    // OCR calls can take minutes for large PDFs (e.g. 100+ pages).
    // Tune this per deployment/workload.
    PADDLE_OCR_TIMEOUT_MS: z.coerce.number().int().positive().default(120_000),
    PADDLE_OCR_URL: z.url().default("http://localhost:8080"),
    PORT: z.coerce.number().default(3000),
    POSTHOG_API_KEY: z.string().optional(),
    REDIS_URL: z.url().optional(),
    REGION: z.string().optional(),
    S3_ACCESS_KEY: z.string().optional(),
    S3_BUCKET: z.string().default("ocrbase"),
    S3_ENDPOINT: z.url().optional(),
    S3_REGION: z.string().default("us-east-1"),
    S3_SECRET_KEY: z.string().optional(),
    SERVICE_NAME: z.string().optional(),
    SERVICE_VERSION: z.string().optional(),
    // BullMQ worker concurrency. For very large PDFs, keep this low (1-2)
    // to avoid saturating the OCR service.
    WORKER_CONCURRENCY: z.coerce.number().int().positive().default(5),
  },
});
