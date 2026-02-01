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
    PADDLE_OCR_URL: z.url().default("http://localhost:8080"),
    PORT: z.coerce.number().default(3000),
    REDIS_URL: z.url().optional(),
    REGION: z.string().optional(),
    S3_ACCESS_KEY: z.string().optional(),
    S3_BUCKET: z.string().default("ocrbase"),
    S3_ENDPOINT: z.url().optional(),
    S3_REGION: z.string().default("us-east-1"),
    S3_SECRET_KEY: z.string().optional(),
    SERVICE_NAME: z.string().optional(),
    SERVICE_VERSION: z.string().optional(),
  },
});
