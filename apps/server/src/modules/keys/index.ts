import { Elysia, t } from "elysia";

import { requireAuth } from "../../plugins/auth";
import { KeyModel } from "./model";
import { KeyService } from "./service";

const formatKeyResponse = (key: {
  id: string;
  name: string;
  keyPrefix: string;
  isActive: boolean;
  requestCount: number;
  lastUsedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}) => ({
  createdAt: key.createdAt.toISOString(),
  id: key.id,
  isActive: key.isActive,
  keyPrefix: key.keyPrefix,
  lastUsedAt: key.lastUsedAt?.toISOString() ?? null,
  name: key.name,
  requestCount: key.requestCount,
  updatedAt: key.updatedAt.toISOString(),
});

const getErrorMessage = (caught: unknown, fallback: string): string =>
  caught instanceof Error ? caught.message : fallback;

export const keysRoutes = new Elysia({ prefix: "/api/keys" })
  .use(requireAuth)
  .post(
    "/",
    async ({ body, set }) => {
      try {
        const result = await KeyService.create(body.name);

        return {
          createdAt: result.createdAt.toISOString(),
          id: result.id,
          isActive: result.isActive,
          key: result.key,
          keyPrefix: result.keyPrefix,
          name: result.name,
        };
      } catch (error) {
        set.status = 500;
        return { message: getErrorMessage(error, "Failed to create API key") };
      }
    },
    {
      body: KeyModel.createBody,
    }
  )
  .get("/", async ({ set }) => {
    try {
      const keys = await KeyService.list();
      return keys.map(formatKeyResponse);
    } catch (error) {
      set.status = 500;
      return { message: getErrorMessage(error, "Failed to list API keys") };
    }
  })
  .get(
    "/:id",
    async ({ params, set }) => {
      try {
        const usage = await KeyService.getUsage(params.id);

        if (!usage) {
          set.status = 404;
          return { message: "API key not found" };
        }

        return {
          key: {
            createdAt: usage.key.createdAt.toISOString(),
            id: usage.key.id,
            isActive: usage.key.isActive,
            keyPrefix: usage.key.keyPrefix,
            lastUsedAt: usage.key.lastUsedAt?.toISOString() ?? null,
            name: usage.key.name,
            requestCount: usage.key.requestCount,
          },
          recentUsage: usage.recentUsage.map((u) => ({
            createdAt: u.createdAt.toISOString(),
            endpoint: u.endpoint,
            method: u.method,
            processingMs: u.processingMs,
            statusCode: u.statusCode,
          })),
          stats: usage.stats,
        };
      } catch (error) {
        set.status = 500;
        return {
          message: getErrorMessage(error, "Failed to get API key usage"),
        };
      }
    },
    {
      params: t.Object({
        id: t.String(),
      }),
    }
  )
  .post(
    "/:id/revoke",
    async ({ params, set }) => {
      try {
        const revoked = await KeyService.revoke(params.id);

        if (!revoked) {
          set.status = 404;
          return { message: "API key not found" };
        }

        return { success: true };
      } catch (error) {
        set.status = 500;
        return { message: getErrorMessage(error, "Failed to revoke API key") };
      }
    },
    {
      params: t.Object({
        id: t.String(),
      }),
    }
  )
  .delete(
    "/:id",
    async ({ params, set }) => {
      try {
        const deleted = await KeyService.delete(params.id);

        if (!deleted) {
          set.status = 404;
          return { message: "API key not found" };
        }

        return { success: true };
      } catch (error) {
        set.status = 500;
        return { message: getErrorMessage(error, "Failed to delete API key") };
      }
    },
    {
      params: t.Object({
        id: t.String(),
      }),
    }
  );
