import "dotenv/config";
import { createEnv } from "@t3-oss/env-core";
import { z } from "zod";

export const env = createEnv({
  emptyStringAsUndefined: true,
  runtimeEnv: process.env,
  server: {
    OTEL_DATASET: z.string().default("ocrbase-analytics"),
    OTEL_ENDPOINT: z.url().default("https://telemetry.ocrbase.dev/v1/traces"),
    OTEL_TOKEN: z.string().default("xaat-b1eee2b3-807e-4e75-b459-db3cf3e3d881"),
    PORT: z.coerce.number().default(3000),
  },
});
