import { env } from "@ocrbase/env/server";
import { hostname } from "node:os";

export interface EnvironmentContext {
  service: string;
  version: string;
  commitHash: string;
  environment: string;
  region: string;
  hostname: string;
  nodeVersion: string;
  deploymentId?: string;
}

const getEnvVar = (key: string, fallback: string): string =>
  process.env[key] ?? fallback;

export const envContext: EnvironmentContext = {
  commitHash: getEnvVar("COMMIT_SHA", "unknown"),
  deploymentId: process.env.DEPLOYMENT_ID,
  environment: env.NODE_ENV,
  hostname: hostname(),
  nodeVersion: process.version,
  region: getEnvVar("REGION", "local"),
  service: getEnvVar("SERVICE_NAME", "ocrbase-server"),
  version: getEnvVar("SERVICE_VERSION", "0.0.0-dev"),
};
