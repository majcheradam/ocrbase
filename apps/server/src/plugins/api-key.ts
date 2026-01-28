import { db } from "@ocrbase/db";
import { apiKeys, apiKeyUsage } from "@ocrbase/db/schema/api-keys";
import { eq, sql } from "drizzle-orm";
import { Elysia } from "elysia";

import { hashApiKey } from "../lib/api-key";

export const apiKeyPlugin = new Elysia({ name: "api-key" })
  .derive(
    { as: "global" },
    async ({
      request,
    }): Promise<{
      apiKey: {
        id: string;
        name: string;
        organizationId: string;
        userId: string;
      } | null;
      apiKeyAuth: boolean;
    }> => {
      const authHeader = request.headers.get("authorization");

      if (!authHeader) {
        return { apiKey: null, apiKeyAuth: false };
      }

      const [scheme, ...rest] = authHeader.split(" ");
      if (scheme?.toLowerCase() !== "bearer") {
        return { apiKey: null, apiKeyAuth: false };
      }

      const token = rest.join(" ").trim();
      if (!token) {
        return { apiKey: null, apiKeyAuth: false };
      }

      const keyHash = await hashApiKey(token);

      const [foundKey] = await db
        .select({
          id: apiKeys.id,
          isActive: apiKeys.isActive,
          name: apiKeys.name,
          organizationId: apiKeys.organizationId,
          userId: apiKeys.userId,
        })
        .from(apiKeys)
        .where(eq(apiKeys.keyHash, keyHash))
        .limit(1);

      if (!foundKey || !foundKey.isActive) {
        return { apiKey: null, apiKeyAuth: false };
      }

      // Update last used and request count
      await db
        .update(apiKeys)
        .set({
          lastUsedAt: new Date(),
          requestCount: sql`${apiKeys.requestCount} + 1`,
        })
        .where(eq(apiKeys.id, foundKey.id));

      return {
        apiKey: {
          id: foundKey.id,
          name: foundKey.name,
          organizationId: foundKey.organizationId,
          userId: foundKey.userId,
        },
        apiKeyAuth: true,
      };
    }
  )
  .onAfterResponse(
    { as: "global" },
    async (context: {
      apiKey?: {
        id: string;
        name: string;
        organizationId: string;
        userId: string;
      } | null;
      path: string;
      request: Request;
      set: { status?: number | string };
    }) => {
      const { apiKey, path, request, set } = context;
      if (!apiKey) {
        return;
      }

      // Log usage
      await db.insert(apiKeyUsage).values({
        apiKeyId: apiKey.id,
        endpoint: path,
        method: request.method,
        processingMs: null,
        statusCode: typeof set.status === "number" ? set.status : 200,
      });
    }
  );

export const requireApiKey = new Elysia({ name: "requireApiKey" })
  .use(apiKeyPlugin)
  .onBeforeHandle(
    { as: "scoped" },
    (context: { apiKeyAuth?: boolean; set: { status?: number | string } }) => {
      const { apiKeyAuth, set } = context;
      if (!apiKeyAuth) {
        set.status = 401;
        return { message: "Invalid or missing API key" };
      }
    }
  );
