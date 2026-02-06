import { Elysia, t } from "elysia";

import { IdPatterns } from "@/lib/openapi";
import { requireAuth } from "@/plugins/auth";

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

export const keysRoutes = new Elysia({ prefix: "/v1/keys" })
  .use(requireAuth)
  .post(
    "/",
    async ({ body, organization, set, user }) => {
      // requireAuth guarantees user exists, but TS needs narrowing
      if (!user) {
        set.status = 401;
        return { message: "Unauthorized" };
      }

      try {
        const result = await KeyService.create({
          name: body.name,
          organizationId: organization?.id ?? user.id,
          userId: user.id,
        });

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
      detail: {
        description: `Create a new API key for programmatic access.

The full API key is only returned once at creation time. Store it securely.
Keys can be revoked or deleted at any time.`,
        responses: {
          201: {
            description: "API key created (includes full key, only shown once)",
          },
          401: { description: "Unauthorized - Invalid or missing API key" },
          429: { description: "Too Many Requests - Rate limit exceeded" },
          500: { description: "Internal Server Error" },
        },
        tags: ["Keys"],
      },
    }
  )
  .get(
    "/",
    async ({ organization, set, user }) => {
      if (!user) {
        set.status = 401;
        return { message: "Unauthorized" };
      }
      try {
        const keys = await KeyService.list(organization?.id ?? user.id);
        return keys.map(formatKeyResponse);
      } catch (error) {
        set.status = 500;
        return { message: getErrorMessage(error, "Failed to list API keys") };
      }
    },
    {
      detail: {
        description: `List all API keys for the current organization.

Returns key metadata including prefix, status, and usage statistics. Full keys are never returned after creation.`,
        responses: {
          200: { description: "List of API keys" },
          401: { description: "Unauthorized - Invalid or missing API key" },
          429: { description: "Too Many Requests - Rate limit exceeded" },
          500: { description: "Internal Server Error" },
        },
        tags: ["Keys"],
      },
    }
  )
  .get(
    "/:id",
    async ({ params, organization, set, user }) => {
      if (!user || !organization) {
        set.status = 401;
        return { message: "Unauthorized" };
      }

      try {
        const usage = await KeyService.getUsage(params.id, organization.id);

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
      detail: {
        description: `Get detailed information and usage statistics for an API key.

Includes recent request history, total request count, and aggregated stats.`,
        responses: {
          200: { description: "API key details with usage statistics" },
          401: { description: "Unauthorized - Invalid or missing API key" },
          404: { description: "Not Found - API key does not exist" },
          429: { description: "Too Many Requests - Rate limit exceeded" },
          500: { description: "Internal Server Error" },
        },
        tags: ["Keys"],
      },
      params: t.Object({
        id: t.String({
          description: "API key ID",
          examples: ["key_abc123xyz"],
          pattern: IdPatterns.key,
        }),
      }),
    }
  )
  .post(
    "/:id/revoke",
    async ({ params, organization, set, user }) => {
      if (!user || !organization) {
        set.status = 401;
        return { message: "Unauthorized" };
      }

      try {
        const revoked = await KeyService.revoke(params.id, organization.id);

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
      detail: {
        description: `Revoke an API key without deleting it.

The key will immediately stop working but usage history is preserved. This action can be reversed by contacting support.`,
        responses: {
          200: { description: "API key revoked successfully" },
          401: { description: "Unauthorized - Invalid or missing API key" },
          404: { description: "Not Found - API key does not exist" },
          429: { description: "Too Many Requests - Rate limit exceeded" },
          500: { description: "Internal Server Error" },
        },
        tags: ["Keys"],
      },
      params: t.Object({
        id: t.String({
          description: "API key ID",
          examples: ["key_abc123xyz"],
          pattern: IdPatterns.key,
        }),
      }),
    }
  )
  .delete(
    "/:id",
    async ({ params, organization, set, user }) => {
      if (!user || !organization) {
        set.status = 401;
        return { message: "Unauthorized" };
      }

      try {
        const deleted = await KeyService.delete(params.id, organization.id);

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
      detail: {
        description: `Permanently delete an API key and all usage history.

This action cannot be undone. The key will immediately stop working.`,
        responses: {
          200: { description: "API key deleted successfully" },
          401: { description: "Unauthorized - Invalid or missing API key" },
          404: { description: "Not Found - API key does not exist" },
          429: { description: "Too Many Requests - Rate limit exceeded" },
          500: { description: "Internal Server Error" },
        },
        tags: ["Keys"],
      },
      params: t.Object({
        id: t.String({
          description: "API key ID",
          examples: ["key_abc123xyz"],
          pattern: IdPatterns.key,
        }),
      }),
    }
  );
