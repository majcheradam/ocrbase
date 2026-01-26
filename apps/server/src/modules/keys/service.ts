import { db } from "@ocrbase/db";
import { apiKeys, apiKeyUsage } from "@ocrbase/db/schema/api-keys";
import { and, desc, eq, gte, sql } from "drizzle-orm";

import { generateApiKey, getKeyPrefix, hashApiKey } from "../../lib/api-key";

export const KeyService = {
  async create({
    name,
    organizationId,
    userId,
  }: {
    name: string;
    organizationId: string;
    userId: string;
  }): Promise<{
    id: string;
    key: string;
    keyPrefix: string;
    name: string;
    isActive: boolean;
    createdAt: Date;
  }> {
    const rawKey = generateApiKey();
    const keyHash = await hashApiKey(rawKey);
    const keyPrefix = getKeyPrefix(rawKey);

    const [created] = await db
      .insert(apiKeys)
      .values({
        keyHash,
        keyPrefix,
        name,
        organizationId,
        userId,
      })
      .returning();

    if (!created) {
      throw new Error("Failed to create API key");
    }

    return {
      createdAt: created.createdAt,
      id: created.id,
      isActive: created.isActive,
      key: rawKey,
      keyPrefix: created.keyPrefix,
      name: created.name,
    };
  },

  async delete(id: string): Promise<boolean> {
    const result = await db
      .delete(apiKeys)
      .where(eq(apiKeys.id, id))
      .returning({ id: apiKeys.id });

    return result.length > 0;
  },

  async getById(id: string) {
    const [key] = await db
      .select()
      .from(apiKeys)
      .where(eq(apiKeys.id, id))
      .limit(1);

    return key ?? null;
  },

  async getUsage(id: string) {
    const key = await this.getById(id);

    if (!key) {
      return null;
    }

    const now = new Date();
    const day = 24 * 60 * 60 * 1000;

    const [last24h, last7d, last30d] = await Promise.all([
      db
        .select({ count: sql<number>`count(*)::int` })
        .from(apiKeyUsage)
        .where(
          and(
            eq(apiKeyUsage.apiKeyId, id),
            gte(apiKeyUsage.createdAt, new Date(now.getTime() - day))
          )
        ),
      db
        .select({ count: sql<number>`count(*)::int` })
        .from(apiKeyUsage)
        .where(
          and(
            eq(apiKeyUsage.apiKeyId, id),
            gte(apiKeyUsage.createdAt, new Date(now.getTime() - 7 * day))
          )
        ),
      db
        .select({ count: sql<number>`count(*)::int` })
        .from(apiKeyUsage)
        .where(
          and(
            eq(apiKeyUsage.apiKeyId, id),
            gte(apiKeyUsage.createdAt, new Date(now.getTime() - 30 * day))
          )
        ),
    ]);

    const recentUsage = await db
      .select({
        createdAt: apiKeyUsage.createdAt,
        endpoint: apiKeyUsage.endpoint,
        method: apiKeyUsage.method,
        processingMs: apiKeyUsage.processingMs,
        statusCode: apiKeyUsage.statusCode,
      })
      .from(apiKeyUsage)
      .where(eq(apiKeyUsage.apiKeyId, id))
      .orderBy(desc(apiKeyUsage.createdAt))
      .limit(50);

    return {
      key: {
        createdAt: key.createdAt,
        id: key.id,
        isActive: key.isActive,
        keyPrefix: key.keyPrefix,
        lastUsedAt: key.lastUsedAt,
        name: key.name,
        requestCount: key.requestCount,
      },
      recentUsage,
      stats: {
        last24h: last24h[0]?.count ?? 0,
        last30d: last30d[0]?.count ?? 0,
        last7d: last7d[0]?.count ?? 0,
      },
    };
  },

  list() {
    return db
      .select({
        createdAt: apiKeys.createdAt,
        id: apiKeys.id,
        isActive: apiKeys.isActive,
        keyPrefix: apiKeys.keyPrefix,
        lastUsedAt: apiKeys.lastUsedAt,
        name: apiKeys.name,
        requestCount: apiKeys.requestCount,
        updatedAt: apiKeys.updatedAt,
      })
      .from(apiKeys)
      .orderBy(desc(apiKeys.createdAt));
  },

  async revoke(id: string): Promise<boolean> {
    const result = await db
      .update(apiKeys)
      .set({ isActive: false })
      .where(eq(apiKeys.id, id))
      .returning({ id: apiKeys.id });

    return result.length > 0;
  },
};
