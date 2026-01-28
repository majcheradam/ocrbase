import { db } from "@ocrbase/db";
import { sql } from "drizzle-orm";
import { Elysia } from "elysia";

import { checkLlmHealth } from "../../services/llm";
import { checkOcrHealth } from "../../services/ocr";
import { checkQueueHealth } from "../../services/queue";
import { checkStorageHealth } from "../../services/storage";

export interface HealthCheck {
  database: boolean;
  llm: boolean;
  ocr: boolean;
  redis: boolean;
  storage: boolean;
}

export interface HealthResponse {
  checks: HealthCheck;
  status: "healthy" | "degraded" | "unhealthy";
  timestamp: string;
}

const checkDatabaseHealth = async (): Promise<boolean> => {
  try {
    await db.execute(sql`SELECT 1`);
    return true;
  } catch {
    return false;
  }
};

const determineOverallStatus = (
  checks: HealthCheck
): HealthResponse["status"] => {
  const criticalChecks = [checks.database, checks.storage];
  const allCriticalHealthy = criticalChecks.every(Boolean);

  if (!allCriticalHealthy) {
    return "unhealthy";
  }

  const allChecks = Object.values(checks);
  const allHealthy = allChecks.every(Boolean);

  return allHealthy ? "healthy" : "degraded";
};

export const healthRoutes = new Elysia({ prefix: "/health" })
  .get("/live", () => ({ status: "ok" }), {
    detail: {
      description: "Liveness probe for container orchestration",
      tags: ["Health"],
    },
  })
  .get(
    "/ready",
    async (): Promise<HealthResponse> => {
      const [database, redis, storage, ocr, llm] = await Promise.all([
        checkDatabaseHealth(),
        checkQueueHealth(),
        checkStorageHealth(),
        checkOcrHealth(),
        checkLlmHealth(),
      ]);

      const checks: HealthCheck = {
        database,
        llm,
        ocr,
        redis,
        storage,
      };

      const status = determineOverallStatus(checks);

      return {
        checks,
        status,
        timestamp: new Date().toISOString(),
      };
    },
    {
      detail: {
        description: "Readiness probe with dependency health checks",
        tags: ["Health"],
      },
    }
  );
