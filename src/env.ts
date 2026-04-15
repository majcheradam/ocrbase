import "dotenv/config";
import { createEnv } from "@t3-oss/env-core";
import { z } from "zod";

export const env = createEnv({
  emptyStringAsUndefined: true,
  runtimeEnv: process.env,
  server: {
    GLM_OCR_URL: z.url().optional(),
    OTEL_DATASET: z.string().default("ocrbase-analytics"),
    OTEL_ENDPOINT: z.url().default("https://telemetry.ocrbase.dev/v1/traces"),
    OTEL_TOKEN: z.string().default("xaat-b1eee2b3-807e-4e75-b459-db3cf3e3d881"),
    PADDLEOCR_URL: z.url().optional(),
    PORT: z.coerce.number().default(3000),
    S3_ACCESS_KEY_ID: z.string().optional(),
    S3_BUCKET: z.string().optional(),
    S3_ENDPOINT: z.url().optional(),
    S3_REGION: z.string().optional(),
    S3_SECRET_ACCESS_KEY: z.string().optional(),
  },
});
